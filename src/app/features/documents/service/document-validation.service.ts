import { Injectable } from "@angular/core";
import { DocumentDraft } from "../model/document-draft.model";
import { DocumentType } from "../model/document-type.model";
import { DocumentItemDraft } from "../model/document-item-draft.model";

@Injectable({
  providedIn: "root"
})
export class DocumentValidationService {

  validateDocument(document: DocumentDraft): string[] {
    const errors = this.validateCommonFields(document);
    errors.push(...this.validateDocumentItems(document.documentItems));
  
    return errors;
  }

  private validateCommonFields(document: DocumentDraft): string[] {
    const errors: string[] = [];

    // Document
    if (!document.account) errors.push("Account is required");
    if (!document.documentType) errors.push("Document type is required");
    if (!document.documentName?.trim()) errors.push("Document name is required");
    if (!document.documentDate) errors.push("Document date is required");

    // Counterparty
    if ((document.documentType === DocumentType.BILL || document.documentType === DocumentType.INVOICE) && !document.counterparty) errors.push("Counterparty is required");

    // Invoice
    if (document.documentType === DocumentType.INVOICE && !document.invoiceNumber?.trim()) errors.push("Invoice number is required");

    // Payment
    if (!document.paymentMethod) errors.push("Payment method is required");
    if (!document.currencyCode) errors.push("Currency is required");

    if (document.exchangeRate == null || !Number.isFinite(document.exchangeRate) || document.exchangeRate <= 0) errors.push("Exchange rate must be greater than zero");

    return errors;
  }

  validateDocumentItem(item: DocumentItemDraft): string[] {
    const errors: string[] = [];

    if (!item.itemType) errors.push('Item type is required');
    if (!item.item) errors.push('Item is required');
    if (item.itemQuantity === undefined || !Number.isFinite(item.itemQuantity) || item.itemQuantity <= 0) errors.push('Quantity must be greater than 0');
    if (item.itemPrice === undefined || !Number.isFinite(item.itemPrice) || item.itemPrice <= 0) errors.push('Price must be greater than 0');
    return errors;
  }

  private validateDocumentItems(items: DocumentItemDraft[]): string[] {
    if (items.length === 0) return ['At least one document item is required'];

    return items.flatMap(item => this.validateDocumentItem(item));
  }
}