import { Injectable, signal } from '@angular/core';
import { MoneyTransferDraft, ProvisionAt } from '../model/money-transfer-draft.model';
import { Account } from '../model/account.model';
import { PaymentMethod } from '../model/payment-method.model';

@Injectable({
  providedIn: 'root',
})
export class TransferRepositoryService {
  private readonly _draft = signal<MoneyTransferDraft | null>(null);
  private readonly _draftTransferReady = signal(false);

  readonly draft = this._draft.asReadonly();

  initTransfer(base: Partial<MoneyTransferDraft>): void {
    const now = new Date().toISOString();

    const transfer: MoneyTransferDraft = {
      transferDate: base.transferDate ?? now.substring(0, 10),
      sourceAccount: base.sourceAccount ?? null,
      targetAccount: base.targetAccount ?? null,
      transferAmount: base.transferAmount ?? 0,
      paymentMethod: base.paymentMethod ?? null,
      exchangeRate: base.exchangeRate ?? 1,
      provisionAmount: base.provisionAmount ?? null,
      provisionAt: base.provisionAt ?? null,
      comment: base.comment ?? '',
    };
    this._draft.set(transfer);
  }

  prepareDraftTransfer(transfer: Partial<MoneyTransferDraft>) {
    this.initTransfer(transfer);
    this._draftTransferReady.set(true);
  }

  updateDraft(patch: Partial<MoneyTransferDraft>): void {
    const current = this.draft();

    if (!current) return;

    this._draft.set({
      ...current,
      ...patch,
    });
  }

  reset(): void {
    this.initTransfer({});
  }

  consumeTransferDraft(): boolean {
    const requested = this._draftTransferReady();
    this._draftTransferReady.set(false);
    return requested;
  }
}
