import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthStore } from './auth.store';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  // Skip attaching token for login endpoint
  if (req.url.includes('/auth/login') ||
      req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = authStore.accessToken();

  if (!token) {
    return next(req);
  }

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return authService.refreshTokenShared().pipe(
        switchMap(() => {
          const newToken = authStore.accessToken();

          if (!newToken) {
            return next(req);
          }

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          return next(retryReq);
        }),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
