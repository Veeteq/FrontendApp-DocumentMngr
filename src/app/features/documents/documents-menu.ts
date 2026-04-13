import { Component } from '@angular/core';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { DOCUMENTS_SIDEBAR } from './sidebar.config';

@Component({
  selector: 'app-documents-menu',
  imports: [
    RouterLink,
    RouterOutlet,
    RouterModule
],
  templateUrl: './documents-menu.html',
  styleUrl: './documents-menu.css',
})
export class DocumentsMenu {
  sidebar = DOCUMENTS_SIDEBAR;
}
