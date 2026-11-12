import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ConfigService } from "../../../core/config/config.service";
import { CreateDocumentRequest } from "../../../core/dto/create-document-request.model";
import { TransferRequest } from "../../../core/dto/transfer-request.model";
import { Document } from "../model/document.model";
import { PagedResponse } from "../model/paged-response.model";

@Injectable({
    providedIn: "root"
})
export class DocumentApiService {
  private readonly httpClient: HttpClient = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly baseUrl = `${this.config.documentApiUrl}/documents`;

  getDocuments(pageNumber: number, pageSize: number, orderBy: string, orderDirection: string): Observable<PagedResponse<Document>> {
    const corrPageNumber = pageNumber - 1; // API is 0-based, UI is 1-based
    const params = new HttpParams()
      .set('pageNumber', corrPageNumber)
      .set('pageSize', pageSize)
      .set('orderBy', orderBy)
      .set('orderDirection', orderDirection);

    return this.httpClient.get<PagedResponse<Document>>(`${this.baseUrl}`, { params });
  }

  createDocument(request: CreateDocumentRequest) : Observable<HttpResponse<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}`, request, { observe: 'response' });
  }

  createTransfer(request: TransferRequest) : Observable<HttpResponse<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}`, request, { observe: 'response' });
  }

  getMatadata(property: string, pattern: string) {
    const params = new HttpParams()
      .set('property', property)
      .set('pattern', pattern)
      .set('distinct', true);

    return this.httpClient.get<string[]>(`${this.baseUrl}/metadata`, { params });
  }

  getDocument(documentId: number): Observable<Document> {
    return this.httpClient.get<Document>(`${this.baseUrl}/${documentId}`);
  }
}