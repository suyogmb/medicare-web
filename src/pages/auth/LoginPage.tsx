import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, CircleCheck, CreditCard, Eye, EyeOff, HeartPulse, Headset, IdCard, Languages, Loader2, Lock, PenTool, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { PublicBrand } from '../../components/layout/PublicLayout';

const CAPABILITIES = [
  { icon: Lock, label: 'Secure sign-in' },
  { icon: RefreshCw, label: 'Real-time updates' },
  { icon: PenTool, label: 'E-prescribing' },
];

/** Stitch "Login" — dark brand panel + workstation sign-in form. */
export function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'form' | 'sso' | 'card' | null>(null);
  const [cardState, setCardState] = useState<'idle' | 'reading' | 'ok'>('idle');

  const signIn = (via: 'form' | 'sso') => {
    setBusy(via);
    window.setTimeout(() => navigate('/'), 650);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || password.length < 6) {
      setError('Enter your email and a password of at least 6 characters.');
      return;
    }
    setError('');
    signIn('form');
  };

  const smartCard = () => {
    setCardState('reading');
    window.setTimeout(() => setCardState('ok'), 1200);
    window.setTimeout(() => navigate('/'), 2000);
  };

  return (
    <div className="flex min-h-screen bg-surface p-0 lg:p-4">
      <div className="flex w-full flex-col overflow-hidden bg-surface-container-lowest shadow-2xl lg:flex-row lg:rounded-2xl">
        {/* Brand panel */}
        <div className="relative flex w-full flex-col justify-between gap-10 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-primary/40 p-8 text-white lg:w-[48%] lg:p-12 xl:w-[45%] xl:p-14">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 -right-20 h-80 w-80 rounded-full bg-primary-container/20 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between">
            <PublicBrand inverted />
          </div>

          <div className="relative z-10 flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <h1 className="text-display font-semibold leading-tight tracking-tight text-white">
                Smarter healthcare management.
                <span className="block bg-gradient-to-r from-blue-300 via-primary-fixed to-blue-200 bg-clip-text text-transparent">Built for clinical teams.</span>
              </h1>
              <p className="max-w-lg pt-1 text-body-md leading-relaxed text-slate-300">
                Patient records, appointments and prescriptions in one place.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-700/40 pb-3">
                <span className="flex items-center gap-2.5 text-body-md font-medium text-white">
                  <HeartPulse size={20} className="text-primary-fixed" aria-hidden /> Today at a Glance
                </span>
              </div>
              <div className="py-3">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-caption text-slate-400">AVERAGE HEART RATE</span>
                  <span className="font-mono text-body-md text-slate-200">72 bpm</span>
                </div>
                <svg className="h-12 w-full text-primary-fixed-dim" fill="none" preserveAspectRatio="none" viewBox="0 0 380 48" aria-hidden>
                  <path
                    className="drop-shadow-[0_0_8px_rgba(179,197,255,0.6)]"
                    d="M0,24 L40,24 L52,14 L60,34 L68,6 L78,42 L86,24 L140,24 L152,14 L160,34 L168,6 L178,42 L186,24 L240,24 L252,14 L260,34 L268,6 L278,42 L286,24 L340,24 L350,18 L360,24 L380,24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-700/30 pt-2 text-center font-mono">
                {[
                  ['VISITS TODAY', '2,418', 'text-white'],
                  ['BEDS IN USE', '94.2%', 'text-white'],
                  ['DOCTORS ON DUTY', '24', 'text-emerald-400'],
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded border border-slate-800 bg-slate-900/60 p-1.5">
                    <div className="text-caption text-slate-400">{k}</div>
                    <div className={cn('text-body-md font-semibold', c)}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-1.5 text-body-sm text-slate-300">
                  <Icon size={15} className="text-primary-fixed" aria-hidden /> {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 border-t border-slate-800/80 pt-6">
            <div className="flex items-start gap-3 text-body-sm text-slate-400">
              <BadgeCheck size={18} className="mt-0.5 shrink-0 text-primary-fixed" aria-hidden />
              <div>
                <span className="font-semibold text-slate-300">HIPAA compliant</span>
                <p className="mt-0.5 text-caption leading-normal text-slate-400">
                  Patient information is encrypted and every sign-in is recorded.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign-in panel */}
        <div className="flex w-full flex-col justify-between bg-surface-container-lowest p-8 sm:p-12 lg:w-[52%] lg:p-14 xl:w-[55%]">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 pb-6">
            <span />
            <div className="flex items-center gap-4 text-body-sm">
              <span className="inline-flex items-center gap-1.5 text-secondary">
                <Languages size={17} aria-hidden /> English (US)
              </span>
              <span className="h-4 w-px bg-outline-variant/40" />
              <a href="tel:+18005552273" className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-container">
                <Headset size={17} aria-hidden /> Emergency Helpdesk
              </a>
            </div>
          </div>

          <div className="mx-auto my-auto w-full max-w-md py-4">
            <div className="mb-8">
              <h2 className="text-headline-lg font-semibold tracking-tight text-on-surface">Welcome Back</h2>
              <p className="mt-1.5 text-body-md text-on-surface-variant">Sign in to continue to MediCare 360.</p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
              <label className="flex flex-col gap-1.5">
                <span className="text-body-sm font-medium text-on-surface">Email or NPI number</span>
                <span className="relative">
                  <IdCard size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" aria-hidden />
                  <input
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@medicare360.org"
                    aria-invalid={Boolean(error) && !identifier.trim()}
                    className="h-11 w-full rounded-lg border border-outline-variant bg-surface pl-10 pr-4 text-body-md text-on-surface shadow-sm transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-body-sm font-medium text-on-surface">Password</span>
                <span className="relative">
                  <Lock size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" aria-hidden />
                  <input
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(error) && password.length < 6}
                    className="h-11 w-full rounded-lg border border-outline-variant bg-surface pl-10 pr-11 text-body-md text-on-surface shadow-sm transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                    {show ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
              </label>
              {error && <p className="rounded-lg bg-danger-container px-3 py-2 text-body-sm text-danger">{error}</p>}
              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer select-none items-center gap-2.5">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                  <span className="text-body-sm text-on-surface-variant">Remember this device</span>
                </label>
                <Link to="/forgot-password" className="text-body-sm font-medium text-primary hover:text-primary-container hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={busy !== null}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-body-md font-medium text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-container active:scale-[0.99] disabled:opacity-70"
              >
                {busy === 'form' ? <Loader2 size={19} className="animate-spin" aria-hidden /> : null}
                {busy === 'form' ? 'Signing in…' : 'Sign In'}
                {busy !== 'form' && <ArrowRight size={19} aria-hidden />}
              </button>

              <div className="relative my-4 py-1">
                <div aria-hidden className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface-container-lowest px-3 font-mono text-caption uppercase tracking-wider text-outline">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signIn('sso')}
                disabled={busy !== null}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-outline-variant bg-surface text-body-md font-medium text-on-surface shadow-sm transition-all hover:bg-surface-container disabled:opacity-70"
              >
                {busy === 'sso' ? <Loader2 size={20} className="animate-spin text-primary" aria-hidden /> : <Building2 size={20} className="text-primary" aria-hidden />}
                Sign In with Hospital Account
              </button>
              <button
                type="button"
                onClick={smartCard}
                disabled={cardState !== 'idle'}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-outline-variant bg-surface text-body-md font-medium text-on-surface shadow-sm transition-all hover:bg-surface-container disabled:opacity-90"
              >
                {cardState === 'reading' ? (
                  <Loader2 size={20} className="animate-spin text-primary" aria-hidden />
                ) : cardState === 'ok' ? (
                  <CircleCheck size={20} className="text-emerald-600" aria-hidden />
                ) : (
                  <CreditCard size={20} className="text-emerald-600" aria-hidden />
                )}
                {cardState === 'reading' ? 'Reading your card…' : cardState === 'ok' ? 'Card verified, signing in' : 'Sign In with Smart Card'}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-low p-3.5">
              <Headset size={20} className="mt-0.5 text-primary" aria-hidden />
              <div className="text-body-sm text-on-surface-variant">
                Can't sign in?
                <div className="mt-0.5 font-medium text-on-surface">
                  Call IT support (24/7):{' '}
                  <a className="font-mono text-primary hover:underline" href="tel:18005552273">
                    +1 (800) 555-CARE • Ext. 4
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 border-t border-outline-variant/40 pt-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-secondary">
              <a className="hover:text-primary" href="#privacy">
                Privacy Policy
              </a>
              <span className="text-outline-variant">•</span>
              <a className="hover:text-primary" href="#terms">
                Terms of Service
              </a>
              <span className="text-outline-variant">•</span>
              <a className="hover:text-primary" href="#hipaa">
                HIPAA Attestation
              </a>
            </div>
            <p className="text-caption text-outline">© 2026 MediCare 360 Health Systems, Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
