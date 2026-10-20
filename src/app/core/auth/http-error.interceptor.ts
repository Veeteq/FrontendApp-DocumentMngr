import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, throwError } from "rxjs";

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
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

        const normalizedError = new HttpErrorResponse({
          error: error.error,
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url ?? undefined,
          //message
        });

        return throwError(() => normalizedError);
      }
      return throwError(() => error);
    })
  );
}  