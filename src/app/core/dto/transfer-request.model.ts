import { DocumentType } from "../../features/documents/model/document-type.model";
import { PaymentRequest } from "./payment-request.model";
import { Transfer } from "./transfer.model";

export interface TransferRequest {

  documentDate: string;
  documentType: DocumentType.TRANSFER;
  accountId: number;
  documentDescription?: string;
  payment: PaymentRequest;
  transfer: Transfer;
} 