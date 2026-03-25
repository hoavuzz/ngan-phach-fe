import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, switchMap, throwError } from 'rxjs';
import { User } from '../services/user';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(User as any);
  const platformId = inject(PLATFORM_ID);

  console.log('Interceptor - Request URL:', req.url); // Thêm log

  let token = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('accessToken');
    console.log('Interceptor - Token found:', token ? 'Yes' : 'No'); // Thêm log
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Interceptor - Added Authorization header'); // Thêm log
  }

  return next(authReq).pipe(
    catchError((error) => {
      console.error('Interceptor - Error:', error.status, error.message); // Thêm log

      if (error.status === 401 && isPlatformBrowser(platformId)) {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('Interceptor - Attempting refresh token'); // Thêm log

        if (refreshToken) {
          return userService.refreshToken().pipe(
            switchMap((response: any) => {
              console.log('Interceptor - Refresh success, new token:', response.accessToken); // Thêm log

              localStorage.setItem('accessToken', response.accessToken);
              localStorage.setItem('refreshToken', response.refreshToken);

              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`,
                },
              });

              return next(newReq);
            }),
            catchError((refreshError) => {
              console.error('Interceptor - Refresh failed:', refreshError); // Thêm log
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
