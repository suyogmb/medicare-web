import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Headset, Hospital } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Brand lock-up used on the unauthenticated Stitch screens (Login, Forgot/Reset Password, 404, 500). */
export function PublicBrand({ inverted, tagline }: { inverted?: boolean; tagline?: string }) {
  return (
    <Link to="/login" className="flex items-center gap-3">
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg shadow-sm', inverted ? 'bg-primary-container text-on-primary ring-1 ring-white/20' : 'bg-primary text-on-primary')}>
        <Hospital size={20} aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="flex items-baseline gap-2">
          <span className={cn('text-headline-md font-bold tracking-tight', inverted ? 'text-white' : 'text-on-surface')}>
            MediCare<span className={cn('font-normal', inverted ? 'text-primary-fixed-dim' : 'text-primary')}>360</span>
          </span>
        </span>
        {tagline && <span className={cn('font-mono text-caption tracking-wider', inverted ? 'text-slate-400' : 'text-secondary')}>{tagline}</span>}
      </span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="z-20 flex w-full flex-wrap items-center justify-between gap-4 bg-surface-container-lowest px-space-lg py-4 shadow-sm sm:px-6">
      <PublicBrand />
      <div className="flex items-center gap-4 text-body-sm">
        <a href="tel:+18005552273" className="inline-flex items-center gap-1 font-medium text-primary hover:text-on-primary-fixed-variant">
          <Headset size={16} aria-hidden /> Emergency Helpdesk
        </a>
      </div>
    </header>
  );
}

export function PublicFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('z-20 flex w-full flex-col items-center justify-between gap-4 bg-surface-container-lowest px-6 py-4 text-caption text-secondary shadow-sm md:flex-row', className)}>
      <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-4">
        <a className="hover:text-on-surface" href="#privacy">
          Privacy Policy
        </a>
        <span>·</span>
        <a className="hover:text-on-surface" href="#terms">
          Terms of Service
        </a>
        <span>·</span>
        <a className="hover:text-on-surface" href="#hipaa">
          HIPAA Attestation (§164.312)
        </a>
      </nav>
      <span className="text-center font-mono text-data-code-label text-on-surface-variant md:text-right">© 2026 MediCare 360 Health Systems, Inc. Authorized Medical Personnel Only.</span>
    </footer>
  );
}

/** Header + centered canvas + footer shell for 404 / error / password recovery screens. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PublicHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
