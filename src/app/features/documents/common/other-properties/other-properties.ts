import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NumberInputComponent } from '../../../common/numberinput/number-input';
import { Currency } from '../../model/currency.model';
import { DocumentDraft } from '../../model/document-draft.model';
import { PaymentMethod } from '../../model/payment-method.model';

@Component({
  selector: 'app-other-properties',
  imports: [
    FormsModule,
    NumberInputComponent,
  ],
  templateUrl: './other-properties.html',
  styleUrl: './other-properties.css',
})
export class OtherProperties {
  readonly draft = input.required<DocumentDraft>();
  readonly draftChange = output<Partial<DocumentDraft>>();
  readonly currencies = Object.values(Currency);
    readonly paymentMethods = [
    PaymentMethod.CASH,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BANK_TRANSFER
  ];

  readonly exchangeRateEditable = computed(() => {
    const accountCurrency = this.draft().account?.accountCurrency;
    const documentCurrency = this.draft().currencyCode;
    if (!accountCurrency || !documentCurrency) return true;
    return accountCurrency !== documentCurrency;
  });

  updateDraft(patch: Partial<DocumentDraft>): void {
    this.draftChange.emit(patch);
  }

  onCurrencyChange(currencyCode: Currency) {
    const accountCurrency = this.draft()?.account?.accountCurrency;
    if (accountCurrency === currencyCode) {
      this.updateDraft({
        currencyCode: currencyCode,
        exchangeRate: 1,
      });
      return;
    }

    this.updateDraft({
      currencyCode: currencyCode,
    });
  }

}