import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders the navigation, the footer and the WhatsApp button', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('app-nav-bar')).not.toBeNull();
    expect(page.querySelector('app-site-footer')).not.toBeNull();
    expect(page.querySelector('a[aria-label="Escríbenos por WhatsApp"]')?.getAttribute('href')).toContain('wa.me/57');
  });

  it('opens and closes the mobile menu', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const toggle = page.querySelector<HTMLButtonElement>('.nav__toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    page.querySelector<HTMLAnchorElement>('#menu-movil a')!.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
