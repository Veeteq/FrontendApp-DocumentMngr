import { HttpHandler, HttpRequest } from '@angular/common/http';
import { authStore } from './auth.store';

export const authInterceptor = () => {
  return {
    intercept(req: HttpRequest<any>, next: HttpHandler) {
      // Skip attaching token for login endpoint
      if (req.url.includes('/auth/login')) {
        return next.handle(req);
      }

      const token = authStore.accessToken();

      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return next.handle(req);
    },
  };
};
