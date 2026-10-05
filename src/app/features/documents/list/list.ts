import { Component, inject, OnInit, signal } from '@angular/core';
import { DocumentApiService } from '../service/document-api.service';
import { PagedResponse } from '../model/paged-response.model';
import { Document } from '../model/document.model';

@Component({
  selector: 'app-list',
  imports: [],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  private readonly api = inject(DocumentApiService);

  /** UI state */
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Pagination */
  readonly page = signal(1);
  readonly pageSize = 30;
  readonly orderBy = signal('documentDate');
  readonly orderDirection = signal('desc');

  /** API result */
  readonly result = signal<PagedResponse<Document> | null>(null);

  ngOnInit(): void {
    this.loadDocuments();
  }
  
  loadDocuments() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getDocuments(this.page(), this.pageSize, this.orderBy(), this.orderDirection()).subscribe({
      next: (response) => {
        this.result.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

}
