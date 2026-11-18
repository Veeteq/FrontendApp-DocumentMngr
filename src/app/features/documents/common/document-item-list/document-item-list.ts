import { Component, inject, input, output } from "@angular/core";
import { NumberFormatService } from "../../../../core/locale/number-format.service";
import { DocumentItemDraft } from "../../model/document-item-draft.model";
import { DocumentItem } from "../../model/document-item.model";
import { ItemType } from "../../model/item-type.model";

@Component({
  selector: 'app-document-item-list',
  styleUrl: 'document-item-list.css',
  templateUrl: 'document-item-list.html'
})
export class DocumentItemList {
  private readonly numberFormatService = inject(NumberFormatService);

  readonly documentItems = input.required<(DocumentItem | DocumentItemDraft)[]>();
  readonly documentCurrency = input.required<string | null>();
  readonly editable = input(false);

  readonly editItem = output<number>();
  readonly deleteItem = output<number>();

  formatItemTotal(item: DocumentItem | DocumentItemDraft): string {
    return this.numberFormatService.format(this.getItemTotal(item), 2);
  }

  formatAmount(value: number | null | undefined, fractionDigits: number): string {
    return this.numberFormatService.format(value, fractionDigits);
  }

  getItemTotalClass(item: DocumentItem | DocumentItemDraft): string {
    return this.numberFormatService.getTotalClass(this.getItemTotal(item));
  }

  getExpensesTotal(): number {
    return this.getTypeTotal(ItemType.EXP);
  }

  getIncomesTotal(): number {
    return this.getTypeTotal(ItemType.INC);
  }

  getDocumentTotalClass(): string {
    return this.numberFormatService.getTotalClass(this.getDocumentTotal());
  }

  formatDocumentTotal() {
    return this.numberFormatService.format(this.getDocumentTotal(), 2);
  }

  private getTypeTotal(type: ItemType): number {
    return this.documentItems()
      .filter(item => item.itemType === type)
      .reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  private getItemTotal(item: DocumentItem | DocumentItemDraft): number {
    return this.numberFormatService.calculateDocumentItemTotal(item.itemQuantity, item.itemPrice, item.itemType);
  }  

  private getDocumentTotal(): number {
    const total = this.documentItems().reduce((sum, item) => sum + this.getItemTotal(item), 0);
    return this.numberFormatService.roundHalfUp(total, 2);
  }

}