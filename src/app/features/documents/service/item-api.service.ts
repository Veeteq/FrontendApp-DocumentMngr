import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { PagedResponse } from "../model/paged-response.model";
import { Item } from "../model/item.model";

@Injectable({
  providedIn: 'root'
})
export class ItemApiService {
  private httpClient: HttpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.documentApiUrl}/items`;

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