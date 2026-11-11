import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApplicationErrorMessage } from '../../../core/auth/http-error.interceptor';
import { CreateDocumentItemRequest } from '../../../core/dto/create-document-item-request.model';
import { CreateDocumentRequest } from '../../../core/dto/create-document-request.model';
import { NumberFormatService } from '../../../core/locale/number-format.service';
import { ItemAutocompleteComponent } from '../../autocomplete/item/item-autocomplete';
import { ItemCommentAutocompleteComponent } from '../../autocomplete/itemcomment/item-comment-autocomplete';
import { NumberInputComponent } from '../../common/numberinput/number-input';
import { ToastService } from '../../common/toast/toast.service';
import { Header } from '../common/header/header';
import { OtherProperties } from '../common/other-properties/other-properties';
import { Currency } from '../model/currency.model';
import { DocumentDraft } from '../model/document-draft.model';
import { DocumentItemDraft } from '../model/document-item-draft.model';
import { DocumentType } from '../model/document-type.model';
import { ItemType } from '../model/item-type.model';
import { Item } from '../model/item.model';
import { DocumentApiService } from '../service/document-api.service';
import { DocumentRepositoryService } from '../service/document-repository.service';


@Component({
  selector: 'app-document-create',
  imports: [
    RouterLink,
    FormsModule,
    ItemAutocompleteComponent,
    ItemCommentAutocompleteComponent,
    NumberInputComponent,
    Header,
    OtherProperties,
],
  templateUrl: './document-create.html',
  styleUrl: './document-create.css',
})
export class DocumentCreate implements OnInit {
  private readonly repository = inject(DocumentRepositoryService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly numberFormatService = inject(NumberFormatService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // Temporary reference data
  readonly itemTypes = Object.values(ItemType);

  // UI state
  readonly creating = signal(false);
  readonly validationErrors = signal<string[]>([]);
  readonly draft = this.repository.draft;
  
  ngOnInit(): void {
    this.repository.initDocument({
      documentDate: new Date().toISOString().substring(0, 10),
      documentType: DocumentType.BILL,
      documentName: '',
      documentComment: '',
      invoiceNumber: '',

      account: null,
      counterparty: null,

      paymentMethod: null,
      currencyCode: Currency.PLN,
      exchangeRate: 1,
    });
    this.initDocumentItem();
  }

  updateDraft(patch: Partial<DocumentDraft>) {
    this.repository.updateDraft(patch);
  }

  onCommentChanged(comment: string) {
    this.updateDocumentItem({
      itemComment: comment,
    });
  }

  onItemSelected(item: Item): void {
    this.updateDocumentItem({ item });
  }

  updateDocumentItem(patch: Partial<DocumentItemDraft>) {
    const draft = this.repository.draft();
    if (!draft) return;

    const documentItem = draft.documentItems[0];
    if (!documentItem) return;

    this.repository.updateDraft({
      documentItems: [
        {
          ...documentItem,
          ...patch,
        },
      ],
    });
  }

  getOriginalTotal(): string {
    const draft = this.repository.draft();
    if (!draft) return '0';

    const item = draft.documentItems[0];
    if (!item) return '0';

    const total = (item.itemQuantity ?? 0) * (item.itemPrice ?? 0);
    return this.numberFormatService.format(total, 2);
  }

  submit() {
    if (this.creating()) return; // Prevent multiple submissions

    const document = this.repository.draft();
    if (!document) return;

    //Error handling
    const errors = this.validateDocument();
    this.validationErrors.set(errors);
    if (errors.length > 0) {
      this.toastService.error('Please correct the validation errors');
      console.error('Validation errors', errors);
      return;
    }

    // Convert to request DTO
    const request = this.toCreateDocumentRequest(document);

    //Send request to API
    this.creating.set(true);
    this.documentApi
      .createDocument(request)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (response) => {
          const location = response.headers.get('Location');
          console.log('Document created at: ' + location);
          this.toastService.success('Document created successfully');

          const documentId = this.extractDocumentId(location);
          if (documentId != null) {
            this.router.navigate(['/documents/details', documentId]);
            return;
          }

          this.resetForm();
        },
        error: (error) => {
          this.handleHttpError(error, 'Unable to create document');
        },
      });
  }

  resetForm() {
    this.validationErrors.set([]);

    this.repository.initDocument({
      documentDate: new Date().toISOString().substring(0, 10),
      documentType: DocumentType.BILL,
      documentName: '',
      documentComment: '',
      invoiceNumber: '',

      account: null,
      counterparty: null,

      paymentMethod: null,
      currencyCode: Currency.PLN,
      exchangeRate: 1,
    });
    this.initDocumentItem();
  }

  hasValidationError(message: string): boolean {
    return this.validationErrors().includes(message);
  }

  private initDocumentItem() {
    const draft = this.repository.draft();
    if (!draft) return;
    if (draft.documentItems.length > 0) return;

    this.repository.updateDraft({
      documentItems: [
        {
          itemType: ItemType.EXP,
          itemQuantity: 1,
          itemPrice: 0,
          itemComment: '',
        },
      ],
    });
  }

  private validateDocument(): string[] {
    const errors: string[] = [];
    const document = this.repository.draft();
    if (!document) {
      errors.push('Document is empty');
      return errors;
    }
    if (!document.account) errors.push('Account is required');
    if (!document.documentType) errors.push('Document type is required');
    if (!document.documentName?.trim()) errors.push('Document name is required');
    if (!document.documentDate) errors.push('Document date is required');

    // Counterparty
    if ((document.documentType === DocumentType.BILL || document.documentType === DocumentType.INVOICE) && !document.counterparty)
      errors.push('Counterparty is required');

    // Invoice
    if (document.documentType === DocumentType.INVOICE && !document.invoiceNumber?.trim()) errors.push('Invoice number is required');

    // Payment
    if (!document.paymentMethod) errors.push('Payment method is required');
    if (!document.currencyCode) errors.push('Currency is required');
    if (document.exchangeRate == null || document.exchangeRate <= 0) errors.push('Exchange rate must be greater than zero');

    // Items
    const items = document.documentItems;
    if (items.length === 0) errors.push('At least one document item is required');
    items.forEach((item, index) => {
      const itemNo = index + 1;
      if (!item.itemType) errors.push(`Item #${itemNo}: type is required`);
      if (!item.item) errors.push(`Item #${itemNo}: item is required`);
      if (item.itemQuantity == null || item.itemQuantity <= 0) errors.push(`Item #${itemNo}: quantity must be greater than 0`);
      if (item.itemPrice == null || item.itemPrice <= 0) errors.push(`Item #${itemNo}: price must be greater than 0`);
    });

    return errors;
  }

  private toCreateDocumentRequest(document: DocumentDraft): CreateDocumentRequest {
    if (!document.account) throw new Error('Account is required');
    if (!document.documentType) throw new Error('Document type is required');
    if (!document.paymentMethod) throw new Error('Payment method is required');
    if (!document.currencyCode) throw new Error('Currency is required');
    if (document.exchangeRate == null) throw new Error('Exchange rate is required');

    return {
      documentDate: document.documentDate,
      documentType: document.documentType,
      documentName: this.emptyToUndefined(document.documentName),
      documentDescription: this.emptyToUndefined(document.documentComment),
      invoiceNumber: this.emptyToUndefined(document.invoiceNumber),
      accountId: document.account.accountId,
      counterpartyId: document.counterparty?.id,
      payment: {
        paymentMethod: document.paymentMethod,
        currencyCode: document.currencyCode,
        exchangeRate: document.exchangeRate,
      },
      documentItems: document.documentItems.map((item, index) => this.toCreateDocumentItemRequest(item, index)),
    };
  }

  private toCreateDocumentItemRequest(item: DocumentItemDraft, index: number): CreateDocumentItemRequest {
    if (!item.itemType) throw new Error(`Item #${index + 1}: type is required`);
    if (!item.item) throw new Error(`Item #${index + 1}: item is required`);
    if (item.itemQuantity == null || item.itemQuantity <= 0) throw new Error(`Item #${index + 1}: quantity must be greater than 0`);
    if (item.itemPrice == null || item.itemPrice <= 0) throw new Error(`Item #${index + 1}: price must be greater than 0`);
    return {
      itemType: item.itemType,
      itemId: item.item.itemId,
      itemQuantity: item.itemQuantity,
      itemPrice: item.itemPrice,
      itemDescription: this.emptyToUndefined(item.itemComment),
    };
  }

  private emptyToUndefined(value?: string): string | undefined {
    if (!value) return undefined;
    return value?.trim() ? value.trim() : undefined;
  }

  private handleHttpError(error: unknown, userMessage: string) {
    const errMsg = getApplicationErrorMessage(error, userMessage);
    this.toastService.error(errMsg);
    console.error(userMessage, error);
  }

  private extractDocumentId(location: string | null): number | null {
    if (!location) return null;
    const lastSegment = location.split('/').filter(Boolean).pop();
    const documentId = Number(lastSegment);
    return Number.isInteger(documentId) && documentId > 0 ? documentId : null;
  }
}