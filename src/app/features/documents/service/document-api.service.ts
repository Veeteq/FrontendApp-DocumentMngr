import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { PagedResponse } from "../model/paged-response.model";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Document } from "../model/document.model";

@Injectable({
    providedIn: "root"
})
export class DocumentApiService {
  private httpClient: HttpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.documentApiUrl}/documents`;

  getDocuments(pageNumber: number, pageSize: number): Observable<PagedResponse<Document>> {
    const corrPageNumber = pageNumber - 1; // API is 0-based, UI is 1-based
    const params = new HttpParams()
      .set('pageNumber', corrPageNumber)
      .set('pageSize', pageSize);

      const uuid = crypto.randomUUID();

      const headers = new HttpHeaders()
      .set('Transaction-Id', uuid)
      .set('Accept-Language', 'en-US');

    return this.httpClient.get<PagedResponse<Document>>(`${this.baseUrl}`, { params, headers });
  }
}