import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/config/config.service';
import { Counterparty } from '../model/counterparty.model';

@Injectable({
  providedIn: 'root',
})
export class AddressbookApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly baseUrl =`${this.config.addressbookApiUrl}/contacts`;

  searchCounterparties(pattern: string): Observable<Counterparty[]> {
    return this.http.get<Counterparty[]>(`${this.baseUrl}/search?searchText=${pattern}`);
  }

}