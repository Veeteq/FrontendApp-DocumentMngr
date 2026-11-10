import { Account } from "./account.model";
import { Counterparty } from "./counterparty.model";
import { Currency } from "./currency.model";
import { DocumentItem } from "./document-item.model";
import { DocumentType } from "./document-type.model";
import { PaymentMethod } from "./payment-method.model";
import { TransferDetails } from "./transfer-details.model";

export interface Document {
  documentId: number;
  documentDate: string;            // ISO date (yyyy-MM-dd)
  documentType: DocumentType;

  documentName: string;
  documentComment?: string;
  invoiceNumber?: string;

  account: Account
  counterparty?: Counterparty;

  documentAmount: number;
  transferDetails?: TransferDetails;

  paymentMethod: PaymentMethod;
  currencyCode: Currency;
  exchangeRate: number;

  documentItems: DocumentItem[];
  documentItemsCount: number;
  
  createDateTime: string;           // ISO datetime
  updateDateTime: string;           // ISO datetime
  version: number;
}
