import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCheck, CircleCheck, Eye, EyeOff, Headset, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { PublicShell } from '../../components/layout/PublicLayout';

const RULES: { label: string; note?: string; test: (v: string) => boolean }[] = [
  { label: 'Minimum 12 characters', note: '(HIPAA Security Rule § 164.312)', test: (v) => v.length >= 12 },
  { label: 'Includes uppercase & lowercase letters (A-Z, a-z)', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'Includes at least one numeral (0-9)', test: (v) => /\d/.test(v) },
  { label: 'Includes at least one special symbol (!@#$%^&*)', test: (v) => /[^A-Za-z0-9]/.test(v) },
  { label: 'Not repeated in the last 12 password cycles', test: (v) => v.length > 0 && !/password|medicare/i.test(v) },
];

const STRENGTH = [
  { label: 'WEAK', color: 'text-danger', bar: 'bg-danger' },
  { label: 'WEAK', color: 'text-danger', bar: 'bg-danger' },
  { label: 'FAIR', color: 'text-warning', bar: 'bg-warning' },
  { label: 'MODERATE', color: 'text-warning', bar: 'bg-success' },
  { label: 'STRONG', color: 'text-success', bar: 'bg-success' },
  { label: 'STRONG', color: 'text-success', bar: 'bg-success' },
];

/** Stitch "Reset Password" — strength meter, compliance checklist and success state. */
export function ResetPasswordPage() {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const passed = RULES.filter((r) => r.test(pw)).length;
  const strength = STRENGTH[passed];
  const bars = Math.min(4, Math.max(0, passed - 1));
  const matches = confirm.length > 0 && pw === confirm;
  const valid = passed === RULES.length && matches;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) setDone(true);
  };

  const field = 'h-11 w-full rounded-xl bg-surface-container-lowest pl-11 pr-11 text-body-md text-on-surface shadow-sm transition-all placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <PublicShell>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-[580px] rounded-2xl bg-surface-container-lowest p-6 shadow-xl sm:p-10">
          {!done ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-data-code-label font-semibold uppercase tracking-wider text-primary">Reset Password</span>
                </div>
                <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">Create a New Password</h1>
                <p className="text-body-md leading-relaxed text-secondary">Choose a strong new password for your MediCare 360 account.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3.5">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <p className="text-body-sm text-on-surface-variant">Passwords expire every 90 days. Use a password you haven't used before.</p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={submit}>
                {/* Lets password managers pair the new secret with the account. */}
                <input type="text" name="username" autoComplete="username" defaultValue="sarah.jenkins@medicare360.org" className="sr-only" tabIndex={-1} aria-hidden />
                <label className="flex flex-col gap-2">
                  <span className="flex items-center justify-between">
                    <span className="text-body-sm font-semibold text-on-surface">New Password</span>
                    {pw && <span className={cn('font-mono text-data-code-label font-semibold', strength.color)}>{strength.label}</span>}
                  </span>
                  <span className="relative">
                    <LockKeyhole size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" aria-hidden />
                    <input type={showPw ? 'text' : 'password'} autoComplete="new-password" className={field} placeholder="Enter new password" value={pw} onChange={(e) => setPw(e.target.value)} />
                    <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-on-surface">
                      {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </span>
                  <span className="flex flex-col gap-1.5 pt-1">
                    <span className="grid h-1.5 grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={cn('h-full rounded-full transition-colors', i < bars ? strength.bar : 'bg-surface-container')} />
                      ))}
                    </span>
                    <span className="flex items-center justify-between text-caption">
                      <span />
                      {passed >= 4 && <span className="font-medium text-success">Strong enough</span>}
                    </span>
                  </span>
                </label>

                <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4">
                  <span className="text-caption font-semibold uppercase tracking-wider text-secondary">Password Requirements</span>
                  <ul className="flex flex-col gap-2 text-body-sm">
                    {RULES.map((r) => {
                      const ok = r.test(pw);
                      return (
                        <li key={r.label} className="flex items-center gap-2.5">
                          <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full', ok ? 'bg-success-container text-success' : 'bg-surface-container text-outline')}>
                            {ok ? <Check size={12} strokeWidth={3} aria-hidden /> : <X size={11} strokeWidth={3} aria-hidden />}
                          </span>
                          <span className={cn('font-medium', ok ? 'text-on-surface-variant' : 'text-outline')}>
                            {r.label} {r.note && <span className="text-caption text-secondary">{r.note}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="flex items-center justify-between">
                    <span className="text-body-sm font-semibold text-on-surface">Confirm New Password</span>
                    {confirm && (
                      <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-data-code-label font-medium', matches ? 'bg-success-container text-success' : 'bg-error-container text-on-error-container')}>
                        {matches ? <CheckCheck size={12} aria-hidden /> : <X size={12} aria-hidden />}
                        {matches ? 'Passwords match' : 'Mismatch'}
                      </span>
                    )}
                  </span>
                  <span className="relative">
                    <LockKeyhole size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" aria-hidden />
                    <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" className={field} placeholder="Re-enter new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    <button type="button" aria-label="Toggle password visibility" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-on-surface">
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </span>
                </label>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!valid}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-headline-sm font-semibold text-on-primary shadow-md transition-all hover:bg-[#2253BC] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShieldCheck size={20} aria-hidden /> Update Password
                  </button>
                  <Link to="/login" className="inline-flex items-center justify-center gap-1.5 pt-2 text-body-md font-medium text-secondary transition-colors hover:text-primary">
                    <ArrowLeft size={18} aria-hidden /> Back to Login
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            <div role="status" className="flex flex-col items-center gap-6 py-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-container text-success shadow-sm">
                <CircleCheck size={36} aria-hidden />
              </span>
              <div className="flex flex-col gap-2">
                <h1 className="text-headline-lg font-bold text-on-surface">Password Updated Successfully</h1>
                <p className="mx-auto max-w-md text-body-md leading-relaxed text-secondary">
                  You can now sign in with your new password. Other devices using your account have been signed out.
                </p>
              </div>
              <Link to="/login" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-headline-sm font-semibold text-on-primary shadow-md transition-all hover:bg-[#2253BC]">
                Proceed to Sign In <ArrowRight size={20} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setPw('');
                  setConfirm('');
                }}
                className="text-body-sm text-secondary transition-colors hover:text-on-surface"
              >
                Need to change again? Return to credential renewal
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex w-full max-w-[580px] items-start justify-between gap-4 rounded-xl bg-surface-container-low p-4 shadow-sm sm:items-center">
          <span className="flex items-center gap-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
              <Headset size={20} aria-hidden />
            </span>
            <span className="flex flex-col">
              <span className="text-body-sm font-semibold text-on-surface">Need help accessing your account?</span>
              <span className="text-caption text-secondary">IT support is available 24/7</span>
            </span>
          </span>
          <a href="tel:+18005552273" className="shrink-0 rounded-lg bg-surface-container-lowest px-3 py-1.5 font-mono text-data-code-label font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-on-primary">
            +1 (800) 555-CARE · Ext. 4
          </a>
        </div>
      </div>
    </PublicShell>
  );
}
