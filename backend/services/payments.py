"""Payments: parents report them with a receipt, admins verify them (or register cash), everyone sees the account."""
import csv
import io
from datetime import date, datetime, timezone

from fastapi import UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from enums import EnrollmentStatus, PaymentConcept, PaymentMethod, PaymentStatus
from models import Payment, Player, User
from policies import AccessPolicy
from repositories import PaymentRepository, PlayerRepository, SettingsRepository
from schemas import AccountStatusOut, MonthStatusOut, OverdueOut, PaymentAdminIn, PaymentReportIn, RejectIn
from services.errors import BadRequest, Conflict, NotFound
from services.payment_status import MonthlyDueDayPolicy, PaymentStatusStrategy
from services.presenters import payment_out, whatsapp_url
from services.storage import FileStorage, new_key, read_image


class PaymentService:
    def __init__(self, session: Session, storage: FileStorage):
        self.session = session
        self.policy = AccessPolicy(session)
        self.payments = PaymentRepository(session)
        self.players = PlayerRepository(session)
        self.settings = SettingsRepository(session)
        self.storage = storage

    def _status_strategy(self) -> PaymentStatusStrategy:
        settings = self.settings.get_or_create()
        return MonthlyDueDayPolicy(due_day=settings.due_day, enrollment_fee=settings.enrollment_fee)

    # ---------- account

    def account(self, player: Player, year: int | None = None) -> AccountStatusOut:
        year = year or date.today().year
        payments = self.payments.list_by_player(player.id)
        state = self._status_strategy().account(player, payments, year)
        return AccountStatusOut(
            player_id=player.id,
            is_up_to_date=state.is_up_to_date,
            enrollment_paid=state.enrollment_paid,
            overdue_months=state.overdue_months,
            amount_due=state.amount_due,
            months=[
                MonthStatusOut(year=m.year, month=m.month, month_name=m.month_name, status=m.status, payment_id=m.payment_id)
                for m in state.months
            ],
            payments=[payment_out(p) for p in payments],
        )

    def account_for_user(self, user: User, player_id: int, year: int | None = None) -> AccountStatusOut:
        return self.account(self.policy.player_for_any(user, player_id), year)

    # ---------- parent reports a payment

    def _check_period(self, player: Player, data: PaymentReportIn) -> None:
        if data.concept == PaymentConcept.MONTHLY and player.enrollment_status != EnrollmentStatus.APPROVED:
            raise BadRequest("Las mensualidades se pagan cuando la inscripción esté aprobada.")
        if self.payments.find_active_for_period(player.id, data.concept, data.period_year, data.period_month):
            raise Conflict("Ya hay un pago registrado para ese concepto y periodo.")

    async def report(self, user: User, player_id: int, data: PaymentReportIn, receipt: UploadFile | None) -> Payment:
        player = self.policy.player_for_guardian(user, player_id)
        self._check_period(player, data)
        if data.method == PaymentMethod.NEQUI and receipt is None:
            raise BadRequest("Adjunta la foto o captura del comprobante de Nequi.")

        payment = Payment(player_id=player.id, registered_by_id=user.id, status=PaymentStatus.PENDING_VERIFICATION, **data.model_dump())
        if receipt is not None:
            content, content_type = await read_image(receipt)
            payment.receipt_key = new_key(f"receipts/{player.id}", content_type)
            self.storage.save(payment.receipt_key, content, content_type)
        self.payments.add(payment)
        self.session.commit()
        return payment

    def receipt_response(self, user: User, payment_id: int) -> Response:
        payment = self.payments.get(payment_id)
        if payment is None:
            raise NotFound("No encontramos ese pago.")
        if not user.is_admin:
            # Parents only their own children's receipts (404 otherwise, through the policy)
            self.policy.player_for_guardian(user, payment.player_id)
        if not payment.receipt_key:
            raise NotFound("Este pago no tiene comprobante.")
        return self.storage.response(payment.receipt_key)

    # ---------- admin

    def search(self, **filters):
        return self.payments.search(**filters)

    def register_by_admin(self, admin: User, data: PaymentAdminIn) -> Payment:
        player = self.players.get(data.player_id)
        if player is None:
            raise NotFound("No encontramos ese deportista.")
        report = PaymentReportIn(**data.model_dump(exclude={"player_id"}))
        self._check_period(player, report)
        now = datetime.now(timezone.utc)
        payment = self.payments.add(
            Payment(
                player_id=player.id,
                registered_by_id=admin.id,
                status=PaymentStatus.VERIFIED,
                verified_by_id=admin.id,
                verified_at=now,
                **report.model_dump(),
            )
        )
        self.session.commit()
        return payment

    def _payment(self, payment_id: int) -> Payment:
        payment = self.payments.get(payment_id)
        if payment is None:
            raise NotFound("No encontramos ese pago.")
        return payment

    def verify(self, admin: User, payment_id: int) -> Payment:
        payment = self._payment(payment_id)
        if payment.status == PaymentStatus.VERIFIED:
            raise Conflict("Este pago ya estaba verificado.")
        payment.status = PaymentStatus.VERIFIED
        payment.verified_by_id = admin.id
        payment.verified_at = datetime.now(timezone.utc)
        payment.rejection_reason = None
        self.session.commit()
        return payment

    def reject(self, admin: User, payment_id: int, data: RejectIn) -> Payment:
        payment = self._payment(payment_id)
        if payment.status != PaymentStatus.PENDING_VERIFICATION:
            raise Conflict("Solo se pueden rechazar pagos pendientes de verificación.")
        payment.status = PaymentStatus.REJECTED
        payment.rejection_reason = data.reason
        payment.verified_by_id = admin.id
        payment.verified_at = datetime.now(timezone.utc)
        self.session.commit()
        return payment

    def overdue(self) -> list[OverdueOut]:
        result = []
        for player in self.players.search(status=EnrollmentStatus.APPROVED):
            account = self.account(player)
            if account.is_up_to_date:
                continue
            text = (
                f"Hola {player.guardian.first_names}, te saludamos del Club Atlético Sucre. "
                f"{player.first_names} tiene {account.overdue_months} mensualidad(es) pendiente(s) "
                f"por ${account.amount_due:,.0f}".replace(",", ".")
                + ". Recuerda que para seguir entrenando hay que estar al día. ¡Gracias!"
            )
            result.append(
                OverdueOut(
                    player_id=player.id,
                    player_name=player.full_name,
                    category_name=player.category.name if player.category else None,
                    guardian_name=player.guardian.full_name,
                    guardian_phone=player.guardian.phone,
                    overdue_months=account.overdue_months,
                    amount_due=account.amount_due,
                    whatsapp_url=whatsapp_url(player.guardian.phone, text),
                )
            )
        return result

    def export_csv(self) -> str:
        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=";")
        writer.writerow(["id", "deportista", "acudiente", "concepto", "año", "mes", "valor", "método", "fecha", "estado", "referencia"])
        for p in self.payments.search():
            writer.writerow([
                p.id, p.player.full_name, p.player.guardian.full_name, p.concept, p.period_year or "",
                p.period_month or "", p.amount, p.method, p.paid_on.isoformat(), p.status, p.reference_number or "",
            ])
        # BOM so Excel opens the accents correctly
        return "﻿" + buffer.getvalue()
