import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { getApplicationErrorMessage } from "../../../core/auth/http-error.interceptor";
import { NumberFormatService } from "../../../core/locale/number-format.service";
import { ToastService } from "../../common/toast/toast.service";
import { DocumentType } from "../model/document-type.model";
import { Document } from "../model/document.model";
import { DocumentApiService } from "../service/document-api.service";
import { BaseDetails } from "./base-details/base-details";
import { TransferDetails } from "./transfer-details/transfer-details";

@Component({
  selector: 'app-details',
  imports: [RouterLink, BaseDetails, TransferDetails],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly documentApi = inject(DocumentApiService);
  private readonly toastService = inject(ToastService);
  private readonly numberFormatService = inject(NumberFormatService);

  readonly document = signal<Document | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly documentId = signal<number | null>(null);
  readonly DocumentType = DocumentType;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const documentId = Number(id);
    if (!Number.isInteger(documentId) || documentId <= 0) return;

    console.log('Document ID: ', documentId);
    this.documentId.set(documentId);
    this.loadDocument();
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