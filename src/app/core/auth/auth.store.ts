import { computed, Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly _accessToken = signal<string | null>(localStorage.getItem('accessToken'));
  private readonly _refreshToken = signal(localStorage.getItem('refreshToken'));
  private readonly _expiresIn = signal<number | null>(null);

  readonly isAuthenticated = computed(() => !!this._accessToken());

  
  // ---- Getters ----
  accessToken = () => this._accessToken();
  
  // ---- Setters ----
  setAccessToken(token: string) {
    this._accessToken.set(token);
    localStorage.setItem('accessToken', token);
  }

  setRefreshToken(token: string) {
    this._refreshToken.set(token);
    localStorage.setItem('refreshToken', token);
  }

  setExpiresIn(expiresIn: number) {
    this._expiresIn.set(expiresIn);
  }

  clearAccessToken() {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._expiresIn.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }


}
