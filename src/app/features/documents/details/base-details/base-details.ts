import { Component, inject, input } from "@angular/core";
import { NumberFormatService } from "../../../../core/locale/number-format.service";
import { DocumentItemList } from "../../common/document-item-list/document-item-list";
import { Document } from "../../model/document.model";

@Component({
  selector: 'app-base-details',
  templateUrl: 'base-details.html',
  styleUrl: 'base-details.css',
  imports: [
    DocumentItemList
  ]
})
export class BaseDetails {
  private readonly numberFormatService = inject(NumberFormatService);

  readonly document = input.required<Document>();

  formatAmount(value: number | null | undefined, fractionDigits = 2): string {
    return this.numberFormatService.format(value ?? 0, fractionDigits);
  }

}