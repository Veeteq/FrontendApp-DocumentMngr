import { Injectable, signal } from "@angular/core";

@Injectable(
  { providedIn: 'root' }
)
export class LocaleService {
  private readonly locale = signal('pl-PL');

  getLocale(): string {
    return this.locale();
  }

  setLocale(locale: string) {
    this.locale.set(locale);
  }
}