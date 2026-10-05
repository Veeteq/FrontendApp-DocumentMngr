import { Injectable, signal } from '@angular/core';
import { MoneyTransfer } from '../model/money-transfer.model';

@Injectable({
  providedIn: 'root'
})
export class TransferRepositoryService {

  readonly draft = signal<MoneyTransfer | undefined>(undefined);

  initTransfer(transfer: Partial<MoneyTransfer>): void {
    const now = new Date().toISOString();

    this.draft.set({
      transferDate: transfer.transferDate ?? now.substring(0, 10),
      transferAmount: 0,
      exchangeRate: 1,
      provisionAmount: 0,
      ...transfer,
    });
  }

  updateDraft(patch: Partial<MoneyTransfer>): void {
    const current = this.draft();

    if (!current) return;

    this.draft.set({
      ...current,
      ...patch,
    });
  }

  reset(): void {
    this.draft.set(undefined);
    this.initTransfer({
      transferDate: new Date().toISOString().substring(0, 10),
      transferAmount: 0,
      exchangeRate: 1,
      provisionAmount: 0,
    });
  }
}
