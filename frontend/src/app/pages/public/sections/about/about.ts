import { Component } from '@angular/core';

import { ABOUT, CLUB, FAMILY_DUTIES, VALUES } from '../../../../core/content/club-content';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  protected readonly about = ABOUT;
  protected readonly club = CLUB;
  protected readonly values = VALUES;
  protected readonly duties = FAMILY_DUTIES;
}
