import { Component, DestroyRef, inject, input, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { catchError, distinctUntilChanged, EMPTY, finalize, startWith, Subject, switchMap } from "rxjs";
import { getApplicationErrorMessage } from "../../../../core/auth/http-error.interceptor";
import { NumberFormatService } from "../../../../core/locale/number-format.service";
import { DocumentType } from "../../model/document-type.model";
import { Document } from "../../model/document.model";
import { PagedResponse } from "../../model/paged-response.model";
import { DocumentApiService } from "../../service/document-api.service";

@Component({
  selector: 'app-documents-by-date',
  imports: [
    RouterLink
  ],
  styleUrl: 'documents-by-date.css',
  templateUrl: 'documents-by-date.html'
})
export class DocumentsByDate implements OnInit {
  private readonly documentApi = inject(DocumentApiService);
  private readonly numberFormatService = inject(NumberFormatService);
  private readonly destroyRef = inject(DestroyRef);

  readonly documentDate = input<string | null>();
  readonly selectedDocumentId = input<number | null>(null);

  readonly DocumentType = DocumentType;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<PagedResponse<Document> | null>(null);

  private readonly documentDate$ = toObservable(this.documentDate);
  private readonly retry$ = new Subject<void>();

  ngOnInit(): void {
    this.documentDate$
      .pipe(
        distinctUntilChanged(),
        switchMap(date => {
          this.result.set(null);
          this.error.set(null);
          this.loading.set(false);

          if (!date) return EMPTY;
          this.loading.set(true);

          return this.retry$.pipe(
            startWith(undefined),
            switchMap(() => this.fetchDocuments(date))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.result.set(response);
      });
  }

  retry() {
    this.retry$.next();
  }

  formatAmount(value: number | null): string {
    if (value == null) return '';
    return this.numberFormatService.format(value, 2);
  }

  getDocumentTotalClass(value: number | null): string {
    if (value == null) return '';
    return this.numberFormatService.getTotalClass(value);
  }

  isTransfer(document: Document): boolean {
    return document.documentType.toUpperCase() === DocumentType.TRANSFER.toUpperCase();
  }

  private fetchDocuments(date: string) {
    this.loading.set(true);
    this.error.set(null);

    return this.documentApi
      .searchDocuments(date, 1, 25, 'documentDate', 'desc')
      .pipe(
        catchError(error => {
          this.error.set(getApplicationErrorMessage(error, 'Failed to load documents'));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      );
  }
}

