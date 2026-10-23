import { Component, DestroyRef, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";

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

  readonly highlightedIndex = signal(-1);
  readonly selectedComment = signal<string | null>(null);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(pattern => {
      if(pattern.length < 3) {
        this.documentComments.set([]);
        this.opened.set(false);
        return;
      }

      this.loading.set(true);
      
      this.documentApi.searchDocuments("documentItemComment", pattern)
      .subscribe({
        next: (comments) => {
          this.documentComments.set(comments);
          this.opened.set(true);
          this.highlightedIndex.set(comments.length > 0 ? 0 : -1);
          this.loading.set(false);
        },
        error: (err) => {
          this.documentComments.set([]);
          this.opened.set(false);
          this.loading.set(false);
        },
      });
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