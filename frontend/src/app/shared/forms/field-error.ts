import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { map, of, startWith, switchMap } from 'rxjs';

import { errorText } from './validators';

/**
 * Error message under a field, shown once the user touched it (or pressed "Continuar").
 * It listens to the control's events (value, status, touched), because a form changing state does not
 * re-render this component by itself.
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="field-error" [id]="id()" role="alert">{{ text }}</p>
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl | null>();
  readonly id = input<string>('');

  private readonly state = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control ? control.events.pipe(startWith(null), map(() => ({ control }))) : of({ control: null }),
      ),
    ),
  );

  protected readonly message = computed(() => {
    const control = this.state()?.control;
    if (!control || !control.invalid || !(control.touched || control.dirty)) return null;
    return errorText(control.errors);
  });
}
