import { HttpInterceptorFn } from "@angular/common/http";

export const requestContextInterceptor: HttpInterceptorFn = (req, next) => {
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