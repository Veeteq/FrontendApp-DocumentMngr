import { Component } from '@angular/core';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-documents',
  imports: [
    RouterLink,
    RouterOutlet,
    RouterModule
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css',
})
export class Documents {}
