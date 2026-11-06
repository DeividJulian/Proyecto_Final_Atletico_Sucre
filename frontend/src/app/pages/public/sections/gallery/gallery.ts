import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { News } from '../../../../core/models/public';
import { PublicContentStore } from '../../../../core/state/public-content.store';

@Component({
  selector: 'app-gallery',
  imports: [DatePipe],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  protected readonly store = inject(PublicContentStore);
  protected readonly expanded = signal<number | null>(null);

  toggleNews(item: News): void {
    this.expanded.update((current) => (current === item.id ? null : item.id));
  }
}
