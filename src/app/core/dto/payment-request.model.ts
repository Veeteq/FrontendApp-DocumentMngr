import { Currency } from "../../features/documents/model/currency.model";
import { PaymentMethod } from "../../features/documents/model/payment-method.model";

export interface PaymentRequest {
  paymentMethod: PaymentMethod;
  currencyCode: Currency;
  exchangeRate: number;
}