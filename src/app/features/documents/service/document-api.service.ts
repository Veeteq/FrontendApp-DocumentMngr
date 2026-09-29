import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { PagedResponse } from "../model/paged-response.model";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Document } from "../model/document.model";
import { CreateDocumentRequest } from "../../../core/dto/create-document-request.model";

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

    return this.httpClient.get<PagedResponse<Document>>(`${this.baseUrl}`, { params });
  }

  createDocument(request: CreateDocumentRequest) : Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}`, request);
  }

  searchDocuments(property: string, pattern: string) {
    const params = new HttpParams()
      .set('property', property)
      .set('pattern', pattern)
      .set('distinct', true);

    return this.httpClient.get<string[]>(`${this.baseUrl}/search`, { params });
  }
}