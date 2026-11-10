import { Account } from "./account.model";
import { Currency } from "./currency.model";
import { ProvisionAt } from "./money-transfer-draft.model";

export interface TransferDetails {
  sourceAccount: Account;
  sourceAmount: number;
  sourceCurrency: Currency;

  targetAccount: Account;
  targetAmount: number;
  targetCurrency: Currency;

  provisionAmount?: number | null;
  provisionAt?: ProvisionAt | null;

}