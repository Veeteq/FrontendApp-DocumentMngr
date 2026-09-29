import { Component, DestroyRef, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { Account } from "../../documents/model/account.model";
import { AccountApiService } from "../../documents/service/account-api.service";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-account-autocomplete',
  imports: [FormsModule],
  templateUrl: './account-autocomplete.html',
  styleUrls: ['./account-autocomplete.css']
})
export class AccountAutocompleteComponent {
  private readonly accountApi = inject(AccountApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly accountSelected = output<Account>();

  readonly searchText = signal('');
  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(false);
  readonly opened = signal(false);

  readonly highlightedIndex = signal(-1);
  readonly selectedAccount = signal<Account | null>(null);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(pattern => {
      console.log("pattern: " + pattern);
      console.log("opened: " + this.opened());

      if(pattern.length < 2) {
        this.accounts.set([]);
        this.opened.set(false);
        return;
      }

      this.loading.set(true);
      
      this.accountApi.searchAccounts(pattern)
      .subscribe({
        next: (accounts) => {
          this.accounts.set(accounts);
          this.opened.set(true);
          this.highlightedIndex.set(accounts.length > 0 ? 0 : -1);
          this.loading.set(false);
        },
        error: (err) => {
          this.accounts.set([]);
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

  selectAccount(account: Account) {
    this.selectedAccount.set(account);
    this.searchText.set(account.accountName);
    this.accounts.set([]);
    this.highlightedIndex.set(-1);
    this.opened.set(false);
    this.accountSelected.emit(account);
  }

  onKeyDown($event: KeyboardEvent) {
    console.log("opened: " + this.opened());
    console.log("highlightedIndex: " + this.highlightedIndex());
    if (!this.opened()) return;

    const accounts = this.accounts();
    switch ($event.key) {
      case 'ArrowDown':
        console.log('down');
        $event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, accounts.length - 1));
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
          this.selectAccount(accounts[this.highlightedIndex()]);
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
          this.selectAccount(accounts[this.highlightedIndex()]);
        }
        break;
    }
  }

  hideDropdown() {
    setTimeout(() => this.opened.set(false), 200);
  }
}