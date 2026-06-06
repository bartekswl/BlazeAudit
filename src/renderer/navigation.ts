import {
  Calendar,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavId =
  | 'dashboard'
  | 'customers'
  | 'documents'
  | 'templates'
  | 'calendar'
  | 'settings';

export interface NavItem {
  id: NavId;
  label: string;
  icon: LucideIcon;
}

// Single source of truth for sidebar navigation. Add/remove/reorder here —
// see UX.md §4. "Documents" is the single home for all inspections.
export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];
