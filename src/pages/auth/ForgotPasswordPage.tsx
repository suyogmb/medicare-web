import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Fingerprint, Headset, IdCard, KeyRound, MonitorSmartphone, ShieldCheck, ShieldPlus } from 'lucide-react';
import { PublicShell } from '../../components/layout/PublicLayout';

function mask(value: string): string {
  if (value.includes('@')) {
    const [user, domain] = value.split('@');
    return `${user.slice(0, 3)}***@${domain}`;
  }
  return value.length > 4 ? `${value.slice(0, 2)}******${value.slice(-2)} (Verified Provider)` : 'NPI-******';
}

/** Stitch "Forgot Password". */
export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = identifier.trim();
    if (!v) return;
    setSentTo(mask(v));
    setSeconds(54);
  };

  return (
    <PublicShell>
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
        <section className="relative flex flex-col items-center justify-center px-4 py-8 sm:px-8 lg:col-span-7 lg:px-14 xl:px-20">
          <div className="pointer-events-none absolute -left-12 -top-12 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10 flex w-full max-w-xl flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 font-mono text-data-code-label font-semibold uppercase tracking-wider text-primary">
                <KeyRound size={14} aria-hidden /> Password Recovery
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-display-mobile font-bold tracking-tight text-on-surface sm:text-display">Forgot your password?</h1>
              <p className="text-body-md leading-relaxed text-on-surface-variant">
                Enter your work email or 10-digit NPI number and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="card flex flex-col gap-6 p-6 sm:p-8">
              {sentTo && (
                <div role="status" className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 text-headline-sm font-semibold text-primary">
                      <CircleCheck size={20} className="text-success" aria-hidden /> Reset Link Sent
                    </span>
                  </div>
                  <p className="text-body-sm leading-relaxed text-on-surface-variant">
                    A password reset link has been sent to <strong className="font-mono font-medium text-on-surface">{sentTo}</strong>. The link is valid for 15 minutes.
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-caption text-secondary">
                    <span />
                    <span className="flex items-center gap-3">
                      <Link to="/reset-password" className="font-medium text-primary underline">
                        Open reset link (demo)
                      </Link>
                      <button type="button" disabled={seconds > 0} onClick={() => setSeconds(54)} className="font-medium text-primary underline disabled:opacity-50">
                        {seconds > 0 ? `Resend Link in ${seconds}s` : 'Resend Reset Link Now'}
                      </button>
                    </span>
                  </div>
                </div>
              )}

              <form className="flex flex-col gap-5" onSubmit={submit}>
                <label className="flex flex-col gap-2">
                  <span className="flex items-baseline justify-between text-headline-sm text-on-surface">
                    <span>Institutional Email or NPI Number</span>
                    
                  </span>
                  <span className="relative">
                    <IdCard size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
                    <input
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="dr.chen@medicare360.org or 10-digit NPI"
                      className="h-11 w-full rounded-lg bg-surface-container-low pl-11 pr-4 text-body-md text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </span>
                  <span className="flex items-start gap-2 pt-1 text-caption text-on-surface-variant">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                      For your security, reset links expire after 15 minutes.
                    </span>
                  </span>
                </label>
                <button
                  type="submit"
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg text-headline-sm font-semibold shadow-sm transition-all active:scale-[0.99] ${sentTo ? 'bg-success text-white' : 'bg-primary text-on-primary hover:bg-[#2253bc]'}`}
                >
                  {sentTo ? (
                    <>
                      <Check size={18} aria-hidden /> Dispatched Successfully
                    </>
                  ) : (
                    <>
                      Send Reset Link <ArrowRight size={18} aria-hidden />
                    </>
                  )}
                </button>
                <Link to="/login" className="inline-flex items-center justify-center gap-1.5 pt-2 text-body-md font-medium text-secondary transition-colors hover:text-on-surface">
                  <ArrowLeft size={18} aria-hidden /> Back to Sign In
                </Link>
              </form>
            </div>

            <div className="card flex items-start gap-3.5 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                <Headset size={18} aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5 text-body-sm">
                <span className="font-semibold text-on-surface">Locked out or lost your security key?</span>
                <span className="text-on-surface-variant">
                  Contact 24/7 IT support:{' '}
                  <a href="tel:+18005552273" className="font-mono font-medium text-primary hover:underline">
                    +1 (800) 555-CARE · Ext. 4
                  </a>
                </span>
              </span>
            </div>
          </div>
        </section>

        <SecurityAside />
      </div>
    </PublicShell>
  );
}

function SecurityAside() {
  return (
    <section className="relative flex flex-col justify-between gap-6 overflow-hidden bg-surface-container-low p-8 lg:col-span-5 xl:p-12">
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="card mt-2 flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-headline-sm font-semibold text-on-surface">
              <ShieldPlus size={22} className="text-primary" aria-hidden /> Your account stays protected
            </span>
          </div>
          <p className="text-body-sm leading-relaxed text-on-surface-variant">
            Resetting your password signs you out everywhere else, so only you can get back into your account.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <span className="font-mono text-data-code-label font-semibold uppercase tracking-wider text-secondary">What happens next</span>
          {[
            { icon: MonitorSmartphone, tone: 'text-primary', title: 'Other sessions signed out', text: 'All other devices using your account are signed out after the reset.' },
            { icon: Fingerprint, tone: 'text-success', title: 'Security keys keep working', text: 'Registered security keys and badges continue to work for urgent access.' },
          ].map((s) => (
            <div key={s.title} className="card flex items-start gap-3 p-3">
              <s.icon size={18} className={`mt-0.5 shrink-0 ${s.tone}`} aria-hidden />
              <span className="flex flex-col text-body-sm">
                <span className="font-semibold text-on-surface">{s.title}</span>
                <span className="text-caption text-on-surface-variant">{s.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
