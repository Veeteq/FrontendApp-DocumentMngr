import { inject, Injectable } from "@angular/core";
import { LocaleService } from "./locale.service";

@Injectable(
  { providedIn: 'root' }
)
export class NumberFormatService {
  private readonly localeService = inject(LocaleService);

  parse(value: string): number | null {
    if (!value.trim()) return null;
    const normalized = value.trim()
    .replace(/\s/g, '')
    .replace(',', '.');
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  format(value: number | null | undefined, fractionDigits: number = 2): string {
    if (value == null) return '';
    const locale = this.localeService.getLocale();
    return value.toLocaleString(locale, { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits });
  }

  formatQuantity(value: number | null | undefined): string {
    return this.format(value, 3);
  }

  formatPrice(value: number | null | undefined): string {
    return this.format(value, 2);
  }

  formatExchangeRate(value: number | null | undefined): string {
    return this.format(value, 6);
  }
}
