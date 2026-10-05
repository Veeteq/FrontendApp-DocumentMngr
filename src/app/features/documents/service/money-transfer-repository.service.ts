import { Injectable, signal } from '@angular/core';
import { MoneyTransfer } from '../model/money-transfer.model';

@Injectable({
  providedIn: 'root'
})
export class TransferRepositoryService {

  readonly draft = signal<MoneyTransfer | undefined>(undefined);

  initTransfer(transfer: Partial<MoneyTransfer>): void {
    this.draft.set({
      transferDate: '',
      exchangeRate: 1,
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
  }
}
