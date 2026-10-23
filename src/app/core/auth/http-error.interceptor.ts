import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ApplicationHttpError {
  message: string;
  originalError: HttpErrorResponse;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const normalizedError: ApplicationHttpError = {
          message: getErrorMessage(error),
          originalError: error,
        };

        return throwError(() => normalizedError);
      }
      return throwError(() => error);
    }),
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  let message: string;

  if (error.status === 0) {
    message = 'Nie można połączyć się z serwerem. Sprawdź połączenie sieciowe.';
  } else if (error.status === 401) {
    message = 'Sesja wygasła lub wymagane jest ponowne uwierzytelnienie.';
  } else if (error.status === 403) {
    message = 'Nie masz uprawnień do wykonania tej operacji.';
  } else if (error.status === 404) {
    message = 'Nie znaleziono żądanego zasobu.';
  } else if (error.status >= 500) {
    message = 'Wystąpił błąd serwera. Spróbuj ponownie później.';
  } else {
    message = 'Nie udało się wykonać żądania.';
  }
  return message;
}

export function isApplicationHttpError(error: unknown): error is ApplicationHttpError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  return ('message' in error && typeof error.message === 'string' && 'originalError' in error && error.originalError instanceof HttpErrorResponse);
}

export function getApplicationErrorMessage(error: unknown, fallback = 'Nie udało się wykonać operacji.'): string {
  return isApplicationHttpError(error) ? error.message : fallback;
}