import { Component, DestroyRef, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";

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

  readonly highlightedIndex = signal(-1);
  readonly selectedCounterparty = signal<Counterparty | null>(null);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(pattern => {
      console.log("pattern: " + pattern);
      console.log("opened: " + this.opened());

      if(pattern.length < 3) {
        this.counterparties.set([]);
        this.opened.set(false);
        return;
      }

      this.loading.set(true);
      
      this.addressbookApi.searchCounterparties(pattern)
      .subscribe({
        next: (counterparties) => {
          this.counterparties.set(counterparties);
          this.opened.set(true);
          this.highlightedIndex.set(counterparties.length > 0 ? 0 : -1);
          this.loading.set(false);
        },
        error: (err) => {
          this.counterparties.set([]);
          this.opened.set(false);
          this.loading.set(false);
        },
      });
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
    console.log("opened: " + this.opened());
    console.log("highlightedIndex: " + this.highlightedIndex());
    if (!this.opened()) return;

    const counterparties = this.counterparties();
    switch ($event.key) {
      case 'ArrowDown':
        console.log('down');
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, counterparties.length - 1));
        break;
      case 'ArrowUp':
        console.log('up');
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.max(index - 1, 0));
        break;
      case 'Enter':
        console.log('enter');
        if (this.highlightedIndex() >= 0) {
          $event.preventDefault();
          this.selectCounterparty(counterparties[this.highlightedIndex()]);
        }
        break;
      case 'Escape':
        console.log('escape');
        this.opened.set(false);
        this.highlightedIndex.set(-1);
        break;
      case 'Tab':
        console.log('tab');
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