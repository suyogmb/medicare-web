import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, CircleCheck, Loader2, LogIn, LogOut, Power, Save, X } from 'lucide-react';
import { initials } from '../../lib/format';
import { getStaffDoctor } from '../../data/staff';
import { useToast } from '../ui/Toast';
import { CURRENT_USER } from './navigation';

type Phase = 'confirm' | 'signing-out' | 'done';
const REDIRECT_SECONDS = 4;

/** Stitch "Logout Confirmation Modal" — confirm → signing out → signed out (auto-redirect to sign in). */
export function LogoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const notify = useToast();
  const [phase, setPhase] = useState<Phase>('confirm');
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const email = getStaffDoctor('DR-1001')?.email ?? '';

  useEffect(() => {
    if (!open) return;
    setPhase('confirm');
    setSeconds(REDIRECT_SECONDS);
    cancelRef.current?.focus();
  }, [open]);

  const dismiss = () => {
    if (phase !== 'confirm') return;
    onClose();
    notify('Sign out cancelled', 'info');
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });

  // Signing out → done after a short delay; then count down to the sign-in screen.
  useEffect(() => {
    if (phase === 'signing-out') {
      const t = window.setTimeout(() => setPhase('done'), 1200);
      return () => window.clearTimeout(t);
    }
    if (phase === 'done') {
      if (seconds <= 0) {
        onClose();
        navigate('/login');
        return;
      }
      const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
      return () => window.clearTimeout(t);
    }
  }, [phase, seconds, navigate, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-md" onMouseDown={(e) => e.target === e.currentTarget && dismiss()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-desc" className="relative w-full max-w-[440px] rounded-2xl bg-surface-container-lowest p-6 shadow-2xl sm:p-7">
        {phase !== 'done' && (
          <button
            type="button"
            onClick={dismiss}
            disabled={phase === 'signing-out'}
            aria-label="Close dialog"
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
          >
            <X size={20} />
          </button>
        )}

        {phase !== 'done' ? (
          <div className="flex flex-col">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-container/40 text-error">
              <LogOut size={24} aria-hidden />
            </span>
            <h2 id="logout-title" className="text-headline-lg tracking-tight text-on-surface">
              Sign Out?
            </h2>
            <p id="logout-desc" className="mt-1.5 text-body-md leading-relaxed text-on-surface-variant">
              Are you sure you want to sign out of MediCare 360?
            </p>
            <p className="mt-1 text-body-sm text-outline">You&apos;ll need to sign in again to access patient charts.</p>

            <div className="my-5 flex items-center gap-3.5 rounded-xl bg-surface-container-low p-3.5">
              <span className="relative shrink-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-container text-sm font-semibold text-on-primary shadow-sm ring-2 ring-surface-container-lowest">
                  {initials(CURRENT_USER.name)}
                </span>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-surface-container-lowest" title="Signed in" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-headline-sm font-semibold text-on-surface">{CURRENT_USER.name}</span>
                  <BadgeCheck size={15} className="shrink-0 text-primary" aria-label="Verified staff" />
                </span>
                <span className="mt-0.5 self-start rounded-full bg-primary-fixed/50 px-2 py-0.5 font-mono text-data-code-label font-medium text-primary">{CURRENT_USER.sidebarRole}</span>
                <span className="mt-0.5 truncate font-mono text-[11px] text-on-surface-variant">{email}</span>
              </span>
            </div>

            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-surface-container p-2.5">
              <Save size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <span className="text-caption text-on-surface-variant">Unsaved drafts and orders are kept and will be waiting when you sign back in.</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                ref={cancelRef}
                type="button"
                onClick={dismiss}
                disabled={phase === 'signing-out'}
                className="flex-1 rounded-xl bg-surface-container px-4 py-2.5 text-center text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setPhase('signing-out')}
                disabled={phase === 'signing-out'}
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 text-body-sm font-semibold text-on-error shadow-sm transition-all hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {phase === 'signing-out' ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Power size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />}
                {phase === 'signing-out' ? 'Signing Out...' : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        ) : (
          <div role="status" className="flex flex-col items-center py-2 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-container text-success">
              <CircleCheck size={32} aria-hidden />
            </span>
            <h2 id="logout-title" className="text-headline-lg tracking-tight text-on-surface">
              Signed Out Successfully
            </h2>
            <p id="logout-desc" className="mt-2 max-w-xs text-body-md leading-relaxed text-on-surface-variant">
              You&apos;ve been signed out. Taking you to the sign-in page.
            </p>
            <button
              type="button"
              onClick={() => setSeconds(0)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-body-sm font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container"
            >
              <LogIn size={18} aria-hidden />
              Back to Sign In ({seconds}s)
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
