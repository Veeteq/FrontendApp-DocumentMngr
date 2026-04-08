import { Routes } from '@angular/router';
import { DocumentsMenu } from './documents-menu';

export const documentsRoutes: Routes = [
  {
    path: '', component: DocumentsMenu,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'details/:id', loadComponent: () => import('../documents/list/list').then(m => m.List) },
      { path: 'upload', loadComponent: () => import('../documents/list/list').then(m => m.List) },
      { path: 'new', loadComponent: () => import('../documents/list/list').then(m => m.List) },
      { path: 'list', loadComponent: () => import('../documents/list/list').then(m => m.List) }
    ]
  }
];