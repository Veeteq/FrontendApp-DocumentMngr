import { Currency } from "./currency.model";
import { PaymentMethod } from "./payment-method.model";

export interface Account {
  accountId: number;
  accountName: string;
  accountDescription?: string;
  accountCurrency: Currency;
  accountImageUrl?: string;
  defaultPaymentMethod: PaymentMethod;
}
