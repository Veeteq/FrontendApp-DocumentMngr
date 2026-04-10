import { Injectable, signal } from "@angular/core";
import { Document } from "../model/document.model";

@Injectable({
  providedIn: 'root'
})
export class DocumentRepositoryService {

  /** Internal signal holding the draft document */
  private readonly _draft = signal<Document | null>(null);

   /** Public read-only access to the draft */
  readonly draft = this._draft.asReadonly();


  /**
   * Initialize a new empty document draft.
   * This should be called when user starts "New Document".
   */
  initDocument(base: Partial<Document>) {
    const now = new Date().toISOString();

    const document: Document = {
      documentDate: base.documentDate ?? now.substring(0, 10),
      documentType: base.documentType ?? '',
      documentName: base.documentName ?? '',
      documentComment: base.documentComment,

      account: base.account!,
      paymentMethod: base.paymentMethod ?? '',
      currencyCode: base.currencyCode ?? 'PLN',
      exchangeRate: base.exchangeRate ?? 1,

      documentItems: []
    }

     this._draft.set(document);
  }

  /**
   * Update top-level document fields.
   * Does NOT allow replacing entire document.
   */
  updateDraft(patch: Partial<Document>) {
    const current = this._draft();
    if (!current) return;

    this._draft.set({
      ...current,
      ...patch,
      updateDateTime: new Date().toISOString(),
    });
  }

  /**
   * Clear the draft document (e.g. after submit or cancel).
   */
  reset() {
    this._draft.set(null);
  }

}