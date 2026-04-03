import { Component } from '@angular/core';
import { authStore } from '../../core/auth/auth.store';
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
  auth = authStore;
}
