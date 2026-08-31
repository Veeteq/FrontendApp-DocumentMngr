import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

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
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout().subscribe({
      error: err => console.error('Logout failed', err)
    });
  }
}
