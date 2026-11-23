import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { distinctUntilChanged, finalize, map } from "rxjs";
import { getApplicationErrorMessage } from "../../../core/auth/http-error.interceptor";
import { NumberFormatService } from "../../../core/locale/number-format.service";
import { ToastService } from "../../common/toast/toast.service";
import { DocumentType } from "../model/document-type.model";
import { Document } from "../model/document.model";
import { DocumentApiService } from "../service/document-api.service";
import { BaseDetails } from "./base-details/base-details";
import { TransferDetails } from "./transfer-details/transfer-details";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DocumentsByDate } from "../common/documents-by-date/documents-by-date";

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
  private readonly destroyRef = inject(DestroyRef);

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
}