import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment.prod";

export const requestContextInterceptor: HttpInterceptorFn = (req, next) => {
  const authApiUrl = environment.authApiUrl;

    const isAuthRequest = req.url === `${authApiUrl}/login` ||
                          req.url === `${authApiUrl}/refresh` ||
                          req.url === `${authApiUrl}/logout`;

  if (isAuthRequest) return next(req);
  
  const transactionId = crypto.randomUUID();
  const acceptLanguage = navigator.language || 'en-US';

  const request = req.clone({
    setHeaders: {
      'Transaction-ID': transactionId,
      'Accept-Language': acceptLanguage
    }
  });
  return next(request);
}