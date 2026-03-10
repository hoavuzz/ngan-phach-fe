import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class User {
  apiUrl = 'http://localhost:3000/api/users';

  // Khởi tạo với null, KHÔNG đọc localStorage ở đây
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    // Chỉ load từ storage nếu đang chạy trên browser
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          this.userSubject.next(parsed); // phát giá trị ban đầu
        } catch (e) {
          console.error('Invalid user in localStorage', e);
          localStorage.removeItem('user'); // xóa nếu hỏng
        }
      }
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
    if (!isPlatformBrowser(this.platformId)) return; // an toàn cho SSR

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

  // getProfile() {
  //   const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;

  //   return this.http.get<any>(this.apiUrl + '/profile', {
  //     headers: {
  //       Authorization: token ? `Bearer ${token}` : '',
  //     },
  //   });
  // }

  getProfile() {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;

    return this.http.get<any>(this.apiUrl + '/profile', {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'ngsw-bypass': 'true', // <-- tắt cache/transfer state cho request này
      },
    });
  }
}
