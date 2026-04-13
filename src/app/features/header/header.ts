import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  auth = inject(AuthStore);
}
