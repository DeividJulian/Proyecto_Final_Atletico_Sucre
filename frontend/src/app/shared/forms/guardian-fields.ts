import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { GUARDIAN_DOCUMENT_TYPES, RELATIONSHIPS } from '../../core/content/labels';
import { GuardianForm } from './family-forms';
import { FieldError } from './field-error';

/** Fields of the guardian (acudiente). The document can be locked when editing an existing profile. */
@Component({
  selector: 'app-guardian-fields',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <div class="form-grid" [formGroup]="form()">
      <div class="field">
        <label for="g-first">Nombres *</label>
        <input id="g-first" formControlName="first_names" autocomplete="given-name" />
        <app-field-error [control]="form().controls.first_names" />
      </div>
      <div class="field">
        <label for="g-last">Apellidos *</label>
        <input id="g-last" formControlName="last_names" autocomplete="family-name" />
        <app-field-error [control]="form().controls.last_names" />
      </div>
      <div class="field">
        <label for="g-doctype">Tipo de documento *</label>
        <select id="g-doctype" formControlName="document_type">
          @for (option of documentTypes; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="g-doc">Número de documento *</label>
        <input id="g-doc" formControlName="document_number" inputmode="numeric" placeholder="Sin puntos" />
        <app-field-error [control]="form().controls.document_number" />
      </div>
      <div class="field">
        <label for="g-phone">Celular / WhatsApp *</label>
        <input id="g-phone" formControlName="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="321 854 3957" />
        <app-field-error [control]="form().controls.phone" />
      </div>
      <div class="field">
        <label for="g-alt">Otro celular (opcional)</label>
        <input id="g-alt" formControlName="alt_phone" type="tel" inputmode="tel" />
        <app-field-error [control]="form().controls.alt_phone" />
      </div>
      <div class="field field--wide">
        <label for="g-address">Dirección *</label>
        <input id="g-address" formControlName="address" autocomplete="street-address" placeholder="Calle 10 # 5-20" />
        <app-field-error [control]="form().controls.address" />
      </div>
      <div class="field">
        <label for="g-neigh">Barrio (opcional)</label>
        <input id="g-neigh" formControlName="neighborhood" />
      </div>
      <div class="field">
        <label for="g-city">Ciudad *</label>
        <input id="g-city" formControlName="city" autocomplete="address-level2" />
        <app-field-error [control]="form().controls.city" />
      </div>
      <div class="field field--wide">
        <label for="g-rel">Parentesco con el deportista *</label>
        <select id="g-rel" formControlName="relationship_to_player">
          <option value="" disabled>Selecciona…</option>
          @for (option of relationships; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
        <app-field-error [control]="form().controls.relationship_to_player" />
      </div>
    </div>
  `,
})
export class GuardianFields {
  readonly form = input.required<GuardianForm>();
  protected readonly documentTypes = GUARDIAN_DOCUMENT_TYPES;
  protected readonly relationships = RELATIONSHIPS;
}
