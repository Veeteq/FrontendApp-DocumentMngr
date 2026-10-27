import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let authStore: AuthStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should send login request and store the returned tokens', () => {
    const username = 'test-user';
    const password = 'test-password';
    const response = {
      token: 'test-access-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    service.login(username, password).subscribe();

    const request = httpTestingController.expectOne(
      `${environment.authApiUrl}/login`,
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username, password });
    expect(request.request.withCredentials).toBe(true);

    request.flush(response);

    expect(authStore.accessToken()).toBe(response.token);
    expect(localStorage.getItem('accessToken')).toBe(response.token);
    expect(localStorage.getItem('expiresAt')).toBe(response.expiresAt);
  });


  it('should refresh the token and store the returned tokens', () => {
    const response = {
      token: 'refreshed-access-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    service.refreshToken().subscribe();

    const request = httpTestingController.expectOne(
      `${environment.authApiUrl}/refresh`,
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBe(true);

    request.flush(response);

    expect(authStore.accessToken()).toBe(response.token);
    expect(localStorage.getItem('accessToken')).toBe(response.token);
    expect(localStorage.getItem('expiresAt')).toBe(response.expiresAt);
  });


  it('should share a single refresh request between simultaneous subscribers', () => {
    const response = {
      token: 'shared-refreshed-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    let firstResult: unknown;
    let secondResult: unknown;

    service.refreshTokenShared().subscribe(value => {
      firstResult = value;
    });

    service.refreshTokenShared().subscribe(value => {
      secondResult = value;
    });

    const requests = httpTestingController.match(
      `${environment.authApiUrl}/refresh`,
    );

    expect(requests.length).toBe(1);
    expect(requests[0].request.method).toBe('POST');

    requests[0].flush(response);

    expect(firstResult).toEqual(response);
    expect(secondResult).toEqual(response);
    expect(authStore.accessToken()).toBe(response.token);
  });


  it('should clear authentication state and navigate to login after logout', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');

    service['authStore'].setAccessToken('test-access-token');
    service['authStore'].setExpiresAt(
      new Date(Date.now() + 60_000).toISOString(),
    );

    service.logout().subscribe();

    const request = httpTestingController.expectOne(
      `${environment.authApiUrl}/logout`,
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBe(true);

    request.flush(null);

    expect(authStore.accessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('expiresAt')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });


  it('should clear authentication state and navigate to login when session expires', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');

    authStore.setAccessToken('test-access-token');
    authStore.setExpiresAt(
      new Date(Date.now() + 60_000).toISOString(),
    );

    service.handleSessionExpired();

    expect(authStore.accessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('expiresAt')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);

    httpTestingController.expectNone(
      `${environment.authApiUrl}/logout`,
    );
  });


  it('should propagate login errors without storing tokens', () => {
    let receivedError: unknown;

    service.login('test-user', 'wrong-password').subscribe({
      error: error => {
        receivedError = error;
      },
    });

    const request = httpTestingController.expectOne(
      `${environment.authApiUrl}/login`,
    );

    request.flush(
      { message: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(receivedError).toBeTruthy();
    expect(authStore.accessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('expiresAt')).toBeNull();
  });

  it('should propagate refresh errors without overwriting existing tokens', () => {
    authStore.setAccessToken('existing-access-token');

    const existingExpiry = new Date(Date.now() + 60_000).toISOString();
    authStore.setExpiresAt(existingExpiry);

    let receivedError: unknown;

    service.refreshToken().subscribe({
      error: error => {
        receivedError = error;
      },
    });

    const request = httpTestingController.expectOne(
      `${environment.authApiUrl}/refresh`,
    );

    request.flush(
      { message: 'Refresh token expired' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(receivedError).toBeTruthy();
    expect(authStore.accessToken()).toBe('existing-access-token');
    expect(localStorage.getItem('expiresAt')).toBe(existingExpiry);
  });

  it('should share refresh errors and allow a subsequent retry', () => {
    let firstError: unknown;
    let secondError: unknown;

    service.refreshTokenShared().subscribe({
      error: error => {
        firstError = error;
      },
    });

    service.refreshTokenShared().subscribe({
      error: error => {
        secondError = error;
      },
    });

    const requests = httpTestingController.match(
      `${environment.authApiUrl}/refresh`,
    );

    expect(requests.length).toBe(1);

    requests[0].flush(
      { message: 'Refresh token expired' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(firstError).toBeTruthy();
    expect(secondError).toBeTruthy();

    // A new attempt should issue a new HTTP request.
    let retryResult: unknown;

    service.refreshTokenShared().subscribe({
      next: value => {
        retryResult = value;
      },
    });

    const retryRequest = httpTestingController.expectOne(
      `${environment.authApiUrl}/refresh`,
    );

    const response = {
      token: 'retry-access-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    retryRequest.flush(response);

    expect(retryResult).toEqual(response);
    expect(authStore.accessToken()).toBe(response.token);
  });

  it('should clear authentication state and navigate to login when logout fails', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');

    authStore.setAccessToken('test-access-token');
    authStore.setExpiresAt(
      new Date(Date.now() + 60_000).toISOString(),
    );

    let receivedError: unknown;

    service.logout().subscribe({
      error: error => {
        receivedError = error;
      },
    });

    const request = httpTestingController.expectOne(
      `${environment.authApiUrl}/logout`,
    );

    request.flush(
      { message: 'Logout failed' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(receivedError).toBeTruthy();
    expect(authStore.accessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('expiresAt')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

});

