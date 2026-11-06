import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService, CrudApi } from '../../../core/api/admin-api.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Player, PlayerDetail } from '../../../core/models/family';
import { Category } from '../../../core/models/public';
import { NotificationService } from '../../../core/services/notification.service';
import { formatPhone } from '../../../core/utils/format';
import { ConfirmService } from '../../../shared/confirm/confirm.service';

type Filter = 'pending' | 'approved' | 'rejected' | 'inactive';

/** Pending enrollments: see the family data, adjust category/fee and approve, or reject with a reason. */
@Component({
  selector: 'app-admin-enrollments',
  imports: [DatePipe, FormsModule],
  templateUrl: './enrollments.html',
  styleUrl: './enrollments.css',
})
export class AdminEnrollments implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly crud = inject(CrudApi);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  protected readonly filter = signal<Filter>('pending');
  protected readonly players = signal<Player[] | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly details = signal<Record<number, PlayerDetail>>({});
  protected readonly expanded = signal<number | null>(null);
  protected readonly busy = signal<number | null>(null);
  /** Category and fee chosen on screen before approving, per player. */
  protected readonly choice: Record<number, { category_id: number | null; monthly_fee: number }> = {};

  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'inactive', label: 'Inactivas' },
  ];
  protected readonly label = label;
  protected readonly phone = formatPhone;

  ngOnInit(): void {
    this.crud.list<Category>('/admin/categories').subscribe({ next: (list) => this.categories.set(list) });
    this.load();
  }

  setFilter(value: Filter): void {
    this.filter.set(value);
    this.load();
  }

  load(): void {
    this.players.set(null);
    this.expanded.set(null);
    this.api.enrollments(this.filter()).subscribe({
      next: (list) => {
        for (const player of list) {
          this.choice[player.id] = { category_id: player.category?.id ?? null, monthly_fee: player.monthly_fee };
        }
        this.players.set(list);
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  toggle(player: Player): void {
    const open = this.expanded() === player.id ? null : player.id;
    this.expanded.set(open);
    if (open !== null && !this.details()[player.id]) {
      this.api.player(player.id).subscribe({
        next: (detail) => this.details.update((map) => ({ ...map, [player.id]: detail })),
        error: (err) => this.notify.error(apiErrorMessage(err)),
      });
    }
  }

  approve(player: Player): void {
    const choice = this.choice[player.id];
    if (!choice?.category_id) {
      this.notify.error('Elige la categoría antes de aprobar.');
      return;
    }
    this.busy.set(player.id);
    this.api.approve(player.id, { category_id: choice.category_id, monthly_fee: Number(choice.monthly_fee) }).subscribe({
      next: () => {
        this.busy.set(null);
        this.notify.success(`Inscripción de ${player.first_names} aprobada. Se avisó a la familia por correo.`);
        this.load();
      },
      error: (err) => {
        this.busy.set(null);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  async reject(player: Player): Promise<void> {
    const reason = await this.confirm.ask({
      title: 'Rechazar inscripción',
      message: `La familia de ${player.full_name} verá el motivo en su panel y lo recibirá por correo.`,
      confirmText: 'Rechazar',
      danger: true,
      askReason: { label: 'Motivo', minLength: 5 },
    });
    if (!reason) return;
    this.busy.set(player.id);
    this.api.reject(player.id, reason).subscribe({
      next: () => {
        this.busy.set(null);
        this.notify.success('Inscripción rechazada.');
        this.load();
      },
      error: (err) => {
        this.busy.set(null);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }
}
