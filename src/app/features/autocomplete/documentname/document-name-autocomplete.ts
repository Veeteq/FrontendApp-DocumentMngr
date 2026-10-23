import { Component, DestroyRef, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap } from "rxjs";

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
  readonly error = signal<string | null>(null);

  readonly highlightedIndex = signal(-1);
  readonly selectedName = signal<string | null>(null);

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

          return this.documentApi.searchDocuments("documentName", trimmed)
          .pipe(
            catchError(() => {
              this.error.set('Failed to load document names');
              return of([]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this.documentNames.set(items);
        this.highlightedIndex.set(items.length > 0 ? 0 : -1);
        const searchable = this.searchText().trim().length >= 3;
        this.opened.set(searchable);
        console.log('opened: ' + this.opened());
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
    if (!this.opened()) return;

    const names = this.documentNames();
    switch ($event.key) {
      case 'ArrowDown':
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, names.length - 1));
        break;
      case 'ArrowUp':
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.max(index - 1, 0));
        break;
      case 'Enter':
        if (this.highlightedIndex() >= 0) {
          $event.preventDefault();
          this.selectName(names[this.highlightedIndex()]);
        }
        break;
      case 'Escape':
        this.opened.set(false);
        this.highlightedIndex.set(-1);
        break;
      case 'Tab':
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