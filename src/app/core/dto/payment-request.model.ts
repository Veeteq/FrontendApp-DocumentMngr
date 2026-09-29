export interface PaymentRequest {
  paymentMethod: string;
  currencyCode: string;
  exchangeRate: number;
}