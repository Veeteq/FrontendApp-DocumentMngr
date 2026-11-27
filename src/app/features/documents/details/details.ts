import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { catchError, distinctUntilChanged, EMPTY, finalize, map, startWith, Subject, switchMap, tap } from "rxjs";
import { getApplicationErrorMessage } from "../../../core/auth/http-error.interceptor";
import { NumberFormatService } from "../../../core/locale/number-format.service";
import { ToastService } from "../../common/toast/toast.service";
import { DocumentsByDate } from "../common/documents-by-date/documents-by-date";
import { DocumentType } from "../model/document-type.model";
import { Document } from "../model/document.model";
import { DocumentApiService } from "../service/document-api.service";
import { DocumentRepositoryService } from "../service/document-repository.service";
import { DocumentRequestMapperService } from "../service/document-request-mapper.service";
import { BaseDetails } from "./base-details/base-details";
import { TransferDetails } from "./transfer-details/transfer-details";
import { TransferRepositoryService } from "../service/money-transfer-repository.service";

@Component({
  selector: 'app-details',
  imports: [
    RouterLink,
    BaseDetails,
    TransferDetails,
    DocumentsByDate
  ],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly documentApi = inject(DocumentApiService);
  private readonly toastService = inject(ToastService);
  private readonly numberFormatService = inject(NumberFormatService);
  private readonly repository = inject(DocumentRepositoryService);
  private readonly documentRequestMapper = inject(DocumentRequestMapperService);
  private readonly transferRepository = inject(TransferRepositoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly retry$ = new Subject<void>();

  readonly document = signal<Document | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly documentId = signal<number | null>(null);
  readonly DocumentType = DocumentType;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => {
          const id = params.get('id');
          const documentId = Number(id);
          return id && Number.isInteger(documentId) && documentId > 0 ? documentId : null;
        }),
        distinctUntilChanged(),
        tap(documentId => {
          this.documentId.set(documentId);
          this.document.set(null);
          this.error.set(null);
        }),
        switchMap(documentId => {
          if (documentId == null) {
            this.loading.set(false);
            this.error.set('Invalid document ID');
            return EMPTY;
          }
          return this.retry$.pipe(
            startWith(undefined),
            switchMap(() => this.fetchDocument(documentId))
          );
        }),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  loadDocument(): void {
    if (this.documentId() == null) return;
    this.retry$.next();
  }

  cloneDocument() {
    const document = this.document();
    if (!document) return;

    if (this.isTransfer(document)) {
      this.cloneTransferDocument(document);
      return;
    }

    const clone = this.documentRequestMapper.toDocumentDraft(document);

    this.repository.prepareDraftDocument(clone);
    this.router.navigate(['/documents/standard']);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(this.numberFormatService.locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date);
  }

  isTransfer(document: Document): boolean {
    return document.documentType.toUpperCase() === DocumentType.TRANSFER.toUpperCase();
  }

  private cloneTransferDocument(document: Document) {
    const transfer = document.transferDetails;
    if (!transfer) return;

    this.transferRepository.prepareDraftTransfer({
      sourceAccount: transfer.sourceAccount,
      targetAccount: transfer.targetAccount,
      transferAmount: transfer.sourceAmount,
      paymentMethod: document.paymentMethod,
      exchangeRate: document.exchangeRate,
      provisionAmount: transfer.provisionAmount ?? null,
      provisionAt: transfer.provisionAt ?? null,
      comment: document.documentComment ?? '',
    });

    this.router.navigate(['/documents/transfer']);
  }

  private fetchDocument(documentId: number) {
    this.loading.set(true);
    this.error.set(null);

    return this.documentApi
      .getDocument(documentId)
      .pipe(
        tap(document => {
          this.document.set(document);
        }),
        catchError((error: unknown) => {
          const message = getApplicationErrorMessage(error, 'Unable to load document.');

          this.error.set(message);
          this.toastService.error(message);

          console.error('Unable to load document', error);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      );
  }

}