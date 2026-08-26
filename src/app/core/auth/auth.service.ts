import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { AuthStore } from "./auth.store";
import { LoginResponse } from "../../model/login-response";
import { environment } from "../../../environments/environment";
import { Router } from "@angular/router";
import { RefreshTokenResponse } from "../../model/refresh-token-response";

@Injectable({ 
  providedIn: 'root' 
})
export class AuthService {

  private authStore: AuthStore = inject(AuthStore);
  private http: HttpClient = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = `${environment.authApiUrl}/login`;

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}`, { username, password })
    .pipe(
      tap(data => {
        this.authStore.setAccessToken(data.token);
        this.authStore.setExpiresAt(data.expiresAt);
      })
    );
  }

  logout() {
    this.authStore.clearAccessToken();
    this.router.navigate(['/login']);
  }

  refreshToken() {
    return this.http.post<RefreshTokenResponse>(`${this.baseUrl}/refresh`,
      {}, 
      {
        withCredentials: true
      })
    .pipe(
      tap(data => {
        this.authStore.setAccessToken(data.token);
        this.authStore.setExpiresAt(data.expiresAt);
      })
    );
  }

}