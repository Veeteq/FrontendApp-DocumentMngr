import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { getApplicationErrorMessage } from "../../../core/auth/http-error.interceptor";
import { NumberFormatService } from "../../../core/locale/number-format.service";
import { ToastService } from "../../common/toast/toast.service";
import { DocumentItemEditor } from "../common/document-item-editor/document-item-editor";
import { DocumentItemList } from "../common/document-item-list/document-item-list";
import { DocumentsByDate } from "../common/documents-by-date/documents-by-date";
import { Header } from "../common/header/header";
import { OtherProperties } from "../common/other-properties/other-properties";
import { DocumentDraft } from "../model/document-draft.model";
import { DocumentItemDraft } from "../model/document-item-draft.model";
import { ItemType } from "../model/item-type.model";
import { DocumentApiService } from "../service/document-api.service";
import { DocumentRepositoryService } from "../service/document-repository.service";
import { DocumentRequestMapperService } from "../service/document-request-mapper.service";
import { DocumentValidationService } from "../service/document-validation.service";
import { extractDocumentId } from "../service/document.utils";

@Component({
  selector: 'app-multiitem-document-create',
  imports: [
    FormsModule,
    Header,
    DocumentsByDate,
    DocumentsByDate,
    OtherProperties,
    DocumentItemEditor,
    DocumentItemList
  ],
  templateUrl: './multiitem-document-create.html',
  styleUrl: './multiitem-document-create.css',
})
export class MultiItemDocumentCreate implements OnInit {
  private readonly repository = inject(DocumentRepositoryService);
  private readonly numberFormatService = inject(NumberFormatService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly toastService = inject(ToastService);
  private readonly documentValidationService = inject(DocumentValidationService);
  private readonly documentRequestMapper = inject(DocumentRequestMapperService);
  private readonly router = inject(Router);

  readonly itemTypes = Object.values(ItemType);
  readonly draft = this.repository.draft;

  readonly documentItemDraft = signal<DocumentItemDraft | null>(null);
  readonly itemValidationErrors = signal<string[]>([]);
  readonly validationErrors = signal<string[]>([]);
  readonly editingItemIndex = signal<number | null>(null);
  readonly creating = signal(false);

  ngOnInit(): void {
    const requested = this.repository.checkRequestConversion();
    if (requested && this.repository.draft()) return; //DO NOT init document if document is converted from simple to standard

    this.repository.initDocument({});
  }

  initDocumentItem(): void {
    this.itemValidationErrors.set([]);
    this.editingItemIndex.set(null);
    this.documentItemDraft.set({
      itemType: ItemType.EXP,
      itemQuantity: 1,
      itemPrice: 0,
      itemComment: '',
    });
  }

  cancelDocumentItem(): void {
    this.closeDocumentItemEditor();
  }

  saveDocumentItem() {
    const item = this.documentItemDraft();
    if (!item) return;

    const errors = this.documentValidationService.validateDocumentItem(item);
    this.itemValidationErrors.set(errors);
    if (errors.length > 0) {
      console.log('errors: ' + errors);
      return;
    }
    const document = this.repository.draft();
    if (!document) return;

    const editingIndex = this.editingItemIndex();

    if (editingIndex == null) {
      //Add
      this.repository.updateDraft({
        documentItems: [...document.documentItems, { ...item }],
      });
    } else {
      //Update
      this.repository.updateDraft({
        documentItems: document.documentItems.map((existingItem, index) =>
          index === editingIndex ? { ...item } : existingItem,
        ),
      });
    }
    this.closeDocumentItemEditor();
  }

  deleteDocumentItem(index: number): void {
    const document = this.draft();
    if (!document) return;

    this.repository.updateDraft({
      documentItems: document.documentItems.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  editDocumentItem(index: number): void {
    const document = this.draft();
    if (!document) return;

    const documentItem = document.documentItems[index];
    if (!documentItem) return;

    this.itemValidationErrors.set([]);
    this.editingItemIndex.set(index);

    this.documentItemDraft.set({
      ...documentItem,
    });
  }

  updateDocumentItemDraft(patch: Partial<DocumentItemDraft>): void {
    const item = this.documentItemDraft();
    if (!item) return;
    this.documentItemDraft.set({
      ...item,
      ...patch,
    });
  }

  updateDocumentDraft(patch: Partial<DocumentDraft>) {
    this.repository.updateDraft(patch);
  }

  submit() {
    if (this.creating()) return;

    const document = this.draft();
    if (!document) return;

    if (this.documentItemDraft()) {
      this.toastService.error(
        'Add or cancel the currently edited item before creating the document',
      );
      return;
    }

    //Error handling
    const errors = this.documentValidationService.validateDocument(document);
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
          this.toastService.success('Document created successfully');
          const documentId = extractDocumentId(location);
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

  resetForm(): void {
    this.validationErrors.set([]);
    this.repository.initDocument({});
  }

  cancel() {
    this.validationErrors.set([]);
    this.repository.initDocument({});
    this.router.navigate(['/documents/list']);
  }

  getItemTotal(item: DocumentItemDraft): number {
    return this.numberFormatService.calculateDocumentItemTotal(item.itemQuantity, item.itemPrice, item.itemType);
  }

  formatItemTotal(item: DocumentItemDraft): string {
    return this.numberFormatService.format(this.getItemTotal(item), 2);
  }

  getDocumentTotal(): number {
    const document = this.draft();
    if (!document) return 0;

    const total = document.documentItems.reduce((sum, item) => sum + this.getItemTotal(item), 0);
    return this.numberFormatService.roundHalfUp(total, 2);
  }

  formatDocumentTotal(): string {
    return this.numberFormatService.format(this.getDocumentTotal(), 2);
  }

  formatAmount(value: number | null | undefined, fractionDigits: number): string {
    return this.numberFormatService.format(value, fractionDigits);
  }

  getItemTotalClass(item: DocumentItemDraft): string {
    return this.numberFormatService.getTotalClass(this.getItemTotal(item));
  }

  getExpensesTotal(): number {
    return (this.draft()?.documentItems
      .filter((item) => item.itemType === ItemType.EXP)
      .reduce((sum, item) => sum + this.getItemTotal(item), 0) ?? 0
    );
  }

  getIncomesTotal(): number {
    return (this.draft()?.documentItems
      .filter((item) => item.itemType === ItemType.INC)
      .reduce((sum, item) => sum + this.getItemTotal(item), 0) ?? 0
    );
  }

  getDocumentTotalClass(): string {
    return this.numberFormatService.getTotalClass(this.getDocumentTotal());
  }

  private closeDocumentItemEditor(): void {
    this.documentItemDraft.set(null);
    this.itemValidationErrors.set([]);
  }

  private handleHttpError(error: unknown, fallback: string): void {
    const message = getApplicationErrorMessage(error, fallback);
    this.toastService.error(message);
    console.error(fallback, error);
  }

}