import { Injectable } from "@angular/core";
import { CreateDocumentItemRequest } from "../../../core/dto/create-document-item-request.model";
import { CreateDocumentRequest } from "../../../core/dto/create-document-request.model";
import { DocumentDraft } from "../model/document-draft.model";
import { DocumentItemDraft } from "../model/document-item-draft.model";
import { DocumentItem } from "../model/document-item.model";
import { Document } from "../model/document.model";

@Injectable({
  providedIn: 'root',
})
export class DocumentRequestMapperService {
  /* document properties are already validated in previous steps so we can safely use '!' */
  toCreateDocumentRequest(document: DocumentDraft): CreateDocumentRequest {
    return {
      documentDate: document.documentDate,
      documentType: document.documentType,
      documentName: this.emptyToUndefined(document.documentName),
      documentDescription: this.emptyToUndefined(document.documentComment),
      invoiceNumber: this.emptyToUndefined(document.invoiceNumber),
      accountId: document.account!.accountId,
      counterpartyId: document.counterparty?.id,
      payment: {
        paymentMethod: document.paymentMethod!,
        currencyCode: document.currencyCode!,
        exchangeRate: document.exchangeRate!,
      },
      documentItems: document.documentItems.map((item) => this.toCreateDocumentItemRequest(item)),
    };
  }

  toDocumentDraft(document: Document): DocumentDraft {
    const documentDraft: DocumentDraft = {
      documentDate: this.getToday(),

      documentType: document.documentType,
      documentName: document.documentName,
      documentComment: document.documentComment ?? '',
      invoiceNumber: document.invoiceNumber ?? '',

      account: document.account,
      counterparty: document.counterparty ?? null,

      paymentMethod: document.paymentMethod,
      currencyCode: document.currencyCode,
      exchangeRate: document.exchangeRate,

      documentItems: document.documentItems.map((item) => this.toDocumentItemDraft(item)),
    };
    return documentDraft;
  }

  /* documentItem properties are already validated in previous steps so we can safely use '!' */
  private toCreateDocumentItemRequest(item: DocumentItemDraft): CreateDocumentItemRequest {
    return {
      itemType: item.itemType!,
      itemId: item.item!.itemId,
      itemQuantity: item.itemQuantity!,
      itemPrice: item.itemPrice!,
      itemDescription: this.emptyToUndefined(item.itemComment),
    };
  }

  private toDocumentItemDraft(documentItem: DocumentItem): DocumentItemDraft {
    const documentItemDraft: DocumentItemDraft = {
      itemType: documentItem.itemType,
      item: documentItem.item,
      itemQuantity: documentItem.itemQuantity,
      itemPrice: documentItem.itemPrice,
      itemComment: documentItem.itemComment ?? '',
    };
    return documentItemDraft;
  }

  private emptyToUndefined(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  private getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}