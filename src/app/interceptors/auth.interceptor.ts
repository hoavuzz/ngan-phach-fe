import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, switchMap, throwError } from 'rxjs';
import { UserService } from '../services/user'; // 👈 Sửa lại tên service

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const platformId = inject(PLATFORM_ID);

  // ================= LOGGING (từ file ghép) =================
  console.log('=== INTERCEPTOR START ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Is browser:', isPlatformBrowser(platformId));

  // ================= LẤY TOKEN (kết hợp cả 2) =================
  let token = null;
  if (isPlatformBrowser(platformId)) {
    // Debug: Log tất cả keys trong localStorage (từ file ghép)
    console.log('All localStorage keys:', Object.keys(localStorage));

    token = localStorage.getItem('accessToken');
    console.log('Raw token from localStorage:', token);
    console.log('Token exists:', !!token);

    if (token) {
      console.log('Token preview:', token.substring(0, 50) + '...');
    }
  }

  // ================= THÊM HEADER (kết hợp cả 2) =================
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('✅ Added Authorization header');
    console.log('Final headers:', authReq.headers.keys());
  } else {
    console.log('❌ No token found');

    // Retry lấy token một lần nữa (từ file ghép)
    if (isPlatformBrowser(platformId)) {
      const retryToken = localStorage.getItem('accessToken');
      console.log('Retry token:', retryToken ? 'Có' : 'Không');
      if (retryToken) {
        token = retryToken;
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('✅ Added Authorization header on retry');
      }
    }
  }

  // ================= XỬ LÝ RESPONSE (kết hợp cả 2) =================
  return next(authReq).pipe(
    catchError((error) => {
      // Log chi tiết lỗi (từ file ghép)
      console.error('❌ HTTP Error:', error.status, error.message);
      console.error('Error URL:', error.url);
      console.error('Interceptor - Error:', error.status, error.message); // Từ file gốc

      // Xử lý 401 Unauthorized
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('🔄 Attempting refresh token, exists:', !!refreshToken); // Từ file ghép
        console.log('Interceptor - Attempting refresh token'); // Từ file gốc

        if (refreshToken) {
          return userService.refreshToken().pipe(
            switchMap((response: any) => {
              console.log('✅ Refresh success'); // Từ file ghép
              console.log('Interceptor - Refresh success, new token:', response.accessToken); // Từ file gốc

              if (response && response.accessToken) {
                localStorage.setItem('accessToken', response.accessToken);

                // Cập nhật refresh token nếu có (từ file ghép)
                if (response.refreshToken) {
                  localStorage.setItem('refreshToken', response.refreshToken);
                }

                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.accessToken}`,
                  },
                });

                return next(newReq);
              }

              // Xử lý response không hợp lệ (từ file ghép)
              console.error('Invalid refresh response:', response);
              return throwError(() => new Error('Invalid refresh response'));
            }),
            catchError((refreshError) => {
              console.error('❌ Refresh failed:', refreshError); // Từ file ghép
              console.error('Interceptor - Refresh failed:', refreshError); // Từ file gốc

              userService.logout();
              return throwError(() => refreshError);
            }),
          );
        } else {
          console.log('❌ No refresh token'); // Từ file ghép
          userService.logout();
        }
      }

      return throwError(() => error);
    }),
  );
};
