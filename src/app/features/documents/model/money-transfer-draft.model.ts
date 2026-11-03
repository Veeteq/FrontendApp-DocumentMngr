import { Account } from "./account.model";
import { PaymentMethod } from "./payment-method.model";

export interface MoneyTransferDraft {
  transferDate: string;
  sourceAccount: Account | null;
  targetAccount: Account | null;
  transferAmount: number | null;
  paymentMethod: PaymentMethod | null;
  exchangeRate: number | null;
  provisionAmount: number | null;
  provisionAt: ProvisionAt | null;
  comment?: string;
}

export enum ProvisionAt  {
  SOURCE,
  TARGET
}