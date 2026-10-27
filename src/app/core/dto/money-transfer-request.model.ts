import { DocumentType } from "../../features/documents/model/document-type.model";
import { PaymentRequest } from "./payment-request.model";

export interface MoneyTransferRequest {

  documentDate: string;
  documentType: DocumentType.TRANSFER;
  accountId: number;
  targetAccountId: number;
  transferAmount: number;
  payment: PaymentRequest;
  documentDescription?: string;
} 