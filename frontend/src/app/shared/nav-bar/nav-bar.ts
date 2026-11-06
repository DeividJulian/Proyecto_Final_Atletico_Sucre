import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NAV_LINKS } from '../../core/content/club-content';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBar {
  protected readonly links = NAV_LINKS;
  protected readonly desktopLinks = NAV_LINKS.filter((link) => link.short);
  protected readonly open = signal(false);

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
