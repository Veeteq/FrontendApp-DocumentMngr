import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreateDocumentRequest } from '../../../core/dto/create-document-request.model';
import { NumberFormatService } from '../../../core/locale/number-format.service';
import { AccountAutocompleteComponent } from '../../autocomplete/account/account-autocomplete';
import { CounterpartyAutocompleteComponent } from '../../autocomplete/counterparty/counterparty-autocomplete';
import { DocumentNameAutocompleteComponent } from '../../autocomplete/documentname/document-name-autocomplete';
import { ItemAutocompleteComponent } from '../../autocomplete/item/item-autocomplete';
import { ItemCommentAutocompleteComponent } from '../../autocomplete/itemcomment/item-comment-autocomplete';
import { NumberInputComponent } from '../../common/numberinput/number-input';
import { Account } from '../model/account.model';
import { Counterparty } from '../model/counterparty.model';
import { DocumentItem } from '../model/document-item.model';
import { Document } from '../model/document.model';
import { Item } from '../model/item.model';
import { DocumentApiService } from '../service/document-api.service';
import { DocumentRepositoryService } from '../service/document-repository.service';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-poc',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AccountAutocompleteComponent,
    CounterpartyAutocompleteComponent,
    DocumentNameAutocompleteComponent,
    ItemAutocompleteComponent,
    ItemCommentAutocompleteComponent,
    NumberInputComponent,
],
  templateUrl: './poc.html',
  styleUrl: './poc.css',
})
export class Poc implements OnInit {
  private readonly repository = inject(DocumentRepositoryService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly numberFormatService = inject(NumberFormatService);
  private readonly toastService = inject(ToastService);

  // Temporary reference data
  readonly documentTypes = ['Note', 'Bill', 'Invoice'];
  readonly paymentMethods = ['CASH', 'CREDITCARD', 'DEBITCARD', 'BANKTRANSFER'];
  readonly currencies = ['PLN', 'EUR', 'USD', 'GBP'];

  readonly validationErrors = signal<string[]>([]);

  readonly draft = this.repository.draft;

  ngOnInit(): void {
    this.repository.initDocument({
      documentDate: new Date().toISOString().substring(0, 10),
      documentType: 'Bill',
      documentName: '',
      paymentMethod: '',
      currencyCode: 'PLN',
      exchangeRate: 1,
      documentComment: '',
    });
    this.initDocumentItem();
  }

  updateDraft(patch: Partial<Document>) {
    this.repository.updateDraft(patch);
  }

  onAccountSelected(account: Account) {
    this.repository.updateDraft({
      account,
      currencyCode: account.accountCurrency,
      paymentMethod: account.defaultPaymentMethod,
    });
  }
  
  onCommentChanged(comment: string) {
    console.log('onCommentChanged: ' + comment);
    const draft = this.repository.draft();
    if (!draft) return;
    const currentItem = draft.documentItems?.[0];
    if (!currentItem) return;

    this.repository.updateDraft({
      documentItems: [
        {
          ...currentItem,
          itemComment: comment,
        },
      ],
    });
  }

  onCounterpartySelected(counterparty: any) {
    console.log('onCounterpartySelected: ' + JSON.stringify(counterparty));
    this.repository.updateDraft({
      counterparty: {
        counterpartyId: counterparty.id,
        counterpartyName: counterparty.companyName ?? counterparty.firstName + ' ' + counterparty.lastName,
        displayName: counterparty.displayName,
      },
    });
  }

  onDocumentNameChanged(name: string) {
    this.repository.updateDraft({
      documentName: name,
    });
  }

  exchangeRateInput: string | null = '';
  onExchangeRateChange(value: string) {
    this.exchangeRateInput = value;
    const parsed = this.numberFormatService.parse(value);
    if (parsed == null) {      
      return;
    }
    this.repository.updateDraft({ exchangeRate: parsed });
  }

  itemQuantityInput: string | null = '';
  onItemQuantityChange(value: string) {
    this.itemQuantityInput = value;
    const parsed = this.numberFormatService.parse(value);
    if (parsed == null) {      
      return;
    }
    this.updateDocumentItem({ itemQuantity: parsed });
  }

  itemPriceInput: string | null = '';
  onItemPriceChange(value: string) {
    this.itemPriceInput = value;
    const parsed = this.numberFormatService.parse(value);
    if (parsed == null) {      
      return;
    }
    this.updateDocumentItem({ itemPrice: parsed });
  }

  onItemSelected(item: Item) {
    const draft = this.repository.draft();
    if (!draft) return;
    const currentItem = draft.documentItems?.[0];
    if (!currentItem) return;

    this.repository.updateDraft({
      documentItems: [
        {
          ...currentItem,
          item: item,
        },
      ],
    });
  }

  onCurrencyChange(currencyCode: string) {
    const accountCurrency = this.repository.draft()?.account?.accountCurrency;
    if (accountCurrency === currencyCode) {
      this.repository.updateDraft({
        currencyCode: currencyCode,
        exchangeRate: 1,
      });
      return;
    }

    this.repository.updateDraft({
      currencyCode: currencyCode,
    });
  }

  updateDocumentItem(patch: Partial<DocumentItem>) {
    const draft = this.repository.draft();
    if (!draft) return;

    const documentItem = draft.documentItems?.[0];
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
    const item = draft?.documentItems?.[0];

    if (!item) return '0';

    const total = (item.itemQuantity ?? 0) * (item.itemPrice ?? 0);
    return this.numberFormatService.format(total, 2);
  }

  submit() {
    const document = this.repository.draft();
    if (!document) return;

    //Error handling
    const errors = this.validateDocument();
    this.validationErrors.set(errors);
    if (errors.length > 0) {
      this.toastService.error('Validation errors: ' + errors.join(', '));
      console.error('Validation errors', errors);
      return;
    }

    // Convert to request DTO
    const request = this.toCreateDocumentRequest(document);
    console.log('submit: ' + JSON.stringify(request, null, 2));

    //Send request to API
    this.documentApi.createDocument(request)
    .subscribe({ 
      next: () => {
        this.toastService.success('Document created successfully');
        console.log('Document created successfully')
      },    
      error: error => {
        this.toastService.error('Error creating document');
        console.error('Error creating document', error);
      }
    });
  }

  resetForm(): void {
    this.validationErrors.set([]);

    this.repository.initDocument({
      documentDate: new Date().toISOString().substring(0, 10),
      documentType: 'Bill',
      currencyCode: 'PLN',
      exchangeRate: 1,
    });
    this.initDocumentItem();
  }

  isCounterpartyEnabled(): boolean {
    const type = this.repository.draft()?.documentType;
    return type === 'Invoice' || type === 'Bill';
  }

  isInvoiceNumberEnabled(): boolean {
    const type = this.repository.draft()?.documentType;
    return type === 'Invoice';
  }
  
  isExchangeRateEditable(): boolean {
    const accountCurrency = this.repository.draft()?.account?.accountCurrency;
    const documentCurrency = this.repository.draft()?.currencyCode;
    if (!accountCurrency || !documentCurrency) {
      return true;
    }
    return accountCurrency !== documentCurrency;
  }  

  private initDocumentItem() {
    const draft = this.repository.draft();
    if (!draft) return;
    if (draft.documentItems?.length > 0) return;

    this.onItemQuantityChange('1');
    this.onItemPriceChange('0');

    this.repository.updateDraft({
      documentItems: [
        {
          itemType: 'EXP',
          itemQuantity: 1,
          itemPrice: 0,
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
    if (
      (document.documentType === 'Bill' || document.documentType === 'Invoice') &&
      !document.counterparty
    )
      errors.push('Counterparty is required');

    // Invoice
    if (document.documentType === 'Invoice' && !document.invoiceNumber?.trim())
      errors.push('Invoice number is required');

    // Payment
    if (!document.paymentMethod) errors.push('Payment method is required');
    if (!document.currencyCode) errors.push('Currency is required');
    if (document.exchangeRate == null || document.exchangeRate <= 0)
      errors.push('Exchange rate must be greater than zero');

    // Items
    const items = document.documentItems ?? [];
    if (items.length === 0) errors.push('At least one document item is required');
    items.forEach((item, index) => {
      const itemNo = index + 1;
      if (!item.itemType) errors.push(`Item #${itemNo}: type is required`);
      if (!item.item) errors.push(`Item #${itemNo}: item is required`);
      if (!item.itemQuantity || item.itemQuantity <= 0)
        errors.push(`Item #${itemNo}: quantity must be greater than 0`);
      if (!item.itemPrice || item.itemPrice <= 0)
        errors.push(`Item #${itemNo}: price must be greater than 0`);
    });

    return errors;
  }

  private toCreateDocumentRequest(document: Document): CreateDocumentRequest {
    return {
      documentDate: document.documentDate,
      documentType: document.documentType,
      documentName: this.emptyToUndefined(document.documentName),
      documentDescription: this.emptyToUndefined(document.documentComment),
      invoiceNumber: this.emptyToUndefined(document.invoiceNumber),
      accountId: document.account!.accountId,
      counterpartyId: document.counterparty?.counterpartyId,
      payment: {
        paymentMethod: document.paymentMethod,
        currencyCode: document.currencyCode,
        exchangeRate: document.exchangeRate,
      },
      documentItems: document.documentItems.map((item) => ({
        itemType: item.itemType,
        itemId: item.item!.itemId,
        itemQuantity: item.itemQuantity,
        itemPrice: item.itemPrice,
        itemDescription: this.emptyToUndefined(item.itemComment),
      })),
    };
  }
  private emptyToUndefined(value?: string): string | undefined {
    if (!value) return undefined;
    return value?.trim() ? value.trim() : undefined;
  }

}