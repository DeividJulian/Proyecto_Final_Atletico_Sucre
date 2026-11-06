import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminApiService } from '../../../core/api/admin-api.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { AppReleaseFull } from '../../../core/models/staff';
import { NotificationService } from '../../../core/services/notification.service';
import { PublicContentStore } from '../../../core/state/public-content.store';
import { FieldError } from '../../../shared/forms/field-error';
import { colombianPhone, normalizePhone } from '../../../shared/forms/validators';

/** Club settings (fees, Nequi, WhatsApp, data policy) and the versions of the Android app. */
@Component({
  selector: 'app-admin-settings',
  imports: [ReactiveFormsModule, FieldError, DatePipe],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.css',
})
export class AdminSettings implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly notify = inject(NotificationService);
  private readonly publicStore = inject(PublicContentStore);

  protected readonly loaded = signal(false);
  protected readonly saving = signal(false);
  protected readonly releases = signal<AppReleaseFull[]>([]);
  protected readonly publishing = signal(false);

  protected readonly form = new FormGroup({
    enrollment_fee: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    monthly_fee: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    due_day: new FormControl(5, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(28)] }),
    sibling_discount_percent: new FormControl(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(100)] }),
    nequi_number: new FormControl('', { nonNullable: true, validators: [colombianPhone] }),
    nequi_holder: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    whatsapp: new FormControl('', { nonNullable: true, validators: [Validators.required, colombianPhone] }),
    payment_instructions: new FormControl('', { nonNullable: true }),
    uniform_store: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    data_policy_version: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    data_policy_text: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(20)] }),
  });

  protected readonly releaseForm = new FormGroup({
    version: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d+\.\d+\.\d+$/)] }),
    build_number: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    apk_url: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^https:\/\//)] }),
    min_android: new FormControl('', { nonNullable: true }),
    release_notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.api.settings().subscribe({
      next: (s) => {
        this.form.setValue({
          enrollment_fee: s.enrollment_fee,
          monthly_fee: s.monthly_fee,
          due_day: s.due_day,
          sibling_discount_percent: s.sibling_discount_percent,
          nequi_number: s.nequi_number ?? '',
          nequi_holder: s.nequi_holder ?? '',
          // The API stores 57 + 10 digits; the form shows the 10 digits
          whatsapp: s.whatsapp.replace(/^57(?=3\d{9}$)/, ''),
          payment_instructions: s.payment_instructions ?? '',
          uniform_store: s.uniform_store ?? '',
          data_policy_version: s.data_policy_version,
          data_policy_text: s.data_policy_text,
        });
        this.loaded.set(true);
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
    this.loadReleases();
  }

  loadReleases(): void {
    this.api.releases().subscribe({ next: (list) => this.releases.set(list) });
  }

  save(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    if (!!v.nequi_number.trim() !== !!v.nequi_holder.trim()) {
      this.notify.error('Para mostrar Nequi escribe el número y el titular (o deja ambos vacíos).');
      return;
    }
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api
      .saveSettings({
        enrollment_fee: Number(v.enrollment_fee),
        monthly_fee: Number(v.monthly_fee),
        due_day: Number(v.due_day),
        sibling_discount_percent: Number(v.sibling_discount_percent),
        nequi_number: v.nequi_number.trim() ? normalizePhone(v.nequi_number) : null,
        nequi_holder: v.nequi_holder.trim() || null,
        whatsapp: `57${normalizePhone(v.whatsapp)}`,
        payment_instructions: v.payment_instructions.trim() || null,
        uniform_store: v.uniform_store.trim() || null,
        data_policy_version: v.data_policy_version.trim(),
        data_policy_text: v.data_policy_text.trim(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.publicStore.retry(); // the public site shows the new values
          this.notify.success('Ajustes del club guardados.');
        },
        error: (err) => {
          this.saving.set(false);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }

  publish(): void {
    this.releaseForm.markAllAsTouched();
    if (this.releaseForm.invalid) return;
    const v = this.releaseForm.getRawValue();
    this.publishing.set(true);
    this.api
      .publishRelease({
        version: v.version.trim(),
        build_number: Number(v.build_number),
        apk_url: v.apk_url.trim(),
        min_android: v.min_android.trim() || null,
        release_notes: v.release_notes.trim() || null,
        is_current: true,
      })
      .subscribe({
        next: (release) => {
          this.publishing.set(false);
          this.releaseForm.reset({ version: '', build_number: release.build_number + 1, apk_url: '', min_android: release.min_android ?? '', release_notes: '' });
          this.notify.success(`Versión ${release.version} publicada en la sección "Descarga la app".`);
          this.loadReleases();
        },
        error: (err) => {
          this.publishing.set(false);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }

  makeCurrent(release: AppReleaseFull): void {
    this.api.makeCurrent(release.id).subscribe({
      next: () => {
        this.notify.success(`La versión ${release.version} es ahora la actual.`);
        this.loadReleases();
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }
}
