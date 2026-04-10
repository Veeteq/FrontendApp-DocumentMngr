import { Account } from "./account.model";
import { Counterparty } from "./counterparty.model";
import { DocumentItem } from "./document-item.model";

export interface Document {
  documentId?: number;
  documentDate: string;            // ISO date (yyyy-MM-dd)
  documentType: string;
  documentName: string;
  documentComment?: string;
  invoiceNumber?: string;

  account: Account;
  targetAccount?: Account;

  documentAmount?: number;

  counterparty?: Counterparty;

  paymentMethod: string;
  currencyCode: string;
  exchangeRate?: number;

  documentItems: DocumentItem[];
  documentItemsCount?: number;
  
  createDateTime?: string;           // ISO datetime
  updateDateTime?: string;           // ISO datetime
  version?: number;
}
