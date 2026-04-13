import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { AuthStore } from "./auth.store";
import { LoginResponse } from "../../model/login-response";
import { environment } from "../../../environments/environment";

@Injectable({ 
  providedIn: 'root' 
})
export class AuthService {

  private authStore: AuthStore = inject(AuthStore);
  private http: HttpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.authApiUrl}/login`;

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}`, { username, password })
    .pipe(
      tap(data => {
        this.authStore.setAccessToken(data.token);
      })
    );
  }

  logout() {
    this.authStore.clearAccessToken();
  }

}