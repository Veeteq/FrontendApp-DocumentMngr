import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ConfigService } from '../config/config.service';

export const requestContextInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(ConfigService);
  const authApiUrl = config.authApiUrl;
  
  const isAuthRequest =
    req.url === `${authApiUrl}/login` ||
    req.url === `${authApiUrl}/refresh` ||
    req.url === `${authApiUrl}/logout`;

  if (isAuthRequest) return next(req);

  const transactionId = createTransactionId();
  const acceptLanguage = navigator.language || 'en-US';

  const request = req.clone({
    setHeaders: {
      'Transaction-ID': transactionId,
      'Accept-Language': acceptLanguage,
    },
  });
  return next(request);
};

export function createTransactionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}