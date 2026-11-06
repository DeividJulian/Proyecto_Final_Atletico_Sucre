import { Component, computed, inject } from '@angular/core';

import { PILLARS } from '../../../../core/content/club-content';
import { Category } from '../../../../core/models/public';
import { PublicContentStore } from '../../../../core/state/public-content.store';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {
  protected readonly store = inject(PublicContentStore);
  protected readonly pillars = PILLARS;
  private readonly currentYear = new Date().getFullYear();

  protected readonly mixed = computed(() => this.store.categories().filter((c) => c.gender === 'mixed'));
  protected readonly female = computed(() => this.store.categories().filter((c) => c.gender === 'female'));

  years(category: Category): string {
    return category.birth_year_from === category.birth_year_to
      ? `Nacidos en ${category.birth_year_from}`
      : `Nacidos entre ${category.birth_year_from} y ${category.birth_year_to}`;
  }

  /** Age range this year, e.g. "8 a 10 años". */
  ages(category: Category): string {
    const youngest = this.currentYear - category.birth_year_to;
    const oldest = this.currentYear - category.birth_year_from;
    return youngest === oldest ? `${youngest} años` : `${youngest} a ${oldest} años`;
  }
}
