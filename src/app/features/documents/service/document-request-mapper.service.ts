import { Injectable } from "@angular/core";
import { CreateDocumentItemRequest } from "../../../core/dto/create-document-item-request.model";
import { CreateDocumentRequest } from "../../../core/dto/create-document-request.model";
import { DocumentDraft } from "../model/document-draft.model";
import { DocumentItemDraft } from "../model/document-item-draft.model";

@Injectable({
  providedIn: 'root'
})
export class DocumentRequestMapperService {

  toCreateDocumentRequest(document: DocumentDraft): CreateDocumentRequest {
    if (!document.account) throw new Error('Account is required');
    if (!document.documentType) throw new Error('Document type is required');
    if (!document.paymentMethod) throw new Error('Payment method is required');
    if (!document.currencyCode) throw new Error('Currency is required');
    if (document.exchangeRate == null) throw new Error('Exchange rate is required');

    return {
      documentDate: document.documentDate,
      documentType: document.documentType,
      documentName: this.emptyToUndefined(document.documentName),
      documentDescription: this.emptyToUndefined(document.documentComment),
      invoiceNumber: this.emptyToUndefined(document.invoiceNumber),
      accountId: document.account.accountId,
      counterpartyId: document.counterparty?.id,
      payment: {
        paymentMethod: document.paymentMethod,
        currencyCode: document.currencyCode,
        exchangeRate: document.exchangeRate,
      },
      documentItems: document.documentItems.map((item, index) => this.toCreateDocumentItemRequest(item, index)),
    };
  }

  private toCreateDocumentItemRequest(item: DocumentItemDraft, index: number): CreateDocumentItemRequest {
    const itemNumber = index + 1;

    if (!item.itemType) throw new Error(`Item #${itemNumber}: type is required`);
    if (!item.item) throw new Error(`Item #${itemNumber}: item is required`);
    if (item.itemQuantity === undefined || !Number.isFinite(item.itemQuantity) || item.itemQuantity <= 0) throw new Error(`Item #${itemNumber}: quantity must be greater than 0`);
    if (item.itemPrice === undefined || !Number.isFinite(item.itemPrice) || item.itemPrice <= 0) throw new Error(`Item #${itemNumber}: price must be greater than 0`);

    return {
      itemType: item.itemType,
      itemId: item.item.itemId,
      itemQuantity: item.itemQuantity,
      itemPrice: item.itemPrice,
      itemDescription: this.emptyToUndefined(item.itemComment),
    };
  }

  private emptyToUndefined(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }

}