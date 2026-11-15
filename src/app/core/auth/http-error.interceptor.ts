import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, TimeoutError } from 'rxjs';
import { ApplicationError, ApplicationErrorType } from '../model/application-error.model';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      const applicationError = normalizeError(error);
      console.error('HTTP request failed:', applicationError);
      return throwError(() => applicationError);
    })
  );
};

function normalizeError(error: unknown): ApplicationError {
  // 1. Handle RxJS TimeoutError specifically
  if (error instanceof TimeoutError) {
    const timeoutMsg = 'Request timed out. Please check your network connection or server status.';
    console.error('HTTP Timeout Interceptor:', error);
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      originalError: error,
    };
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        type: 'network',
        message: 'Nie można połączyć się z serwerem. Sprawdź połączenie sieciowe.',
        originalError: error,
        status: error.status,
      };
    }

    return {
      type: 'http',
      message: getHttpErrorMessage(error),
      originalError: error,
      status: error.status,
    };
  }

  return {
    type: 'unknown',
    message: 'Unexpected error. Try again later.',
    originalError: error,
  };
}

function getHttpErrorMessage(error: HttpErrorResponse): string {
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

export function isApplicationError(error: unknown): error is ApplicationError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as Partial<ApplicationError>;
  const validTypes: ApplicationErrorType[] = [
    'http',
    'timeout',
    'network',
    'unknown',
  ];

  return (
    typeof candidate.message === 'string' &&
    typeof candidate.type === 'string' &&
    validTypes.includes(candidate.type as ApplicationErrorType) && 'originalError' in candidate
  );
}

export function getApplicationErrorMessage(error: unknown, fallback = 'Nie udało się wykonać operacji.'): string {
  return isApplicationError(error) ? error.message : fallback;
}