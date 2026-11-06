import { Component, computed, inject, signal } from '@angular/core';

import { Venue } from '../../../../core/models/public';
import { PublicContentStore } from '../../../../core/state/public-content.store';
import { formatTime, mapsLink } from '../../../../core/utils/format';
import { groupByShift } from '../../../../core/utils/schedule';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule {
  protected readonly store = inject(PublicContentStore);
  /** null = all categories */
  protected readonly selectedCategory = signal<number | null>(null);
  protected readonly blocks = computed(() => groupByShift(this.store.schedule(), this.selectedCategory()));
  protected readonly time = formatTime;

  select(categoryId: number | null): void {
    this.selectedCategory.set(categoryId);
  }

  maps(venue: Venue): string {
    return mapsLink(venue.name, venue.maps_url, venue.address);
  }
}
