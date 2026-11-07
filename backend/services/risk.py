"""Dropout-risk report for the admin: features from the database → model → explained list."""
from datetime import date

from sqlalchemy.orm import Session

from enums import EnrollmentStatus
from ml.features import build_features
from ml.predictor import ModelUnavailable, RiskModel
from repositories import AttendanceRepository, PaymentRepository, PlayerRepository
from schemas import RiskCountsOut, RiskFactorOut, RiskModelOut, RiskPlayerOut, RiskReportOut
from services.errors import ServiceUnavailable
from services.payments import PaymentService
from services.presenters import whatsapp_url
from services.storage import FileStorage

LEVEL_ORDER = {"high": 0, "medium": 1, "low": 2}
DEMO_NOTE = (
    "Modelo de demostración: se entrenó con datos sintéticos porque el club aún no tiene historial de deserciones. "
    "Se reentrena cuando haya datos reales. Úsalo como alerta para hablar con la familia, no como una decisión."
)


class RiskService:
    def __init__(self, session: Session, storage: FileStorage):
        self.players = PlayerRepository(session)
        self.attendance = AttendanceRepository(session)
        self.payments = PaymentRepository(session)
        self.payment_service = PaymentService(session, storage)

    def report(self, category_id: int | None = None, today: date | None = None) -> RiskReportOut:
        try:
            model = RiskModel.get()
        except ModelUnavailable as error:
            raise ServiceUnavailable(str(error)) from error

        today = today or date.today()
        players = list(self.players.search(category_id=category_id, status=EnrollmentStatus.APPROVED))
        rows = [
            build_features(
                player,
                self.attendance.for_player(player.id, None, None),
                self.payments.list_by_player(player.id),
                self.payment_service.account(player, today.year).overdue_months,
                today,
            )
            for player in players
        ]
        predictions = model.predict(rows)

        items = []
        for player, features, prediction in zip(players, rows, predictions, strict=True):
            guardian = player.guardian
            items.append(
                RiskPlayerOut(
                    player_id=player.id,
                    player_name=player.full_name,
                    category_id=player.category_id,
                    category_name=player.category.name if player.category else None,
                    guardian_name=guardian.full_name,
                    guardian_phone=guardian.phone,
                    whatsapp_url=whatsapp_url(
                        guardian.phone,
                        f"Hola {guardian.first_names}, te saludamos del Club Atlético Sucre. Queremos saber cómo "
                        f"está {player.first_names} y si podemos ayudar en algo para que siga entrenando con nosotros.",
                    ),
                    probability=prediction.probability,
                    level=prediction.level,
                    factors=[RiskFactorOut(**vars(f)) for f in prediction.factors],
                    features=vars(features),
                )
            )
        items.sort(key=lambda item: (LEVEL_ORDER[item.level], -item.probability))
        counts = RiskCountsOut(
            high=sum(1 for i in items if i.level == "high"),
            medium=sum(1 for i in items if i.level == "medium"),
            low=sum(1 for i in items if i.level == "low"),
        )
        return RiskReportOut(model=RiskModelOut(**model.info(), note=DEMO_NOTE), counts=counts, players=items)
