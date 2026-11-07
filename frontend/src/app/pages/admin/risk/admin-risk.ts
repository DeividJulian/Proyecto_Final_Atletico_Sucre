import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdminApiService, CrudApi } from '../../../core/api/admin-api.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Category } from '../../../core/models/public';
import { RiskLevel, RiskReport } from '../../../core/models/staff';
import { formatPhone } from '../../../core/utils/format';

const LEVEL_TEXT: Record<RiskLevel, string> = { high: 'Riesgo alto', medium: 'Riesgo medio', low: 'Riesgo bajo' };
const MODEL_NAMES: Record<string, string> = {
  logistic_regression: 'Regresión logística',
  random_forest: 'Random forest',
};

/** Dropout risk (Fase 8): ordered list with the factors of each player and a WhatsApp button to the family. */
@Component({
  selector: 'app-admin-risk',
  imports: [DecimalPipe],
  templateUrl: './admin-risk.html',
  styleUrl: './admin-risk.css',
})
export class AdminRisk implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly crud = inject(CrudApi);

  protected readonly report = signal<RiskReport | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoryId = signal<number | null>(null);
  protected readonly level = signal<RiskLevel | 'all'>('all');
  protected readonly showModel = signal(false);
  protected readonly levelText = LEVEL_TEXT;
  protected readonly phone = formatPhone;

  protected readonly visible = computed(() => {
    const report = this.report();
    if (!report) return [];
    const level = this.level();
    return level === 'all' ? report.players : report.players.filter((p) => p.level === level);
  });

  protected readonly modelName = computed(() => MODEL_NAMES[this.report()?.model.name ?? ''] ?? this.report()?.model.name);
  protected readonly compared = computed(() =>
    Object.entries(this.report()?.model.compared ?? {}).map(([name, metrics]) => ({ name: MODEL_NAMES[name] ?? name, metrics })),
  );

  ngOnInit(): void {
    this.crud.list<Category>('/admin/categories').subscribe({ next: (list) => this.categories.set(list) });
    this.load();
  }

  load(): void {
    this.report.set(null);
    this.error.set(null);
    this.api.risk(this.categoryId()).subscribe({
      next: (data) => this.report.set(data),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  selectCategory(id: number | null): void {
    this.categoryId.set(id);
    this.load();
  }
}
