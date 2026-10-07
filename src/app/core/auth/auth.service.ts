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
  private readonly authStore = inject(AuthStore);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly baseUrl = environment.authApiUrl;

  private refreshInProgress = false;
  private refreshRequest$?: Observable<RefreshTokenResponse>;

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`,
        { username, password },
        { withCredentials: true }
      )
      .pipe(
        tap(data => {
          this.authStore.setAccessToken(data.token);
          this.authStore.setExpiresAt(data.expiresAt);
        }),
      );
  }

  logout(): Observable<void> {
    console.log('2. Logging out...');
    return this.http.post<void>(`${this.baseUrl}/logout`,
      {},
      { withCredentials: true }
    )
      .pipe(
        finalize(() => {
          this.authStore.clearAccessToken();
          this.router.navigate(['/login']);
        })
    );
  }

  //regular refresh token request, which will be called by the interceptor when a 401 is received
  refreshToken(): Observable<RefreshTokenResponse> {
    return this.http
      .post<RefreshTokenResponse>(`${this.baseUrl}/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap(data => {
          this.authStore.setAccessToken(data.token);
          this.authStore.setExpiresAt(data.expiresAt);
        })
      );
  }

  /**
   * Prevents multiple simultaneous refresh requests.
   */
  refreshTokenShared(): Observable<RefreshTokenResponse> {
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
      shareReplay(1)
    );

    return this.refreshRequest$;
  }

  /**
   * Clears the local authentication state and redirects to login.
   *
   * Used when the refresh token is no longer valid.
   * Does NOT call the backend logout endpoint.
   */
  handleSessionExpired(): void {
    this.authStore.clearAccessToken();
    this.router.navigate(['/login']);
  }
}