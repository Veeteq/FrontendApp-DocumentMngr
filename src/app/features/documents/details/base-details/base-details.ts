import { Component, inject, input, OnInit } from "@angular/core";
import { NumberFormatService } from "../../../../core/locale/number-format.service";
import { Document } from "../../model/document.model";

@Component({
  selector: 'app-base-details',
  templateUrl: 'base-details.html',
  styleUrl: 'base-details.css',
})
export class BaseDetails implements OnInit {
  private readonly numberFormatService = inject(NumberFormatService);

  readonly document = input.required<Document>();

  ngOnInit(): void {}

  formatAmount(value: number | null | undefined, fractionDigits = 2): string {
    return this.numberFormatService.format(value ?? 0, fractionDigits);
  }

  getItemTotal(quantity: number | null | undefined, price: number | null | undefined): string {
    return this.formatAmount((quantity ?? 0) * (price ?? 0), 2);
  }
}