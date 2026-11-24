import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FolderHeart, Headset, LayoutDashboard, SearchX, Siren } from 'lucide-react';
import { PublicShell } from '../../components/layout/PublicLayout';

const SHORTCUTS = [
  { to: '/records', label: 'Patient Records', icon: FolderHeart },
  { to: '/appointments', label: 'Appointments Schedule', icon: CalendarDays },
  { to: '/patients?status=Critical', label: 'Triage Queue', icon: Siren },
  { to: '/help', label: 'Clinical IT Helpdesk', icon: Headset },
];

/** Stitch "404 Not Found". */
export function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <PublicShell>
      <div className="flex flex-1 items-center justify-center px-4 py-space-xl sm:px-8">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
          <div className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-fixed/40 blur-3xl" />
          <div className="flex w-full flex-col items-center overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg text-center shadow-xl shadow-surface-dim/40 md:p-space-xl">
            <div className="mb-space-lg flex flex-wrap items-center justify-center gap-space-xs rounded-full bg-surface-container-low px-space-md py-space-xs text-primary shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
              </span>
              <span className="font-mono text-data-code-label font-semibold uppercase tracking-wider">Error 404</span>
            </div>

            <div className="relative my-space-sm flex w-full max-w-lg select-none items-center justify-center">
              <svg className="h-36 w-full overflow-visible text-primary md:h-44" fill="none" viewBox="0 0 540 160" aria-hidden>
                <defs>
                  <linearGradient id="ecgGlow" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#2d67e4" stopOpacity="0.15" />
                    <stop offset="42%" stopColor="#2d67e4" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#ba1a1a" stopOpacity="1" />
                    <stop offset="58%" stopColor="#2d67e4" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#2d67e4" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <line stroke="#dfe2eb" strokeDasharray="3 3" x1="20" x2="520" y1="40" y2="40" />
                <line stroke="#dfe2eb" x1="20" x2="520" y1="80" y2="80" />
                <line stroke="#dfe2eb" strokeDasharray="3 3" x1="20" x2="520" y1="120" y2="120" />
                {['4', '0', '4'].map((n, i) => (
                  <text key={i} fill="#ebeef6" fontFamily="Inter, sans-serif" fontSize="118" fontWeight="800" textAnchor="middle" x={75 + i * 195} y="112">
                    {n}
                  </text>
                ))}
                <path
                  d="M 20 80 L 110 80 L 122 68 L 134 92 L 144 80 L 210 80 L 222 45 L 234 118 L 244 80 L 260 80 C 275 80 270 48 285 48 C 300 48 295 80 310 80 L 340 80 L 350 72 L 362 86 L 370 80 L 420 80 L 432 30 L 444 135 L 454 80 L 520 80"
                  stroke="url(#ecgGlow)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3.5"
                />
                <circle className="animate-ping opacity-60" cx="234" cy="118" fill="#ba1a1a" r="4.5" />
                <circle cx="234" cy="118" fill="#ba1a1a" r="3.5" />
              </svg>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest/80 text-primary-container shadow-md backdrop-blur-sm">
                  <SearchX size={28} aria-hidden />
                </div>
              </div>
            </div>

            <div className="mx-auto mb-space-lg mt-space-sm flex max-w-2xl flex-col items-center">
              <h1 className="mb-space-xs text-display-mobile font-bold tracking-tight text-on-surface sm:text-display">Page Not Found</h1>
              <p className="mb-space-xs text-body-lg font-medium text-on-surface-variant">The page you are looking for doesn&apos;t exist, has been archived, or may have been moved.</p>
              <p className="max-w-xl text-body-sm text-secondary">If you were looking for an active patient chart or encounter file, please verify the Patient ID or return to your workstation dashboard.</p>
            </div>

            <div className="mb-space-xl flex w-full flex-wrap items-center justify-center gap-space-md sm:w-auto">
              <Link to="/" className="inline-flex min-h-[44px] items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-xl py-space-sm text-headline-sm text-on-primary shadow-md transition-all hover:bg-primary active:scale-95">
                <LayoutDashboard size={20} aria-hidden /> Back to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex min-h-[44px] items-center justify-center gap-space-xs rounded-lg bg-surface-container-low px-space-xl py-space-sm text-headline-sm text-on-surface transition-all hover:bg-surface-container active:scale-95"
              >
                <ArrowLeft size={20} aria-hidden /> Go Back
              </button>
            </div>

            <div className="mb-space-lg flex w-full flex-col items-center pt-space-md">
              <span className="mb-space-sm text-caption font-semibold uppercase tracking-wider text-secondary">Immediate Navigation Shortcuts</span>
              <div className="flex flex-wrap items-center justify-center gap-space-sm">
                {SHORTCUTS.map((s) => (
                  <Link key={s.to} to={s.to} className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-low px-space-md py-space-xs text-body-sm text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container hover:text-primary">
                    <s.icon size={16} className="text-primary" aria-hidden /> {s.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex w-full max-w-2xl flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md text-left">
              <div className="flex flex-col justify-between gap-space-xs font-mono text-data-mono-body text-on-surface-variant sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-space-xs">
                  <span className="shrink-0 font-medium text-secondary">Requested URL:</span>
                  <span className="truncate font-medium text-primary">{pathname}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
