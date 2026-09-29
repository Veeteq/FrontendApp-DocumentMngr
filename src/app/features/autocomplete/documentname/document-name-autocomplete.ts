import { Component, DestroyRef, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentApiService } from "../../documents/service/document-api.service";

@Component({
  selector: 'app-document-name-autocomplete',
  imports: [FormsModule],
  templateUrl: './document-name-autocomplete.html',
  styleUrls: ['./document-name-autocomplete.css']
})
export class DocumentNameAutocompleteComponent {
  private readonly documentApi = inject(DocumentApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly nameSelected = output<string>();
  readonly nameChanged = output<string>();

  readonly searchText = signal('');
  readonly documentNames = signal<string[]>([]);
  readonly loading = signal(false);
  readonly opened = signal(false);

  readonly highlightedIndex = signal(-1);
  readonly selectedName = signal<string | null>(null);

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
        this.documentNames.set([]);
        this.opened.set(false);
        return;
      }

      this.loading.set(true);
      
      this.documentApi.searchDocuments("documentName", pattern)
      .subscribe({
        next: (names) => {
          this.documentNames.set(names);
          this.opened.set(true);
          this.highlightedIndex.set(names.length > 0 ? 0 : -1);
          this.loading.set(false);
        },
        error: (err) => {
          this.documentNames.set([]);
          this.opened.set(false);
          this.loading.set(false);
        },
      });
    });
  }

  onInput(value: string) {
    this.searchText.set(value);
    this.nameChanged.emit(value);
    this.search$.next(value);
  }

  selectName(name: string) {
    this.selectedName.set(name);
    this.searchText.set(name);
    this.documentNames.set([]);
    this.highlightedIndex.set(-1);
    this.opened.set(false);
    this.nameSelected.emit(name);
    this.nameChanged.emit(name);
  }

  onKeyDown($event: KeyboardEvent) {
    console.log("opened: " + this.opened());
    console.log("highlightedIndex: " + this.highlightedIndex());
    if (!this.opened()) return;

    const names = this.documentNames();
    switch ($event.key) {
      case 'ArrowDown':
        console.log('down');
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, names.length - 1));
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
          this.selectName(names[this.highlightedIndex()]);
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
          this.selectName(names[this.highlightedIndex()]);
        }
        break;
    }
  }

  hideDropdown() {
    setTimeout(() => this.opened.set(false), 200);
  }
}