import { Component, inject, input, OnInit, output } from "@angular/core";
import { DocumentItemDraft } from "../../model/document-item-draft.model";
import { ItemType } from "../../model/item-type.model";
import { FormsModule } from "@angular/forms";
import { ItemAutocompleteComponent } from "../../../autocomplete/item/item-autocomplete";
import { NumberInputComponent } from "../../../common/numberinput/number-input";
import { ItemCommentAutocompleteComponent } from "../../../autocomplete/itemcomment/item-comment-autocomplete";
import { NumberFormatService } from "../../../../core/locale/number-format.service";

@Component({
  selector: 'app-document-item-editor',
  imports: [
    FormsModule,
    ItemAutocompleteComponent,
    ItemCommentAutocompleteComponent,
    NumberInputComponent
  ],
  templateUrl: './document-item-editor.html',
  styleUrls: ['./document-item-editor.css'],
})
export class DocumentItemEditor {
  private readonly numberFormatService = inject(NumberFormatService);

  readonly item = input.required<DocumentItemDraft>();
  readonly itemTypes = input.required<ItemType[]>();
  readonly validationErrors = input<string[]>([]);

  readonly itemChange = output<Partial<DocumentItemDraft>>();

  get total(): number {
    const item = this.item();
    return this.numberFormatService.calculateDocumentItemTotal(item.itemQuantity, item.itemPrice, item.itemType);
  }

  get formattedTotal(): string {
    return this.numberFormatService.format(this.total, 2);
  }

  get totalClass(): string {
    return this.numberFormatService.getTotalClass(this.total);
  }
}