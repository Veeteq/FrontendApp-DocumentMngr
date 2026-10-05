import { Component, effect, inject, input, model, signal } from "@angular/core";
import { NumberFormatService } from "../../../core/locale/number-format.service";

@Component({
  selector: 'app-number-input',
  standalone: true,
  templateUrl: './number-input.html',
  styleUrl: './number-input.css',
})
export class NumberInputComponent {
  private readonly numberFormatService = inject(NumberFormatService);

  readonly value = model<number | null>(null);
  readonly fractionDigits = input(2);
  readonly minimum = input<number | null>(null);
  readonly maximum = input<number | null>(null);
  readonly disabled = input(false);

  readonly readOnly = input(false, { alias: 'readonly' });

  readonly required = input(false);
  readonly placeholder = input('');
  readonly inputId = input<string | undefined>(undefined);
  readonly inputName = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  
  readonly invalid = signal(false);
  readonly focused = signal(false);
  readonly displayValue = signal('');

  constructor() {
    effect(() => {
      const value = this.value();
      const fractionDigits = this.fractionDigits();

      if (this.focused()) {
        this.displayValue.set(this.numberFormatService.formatForEditing(value, fractionDigits));
      } else {
        this.displayValue.set(this.numberFormatService.format(value, fractionDigits));
      }
    });
  }

  onFocus(): void {
    this.focused.set(true);
    this.invalid.set(false);
    this.displayValue.set(this.numberFormatService.formatForEditing(this.value(), this.fractionDigits()));
  }

  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const text = inputElement.value;

    this.displayValue.set(text);

    if (!text.trim()) {
      this.invalid.set(this.required());
      this.value.set(null);
      return;
    }
    const parsed = this.numberFormatService.parse(text);

    if (parsed == null) {
      this.invalid.set(true);
      return;
    }

    if (!this.isWithinRange(parsed)) {
      this.invalid.set(true);
      return;
    }

    this.invalid.set(false);
    this.value.set(this.numberFormatService.round(parsed, this.fractionDigits()));
  }

  onBlur(): void {
    this.focused.set(false);

    const parsed = this.numberFormatService.parse(this.displayValue());

    if (parsed == null) {
      if (!this.displayValue().trim()) {
        this.invalid.set(this.required());
        this.value.set(null);
      } else {
        this.invalid.set(true);
      }
      return;
    }

    if (!this.isWithinRange(parsed)) {
      this.invalid.set(true);
      return;
    }

    const rounded = this.numberFormatService.round(parsed, this.fractionDigits());

    this.invalid.set(false);
    this.value.set(rounded);
    this.displayValue.set(this.numberFormatService.format(rounded, this.fractionDigits()));
  }

  private isWithinRange(value: number): boolean {
    const minimum = this.minimum();
    const maximum = this.maximum();

    if (minimum != null && value < minimum) return false;
    if (maximum != null && value > maximum) return false;

    return true;
  }
}