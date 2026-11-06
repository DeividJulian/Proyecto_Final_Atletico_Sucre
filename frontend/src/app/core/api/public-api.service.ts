import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { API_URL } from '../config/api-url';
import { AppRelease, Category, Coach, GalleryItem, News, PublicClub, ScheduleItem, Venue } from '../models/public';

/** Read-only calls to the public endpoints of the API (no session needed). */
@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly http = inject(HttpClient);

  club(): Observable<PublicClub> {
    return this.http.get<PublicClub>(`${API_URL}/public/club`);
  }

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${API_URL}/public/categories`);
  }

  venues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(`${API_URL}/public/venues`);
  }

  schedule(): Observable<ScheduleItem[]> {
    return this.http.get<ScheduleItem[]>(`${API_URL}/public/schedule`);
  }

  coaches(): Observable<Coach[]> {
    return this.http.get<Coach[]>(`${API_URL}/public/coaches`);
  }

  news(): Observable<News[]> {
    return this.http.get<News[]>(`${API_URL}/public/news`);
  }

  gallery(): Observable<GalleryItem[]> {
    return this.http.get<GalleryItem[]>(`${API_URL}/public/gallery`);
  }

  /** The current APK, or null while no version has been published (the API answers 404). */
  appRelease(): Observable<AppRelease | null> {
    return this.http.get<AppRelease>(`${API_URL}/app-release`).pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error),
      ),
    );
  }
}
