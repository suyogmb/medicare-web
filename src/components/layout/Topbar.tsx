import { forwardRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, Menu, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/Button';
import { CURRENT_USER, crumbFor } from './navigation';
import { NotificationsBell } from './NotificationsPanel';

interface TopbarProps {
  onMenu: () => void;
}

export const Topbar = forwardRef<HTMLInputElement, TopbarProps>(function Topbar({ onMenu }, searchRef) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = () => {
    const q = query.trim();
    navigate(q ? `/patients?q=${encodeURIComponent(q)}` : '/patients');
    setQuery('');
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between gap-space-sm bg-surface-container-lowest/90 px-space-lg shadow-shell backdrop-blur-xl sm:px-space-xl xl:left-64">
      <div className="flex min-w-0 items-center gap-space-md">
        <IconButton icon={Menu} label="Open navigation" size={20} className="xl:hidden" onClick={onMenu} />
        <div className="flex min-w-0 items-center gap-space-xs text-caption">
          <span className="hidden text-on-surface-variant sm:inline">MediCare 360</span>
          <span className="hidden text-on-surface-variant sm:inline">/</span>
          <span className="truncate font-semibold text-on-surface">{crumbFor(pathname)}</span>
        </div>
      </div>

      <div className="flex items-center gap-space-xs sm:gap-space-md">
        <form
          role="search"
          className="relative hidden w-64 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search EHR, MRN, staff"
            placeholder="Search EHR, MRN, staff..."
            className="w-full rounded-lg bg-surface-container-low py-1.5 pl-9 pr-12 text-body-sm text-on-surface transition-all placeholder:text-on-surface-variant/70 hover:bg-surface-container focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-surface-container-highest px-1 font-mono text-data-code-label text-on-surface-variant">⌘K</kbd>
        </form>
        <IconButton icon={Search} label="Search" size={20} className="md:hidden" onClick={() => navigate('/patients?focus=1')} />
        <NotificationsBell />
        <IconButton icon={HelpCircle} label="Help & Support" size={20} className="hidden p-2 sm:inline-flex" onClick={() => navigate('/help')} />
        <div className="flex items-center gap-space-sm border-l border-surface-variant pl-space-sm">
          <button type="button" onClick={() => navigate('/settings')} className="flex items-center gap-space-sm rounded-lg text-left" aria-label="Open profile settings">
            <Avatar name={CURRENT_USER.name} size="sm" />
            <span className="hidden flex-col lg:flex">
              <span className="text-body-sm font-semibold leading-tight text-on-surface">{CURRENT_USER.name}</span>
              <span className="text-caption leading-tight text-on-surface-variant">{CURRENT_USER.role}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
});
