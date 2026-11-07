"""Domain errors. Services raise these; main.py turns them into {"detail": "..."} with the right status code.

This keeps the business rules free of HTTP details (and easy to test).
"""


class DomainError(Exception):
    status_code = 400

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail


class BadRequest(DomainError):
    status_code = 400


class Unauthorized(DomainError):
    status_code = 401


class Forbidden(DomainError):
    status_code = 403


class NotFound(DomainError):
    status_code = 404


class Conflict(DomainError):
    status_code = 409


class ExternalServiceError(DomainError):
    status_code = 502


class ServiceUnavailable(DomainError):
    status_code = 503
