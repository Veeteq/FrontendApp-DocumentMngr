import { CreateDocumentItemRequest } from "./create-document-item-request.model";
import { PaymentRequest } from "./payment-request.model";

export interface CreateDocumentRequest {
  documentDate: string;
  documentType: string;
  documentName?: string;
  documentDescription?: string;
  invoiceNumber?: string;
  accountId: number;
  counterpartyId?: number;
  payment: PaymentRequest;
  documentItems: CreateDocumentItemRequest[];
}