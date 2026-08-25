import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  { path: 'home', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
  { path: 'login', loadComponent: () => import('./features/login/login').then((m) => m.Login) },
  { path: 'documents', loadChildren: () => import('./features/documents/documents.routes').then((m) => m.documentsRoutes), canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' }
];

