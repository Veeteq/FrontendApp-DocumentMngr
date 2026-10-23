import { Component, DestroyRef, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap } from "rxjs";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddressbookApiService } from "../../documents/service/addressbook-api.service";
import { Counterparty } from "../../documents/model/counterparty.model";

@Component({
  selector: 'app-counterparty-autocomplete',
  imports: [FormsModule],
  templateUrl: './counterparty-autocomplete.html',
  styleUrls: ['./counterparty-autocomplete.css']
})
export class CounterpartyAutocompleteComponent {
  private readonly addressbookApi = inject(AddressbookApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly disabled = input(false);

  readonly counterpartySelected = output<Counterparty>();

  readonly searchText = signal('');
  readonly counterparties = signal<Counterparty[]>([]);
  readonly loading = signal(false);
  readonly opened = signal(false);
  readonly error = signal<string | null>(null);

  readonly highlightedIndex = signal(-1);
  readonly selectedCounterparty = signal<Counterparty | null>(null);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(pattern => {
          console.log('pattern: ' + pattern);
          const trimmed = pattern.trim();

          this.error.set(null);

          if (trimmed.length < 3) {
            this.loading.set(false);
            return of([]);
          }

          this.loading.set(true);

          return this.addressbookApi.searchCounterparties(trimmed)
          .pipe(
            catchError(() => {
              this.error.set('Failed to load counterparties');
              return of([]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this.counterparties.set(items);
        this.highlightedIndex.set(items.length > 0 ? 0 : -1);
        const searchable = this.searchText().trim().length >= 3;
        this.opened.set(searchable);
        console.log('opened: ' + this.opened());
      });
  }

  onInput(value: string) {
    this.searchText.set(value);
    this.search$.next(value);
  }

  selectCounterparty(counterparty: Counterparty) {
    this.selectedCounterparty.set(counterparty);
    this.searchText.set(counterparty.displayName);
    this.counterparties.set([]);
    this.highlightedIndex.set(-1);
    this.opened.set(false);
    this.counterpartySelected.emit(counterparty);
  }

  onKeyDown($event: KeyboardEvent) {
    if (!this.opened()) return;

    const counterparties = this.counterparties();
    switch ($event.key) {
      case 'ArrowDown':
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, counterparties.length - 1));
        break;
      case 'ArrowUp':
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.max(index - 1, 0));
        break;
      case 'Enter':
        if (this.highlightedIndex() >= 0) {
          $event.preventDefault();
          this.selectCounterparty(counterparties[this.highlightedIndex()]);
        }
        break;
      case 'Escape':
        this.opened.set(false);
        this.highlightedIndex.set(-1);
        break;
      case 'Tab':
        if (this.opened() && this.highlightedIndex() >= 0) {
          this.selectCounterparty(counterparties[this.highlightedIndex()]);
        }
        break;
    }
  }

  hideDropdown() {
    setTimeout(() => this.opened.set(false), 200);
  }

  openAdvancedSearch() {
    console.log("Advanced Search clicked");
  }

  addCounterparty() {
    console.log("Add Counterparty clicked");
  }
  
}