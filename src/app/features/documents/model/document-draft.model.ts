import { Account } from "./account.model";
import { Counterparty } from "./counterparty.model";
import { DocumentItemDraft } from "./document-item-draft.model";
import { DocumentType } from "./document-type.model";
import { PaymentMethod } from "./payment-method.model";

export interface DocumentDraft {
  documentDate: string;
  documentType: DocumentType | null;

  documentName: string
  documentComment: string
  invoiceNumber: string

  account: Account | null;
  counterparty: Counterparty | null;

  paymentMethod: PaymentMethod  | null;
  currencyCode: string | null;
  exchangeRate: number | null;

  documentItems: DocumentItemDraft[];
}