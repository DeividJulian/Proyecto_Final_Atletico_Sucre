import { Component, computed, inject, signal } from '@angular/core';

import { ABOUT, CLUB } from '../../../../core/content/club-content';
import { Coach } from '../../../../core/models/public';
import { PublicContentStore } from '../../../../core/state/public-content.store';

@Component({
  selector: 'app-coaches',
  templateUrl: './coaches.html',
  styleUrl: './coaches.css',
})
export class Coaches {
  protected readonly store = inject(PublicContentStore);
  protected readonly about = ABOUT;
  protected readonly club = CLUB;
  protected readonly openId = signal<number | null>(null);

  protected readonly president = computed(() =>
    this.store.coaches().find((c) => c.role_title.toLowerCase().includes('presidente')) ?? null,
  );
  protected readonly staff = computed(() => this.store.coaches().filter((c) => c !== this.president()));

  toggle(coach: Coach): void {
    this.openId.update((current) => (current === coach.id ? null : coach.id));
  }

  initials(coach: Coach): string {
    return coach.full_name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('');
  }

  shortName(coach: Coach): string {
    return coach.full_name.split(' ').slice(0, 2).join(' ');
  }
}
