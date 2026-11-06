import { HttpErrorResponse } from '@angular/common/http';

/** The Spanish message to show for any failed API call (the backend always answers {"detail": "..."}). */
export function apiErrorMessage(error: unknown, fallback = 'Ocurrió un error. Intenta de nuevo.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
    const detail = (error.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (error.status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.';
  }
  return fallback;
}
