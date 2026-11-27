import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { distinctUntilChanged, finalize, map } from "rxjs";
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

  readonly document = signal<Document | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly documentId = signal<number | null>(null);
  readonly DocumentType = DocumentType;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('id')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(id => {
        const documentId = Number(id);
        if (!id || !Number.isInteger(documentId) || documentId <= 0) {
          this.documentId.set(null);
          this.document.set(null);
          this.error.set('Invalid document ID');
          return;
        }
        this.documentId.set(documentId);
        this.document.set(null);
        this.error.set(null);

        console.log('Document ID: ', documentId);
        this.loadDocument();
      })
  }

  loadDocument(): void {
    const documentId = this.documentId();
    if (documentId == null) return;

    this.loading.set(true);

    this.documentApi
      .getDocument(documentId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (document) => {
          this.document.set(document);
          this.error.set(null);
        },
        error: (error) => {
          const message = getApplicationErrorMessage(error, 'Unable to load document.');
          this.error.set(message);
          this.toastService.error(message);

          console.error('Unable to load document', error);
        },
      });
  }

  cloneDocument() {
    const document = this.document();
    if (!document) return;

    if (this.isMoneyTransfer(document)) {
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

  isMoneyTransfer(document: Document): boolean {
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
}