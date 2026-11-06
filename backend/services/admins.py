"""The 2 administrators: coaches with is_admin = true, created on startup from ADMIN_EMAILS.

There is no endpoint to promote someone to admin: the only way is the environment variable, and never
more than config.MAX_ADMINS accounts keep the flag.
"""
import logging

from sqlalchemy.orm import Session

import config
from enums import Role
from models import Coach, User
from repositories import CoachRepository, UserRepository
from security import UNUSABLE_PASSWORD, hash_password

logger = logging.getLogger("atletico.admins")


def ensure_admins(session: Session) -> list[User]:
    users = UserRepository(session)
    coaches = CoachRepository(session)
    config.check_production_settings()
    wanted = config.ADMIN_EMAILS[: config.MAX_ADMINS]
    password = config.admin_initial_password()

    # Accounts that are no longer in ADMIN_EMAILS lose the flag (stay as regular coaches)
    for admin in users.admins():
        if admin.email not in wanted:
            admin.is_admin = False
            logger.info("Admin flag removed from %s (not in ADMIN_EMAILS)", admin.email)

    admins: list[User] = []
    for email in wanted:
        user = users.get_by_email(email)
        if user is None:
            user = users.add(
                User(
                    email=email,
                    password_hash=hash_password(password) if password else UNUSABLE_PASSWORD,
                    role=Role.COACH,
                    is_admin=True,
                    must_change_password=True,
                )
            )
            logger.info("Admin account created: %s", email)
        elif user.role != Role.COACH:
            logger.error("%s is a parent account and can not be an admin; skipped", email)
            continue
        user.is_admin = True
        user.is_active = True
        if coaches.get_by_user(user.id) is None:
            # Placeholder profile; the admin edits the name from the panel
            coaches.add(Coach(user_id=user.id, full_name="Administrador", role_title="Administrador", is_public=False))
        admins.append(user)

    session.commit()
    return admins
