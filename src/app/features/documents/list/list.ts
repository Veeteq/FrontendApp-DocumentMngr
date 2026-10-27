import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApplicationHttpError, getApplicationErrorMessage } from '../../../core/auth/http-error.interceptor';
import { ToastService } from '../../common/toast/toast.service';
import { Document } from '../model/document.model';
import { PagedResponse } from '../model/paged-response.model';
import { DocumentApiService } from '../service/document-api.service';

@Component({
  selector: 'app-list',
  imports: [RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  private readonly api = inject(DocumentApiService);
  private readonly toastService = inject(ToastService);

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
    this.error.set(errorMessage);
    this.toastService.error(errorMessage);
    console.error(fallback, error);
  }
}
