import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  auth = inject(AuthStore);
}
