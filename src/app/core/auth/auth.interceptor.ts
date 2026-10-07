import { AuthStore } from './auth.store';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  const authApiUrl = environment.authApiUrl;

  const isAuthEndpoint =
    req.url === `${authApiUrl}/login` ||
    req.url === `${authApiUrl}/refresh` ||
    req.url === `${authApiUrl}/logout`;

  //Authentication endpoints must not receive the access token. In particular, refresh and logout must not trigger the 401 -> refresh -> ... cycle.
  if (isAuthEndpoint) return next(req);

  const token = authStore.accessToken();

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // Only 401 means that we should try to refresh the access token.
      if (error.status !== 401) return throwError(() => error);

      return authService.refreshTokenShared()
      .pipe(
        //refreshToken() already updates AuthStore. We only need to read the new token here.
        switchMap(() => {
          const newToken = authStore.accessToken();

          //Refresh succeeded but there is no token. Treat this as an expired session.
          if (!newToken) {
            authService.handleSessionExpired();
            return throwError(() => error);
          }

          //Retry the ORIGINAL request with the new token.
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next(retryReq);
        }),

        /*
         * Refresh failed.
         *
         * IMPORTANT:
         * Do NOT call logout(), because logout() performs
         * another HTTP request and would go through this interceptor.
         */
        catchError((refreshError) => {
          authService.handleSessionExpired();
          return throwError(() => refreshError);
        })
      );
    })
  );
};