import { Injectable } from "@angular/core";
import { DocumentDraft } from "../model/document-draft.model";
import { DocumentType } from "../model/document-type.model";

@Injectable({
  providedIn: "root"
})
export class DocumentValidationService {

  validateCommonFields(document: DocumentDraft): string[] {
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

}