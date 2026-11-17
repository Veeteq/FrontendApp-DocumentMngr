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
    label: 'Simple document',
    icon: '📝',
    route: 'simple'
  },
  {
    label: 'Standard document',
    icon: '📝',
    route: 'standard'
  },
  {
    label: 'New Document',
    icon: '⬆️',
    route: 'poc'
  },
  {
    label: 'Money Transfer',
    icon: '⬆️',
    route: 'transfer'
  }
];