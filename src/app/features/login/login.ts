import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  username: string = 'jmclane';
  password: string = '';

  submit() {
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.username, this.password)
    .pipe(
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.error.set('Invalid credentials');
      }
    });
  }

  error = signal<string | null>(null);
  loading = signal(false);
}

