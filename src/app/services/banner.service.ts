import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable, of, from } from 'rxjs';
import { catchError, tap, shareReplay, timeout, delay, retryWhen, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private apiUrl = 'http://localhost:3000/api/banners';

  // Cache cho từng vị trí
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 phút
  private readonly REQUEST_TIMEOUT = 8000; // 8 giây timeout

  // Để tránh gọi trùng lặp
  private pendingRequests = new Map<string, Observable<any>>();

  // Giới hạn số lần gọi API
  private callCount = new Map<string, number>();
  private lastCallTime = new Map<string, number>();
  private readonly MAX_CALLS_PER_MINUTE = 3; // Mỗi vị trí tối đa 3 lần/phút

  constructor(private http: HttpClient) {}

  /**
   * Lấy banner theo vị trí có cache và giới hạn tần suất
   */
  layTheoViTri(viTri: string): Observable<any> {
    // Kiểm tra giới hạn tần suất
    if (!this.canMakeRequest(viTri)) {
      console.warn(
        `⚠️ [BannerService] Rate limit exceeded for: ${viTri}, using cache if available`,
      );

      // Trả về cache cũ nếu có
      const cached = this.cache.get(viTri);
      if (cached) {
        return of(cached.data);
      }

      // Trả về mảng rỗng nếu không có cache
      return of({ success: true, data: [] });
    }

    // Kiểm tra cache còn hạn
    const cached = this.cache.get(viTri);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 [BannerService] Using cached data for: ${viTri}`);
      return of(cached.data);
    }

    // Nếu đang có request cho vị trí này, dùng chung
    if (this.pendingRequests.has(viTri)) {
      console.log(`🔄 [BannerService] Reusing pending request for: ${viTri}`);
      return this.pendingRequests.get(viTri)!;
    }

    console.log(`📤 [BannerService] Fetching fresh data for: ${viTri}`);
    this.updateCallCount(viTri);

    const request = this.http.get<any>(`${this.apiUrl}/vi-tri/${viTri}`).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retryWhen((errors) =>
        errors.pipe(
          delay(1000),
          take(2), // Retry tối đa 2 lần
        ),
      ),
      tap((response) => {
        // Lưu vào cache
        this.cache.set(viTri, {
          data: response,
          timestamp: Date.now(),
        });
        this.pendingRequests.delete(viTri);
        console.log(`✅ [BannerService] Cached data for: ${viTri}`);
      }),
      catchError((error) => {
        this.pendingRequests.delete(viTri);
        console.error(`❌ [BannerService] Error for ${viTri}:`, error);

        // Nếu có cache cũ (dù hết hạn) vẫn trả về
        const cached = this.cache.get(viTri);
        if (cached) {
          console.warn(`⚠️ [BannerService] Using expired cache for: ${viTri}`);
          return of(cached.data);
        }

        return of({ success: true, data: [] }); // Trả về mảng rỗng thay vì lỗi
      }),
      shareReplay(1),
    );

    this.pendingRequests.set(viTri, request);
    return request;
  }

  /**
   * Kiểm tra xem có được phép gọi API không
   */
  private canMakeRequest(viTri: string): boolean {
    const lastCall = this.lastCallTime.get(viTri) || 0;
    const calls = this.callCount.get(viTri) || 0;
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;

    // Reset counter nếu đã qua 1 phút
    if (lastCall < minuteAgo) {
      this.callCount.set(viTri, 0);
      this.lastCallTime.set(viTri, now);
      return true;
    }

    // Kiểm tra số lần gọi trong phút
    return calls < this.MAX_CALLS_PER_MINUTE;
  }

  /**
   * Cập nhật số lần gọi API
   */
  private updateCallCount(viTri: string): void {
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const lastCall = this.lastCallTime.get(viTri) || 0;

    if (lastCall < minuteAgo) {
      this.callCount.set(viTri, 1);
    } else {
      const currentCount = this.callCount.get(viTri) || 0;
      this.callCount.set(viTri, currentCount + 1);
    }
    this.lastCallTime.set(viTri, now);
  }

  /**
   * Clear cache cho 1 hoặc tất cả vị trí
   */
  clearCache(viTri?: string): void {
    if (viTri) {
      this.cache.delete(viTri);
      console.log(`🗑️ [BannerService] Cache cleared for: ${viTri}`);
    } else {
      this.cache.clear();
      console.log(`🗑️ [BannerService] All cache cleared`);
    }
  }

  // ================= CÁC METHOD KHÁC GIỮ NGUYÊN =================

  danhSach(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap((response) => console.log('📥 [BannerService] Response danh sách:', response)),
      catchError(this.handleError),
    );
  }

  chiTiet(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  danhSachAdmin(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin`).pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('❌ [BannerService] Lỗi:', error.status);
    return throwError(() => error);
  };
}
