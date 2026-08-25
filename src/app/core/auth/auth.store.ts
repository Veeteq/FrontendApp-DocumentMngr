import { computed, Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly _accessToken = signal<string | null>(localStorage.getItem('accessToken'));
  private readonly _expiresAt = signal<string | null>(localStorage.getItem('expiresAt'));

  readonly isAuthenticated = computed(() => {
    const token = this._accessToken();
    const expiresAt = this._expiresAt();

    if (!token || !expiresAt) {
      return false;
    }

    return new Date(expiresAt).getTime() > Date.now();
  });

  // ---- Getters ----
  accessToken = () => this._accessToken();
  
  // ---- Setters ----
  setAccessToken(token: string) {
    this._accessToken.set(token);
    localStorage.setItem('accessToken', token);
  }

  
  setExpiresAt(expiresAt: string) {
    this._expiresAt.set(expiresAt);
    localStorage.setItem('expiresAt', expiresAt);
}

  clearAccessToken() {
    this._accessToken.set(null);
    this._expiresAt.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('expiresAt');
  }


}
