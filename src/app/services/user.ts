import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { BehaviorSubject, throwError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class User {
  apiUrl = 'http://localhost:3000/api/users';
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          this.userSubject.next(parsed);
        } catch (e) {
          console.error('Invalid user in localStorage', e);
          localStorage.removeItem('user');
        }
      }
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token from localStorage:', token ? 'Có token' : 'Không có token');

      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
        console.log('📨 Headers đã set:', headers);
      } else {
        console.warn('⚠️ Không tìm thấy token trong localStorage');
      }
    }

    return headers;
  }

  private handleError = (error: HttpErrorResponse) => {
    if (error.status === 401) {
      // Token expired hoặc không hợp lệ
      return this.handle401Error(error);
    }
    return throwError(() => error);
  };

  private handle401Error(error: HttpErrorResponse): Observable<any> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = isPlatformBrowser(this.platformId)
        ? localStorage.getItem('refreshToken')
        : null;

      if (!refreshToken) {
        this.logout();
        return throwError(() => error);
      }

      return this.http.post<any>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
        switchMap((res: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.accessToken);

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('accessToken', res.accessToken);
            localStorage.setItem('refreshToken', res.refreshToken);
          }

          // Thử lại request ban đầu - lấy từ url gốc
          // Vì không có context, chúng ta sẽ không tự động retry
          // Thay vào đó, trả về observable để component tự xử lý
          return throwError(() => new Error('Token refreshed, please retry'));
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => refreshError);
        }),
      );
    } else {
      return this.refreshTokenSubject.pipe(
        switchMap((token) => {
          if (token) {
            // Token đã được refresh, component cần gọi lại API
            return throwError(() => new Error('Token refreshed, please retry'));
          } else {
            return throwError(() => error);
          }
        }),
      );
    }
  }

  register(data: any) {
    return this.http
      .post<any>(this.apiUrl + '/register', data)
      .pipe(tap((res) => this.saveAuth(res)));
  }

  login(data: any) {
    return this.http.post<any>(this.apiUrl + '/login', data).pipe(tap((res) => this.saveAuth(res)));
  }

  private saveAuth(res: any) {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.nguoiDung));

    this.userSubject.next(res.nguoiDung);
  }

  getUser() {
    return this.userSubject.value;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }

    this.userSubject.next(null);
  }

  getProfile() {
    const headers = this.getHeaders();

    return this.http
      .get<any>(this.apiUrl + '/profile', {
        headers: headers,
      })
      .pipe(catchError(this.handleError));
  }

  updateProfile(data: any) {
    return this.http
      .put<any>(this.apiUrl + '/profile', data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  changePassword(data: any) {
    return this.http
      .put<any>(this.apiUrl + '/password', data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getAddresses() {
    return this.http
      .get<any>(this.apiUrl + '/dia-chi', {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  addAddress(data: any) {
    return this.http
      .post<any>(this.apiUrl + '/dia-chi', data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  updateAddress(id: number, data: any) {
    return this.http
      .put<any>(`${this.apiUrl}/dia-chi/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  setDefaultAddress(id: number) {
    return this.http
      .put<any>(
        `${this.apiUrl}/dia-chi/${id}/mac-dinh`,
        {},
        {
          headers: this.getHeaders(),
        },
      )
      .pipe(catchError(this.handleError));
  }

  deleteAddress(id: number) {
    return this.http
      .delete<any>(`${this.apiUrl}/dia-chi/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getFavorites() {
    return this.http
      .get<any>(this.apiUrl + '/yeu-thich', {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  addFavorite(bienTheId: number) {
    return this.http
      .post<any>(
        this.apiUrl + '/yeu-thich',
        { bienTheId },
        {
          headers: this.getHeaders(),
        },
      )
      .pipe(catchError(this.handleError));
  }

  removeFavorite(bienTheId: number) {
    return this.http
      .delete<any>(`${this.apiUrl}/yeu-thich/${bienTheId}`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getOrders() {
    return this.http
      .get<any>(this.apiUrl + '/don-hang', {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getPoints() {
    return this.http
      .get<any>(this.apiUrl + '/diem-tich-luy', {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  uploadAvatar(formData: FormData) {
    // Sửa URL: dùng dynamic route với type='users' và field name='image'
    return this.http
      .post<any>('http://localhost:3000/api/upload/users', formData, {
        headers: this.getHeaders(),
        // Không set Content-Type, để browser tự set
      })
      .pipe(catchError(this.handleError));
  }

  refreshToken() {
    // Kiểm tra platform trước khi dùng localStorage
    let refreshToken = null;
    if (isPlatformBrowser(this.platformId)) {
      refreshToken = localStorage.getItem('refreshToken');
    }
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, { refreshToken });
  }
}
