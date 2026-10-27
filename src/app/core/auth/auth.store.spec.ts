import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthStore],
    });

    store = TestBed.inject(AuthStore);
  });

  afterEach(() => localStorage.clear());
  

  it('should be unauthenticated when no token or expiry exists', () => {
    expect(store.isAuthenticated()).toBe(false);
  });

  it('should store the access token in memory and localStorage', () => {
    store.setAccessToken('test-access-token');

    expect(store.accessToken()).toBe('test-access-token');
    expect(localStorage.getItem('accessToken')).toBe('test-access-token');
  });

  it('should be authenticated when the token has not expired', () => {
    store.setAccessToken('test-access-token');
    store.setExpiresAt(new Date(Date.now() + 60_000).toISOString());

    expect(store.isAuthenticated()).toBe(true);
  });

  it('should be unauthenticated when the token has expired', () => {
    store.setAccessToken('test-access-token');
    store.setExpiresAt(new Date(Date.now() - 60_000).toISOString());

    expect(store.isAuthenticated()).toBe(false);
  });

  it('should clear the token and expiry from memory and localStorage', () => {
    store.setAccessToken('test-access-token');
    store.setExpiresAt(new Date(Date.now() + 60_000).toISOString());

    store.clearAccessToken();

    expect(store.accessToken()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('expiresAt')).toBeNull();
  });
});
