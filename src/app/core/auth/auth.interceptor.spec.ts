
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from './auth.store';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { of, throwError } from 'rxjs';

describe('authInterceptor', () => {
  let httpTestingController: HttpTestingController;
  let authStore: AuthStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            refreshTokenShared: vi.fn(),
            handleSessionExpired: vi.fn(),
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should add the access token to a protected request', () => {
    authStore.setAccessToken('test-access-token');

    TestBed.inject(HttpClient)
      .get('/api/v1/documents')
      .subscribe();

    const request = httpTestingController.expectOne('/api/v1/documents');

    expect(request.request.headers.get('Authorization'))
      .toBe('Bearer test-access-token');

    request.flush([]);
  });


  it('should not add the access token to authentication endpoints', () => {
    authStore.setAccessToken('test-access-token');

    const authEndpoints = [
      `${environment.authApiUrl}/login`,
      `${environment.authApiUrl}/refresh`,
      `${environment.authApiUrl}/logout`,
    ];

    const http = TestBed.inject(HttpClient);

    for (const url of authEndpoints) {
      http.post(url, {}).subscribe();

      const request = httpTestingController.expectOne(url);

      expect(request.request.headers.has('Authorization')).toBe(false);

      request.flush({});
    }
  });


  it('should refresh the token and retry a protected request after 401', () => {
    authStore.setAccessToken('old-access-token');

    const authService = TestBed.inject(AuthService);
    vi.mocked(authService.refreshTokenShared).mockImplementation(() => {
      authStore.setAccessToken('new-access-token');
      return of({
        token: 'new-access-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60_000).toISOString(),
        type: 'Bearer',
        expiresIn: 60,
      });
    });

    const http = TestBed.inject(HttpClient);
    let response: unknown;

    http.get('/api/v1/documents').subscribe(value => {
      response = value;
    });

    const originalRequest = httpTestingController.expectOne('/api/v1/documents');

    expect(originalRequest.request.headers.get('Authorization'))
      .toBe('Bearer old-access-token');

    originalRequest.flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const retryRequest = httpTestingController.expectOne('/api/v1/documents');

    expect(retryRequest.request.headers.get('Authorization'))
      .toBe('Bearer new-access-token');

    retryRequest.flush([{ id: 1 }]);

    expect(response).toEqual([{ id: 1 }]);
    expect(authService.refreshTokenShared).toHaveBeenCalledTimes(1);
    expect(authService.handleSessionExpired).not.toHaveBeenCalled();
  });


  it('should expire the session when token refresh fails', () => {
    authStore.setAccessToken('old-access-token');

    const authService = TestBed.inject(AuthService);
    const refreshError = new Error('Refresh failed');

    vi.mocked(authService.refreshTokenShared).mockReturnValue(
      throwError(() => refreshError),
    );

    const http = TestBed.inject(HttpClient);
    let receivedError: unknown;

    http.get('/api/v1/documents').subscribe({
      error: error => {
        receivedError = error;
      },
    });

    const originalRequest = httpTestingController.expectOne('/api/v1/documents');

    originalRequest.flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(receivedError).toBe(refreshError);
    expect(authService.handleSessionExpired).toHaveBeenCalledTimes(1);
    expect(authService.refreshTokenShared).toHaveBeenCalledTimes(1);
  });


  it('should expire the session if refresh succeeds without an access token', () => {
    authStore.setAccessToken('old-access-token');

    const authService = TestBed.inject(AuthService);

    vi.mocked(authService.refreshTokenShared).mockImplementation(() => {
      authStore.clearAccessToken();

      return of({
        token: 'new-access-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        refreshTokenExpiresAt: new Date(
          Date.now() + 14 * 24 * 60 * 60_000,
        ).toISOString(),
        type: 'Bearer',
        expiresIn: 60,
      });
    });


    // Simulate an inconsistent state: refresh reports success,
    // but the store has no access token when the request is retried.
    authStore.clearAccessToken();

    const http = TestBed.inject(HttpClient);
    let receivedError: unknown;

    http.get('/api/v1/documents').subscribe({
      error: error => {
        receivedError = error;
      },
    });

    const originalRequest = httpTestingController.expectOne('/api/v1/documents');

    originalRequest.flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(receivedError).toBeTruthy();
    expect(authService.handleSessionExpired).toHaveBeenCalledTimes(1);
  });

});
