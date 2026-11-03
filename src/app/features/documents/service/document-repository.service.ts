import { Injectable, signal } from "@angular/core";
import { DocumentType } from "../model/document-type.model";
import { DocumentDraft } from "../model/document-draft.model";

@Injectable({
  providedIn: 'root'
})
export class DocumentRepositoryService {

  /** Internal signal holding the draft document */
  private readonly _draft = signal<DocumentDraft | null>(null);

   /** Public read-only access to the draft */
  readonly draft = this._draft.asReadonly();

  /**
   * Initialize a new empty document draft.
   * This should be called when user starts "New Document".
   */
  initDocument(base: Partial<DocumentDraft>) {
    const now = new Date().toISOString();

    const document: DocumentDraft = {
      documentDate: base.documentDate ?? now.substring(0, 10),
      documentType: base.documentType  ?? DocumentType.BILL,
      documentName: base.documentName ?? '',
      documentComment: base.documentComment ?? '',
      invoiceNumber: base.invoiceNumber ?? '',

      account: base.account ?? null,
      counterparty: base.counterparty ?? null,
      
      paymentMethod: base.paymentMethod ?? null,
      currencyCode: base.currencyCode ?? 'PLN',
      exchangeRate: base.exchangeRate ?? 1,

      documentItems: base.documentItems ?? [],
    }    
    this._draft.set(document);
  }

  initDocumentItem() {
  }
  
  /**
   * Update top-level document fields.
   * Does NOT allow replacing entire document.
   */
  updateDraft(patch: Partial<DocumentDraft>) {
    const current = this._draft();
    if (!current) return;

    this._draft.set({
      ...current,
      ...patch
    });
  }

  /**
   * Clear the draft document (e.g. after submit or cancel).
   */
  reset() {
    this._draft.set(null);
  }

}