import {
  Calendar,
  Database,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  SquarePen,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavId =
  | 'dashboard'
  | 'customers'
  | 'documents'
  | 'builtinTemplates'
  | 'customTemplates'
  | 'calendar'
  | 'database'
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
  { id: 'builtinTemplates', label: 'Built-in Templates', icon: LayoutTemplate },
  { id: 'customTemplates', label: 'Custom Templates', icon: SquarePen },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
];
