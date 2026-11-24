import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import { Check, Copy, Headset, LayoutDashboard, RefreshCw, ShieldCheck, Terminal } from 'lucide-react';
import { PublicShell } from '../../components/layout/PublicLayout';

function utcStamp(d: Date) {
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

/** Stitch "Something Went Wrong" — used by the error boundary and the /error route. */
export function ErrorPage({ error, onRetry }: { error?: Error; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);
  const incident = useMemo(() => `#ERR-${Math.floor(1000 + Math.random() * 8999)}-X${Math.floor(Math.random() * 9)}`, []);
  const stamp = useMemo(() => utcStamp(new Date()), []);

  const copy = () => {
    void navigator.clipboard?.writeText(`Incident ID: ${incident} | Timestamp: ${stamp}${error ? ` | ${error.message}` : ''}`).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    });
  };

  return (
    <PublicShell>
      <div className="flex flex-1 items-center justify-center px-4 py-space-xl sm:px-8">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
            <div className="h-96 w-96 rounded-full bg-primary-fixed/30 blur-3xl" />
          </div>
          <div className="relative flex w-full flex-col items-center rounded-xl bg-surface-container-lowest p-6 text-center shadow-xl shadow-surface-dim/40 md:p-10">
            <div className="mb-space-lg inline-flex items-center gap-space-xs rounded-full bg-tertiary-container/10 px-space-md py-1 text-tertiary shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
              <span className="font-mono text-data-code-label font-semibold uppercase tracking-wider">Error 500</span>
            </div>

            <div className="relative mb-space-lg flex h-24 w-full max-w-md items-center justify-center overflow-hidden rounded-lg bg-surface-container-low p-3 shadow-inner">
              <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(#004dc6_1px,transparent_1px)] [background-size:12px_12px]" />
              <svg className="h-16 w-full text-primary" fill="none" viewBox="0 0 460 70" aria-hidden>
                <path className="opacity-90" d="M0 35 L70 35 L80 35 L88 20 L96 50 L104 10 L112 40 L120 35 L170 35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                <path className="opacity-60" d="M170 35 L200 35" stroke="#737686" strokeDasharray="4 4" strokeWidth="2" />
                <g transform="translate(230, 35)">
                  <circle className="animate-ping opacity-40" r="16" fill="#ffdad6" />
                  <circle r="12" fill="#ffdad6" />
                  <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#ba1a1a" strokeLinecap="round" strokeWidth="2" />
                </g>
                <path className="opacity-60" d="M260 35 L290 35" stroke="#737686" strokeDasharray="4 4" strokeWidth="2" />
                <path className="opacity-40" d="M290 35 L340 35 L348 24 L356 46 L364 16 L372 38 L380 35 L460 35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
            </div>

            <h1 className="mb-space-sm text-display-mobile font-bold tracking-tight text-on-surface sm:text-display">Something went wrong.</h1>
            <p className="mx-auto mb-space-lg max-w-xl text-body-lg leading-relaxed text-on-surface-variant">
              An unexpected error occurred while loading this page. Our IT team has been notified automatically.
            </p>

            <div className="mb-space-lg flex w-full max-w-2xl flex-col items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3 text-left sm:flex-row sm:px-space-lg sm:py-space-md">
              <div className="flex w-full items-center gap-space-sm overflow-hidden">
                <Terminal size={20} className="shrink-0 text-primary" aria-hidden />
                <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 font-mono text-data-mono-body text-on-surface">
                  <span className="font-medium text-primary">
                    Incident: <span className="text-on-surface">{incident}</span>
                  </span>
                  <span className="hidden font-light text-outline-variant md:inline">|</span>
                  <span className="hidden text-secondary md:inline">
                    Time: <span className="text-on-surface">{stamp}</span>
                  </span>
                </div>
              </div>
              <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-space-xs rounded bg-surface-container px-3 py-1.5 text-caption font-medium text-on-surface transition-colors hover:bg-surface-container-high active:scale-95">
                {copied ? <Check size={16} className="text-primary" aria-hidden /> : <Copy size={16} className="text-secondary" aria-hidden />}
                {copied ? 'Copied to Clipboard' : 'Copy Incident ID'}
              </button>
            </div>

            <div className="mb-space-xl flex w-full max-w-2xl items-start gap-space-md rounded-lg bg-surface-container-low/70 p-space-md text-left">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <ShieldCheck size={18} aria-hidden />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-space-xs text-headline-sm font-semibold text-on-surface">
                  Your data is safe
                </div>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">Patient records were not affected and no changes were lost.</p>
              </div>
            </div>

            <div className="mb-space-lg flex w-full max-w-md flex-col items-center justify-center gap-space-md sm:flex-row">
              <button
                type="button"
                onClick={() => (onRetry ? onRetry() : window.location.reload())}
                className="inline-flex w-full flex-1 items-center justify-center gap-space-sm rounded-lg bg-primary px-6 py-2.5 text-headline-sm font-medium text-on-primary shadow-md shadow-primary/20 transition-all hover:bg-on-primary-fixed-variant active:scale-95 sm:w-auto"
              >
                <RefreshCw size={20} aria-hidden /> Try Again
              </button>
              <a href="/" className="inline-flex w-full flex-1 items-center justify-center gap-space-sm rounded-lg bg-surface-container px-6 py-2.5 text-headline-sm font-medium text-on-surface transition-all hover:bg-surface-container-high active:scale-95 sm:w-auto">
                <LayoutDashboard size={20} className="text-secondary" aria-hidden /> Back to Dashboard
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-space-lg gap-y-2 pt-space-md text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-space-xs">
                <Headset size={16} className="text-primary" aria-hidden /> IT Support:
                <a href="tel:+18005552273" className="font-mono font-medium text-primary hover:underline">
                  +1 800 555-CARE Ext. 4
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

/** Catches render errors anywhere below and shows the Stitch error screen. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error?: Error }> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating away from a crashed screen clears the error.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: undefined });
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (this.state.error) return <ErrorPage error={this.state.error} onRetry={() => this.setState({ error: undefined })} />;
    return this.props.children;
  }
}
