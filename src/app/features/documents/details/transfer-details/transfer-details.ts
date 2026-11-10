import { Component, computed, inject, input } from '@angular/core';
import { NumberFormatService } from '../../../../core/locale/number-format.service';
import { Document } from '../../model/document.model';

@Component({
  selector: 'app-transfer-details',
  templateUrl: './transfer-details.html',
  styleUrl: './transfer-details.css',
})
export class TransferDetails {

  private readonly numberFormatService = inject(NumberFormatService);

  readonly document = input.required<Document>();

  readonly sourceCurrency = computed(() => {
    return this.document().account.accountCurrency;
  });

  readonly transfer = computed(() => {
    const transfer = this.document().transferDetails;
    if (!transfer) throw new Error('Transfer details are missing in the document.');
    return transfer;
  });

  readonly hasDifferentCurrencies = computed(() => {
    const sourceCurrency = this.transfer().sourceCurrency;
    const targetCurrency = this.transfer().targetCurrency;
    return sourceCurrency !== targetCurrency;
  });

  readonly sourceToTargetRate = computed(() => {
    const exchangeRate = this.document().exchangeRate;
    if (!this.hasDifferentCurrencies() || exchangeRate == null || exchangeRate <= 0) return null;
    return 1 / exchangeRate;
  });

  readonly targetToSourceRate = computed(() => {
    const exchangeRate = this.document().exchangeRate;
    if (!this.hasDifferentCurrencies() || exchangeRate == null || exchangeRate <= 0) return null;
    return exchangeRate;
  });

  formatAmount(value: number | null | undefined, fractionDigits = 2): string {
    if (value == null) return '';
    return this.numberFormatService.format(value, fractionDigits);
  }

  formatAmountWithCurrency(value: number | null | undefined, currency: string | null | undefined): string {
    if (value == null) return '';
    const formattedAmount = this.formatAmount(value, 2);
    return currency ? `${formattedAmount} ${currency}` : formattedAmount;
  }

  formatRate(value: number | null): string {
    return value == null ? '' : this.formatAmount(value, 6);
  }
}