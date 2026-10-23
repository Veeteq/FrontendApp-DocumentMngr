import { Component, inject, OnInit, signal } from '@angular/core';
import { DocumentApiService } from '../service/document-api.service';
import { PagedResponse } from '../model/paged-response.model';
import { Document } from '../model/document.model';
import { ApplicationHttpError, getApplicationErrorMessage } from '../../../core/auth/http-error.interceptor';
import { ToastService } from '../../common/toast/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-list',
  imports: [],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  private readonly api = inject(DocumentApiService);
  private readonly toastService = inject(ToastService);

  /** UI state */
  readonly loading = signal(false);

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

    this.api.getDocuments(this.page(), this.pageSize, this.orderBy(), this.orderDirection())
    .pipe(
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: (response) => {
        this.result.set(response);
      },
      error: (error: ApplicationHttpError) => {
        this.handleHttpError(error, 'Failed to load documents');

      }
    });
  }

  private handleHttpError(error: unknown, fallback: string) {
    const errorMessage = getApplicationErrorMessage(error, fallback);
    this.toastService.error(errorMessage);
    console.error(fallback, error);
  }
}
