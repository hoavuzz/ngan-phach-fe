import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, switchMap, throwError } from 'rxjs';
import { User } from '../services/user';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(User);
  const platformId = inject(PLATFORM_ID);

  // Chỉ truy cập localStorage khi ở trình duyệt
  let token = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('accessToken');
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Nếu lỗi 401 (Unauthorized) - token hết hạn
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          // Gọi refresh token
          return userService.refreshToken().pipe(
            switchMap((response: any) => {
              // Lưu token mới
              localStorage.setItem('accessToken', response.accessToken);
              localStorage.setItem('refreshToken', response.refreshToken);

              // Clone lại request với token mới
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`,
                },
              });

              // Gửi lại request
              return next(newReq);
            }),
            catchError((refreshError) => {
              // Refresh token thất bại -> logout
              userService.logout();
              return throwError(() => refreshError);
            }),
          );
        }
      }

      return throwError(() => error);
    }),
  );
};
