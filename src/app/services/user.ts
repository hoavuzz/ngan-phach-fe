import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, throwError, Observable } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  apiUrl = 'http://localhost:3000/api/users';

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.loadUserFromLocalStorage();
  }
  

  // ================= INIT =================

  private loadUserFromLocalStorage() {
    console.log('🔄 [UserService] loadUserFromLocalStorage called');
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      console.log('📦 [UserService] Stored user:', storedUser);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('✅ [UserService] Parsed user:', parsedUser);
          this.userSubject.next(parsedUser);
        } catch {
          console.error('Invalid user in localStorage');
          localStorage.removeItem('user');
        }
      }
    }
  }

  // ================= HEADERS =================

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  // ================= AUTH =================

  register(data: any) {
    return this.http
      .post<any>(this.apiUrl + '/register', data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  login(data: any) {
    console.log('🔐 [UserService] Login called with:', data.email);
    return this.http.post<any>(this.apiUrl + '/login', data).pipe(
      tap((res) => {
        console.log('📦 [UserService] Login response:', res);
        this.handleAuth(res);
      }),
    );
  }

  logout() {
    console.log('🚪 [UserService] Logout called');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    this.userSubject.next(null);
  }

  refreshToken(): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not in browser'));
    }

    const refreshToken = localStorage.getItem('refreshToken');

    return this.http.post<any>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap((res) => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
      }),
    );
  }

  private handleAuth(res: any) {
    console.log('🔧 [UserService] handleAuth called');
    if (!isPlatformBrowser(this.platformId)) {
      console.log('❌ Not in browser');
      return;
    }

    console.log('💾 Saving to localStorage...');
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.nguoiDung));

    console.log('📢 Emitting user:', res.nguoiDung);
    console.log('📢 Observers count:', this.userSubject.observers.length);
    this.userSubject.next(res.nguoiDung);
  }

  // ================= USER =================

  getUser() {
    return this.userSubject.value;
  }

  updateLocalUser(data: any) {
    console.log('🔄 [UserService] updateLocalUser:', data);
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem('user', JSON.stringify(data));
    this.userSubject.next(data);
  }

  // ================= PROFILE =================

  getProfile() {
    return this.http
      .get<any>(this.apiUrl + '/profile', {
        headers: this.getHeaders(),
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

  uploadAvatar(formData: FormData) {
    return this.http
      .post<any>('http://localhost:3000/api/upload/users', formData, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap((res) => {
          const user = this.getUser();
          if (user) {
            user.anhDaiDien = res.url;
            this.updateLocalUser(user);
          }
        }),
        catchError(this.handleError),
      );
  }

  // ================= ADDRESS =================

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

  deleteAddress(id: number) {
    return this.http
      .delete<any>(`${this.apiUrl}/dia-chi/${id}`, {
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

  // ================= FAVORITE =================

  getFavorites() {
    console.log('📤 Gọi API lấy danh sách yêu thích');
    return this.http
      .get<any>(this.apiUrl + '/yeu-thich', {
        headers: this.getHeaders(),
      })
      .pipe(
        tap((response) => console.log('📥 Response danh sách yêu thích:', response)),
        catchError(this.handleError),
      );
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

  addFavoriteByProduct(sanPhamId: number, bienTheId: number | null = null, ghiChu: string = '') {
    const body = { sanPhamId, bienTheId, ghiChu };
    console.log('📤 Gửi request POST thêm yêu thích:', {
      url: this.apiUrl + '/yeu-thich',
      body: body,
    });

    return this.http
      .post<any>(this.apiUrl + '/yeu-thich', body, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap((response) => console.log('📥 Response thành công:', response)),
        catchError((error) => {
          console.error('❌ Lỗi chi tiết:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error,
          });
          return throwError(() => error);
        }),
      );
  }

  removeFavorite(bienTheId: number) {
    return this.http
      .delete<any>(`${this.apiUrl}/yeu-thich/${bienTheId}`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  removeFavoriteById(yeuThichId: number) {
    console.log('📤 Gửi request DELETE xóa yêu thích ID:', yeuThichId);
    return this.http
      .delete<any>(`${this.apiUrl}/yeu-thich/${yeuThichId}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap((response) => console.log('📥 Xóa thành công:', response)),
        catchError((error) => {
          console.error('❌ Lỗi khi xóa yêu thích:', error);
          return throwError(() => error);
        }),
      );
  }

  // ================= ORDERS & POINTS =================

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

  // ================= FORGOT/RESET PASSWORD =================

  forgotPassword(data: any) {
    return this.http.post(this.apiUrl + '/forgot-password', data);
  }

  resetPassword(data: any) {
    return this.http.post(this.apiUrl + '/reset-password', data);
  }

  // ================= ERROR HANDLING =================

  private handleError = (error: HttpErrorResponse) => {
    if (error.status === 401) {
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
            return throwError(() => new Error('Token refreshed, please retry'));
          } else {
            return throwError(() => error);
          }
        }),
      );
    }
  }
}
