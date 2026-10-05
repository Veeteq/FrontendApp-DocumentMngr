import { inject, Injectable } from "@angular/core";
import { LocaleService } from "./locale.service";

@Injectable(
  { providedIn: 'root' }
)
export class NumberFormatService {
  private readonly localeService = inject(LocaleService);

  get locale(): string {
    return this.localeService.getLocale();
  }

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

  formatForEditing(value: number | null | undefined, fractionDigits: number = 2): string {
    if (value == null || !Number.isFinite(value)) return '';
    return new Intl.NumberFormat(this.locale, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: fractionDigits }).format(value);
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

  round(value: number, fractionDigits: number): number {
    const factor = Math.pow(10, fractionDigits);
    return Math.round(value * factor) / factor;
  }
}
