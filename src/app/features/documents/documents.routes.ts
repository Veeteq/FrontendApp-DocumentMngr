import { Routes } from '@angular/router';
import { DocumentsMenu } from './documents-menu';

export const documentsRoutes: Routes = [
  {
    path: '', component: DocumentsMenu,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'details/:id', loadComponent: () => import('../documents/list/list').then(m => m.List) },
      { path: 'poc',         loadComponent: () => import('../documents/poc/poc').then(m => m.Poc) },
      { path: 'new',         loadComponent: () => import('./create/document-create').then(m => m.DocumentCreate) },
      { path: 'list',        loadComponent: () => import('../documents/list/list').then(m => m.List) }
    ]
  }
];