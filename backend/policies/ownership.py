"""Who may see or change which player (Policy pattern).

Every endpoint that receives a player id goes through AccessPolicy before touching the data:
- a parent only reaches the players of their own guardian profile;
- a coach only reaches the players of the categories assigned to them;
- an admin reaches everybody.

A player that exists but belongs to someone else answers 404 (not 403), so a parent can not even find out
whether a document or id belongs to another family.
"""
from sqlalchemy.orm import Session

from models import Category, Player, User
from repositories import CategoryRepository, CoachRepository, GuardianRepository, PlayerRepository
from services.errors import Forbidden, NotFound

PLAYER_NOT_FOUND = "No encontramos ese deportista."


class AccessPolicy:
    def __init__(self, session: Session):
        self.players = PlayerRepository(session)
        self.guardians = GuardianRepository(session)
        self.coaches = CoachRepository(session)
        self.categories = CategoryRepository(session)

    # ---------- parent

    def guardian_of(self, user: User):
        guardian = self.guardians.get_by_user(user.id) if user.is_parent else None
        if guardian is None:
            raise Forbidden("Esta sección es solo para padres de familia registrados.")
        return guardian

    def player_for_guardian(self, user: User, player_id: int) -> Player:
        guardian = self.guardian_of(user)
        player = self.players.get(player_id)
        if player is None or player.guardian_id != guardian.id:
            raise NotFound(PLAYER_NOT_FOUND)
        return player

    # ---------- coach / admin

    def coach_category_ids(self, user: User) -> list[int]:
        """Categories a coach works with. Admins work with all of them."""
        if user.is_admin:
            return [c.id for c in self.categories.list()]
        coach = self.coaches.get_by_user(user.id)
        if coach is None:
            return []
        return [c.id for c in self.categories.list_by_coach(coach.id)]

    def category_for_coach(self, user: User, category_id: int) -> Category:
        category = self.categories.get(category_id)
        if category is None or category_id not in self.coach_category_ids(user):
            raise NotFound("No encontramos esa categoría entre las tuyas.")
        return category

    def player_for_coach(self, user: User, player_id: int) -> Player:
        player = self.players.get(player_id)
        if player is None:
            raise NotFound(PLAYER_NOT_FOUND)
        if user.is_admin:
            return player
        if player.category_id is None or player.category_id not in self.coach_category_ids(user):
            raise NotFound(PLAYER_NOT_FOUND)
        return player

    def player_for_any(self, user: User, player_id: int) -> Player:
        """Parent → own players; coach → their categories; admin → all."""
        if user.is_parent:
            return self.player_for_guardian(user, player_id)
        return self.player_for_coach(user, player_id)
