import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { ApplicationError } from '../model/application-error.model';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const config = inject(ConfigService);

  const authApiUrl = config.authApiUrl;

  const isAuthEndpoint =
    req.url === `${authApiUrl}/login` ||
    req.url === `${authApiUrl}/refresh` ||
    req.url === `${authApiUrl}/logout`;

  // Authentication endpoints must not trigger the 401 -> refresh cycle.
  if (isAuthEndpoint) return next(req);

  const token = authStore.accessToken();

  const authReq = token ? req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      // Only 401 means that we should try to refresh the access token.
      if (!isUnauthorizedError(error)) return throwError(() => error);

      return authService.refreshTokenShared().pipe(
        catchError((refreshError: unknown) => {
          // A rejected refresh token means that the session is no longer valid.
          if (isAuthenticationFailure(refreshError)) authService.handleSessionExpired();

          // Network errors, timeout and server errors must not log out the user.
          return throwError(() => refreshError);
        }),

        switchMap(() => {
          const newToken = authStore.accessToken();

          // Refresh reported success, but no access token is available.
          if (!newToken) {
            authService.handleSessionExpired();
            return throwError(() => error);
          }

          // Retry the original request with the refreshed access token.
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });

          return next(retryReq);
        }),
      );
    }),
  );
};

function isUnauthorizedError(error: unknown): boolean {
  return (error instanceof HttpErrorResponse && error.status === 401);
}

function isAuthenticationFailure(error: unknown): boolean {
  if (!isApplicationHttpError(error)) return false;
  return error.status === 401 || error.status === 403;
}

function isApplicationHttpError(error: unknown): error is ApplicationError & { status: number } {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as Partial<ApplicationError>;
  return (candidate.type === 'http' && typeof candidate.status === 'number');
}
