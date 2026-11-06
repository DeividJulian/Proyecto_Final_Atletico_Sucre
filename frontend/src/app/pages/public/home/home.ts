import { Component, OnInit, inject } from '@angular/core';

import { PublicContentStore } from '../../../core/state/public-content.store';
import { About } from '../sections/about/about';
import { AppDownload } from '../sections/app-download/app-download';
import { Categories } from '../sections/categories/categories';
import { Coaches } from '../sections/coaches/coaches';
import { Contact } from '../sections/contact/contact';
import { Costs } from '../sections/costs/costs';
import { Gallery } from '../sections/gallery/gallery';
import { Hero } from '../sections/hero/hero';
import { Schedule } from '../sections/schedule/schedule';

/** The public one-page site. Each section is its own component; the data comes from PublicContentStore. */
@Component({
  selector: 'app-home',
  imports: [Hero, About, Categories, Schedule, Coaches, Costs, Gallery, AppDownload, Contact],
  template: `
    <app-hero />
    <app-about />
    <app-categories />
    <app-schedule />
    <app-coaches />
    <app-costs />
    <app-gallery />
    <app-app-download />
    <app-contact />
  `,
})
export class Home implements OnInit {
  private readonly store = inject(PublicContentStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
