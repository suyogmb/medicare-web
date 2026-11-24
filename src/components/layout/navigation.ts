import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Breadcrumb label shown in the top bar. */
  crumb: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main Clinical',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard, crumb: 'Clinical Workbench' },
      { label: 'Patients', path: '/patients', icon: UserRound, crumb: 'Patient Registry' },
      { label: 'Appointments', path: '/appointments', icon: CalendarDays, crumb: 'Scheduling Grid' },
      { label: 'Doctors', path: '/doctors', icon: Stethoscope, crumb: 'Clinical Staff' },
      { label: 'Records', path: '/records', icon: FolderOpen, crumb: 'EHR Repository' },
      { label: 'Prescriptions', path: '/prescriptions', icon: ClipboardList, crumb: 'Prescriptions' },
    ],
  },
  {
    label: 'Intelligence & Ops',
    items: [
      { label: 'Analytics', path: '/analytics', icon: BarChart3, crumb: 'Analytics' },
      { label: 'Settings', path: '/settings', icon: Settings, crumb: 'Settings' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** Routes reachable outside the main nav groups. */
const EXTRA_CRUMBS: { path: string; crumb: string }[] = [
  { path: '/help', crumb: 'Help & Support' },
];

export function crumbFor(pathname: string): string {
  if (/^\/doctors\/.+/.test(pathname)) return 'Doctor Profile';
  if (/^\/patients\/.+/.test(pathname)) return 'Patient Chart';
  const extra = EXTRA_CRUMBS.find((c) => pathname.startsWith(c.path));
  if (extra) return extra.crumb;
  const match = [...ALL_NAV_ITEMS].sort((a, b) => b.path.length - a.path.length).find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );
  return match?.crumb ?? 'Clinical Workbench';
}

export const CURRENT_USER = {
  name: 'Dr. Sarah Jenkins',
  shortName: 'Dr. S. Jenkins',
  role: 'Lead Physician',
  sidebarRole: 'Chief Physician',
};
