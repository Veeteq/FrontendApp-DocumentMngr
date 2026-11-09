import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { ConfigService } from "../../../core/config/config.service";
import { Item } from "../model/item.model";
import { PagedResponse } from "../model/paged-response.model";

@Injectable({
  providedIn: 'root'
})
export class ItemApiService {
  private httpClient: HttpClient = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly baseUrl = `${this.config.documentApiUrl}/items`;

  getItems(): Observable<PagedResponse<Item>> {
    return this.httpClient.get<PagedResponse<Item>>(`${this.baseUrl}`);
  }

  searchItems(pattern: string): Observable<Item[]> {
    const trimmed = pattern.trim();
    if (trimmed.length < 3) {
      return of([]);
    }
    return this.httpClient.get<Item[]>(`${this.baseUrl}/search`, { params: { name: trimmed } });
  }

}