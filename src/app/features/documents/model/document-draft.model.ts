import { Account } from "./account.model";
import { Counterparty } from "./counterparty.model";
import { Currency } from "./currency.model";
import { DocumentItemDraft } from "./document-item-draft.model";
import { DocumentType } from "./document-type.model";
import { PaymentMethod } from "./payment-method.model";

export interface DocumentDraft {
  documentDate: string;
  documentType: DocumentType;

  documentName: string;
  documentComment: string;
  invoiceNumber: string;

  account: Account | null;
  counterparty: Counterparty | null;

  paymentMethod: PaymentMethod  | null;
  currencyCode: Currency | null;
  exchangeRate: number | null;

  documentItems: DocumentItemDraft[];
}