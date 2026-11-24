import { Fragment, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, ExternalLink, HelpCircle, LogOut, Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/Button';
import { CURRENT_USER, NAV_GROUPS } from './navigation';
import { LogoutModal } from './LogoutModal';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}

export function Logo() {
  return (
    <div className="flex items-center gap-space-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary shadow-sm">
        <Activity size={18} strokeWidth={2.5} aria-hidden />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-headline-sm font-bold tracking-tight text-on-surface">MediCare 360</span>
        <span className="text-caption font-medium text-on-surface-variant">Enterprise Health</span>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose, onSearch }: SidebarProps) {
  const { pathname } = useLocation();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const onDoctorProfile = /^\/doctors\/.+/.test(pathname);
  return (
    <>
      {/* Tablet / mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn('fixed inset-0 z-40 bg-[#181c22]/40 backdrop-blur-sm transition-opacity xl:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />
      <aside
        aria-label="Primary"
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 select-none flex-col justify-between bg-surface-container-lowest shadow-shell transition-transform duration-200 xl:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex min-h-0 flex-col">
          <div className="flex h-16 items-center justify-between px-space-lg">
            <Logo />
            <IconButton icon={X} label="Close navigation" className="xl:hidden" onClick={onClose} />
          </div>

          <div className="px-space-md py-space-xs">
            <button
              type="button"
              onClick={onSearch}
              className="flex w-full items-center justify-between rounded-lg bg-surface-container-low px-space-md py-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="flex items-center gap-space-sm">
                <Search size={17} aria-hidden />
                <span className="text-body-sm">Search records...</span>
              </span>
              <kbd className="rounded bg-surface-container-lowest px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant shadow-[0_1px_2px_rgba(0,0,0,0.04)]">⌘K</kbd>
            </button>
          </div>

          <div className="no-scrollbar overflow-y-auto">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label} className={cn('px-space-md', gi === 0 ? 'pt-space-sm' : 'pt-space-md')}>
                <span className="mb-space-xs block px-space-sm text-caption font-semibold uppercase tracking-wider text-on-surface-variant">{group.label}</span>
                <nav className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const parentOfSubpage = item.path === '/doctors' && onDoctorProfile;
                    return (
                      <Fragment key={item.path}>
                        <NavLink
                          to={item.path}
                          end={item.path === '/'}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-space-sm rounded-lg px-space-sm py-2 transition-colors',
                              parentOfSubpage
                                ? 'font-semibold text-on-surface hover:bg-surface-container'
                                : isActive
                                  ? 'bg-primary-container font-semibold text-on-primary-container shadow-sm'
                                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                            )
                          }
                        >
                          <item.icon size={19} aria-hidden />
                          <span className="text-body-md font-medium">{item.label}</span>
                        </NavLink>
                        {/* Stitch Doctor Profile: nested sub-item under Doctors */}
                        {parentOfSubpage && (
                          <span aria-current="page" className="ml-space-lg rounded-lg bg-primary-container px-space-sm py-1.5 text-body-sm font-semibold text-on-primary-container shadow-sm">
                            Doctor Profile
                          </span>
                        )}
                      </Fragment>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-space-sm p-space-md">
          <NavLink
            to="/help"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between rounded-lg px-space-sm py-2 transition-colors',
                isActive ? 'bg-primary-container font-semibold text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
              )
            }
          >
            <span className="flex items-center gap-space-sm">
              <HelpCircle size={19} aria-hidden />
              <span className="text-body-sm font-medium">Help &amp; Support</span>
            </span>
            <ExternalLink size={15} aria-hidden />
          </NavLink>
          <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm">
            <div className="flex min-w-0 items-center gap-space-sm">
              <Avatar name={CURRENT_USER.name} size="sm" status="primary" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-body-sm font-semibold text-on-surface">{CURRENT_USER.shortName}</span>
                <span className="truncate text-caption text-on-surface-variant">{CURRENT_USER.sidebarRole}</span>
              </div>
            </div>
            <IconButton icon={LogOut} label="Sign out" onClick={() => setLogoutOpen(true)} className="hover:text-error" />
          </div>
        </div>
      </aside>
      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
