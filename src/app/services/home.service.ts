import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, shareReplay, tap, timeout } from 'rxjs/operators';

export interface HomeResponse {
  success: boolean;
  data: {
    categories?: any[];
    recommend?: any[];
    newProducts?: any[];
    featuredProducts?: any[];
    news?: any[];
    partners?: any[];
    banners?: Record<string, any[]>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private readonly apiUrl = 'http://localhost:3000/api/home';
  private readonly cacheTtl = 60 * 1000;

  private cache: { data: HomeResponse; timestamp: number } | null = null;
  private pendingRequest$: Observable<HomeResponse> | null = null;

  constructor(private http: HttpClient) {}

  getHomeData(forceRefresh = false): Observable<HomeResponse> {
    const now = Date.now();

    if (!forceRefresh && this.cache && now - this.cache.timestamp < this.cacheTtl) {
      return of(this.cache.data);
    }

    if (!forceRefresh && this.pendingRequest$) {
      return this.pendingRequest$;
    }

    this.pendingRequest$ = this.http.get<HomeResponse>(this.apiUrl).pipe(
      timeout(10000),
      tap((response) => {
        this.cache = {
          data: response,
          timestamp: Date.now(),
        };
        this.pendingRequest$ = null;
      }),
      catchError((error) => {
        this.pendingRequest$ = null;

        if (this.cache) {
          return of(this.cache.data);
        }

        return throwError(() => error);
      }),
      shareReplay(1),
    );

    return this.pendingRequest$;
  }

  clearCache(): void {
    this.cache = null;
    this.pendingRequest$ = null;
  }
}
