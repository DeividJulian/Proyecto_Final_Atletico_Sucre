import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';

import { GalleryItem } from '../../../core/models/public';
import { CrudConfig, CrudPage } from '../../../shared/crud/crud-page';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  cover_url: string | null;
  is_published: boolean;
  published_at: string | null;
}

const datePipe = new DatePipe('es-CO');

/** News (published ones appear on the site) and the photo gallery. */
@Component({
  selector: 'app-admin-content',
  imports: [CrudPage],
  template: `
    <div class="chips" role="tablist" aria-label="Contenido">
      <button type="button" class="chip" role="tab" [attr.aria-pressed]="tab() === 'noticias'" (click)="tab.set('noticias')">Noticias</button>
      <button type="button" class="chip" role="tab" [attr.aria-pressed]="tab() === 'galeria'" (click)="tab.set('galeria')">Galería</button>
    </div>
    @if (tab() === 'noticias') {
      <app-crud-page [config]="newsConfig" />
    } @else {
      <p class="notice">Las imágenes se cargan por ruta (por ejemplo <code>/img/galeria/foto.jpeg</code>) o por URL pública.</p>
      <app-crud-page [config]="galleryConfig" />
    }
  `,
  styles: `:host { display: grid; gap: 16px; }`,
})
export class AdminContent {
  protected readonly tab = signal<'noticias' | 'galeria'>('noticias');

  protected readonly newsConfig: CrudConfig<NewsItem> = {
    path: '/admin/news',
    singular: 'Noticia',
    heading: (n) => n.title,
    columns: [
      { label: 'Estado', value: (n) => (n.is_published ? 'Publicada' : 'Borrador') },
      { label: 'Publicada el', value: (n) => (n.published_at ? (datePipe.transform(n.published_at, 'mediumDate') ?? '—') : '—') },
      { label: 'Resumen', value: (n) => n.summary ?? '—' },
    ],
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true, maxLength: 160, wide: true },
      { key: 'summary', label: 'Resumen (se ve en la tarjeta)', type: 'text', maxLength: 300, wide: true },
      { key: 'body', label: 'Texto completo', type: 'textarea', required: true },
      { key: 'cover_url', label: 'Imagen de portada (ruta o URL)', type: 'text', maxLength: 500, wide: true },
      { key: 'is_published', label: 'Publicar en el sitio', type: 'checkbox' },
    ],
  };

  protected readonly galleryConfig: CrudConfig<GalleryItem> = {
    path: '/admin/gallery',
    singular: 'Imagen',
    heading: (g) => g.title,
    columns: [
      { label: 'Archivo', value: (g) => g.media_url },
      { label: 'Etiqueta', value: (g) => g.tag ?? '—' },
      { label: 'Orden', value: (g) => String(g.display_order) },
    ],
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true, maxLength: 120 },
      { key: 'tag', label: 'Etiqueta (ej. 2014, femenino)', type: 'text', maxLength: 40 },
      { key: 'media_url', label: 'Ruta o URL de la imagen', type: 'text', required: true, maxLength: 500, wide: true },
      { key: 'caption', label: 'Descripción', type: 'text', maxLength: 300, wide: true },
      { key: 'media_type', label: 'Tipo', type: 'select', required: true, default: 'image',
        options: () => [{ value: 'image', label: 'Imagen' }, { value: 'video', label: 'Video' }] },
      { key: 'display_order', label: 'Orden', type: 'number', default: 0 },
    ],
  };
}
