import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountAutocompleteComponent } from '../../../autocomplete/account/account-autocomplete';
import { CounterpartyAutocompleteComponent } from '../../../autocomplete/counterparty/counterparty-autocomplete';
import { DocumentNameAutocompleteComponent } from '../../../autocomplete/documentname/document-name-autocomplete';
import { Account } from '../../model/account.model';
import { Counterparty } from '../../model/counterparty.model';
import { DocumentDraft } from '../../model/document-draft.model';
import { DocumentType } from '../../model/document-type.model';

@Component({
  selector: 'app-header',
  imports: [
    FormsModule,
    AccountAutocompleteComponent,
    CounterpartyAutocompleteComponent,
    DocumentNameAutocompleteComponent,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly draft = input.required<DocumentDraft>();
  readonly validationErrors = input<string[]>([]);
  readonly draftChange = output<Partial<DocumentDraft>>();

  readonly documentTypes = [
    DocumentType.NOTE, 
    DocumentType.BILL, 
    DocumentType.INVOICE
  ];

  readonly invoiceNumberEnabled = computed(() =>
    this.draft().documentType === DocumentType.INVOICE
  );

  readonly counterpartyEnabled = computed(() =>
    this.draft().documentType === DocumentType.BILL ||
    this.draft().documentType === DocumentType.INVOICE
  );

  updateDraft(patch: Partial<DocumentDraft>): void {
    this.draftChange.emit(patch);
  }

  onDocumentTypeChange(documentType: DocumentType): void {
    const patch: Partial<DocumentDraft> = {
      documentType,
    };

    if (documentType !== DocumentType.INVOICE) {
      patch.invoiceNumber = undefined;
    }

    if (documentType !== DocumentType.BILL && documentType !== DocumentType.INVOICE) {
      patch.counterparty = null;
    }

    this.updateDraft(patch);
  }

  onDocumentNameChanged(documentName: string): void {
    this.updateDraft({
      documentName,
    });
  }

  onAccountSelected(account: Account): void {
    this.updateDraft({
      account,
      currencyCode: account.accountCurrency,
      paymentMethod: account.defaultPaymentMethod,
    });
  }

  onCounterpartySelected(counterparty: Counterparty) {
    this.updateDraft({
      counterparty: {
        id: counterparty.id,
        name: counterparty.companyName ?? counterparty.firstName + ' ' + counterparty.lastName,
        displayName: counterparty.displayName,
      },
    });
  }

  hasValidationError(message: string): boolean {
    return this.validationErrors().includes(message);
  }
}