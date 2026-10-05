import { Account } from "./account.model";

export interface MoneyTransfer {
  transferDate: string;
  sourceAccount?: Account;
  targetAccount?: Account;
  transferAmount?: number;
  paymentMethod?: string;
  exchangeRate: number;
  provisionAmount?: number;
  provisionAt?: 'SOURCE' | 'TARGET';
  comment?: string;
}