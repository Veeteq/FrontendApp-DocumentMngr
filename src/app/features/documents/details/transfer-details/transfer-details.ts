import { Component, inject, input, OnInit } from "@angular/core";
import { NumberFormatService } from "../../../../core/locale/number-format.service";
import { Document } from "../../model/document.model";

@Component({
  selector: 'app-transfer-details',
  templateUrl: 'transfer-details.html',
  styleUrl: 'transfer-details.css',
})
export class TransferDetails implements OnInit {
  private readonly numberFormatService = inject(NumberFormatService);

  readonly document = input.required<Document>();

  ngOnInit(): void {}

  formatAmount(value: number | null | undefined, fractionDigits = 2): string {
    return this.numberFormatService.format(value ?? 0, fractionDigits);
  }
}