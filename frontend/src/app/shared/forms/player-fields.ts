import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { startWith, switchMap } from 'rxjs';

import { BLOOD_TYPES, PLAYER_DOCUMENT_TYPES, SCHOOL_SHIFTS, SEXES } from '../../core/content/labels';
import { PublicContentStore } from '../../core/state/public-content.store';
import { estimateCategory } from '../../core/utils/category';
import { PlayerForm } from './family-forms';
import { FieldError } from './field-error';

/** Fields of one player (deportista). `prefix` keeps the ids unique when there are several children. */
@Component({
  selector: 'app-player-fields',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <div class="form-grid" [formGroup]="form()">
      <div class="field">
        <label [for]="prefix() + '-first'">Nombres *</label>
        <input [id]="prefix() + '-first'" formControlName="first_names" />
        <app-field-error [control]="form().controls.first_names" />
      </div>
      <div class="field">
        <label [for]="prefix() + '-last'">Apellidos *</label>
        <input [id]="prefix() + '-last'" formControlName="last_names" />
        <app-field-error [control]="form().controls.last_names" />
      </div>
      <div class="field">
        <label [for]="prefix() + '-doctype'">Tipo de documento *</label>
        <select [id]="prefix() + '-doctype'" formControlName="document_type">
          @for (option of documentTypes; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label [for]="prefix() + '-doc'">Número de documento *</label>
        <input [id]="prefix() + '-doc'" formControlName="document_number" inputmode="numeric" placeholder="Sin puntos" />
        <app-field-error [control]="form().controls.document_number" />
      </div>
      <div class="field">
        <label [for]="prefix() + '-birth'">Fecha de nacimiento *</label>
        <input [id]="prefix() + '-birth'" formControlName="birth_date" type="date" />
        <app-field-error [control]="form().controls.birth_date" />
        @if (category(); as estimate) {
          <p class="field-hint">Categoría estimada: <strong>{{ estimate }}</strong></p>
        }
      </div>
      <fieldset class="field">
        <legend>Sexo *</legend>
        <div class="choice-row">
          @for (option of sexes; track option.value) {
            <label class="choice">
              <input type="radio" formControlName="sex" [value]="option.value" />
              {{ option.label }}
            </label>
          }
        </div>
        <app-field-error [control]="form().controls.sex" />
      </fieldset>
      <div class="field">
        <label [for]="prefix() + '-school'">Colegio *</label>
        <input [id]="prefix() + '-school'" formControlName="school_name" />
        <app-field-error [control]="form().controls.school_name" />
      </div>
      <div class="field">
        <label [for]="prefix() + '-shift'">Jornada escolar *</label>
        <select [id]="prefix() + '-shift'" formControlName="school_shift">
          <option value="" disabled>Selecciona…</option>
          @for (option of schoolShifts; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
        <app-field-error [control]="form().controls.school_shift" />
        <p class="field-hint">Entrenará en la jornada contraria a la del colegio.</p>
      </div>
      <div class="field">
        <label [for]="prefix() + '-eps'">EPS *</label>
        <input [id]="prefix() + '-eps'" formControlName="eps" placeholder="Ej. Nueva EPS" />
        <app-field-error [control]="form().controls.eps" />
      </div>
      <div class="field">
        <label [for]="prefix() + '-blood'">RH (opcional)</label>
        <select [id]="prefix() + '-blood'" formControlName="blood_type">
          <option value="">No sé / prefiero no decir</option>
          @for (type of bloodTypes; track type) {
            <option [value]="type">{{ type }}</option>
          }
        </select>
      </div>
      <div class="field field--wide">
        <label [for]="prefix() + '-allergies'">Alergias (opcional)</label>
        <textarea [id]="prefix() + '-allergies'" formControlName="allergies" rows="2"></textarea>
      </div>
      <div class="field field--wide">
        <label [for]="prefix() + '-medical'">Condiciones médicas u observaciones (opcional)</label>
        <textarea [id]="prefix() + '-medical'" formControlName="medical_notes" rows="2"></textarea>
      </div>
      <div class="field">
        <label [for]="prefix() + '-ename'">Contacto de emergencia *</label>
        <input [id]="prefix() + '-ename'" formControlName="emergency_contact_name" placeholder="Nombre completo" />
        <app-field-error [control]="form().controls.emergency_contact_name" />
      </div>
      <div class="field">
        <label [for]="prefix() + '-ephone'">Celular de emergencia *</label>
        <input [id]="prefix() + '-ephone'" formControlName="emergency_contact_phone" type="tel" inputmode="tel" />
        <app-field-error [control]="form().controls.emergency_contact_phone" />
      </div>
    </div>
  `,
})
export class PlayerFields {
  readonly form = input.required<PlayerForm>();
  readonly prefix = input('p0');

  private readonly store = inject(PublicContentStore);
  protected readonly documentTypes = PLAYER_DOCUMENT_TYPES;
  protected readonly sexes = SEXES;
  protected readonly schoolShifts = SCHOOL_SHIFTS;
  protected readonly bloodTypes = BLOOD_TYPES;

  /** Live value of birth date and sex, to preview the category with the club's rule. */
  private readonly values = toSignal(
    toObservable(this.form).pipe(switchMap((form) => form.valueChanges.pipe(startWith(form.getRawValue())))),
  );

  protected readonly category = computed(() => {
    const value = this.values();
    if (!value?.birth_date) return null;
    return estimateCategory(value.birth_date, value.sex ?? '', this.store.categories());
  });
}
