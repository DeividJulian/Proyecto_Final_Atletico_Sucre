import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { PublicApiService } from '../api/public-api.service';
import { AppRelease, Category, Coach, GalleryItem, News, PublicClub, ScheduleItem, Venue } from '../models/public';
import { ConnectionService } from '../services/connection.service';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Signal store with the data of the public site. Static texts and images render at once; these sections
 * fill in when the backend answers (after Render wakes up).
 */
@Injectable({ providedIn: 'root' })
export class PublicContentStore {
  private readonly api = inject(PublicApiService);
  private readonly connection = inject(ConnectionService);

  readonly state = signal<LoadState>('idle');
  readonly club = signal<PublicClub | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly venues = signal<Venue[]>([]);
  readonly schedule = signal<ScheduleItem[]>([]);
  readonly coaches = signal<Coach[]>([]);
  readonly news = signal<News[]>([]);
  readonly gallery = signal<GalleryItem[]>([]);
  readonly appRelease = signal<AppRelease | null>(null);

  readonly loading = computed(() => this.state() === 'idle' || this.state() === 'loading');

  /** Loads everything once; calling it again only retries after an error. */
  async load(): Promise<void> {
    if (this.state() === 'loading' || this.state() === 'ready') return;
    this.state.set('loading');
    try {
      await this.connection.whenOnline();
      await Promise.all([
        this.fill(this.api.club(), this.club),
        this.fill(this.api.categories(), this.categories),
        this.fill(this.api.venues(), this.venues),
        this.fill(this.api.schedule(), this.schedule),
        this.fill(this.api.coaches(), this.coaches),
        this.fill(this.api.news(), this.news),
        this.fill(this.api.gallery(), this.gallery),
        this.fill(this.api.appRelease(), this.appRelease),
      ]);
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }

  retry(): Promise<void> {
    this.state.set('idle');
    return this.load();
  }

  private async fill<T>(source: Observable<T>, target: { set(value: T): void }): Promise<void> {
    target.set(await firstValueFrom(source));
  }
}
