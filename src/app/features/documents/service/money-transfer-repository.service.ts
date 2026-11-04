import { Injectable, signal } from '@angular/core';
import { MoneyTransferDraft } from '../model/money-transfer-draft.model';

@Injectable({
  providedIn: 'root',
})
export class TransferRepositoryService {
  private readonly _draft = signal<MoneyTransferDraft | null>(null);
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
}
