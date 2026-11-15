import { HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { Observable, timeout } from "rxjs";

const HTTP_TIMEOUT = 30_000;

export function timeoutInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  return next(request).pipe(timeout(HTTP_TIMEOUT));
}