import { Account } from "./account.model";
import { PaymentMethod } from "./payment-method.model";

export interface MoneyTransferDraft {
  transferDate: string;
  sourceAccount: Account | null;
  targetAccount: Account | null;
  transferAmount: number;
  paymentMethod: PaymentMethod | null;
  exchangeRate: number;
  provisionAmount: number | null;
  provisionAt: ProvisionAt | null;
  comment?: string;
}

export enum ProvisionAt  {
  SOURCE = "SOURCE",
  TARGET = "TARGET"
}