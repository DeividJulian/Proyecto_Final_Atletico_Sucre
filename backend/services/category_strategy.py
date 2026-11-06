"""Strategy pattern: how a player is placed in a category.

The rule may change (the club groups by birth year today; tournaments sometimes group by age at a cut-off
date), so the services depend on the CategoryStrategy interface and get the concrete rule from
get_category_strategy(). Adding a new rule means adding a class, not touching the services.
"""
from abc import ABC, abstractmethod
from collections.abc import Sequence
from datetime import date

from enums import CategoryGender, Sex
from models import Category


class CategoryStrategy(ABC):
    @abstractmethod
    def assign(self, birth_date: date, sex: str, categories: Sequence[Category]) -> Category | None:
        """The category that fits the player, or None if no active category covers them."""


class BirthYearRangeStrategy(CategoryStrategy):
    """Default rule of the club: the birth year falls inside [birth_year_from, birth_year_to].

    Girls go to the female category when one covers their year; otherwise (and for boys) to the mixed one.
    The admin can always move a player to another category by hand.
    """

    def assign(self, birth_date: date, sex: str, categories: Sequence[Category]) -> Category | None:
        year = birth_date.year
        fitting = [c for c in categories if c.is_active and c.birth_year_from <= year <= c.birth_year_to]
        if sex == Sex.FEMALE:
            female = [c for c in fitting if c.gender == CategoryGender.FEMALE]
            if female:
                return _narrowest(female)
        mixed = [c for c in fitting if c.gender == CategoryGender.MIXED]
        return _narrowest(mixed) if mixed else None


class AgeAtCutoffStrategy(CategoryStrategy):
    """Alternative rule: age on a cut-off date (e.g. January 1st) mapped onto the same birth-year ranges."""

    def __init__(self, cutoff: date | None = None):
        self.cutoff = cutoff or date(date.today().year, 1, 1)

    def assign(self, birth_date: date, sex: str, categories: Sequence[Category]) -> Category | None:
        age = self.cutoff.year - birth_date.year - ((self.cutoff.month, self.cutoff.day) < (birth_date.month, birth_date.day))
        equivalent_birth_year = self.cutoff.year - age
        return BirthYearRangeStrategy().assign(date(equivalent_birth_year, 1, 1), sex, categories)


def _narrowest(categories: Sequence[Category]) -> Category:
    """When ranges overlap, the most specific one wins (fewest years), then the display order."""
    return min(categories, key=lambda c: (c.birth_year_to - c.birth_year_from, c.display_order, c.id))


def get_category_strategy() -> CategoryStrategy:
    return BirthYearRangeStrategy()
