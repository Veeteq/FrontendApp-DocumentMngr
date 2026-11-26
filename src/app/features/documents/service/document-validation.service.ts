import { Injectable } from "@angular/core";
import { DocumentDraft } from "../model/document-draft.model";
import { DocumentType } from "../model/document-type.model";
import { DocumentItemDraft } from "../model/document-item-draft.model";
import { MoneyTransferDraft, ProvisionAt } from "../model/money-transfer-draft.model";

@Injectable({
  providedIn: "root"
})
export class DocumentValidationService {

  validateDocument(document: DocumentDraft): string[] {
    const errors = this.validateCommonFields(document);
    errors.push(...this.validateDocumentItems(document.documentItems));
  
    return errors;
  }

  validateTransfer(transfer: MoneyTransferDraft): string[] {
    const errors: string[] = [];

    if (!transfer.transferDate) errors.push('Transaction date is required');
    if (!transfer.paymentMethod) errors.push('Payment method is required');
    if (!transfer.sourceAccount) errors.push('Source account is required');
    if (!transfer.targetAccount) errors.push('Target account is required');
    if (transfer.sourceAccount && transfer.targetAccount && transfer.sourceAccount.accountId === transfer.targetAccount.accountId) errors.push('Source and target account must be different');
    if (transfer.transferAmount == null || !Number.isFinite(transfer.transferAmount) || transfer.transferAmount <= 0) errors.push('Transfer amount must be greater than 0');
    if (transfer.exchangeRate == null || !Number.isFinite(transfer.exchangeRate) || transfer.exchangeRate <= 0) errors.push('Exchange rate must be greater than 0');
    
    errors.push(...this.validateProvision(transfer));
    errors.push(...this.validateTransferCurrencies(transfer));

    return errors;
  }

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

  private validateProvision(transfer: MoneyTransferDraft): string[] {
    const errors: string[] = [];
    const provisionAmount = transfer.provisionAmount;

    if (provisionAmount == null) return errors;
    if (!Number.isFinite(provisionAmount)) {
      errors.push('Provision amount must be a valid number');
      return errors;
    }

    if (provisionAmount < 0) {
      errors.push('Provision amount cannot be negative');
      return errors;
    }

    if (provisionAmount === 0) return errors;

    if (!transfer.provisionAt) {
      errors.push('Provision location is required when provision amount is entered');
      return errors;
    }

    if (transfer.provisionAt === ProvisionAt.SOURCE && Number.isFinite(transfer.transferAmount) && provisionAmount > transfer.transferAmount) errors.push('Provision must not exceed transfer amount');
    if (transfer.provisionAt === ProvisionAt.TARGET && Number.isFinite(transfer.transferAmount) && Number.isFinite(transfer.exchangeRate) && transfer.exchangeRate > 0) {
      const targetAmount = transfer.transferAmount / transfer.exchangeRate;
      if (provisionAmount > targetAmount) errors.push('Provision must not exceed received transfer amount');      
    }
    return errors;
  }

  private validateTransferCurrencies(transfer: MoneyTransferDraft): string[] {
    const errors: string[] = [];

    const sourceCurrency = transfer.sourceAccount?.accountCurrency;
    const targetCurrency = transfer.targetAccount?.accountCurrency;

    if (!sourceCurrency || !targetCurrency) return errors;
    if (sourceCurrency === targetCurrency && transfer.exchangeRate !== 1) errors.push('Exchange rate must be 1 when both accounts use the same currency');
    if (sourceCurrency !== targetCurrency && transfer.exchangeRate === 1) errors.push('Exchange rate should not be 1 when accounts use different currencies');

    return errors;
  }

}