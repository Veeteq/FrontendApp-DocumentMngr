import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Account } from "../model/account.model";
import { Observable, of } from "rxjs";
import { PagedResponse } from "../model/paged-response.model";

@Injectable({
  providedIn: 'root'
})
export class AccountApiService {
  private httpClient: HttpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.documentApiUrl}/accounts`;

  getAccounts(): Observable<PagedResponse<Account>> {
    return this.httpClient.get<PagedResponse<Account>>(`${this.baseUrl}`);
  }

  searchAccounts(pattern: string): Observable<Account[]> {
    const trimmed = pattern.trim();
    if (trimmed.length < 3) {
      return of([]);
    }
    return this.httpClient.get<Account[]>(`${this.baseUrl}/search`, { params: { name: trimmed } });
  }

}