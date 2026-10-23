import { Component, DestroyRef, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap } from "rxjs";
import { Item } from "../../documents/model/item.model";
import { ItemApiService } from "../../documents/service/item-api.service";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-item-autocomplete',
  imports: [FormsModule],
  templateUrl: './item-autocomplete.html',
  styleUrls: ['./item-autocomplete.css'],
})
export class ItemAutocompleteComponent {
  private readonly itemApi = inject(ItemApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input<Item | undefined>();
  readonly itemSelected = output<Item>();

  readonly searchText = signal('');
  readonly items = signal<Item[]>([]);
  readonly loading = signal(false);
  readonly opened = signal(false);
  readonly error = signal<string | null>(null);

  readonly highlightedIndex = signal(-1);
  readonly selectedItem = signal<Item | null>(null);

  private readonly search$ = new Subject<string>();

  constructor() {
    effect(() => {
      const item = this.value();
      if (!item) {
        this.searchText.set('');
        this.items.set([]);
        this.opened.set(false);
        this.selectedItem.set(null);
        this.highlightedIndex.set(-1);
        this.error.set(null);
      }
    });

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

          return this.itemApi.searchItems(trimmed)
          .pipe(
            catchError(() => {
              this.error.set('Failed to load items');
              return of([]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this.items.set(items);
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

  selectItem(item: Item) {
    this.selectedItem.set(item);
    this.searchText.set(item.itemName);
    this.items.set([]);
    this.highlightedIndex.set(-1);
    this.opened.set(false);
    this.itemSelected.emit(item);
  }

  onKeyDown($event: KeyboardEvent) {
    if (!this.opened()) return;

    const items = this.items();
    switch ($event.key) {
      case 'ArrowDown':
        $event.preventDefault();
        this.highlightedIndex.update((index) => Math.min(index + 1, items.length - 1));
        break;
      case 'ArrowUp':
        $event.preventDefault();
        this.highlightedIndex.update((index) => Math.max(index - 1, 0));
        break;
      case 'Enter':
        if (this.highlightedIndex() >= 0) {
          $event.preventDefault();
          this.selectItem(items[this.highlightedIndex()]);
        }
        break;
      case 'Escape':
        this.opened.set(false);
        this.highlightedIndex.set(-1);
        break;
      case 'Tab':
        if (this.opened() && this.highlightedIndex() >= 0) {
          this.selectItem(items[this.highlightedIndex()]);
        }
        break;
    }
  }

  hideDropdown() {
    setTimeout(() => this.opened.set(false), 200);
  }
}