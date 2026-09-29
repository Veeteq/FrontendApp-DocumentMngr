import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Counterparty } from '../model/counterparty.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AddressbookApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =`${environment.addressbookApiUrl}/contacts`;

  searchCounterparties(pattern: string): Observable<Counterparty[]> {
    return this.http.get<Counterparty[]>(`${this.baseUrl}/search?searchText=${pattern}`);
  }

}