import { Route } from '@angular/router';

export interface SidebarItem {
  label: string;
  icon: string;
  route: Route['path'];
  exact?: boolean;
}

export const DOCUMENTS_SIDEBAR: SidebarItem[] = [
  {
    label: 'All Documents',
    icon: '📄',
    route: 'list',
    exact: true
  },
  {
    label: 'New Document',
      icon: '📝',
    route: 'new'
  },
  {
    label: 'Upload Document',
    icon: '⬆️',
    route: 'upload'
  }
];