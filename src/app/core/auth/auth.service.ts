import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, Observable, shareReplay, tap } from 'rxjs';
import { AuthStore } from './auth.store';
import { LoginResponse } from '../../model/login-response';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { RefreshTokenResponse } from '../../model/refresh-token-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStore: AuthStore = inject(AuthStore);
  private http: HttpClient = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = `${environment.authApiUrl}`;

  private refreshInProgress = false;
  private refreshRequest$?: Observable<RefreshTokenResponse>;

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`,
        { username, password },
        { withCredentials: true },
      )
      .pipe(
        tap((data) => {
          this.authStore.setAccessToken(data.token);
          this.authStore.setExpiresAt(data.expiresAt);
        }),
      );
  }

  logout() {
    console.log('2. Logging out...');
    return this.http.post(`${this.baseUrl}/logout`,
      {},
      { withCredentials: true },
    )
      .pipe(
        finalize(() => {
          this.authStore.clearAccessToken();
          this.router.navigate(['/login']);
        }),
      )
      .subscribe({
        error: err => console.error('Logout failed', err)
      });
  }

  //regular refresh token request, which will be called by the interceptor when a 401 is received
  refreshToken() {
    return this.http
      .post<RefreshTokenResponse>(
        `${this.baseUrl}/refresh`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((data) => {
          this.authStore.setAccessToken(data.token);
          this.authStore.setExpiresAt(data.expiresAt);
        }),
      );
  }

  //optimized refresh token request to Prevent Refresh Storms (Concurrent 401 Requests)
  refreshTokenShared() : Observable<RefreshTokenResponse>{
    if (this.refreshInProgress && this.refreshRequest$) {
      console.log('Using running refresh request');
      return this.refreshRequest$;
    }

    console.log('Starting refresh request');
    this.refreshInProgress = true;

    this.refreshRequest$ = this.refreshToken().pipe(
      finalize(() => {
        console.log('Refresh finished');
        this.refreshInProgress = false;
        this.refreshRequest$ = undefined;
      }),
      shareReplay(1),
    );

    return this.refreshRequest$;
  }
}
