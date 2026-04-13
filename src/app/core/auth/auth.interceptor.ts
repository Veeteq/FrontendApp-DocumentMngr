import { HttpInterceptorFn } from '@angular/common/http';
import { AuthStore } from './auth.store';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  
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
