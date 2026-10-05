import { Component, DestroyRef, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { Item } from "../../documents/model/item.model";
import { ItemApiService } from "../../documents/service/item-api.service";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-item-autocomplete',
  imports: [FormsModule],
  templateUrl: './item-autocomplete.html',
  styleUrls: ['./item-autocomplete.css']
})
export class ItemAutocompleteComponent {
  private readonly itemApi = inject(ItemApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly itemSelected = output<Item>();

  readonly searchText = signal('');
  readonly items = signal<Item[]>([]);
  readonly loading = signal(false);
  readonly opened = signal(false);

  readonly highlightedIndex = signal(-1);
  readonly selectedItem = signal<Item | null>(null);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
        debounceTime(300), 
        distinctUntilChanged(), 
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(pattern => {
        console.log("pattern: " + pattern);
        console.log("opened: " + this.opened());

        const trimmed = pattern.trim();
        
        if (trimmed.length < 3) {
          this.items.set([]);
          this.opened.set(false);
          return;
        }

        this.loading.set(true);

        this.itemApi.searchItems(trimmed)
        .subscribe({
          next: (items) => {
            this.items.set(items);
            this.opened.set(true);
            this.highlightedIndex.set(items.length > 0 ? 0 : -1);
            this.loading.set(false);
          },
          error: (err) => {
            this.items.set([]);
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

  selectItem(item: Item) {
    this.selectedItem.set(item);
    this.searchText.set(item.itemName);
    this.items.set([]);
    this.highlightedIndex.set(-1);
    this.opened.set(false);
    this.itemSelected.emit(item);
  }

  onKeyDown($event: KeyboardEvent) {
    console.log("opened: " + this.opened());
    console.log("highlightedIndex: " + this.highlightedIndex());
    if (!this.opened()) return;

    const items = this.items();
    switch ($event.key) {
      case 'ArrowDown':
        console.log('down');
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, items.length - 1));
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
          this.selectItem(items[this.highlightedIndex()]);
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
          this.selectItem(items[this.highlightedIndex()]);
        }
        break;
    }
  }

  hideDropdown() {
    setTimeout(() => this.opened.set(false), 200);
  }
}