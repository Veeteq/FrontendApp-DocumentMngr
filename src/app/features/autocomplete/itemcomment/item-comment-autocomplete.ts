import { Component, DestroyRef, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap } from "rxjs";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentApiService } from "../../documents/service/document-api.service";

@Component({
  selector: 'app-item-comment-autocomplete',
  imports: [FormsModule],
  templateUrl: './item-comment-autocomplete.html',
  styleUrls: ['./item-comment-autocomplete.css']
})
export class ItemCommentAutocompleteComponent {
  private readonly documentApi = inject(DocumentApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly commentSelected = output<string>();
  readonly commentChanged = output<string>();

  readonly searchText = signal('');
  readonly documentComments = signal<string[]>([]);
  readonly loading = signal(false);
  readonly opened = signal(false);
  readonly error = signal<string | null>(null);

  readonly highlightedIndex = signal(-1);
  readonly selectedComment = signal<string | null>(null);

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

          return this.documentApi.searchDocuments("documentItemComment", trimmed)
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
        this.documentComments.set(items);
        this.highlightedIndex.set(items.length > 0 ? 0 : -1);
        const searchable = this.searchText().trim().length >= 3;
        this.opened.set(searchable);
        console.log('opened: ' + this.opened());
      });
  }

  onInput(comment: string) {
    this.searchText.set(comment);
    this.commentChanged.emit(comment);
    this.search$.next(comment);
  }

  selectComment(comment: string) {
    this.selectedComment.set(comment);
    this.searchText.set(comment);
    this.documentComments.set([]);
    this.highlightedIndex.set(-1);
    this.opened.set(false);
    this.commentSelected.emit(comment);
    this.commentChanged.emit(comment);
  }

  onKeyDown($event: KeyboardEvent) {
    if (!this.opened()) return;

    const comments = this.documentComments();
    switch ($event.key) {
      case 'ArrowDown':
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, comments.length - 1));
        break;
      case 'ArrowUp':
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.max(index - 1, 0));
        break;
      case 'Enter':
        if (this.highlightedIndex() >= 0) {
          $event.preventDefault();
          this.selectComment(comments[this.highlightedIndex()]);
        }
        break;
      case 'Escape':
        this.opened.set(false);
        this.highlightedIndex.set(-1);
        break;
      case 'Tab':
        if (this.opened() && this.highlightedIndex() >= 0) {
          this.selectComment(comments[this.highlightedIndex()]);
        }
        break;
    }
  }

  hideDropdown() {
    setTimeout(() => this.opened.set(false), 200);
  }
}