import { HttpInterceptorFn } from '@angular/common/http';
import { authStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip attaching token for login endpoint
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const token = authStore.accessToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(req);
};
