import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NumberFormatService } from "../../../core/locale/number-format.service";
import { AccountAutocompleteComponent } from "../../autocomplete/account/account-autocomplete";
import { NumberInputComponent } from "../../common/numberinput/number-input";
import { Account } from "../model/account.model";
import { MoneyTransfer } from '../model/money-transfer.model';
import { TransferRepositoryService } from "../service/money-transfer-repository.service";
import { MoneyTransferRequest } from "../../../core/dto/money-transfer-request.model";
import { DocumentApiService } from "../service/document-api.service";
import { ToastService } from "../../../core/toast/toast.service";

@Component({
  selector: 'app-money-transfer',
  imports: [ReactiveFormsModule, FormsModule, AccountAutocompleteComponent, NumberInputComponent],
  templateUrl: './transfer-money.html',
  styleUrls: ['./transfer-money.css'],
})
export class TransferMoney implements OnInit {
  private readonly repository = inject(TransferRepositoryService);
  private readonly numberFormatService = inject(NumberFormatService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly toastService = inject(ToastService);

  readonly paymentMethods = ['ATM WITHDRAWAL', 'ATM DEPOSIT', 'CASH', 'BANKTRANSFER'];

  readonly draft = this.repository.draft;
  readonly validationErrors = signal<string[]>([]);

  ngOnInit(): void {
    this.repository.initTransfer({
      transferDate: new Date().toISOString().substring(0, 10),
      exchangeRate: 1,
    });
  }

  updateDraft(patch: Partial<MoneyTransfer>) {
    this.repository.updateDraft(patch);
  }

  onSourceAccountSelected(account: Account) {
    this.updateDraft({ sourceAccount: account });
  }

  onTargetAccountSelected(account: Account) {
    this.updateDraft({ targetAccount: account });
  }

  getWithdrawnAmount(): number {
    return this.draft()?.transferAmount ?? 0;
  }

  getExchangedAmount(): number {
    const transferAmount = this.draft()?.transferAmount ?? 0;
    const provisionAmount = this.draft()?.provisionAmount ?? 0;
    const provisionAt = this.draft()?.provisionAt;

    if (provisionAt === 'SOURCE') {
      return Math.max(transferAmount - provisionAmount, 0);
    }

    return transferAmount;
  }

  getReceivedAmount(): number {
    const exchangedAmount = this.getExchangedAmount();
    const exchangeRate = this.draft()?.exchangeRate ?? 0;
    if (!exchangeRate) return 0;

    let result = exchangedAmount / exchangeRate;

    if (this.draft()?.provisionAt === 'TARGET') {
      result -= this.draft()?.provisionAmount ?? 0;
    }

    return Math.max(result, 0);
  }

  formatAmount(amount: number): string {
    return this.numberFormatService.format(amount, 2);
  }

  submit() {
    const transfer = this.repository.draft();
    if (!transfer) return;

    //Error handling
    const errors = this.validateTransfer();
    this.validationErrors.set(errors);
    if (errors.length > 0) {
      this.toastService.error('Validation errors: ' + errors.join(', ')); 
      console.error('Validation errors:', errors);
      return;
    }

    // Convert to request DTO
    const request = this.toMoneyTransferRequest(transfer);
    console.log('submit: ' + JSON.stringify(request, null, 2));

    //Send request to API
    this.documentApi.createTransfer(request)
    .subscribe({
      next: () => {
        this.toastService.success('Transfer created successfully');
        console.log('Transfer created successfully');
      },
      error: error => {
        this.toastService.error('Error creating transfer document');
        console.error('Error creating transfer document', error);
      }
    });
  }

  resetForm() {
    this.validationErrors.set([]);

    this.repository.initTransfer({
      transferDate: new Date().toISOString().substring(0, 10),
      exchangeRate: 1,
    });
  }

  validateTransfer(): string[] {
    const errors: string[] = [];

    const transfer = this.draft();

    if (!transfer) {
      errors.push('Transfer is not initialized');
      return errors;
    }

    // Transaction Date
    if (!transfer.transferDate) errors.push('Transaction date is required');

    // Accounts
    if (!transfer.sourceAccount) errors.push('Source account is required');
    if (!transfer.targetAccount) errors.push('Target account is required');
    if (transfer.sourceAccount?.accountId &&
        transfer.targetAccount?.accountId &&
        transfer.sourceAccount.accountId === transfer.targetAccount.accountId) errors.push('Source and target account must be different');

    // Amounts
    if (transfer.transferAmount == null || transfer.transferAmount <= 0) errors.push('Transfer amount must be greater than 0');
    if (transfer.exchangeRate == null || transfer.exchangeRate <= 0) errors.push('Exchange rate must be greater than 0');
    if (transfer.provisionAmount != null && transfer.provisionAmount < 0) errors.push('Provision amount cannot be negative');
    if (transfer.provisionAmount != null && transfer.provisionAmount > 0 && !transfer.provisionAt) errors.push('Provision location is required when provision amount is entered');

    // Currency consistency
    const sourceCurrency = transfer.sourceAccount?.accountCurrency;
    const targetCurrency = transfer.targetAccount?.accountCurrency;
    if (sourceCurrency &&
        targetCurrency &&
        sourceCurrency === targetCurrency &&
        transfer.exchangeRate !== 1) errors.push('Exchange rate must be 1 when both accounts use the same currency');

    if (sourceCurrency &&
        targetCurrency &&
        sourceCurrency !== targetCurrency &&
        transfer.exchangeRate === 1) errors.push('Exchange rate should not be 1 when accounts use different currencies');

    return errors;
  }

  private toMoneyTransferRequest(document: MoneyTransfer): MoneyTransferRequest {
    return {
      documentDate: document.transferDate,
      documentType: 'Transfer',
      accountId: document.sourceAccount!.accountId,
      targetAccountId: document.targetAccount!.accountId,
      transferAmount: document.transferAmount!,
      comment: this.emptyToUndefined(document.comment),
      payment: {
        paymentMethod: document.paymentMethod!,
        currencyCode: document.targetAccount!.accountCurrency,
        exchangeRate: document.exchangeRate,
      },
    };
  }

  private emptyToUndefined(value?: string): string | undefined {
    if (!value) return undefined;
    return value?.trim() ? value.trim() : undefined;
  }
}