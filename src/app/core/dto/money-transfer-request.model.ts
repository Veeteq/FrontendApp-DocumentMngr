import { PaymentRequest } from "./payment-request.model";

export interface MoneyTransferRequest {

  documentDate: string;
  documentType: 'Transfer';
  accountId: number;
  targetAccountId: number;
  transferAmount: number;
  payment: PaymentRequest;
  comment?: string;
} 