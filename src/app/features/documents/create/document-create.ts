import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApplicationErrorMessage } from '../../../core/auth/http-error.interceptor';
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
import { DocumentRequestMapperService } from '../service/document-request-mapper.service';
import { DocumentValidationService } from '../service/document-validation.service';

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
  private readonly documentValidationService = inject(DocumentValidationService);
  private readonly documentRequestMapper = inject(DocumentRequestMapperService);

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

    onDocumentDateChange(documentDate: string) {
    console.log("documentDate: " + documentDate);
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

  getOriginalTotal(): number  {
    const draft = this.repository.draft();
    if (!draft) return 0;

    const item = draft.documentItems[0];
    if (!item) return 0;

    const quantity = item.itemQuantity ?? 0
    const price = item.itemPrice ?? 0;

    const amount = this.numberFormatService.roundHalfUp(quantity * price, 2);
    return item.itemType === ItemType.EXP ? -amount : amount;
  }

  getOriginalTotalClass(): string {
    const draft = this.repository.draft();
    if (!draft) return 'text-gray-700';

    const item = draft.documentItems[0];
    if (!item) return 'text-gray-700';

    return item.itemType === ItemType.EXP ? 'text-red-600' : 'text-green-600';
  }

  formatAmount(value: number | null | undefined, fractionDigits: number): string {
    if (value == null) return '';
    return this.numberFormatService.format(value, fractionDigits);
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
    const request = this.documentRequestMapper.toCreateDocumentRequest(document);

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
    const document = this.repository.draft();
    if (!document) return ['Document is empty'];

    const errors = this.documentValidationService.validateCommonFields(document);
    errors.push(...this.documentValidationService.validateDocumentItems(document.documentItems));

    return errors;
  }

  private handleHttpError(error: unknown, fallback: string): void {
    const message = getApplicationErrorMessage(error, fallback);
    this.toastService.error(message);
    console.error(fallback, error);
  }

  private extractDocumentId(location: string | null): number | null {
    if (!location) return null;
    const lastSegment = location.split('/').filter(Boolean).pop();
    const documentId = Number(lastSegment);
    return Number.isInteger(documentId) && documentId > 0 ? documentId : null;
  }
}