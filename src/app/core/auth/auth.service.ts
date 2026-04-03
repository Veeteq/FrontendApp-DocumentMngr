import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { authStore } from "./auth.store";
import { LoginResponse } from "../../model/login-response";

@Injectable({ 
  providedIn: 'root' 
})
export class AuthService {

  private http: HttpClient = inject(HttpClient);
  private baseUrl = 'http://localhost:8282/api/auth';

  
  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password })
    .pipe(
      tap(data => {
        authStore.setAccessToken(data.token);
      })
    );
  }

  logout() {
    authStore.clearAccessToken();
  }

}