import {
  Calendar,
  Database,
  FileText,
  IdCard,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  RefreshCw,
  Settings,
  SquarePen,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavId =
  | 'dashboard'
  | 'customers'
  | 'documents'
  | 'nameBadges'
  | 'builtinTemplates'
  | 'customTemplates'
  | 'calendar'
  | 'database'
  | 'update'
  | 'settings'
  | 'support';

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
  { id: 'nameBadges', label: 'Name Badges', icon: IdCard },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'update', label: 'Update', icon: RefreshCw },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];
