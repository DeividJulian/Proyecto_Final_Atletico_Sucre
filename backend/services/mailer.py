"""Email delivery (Factory pattern): EMAIL_BACKEND picks the sender.

- consola: writes the email to the log (local development)
- memoria: keeps it in OUTBOX (tests)
- brevo:   Brevo's HTTP API (production; Render's free plan blocks SMTP ports)
"""
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

import config
from services.errors import ExternalServiceError

logger = logging.getLogger("atletico.mail")


@dataclass
class Email:
    to: str
    subject: str
    text: str


OUTBOX: list[Email] = []


class Mailer(ABC):
    @abstractmethod
    def send(self, email: Email) -> None: ...


class ConsoleMailer(Mailer):
    def send(self, email: Email) -> None:
        logger.info("Correo para %s | %s\n%s", email.to, email.subject, email.text)


class MemoryMailer(Mailer):
    def send(self, email: Email) -> None:
        OUTBOX.append(email)


class BrevoMailer(Mailer):
    URL = "https://api.brevo.com/v3/smtp/email"

    def send(self, email: Email) -> None:
        if not config.BREVO_API_KEY:
            raise ExternalServiceError("El correo no está configurado en el servidor (falta BREVO_API_KEY).")
        payload = {
            "sender": {"email": config.EMAIL_FROM, "name": config.EMAIL_FROM_NAME},
            "to": [{"email": email.to}],
            "subject": email.subject,
            "textContent": email.text,
        }
        try:
            response = httpx.post(
                self.URL, json=payload, headers={"api-key": config.BREVO_API_KEY, "accept": "application/json"}, timeout=15
            )
            response.raise_for_status()
        except httpx.HTTPError as error:
            logger.error("Brevo failed: %s", error)
            raise ExternalServiceError("No pudimos enviar el correo. Intenta de nuevo en unos minutos.") from error


_MAILERS: dict[str, type[Mailer]] = {"consola": ConsoleMailer, "memoria": MemoryMailer, "brevo": BrevoMailer}


def get_mailer() -> Mailer:
    mailer_class = _MAILERS.get(config.EMAIL_BACKEND)
    if mailer_class is None:
        raise ValueError(f"EMAIL_BACKEND desconocido: {config.EMAIL_BACKEND}")
    return mailer_class()
