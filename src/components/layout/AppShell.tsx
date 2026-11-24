import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useHotkey } from '../../hooks/useHotkey';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** Fixed sidebar (≥1280px, drawer below) + blurred top bar + scrolling content canvas. */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const focusSearch = useCallback(() => {
    setNavOpen(false);
    const input = searchRef.current;
    // Top-bar search is hidden on small screens — fall back to the patient registry search.
    if (input && input.offsetParent !== null) input.focus();
    else navigate('/patients?focus=1');
  }, [navigate]);

  useHotkey('k', focusSearch);

  return (
    <div className="min-h-screen bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-surface-container-lowest focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} onSearch={focusSearch} />
      <Topbar ref={searchRef} onMenu={() => setNavOpen(true)} />
      <main id="main" className="min-h-screen w-full pt-16 xl:pl-64">
        <Outlet />
      </main>
    </div>
  );
}
