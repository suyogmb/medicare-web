import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, CalendarClock, CheckCheck, CircleCheck, FlaskConical, PenLine, Server, Settings2, Siren, type LucideIcon } from 'lucide-react';
import type { AppNotification, NotificationCategory } from '../../types';
import { useClinicalData } from '../../context/ClinicalDataContext';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/Button';
import { useToast } from '../ui/Toast';

const CATEGORY_STYLE: Record<NotificationCategory, { icon: LucideIcon; tile: string; chip: string; dot: string }> = {
  'Critical Alerts': { icon: Siren, tile: 'bg-error-container text-error', chip: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  Appointments: { icon: CalendarClock, tile: 'bg-primary-fixed text-primary', chip: 'bg-primary-fixed text-on-primary-fixed', dot: 'bg-primary' },
  'Lab Results': { icon: FlaskConical, tile: 'bg-tertiary-fixed/60 text-tertiary', chip: 'bg-surface-container text-on-surface-variant', dot: 'bg-tertiary' },
  Prescriptions: { icon: PenLine, tile: 'bg-surface-container text-on-surface-variant', chip: 'bg-surface-container text-on-surface-variant', dot: 'bg-secondary' },
  System: { icon: Server, tile: 'bg-surface-container text-on-surface-variant', chip: 'bg-surface-container text-on-surface-variant', dot: 'bg-outline' },
};
const CATEGORIES = Object.keys(CATEGORY_STYLE) as NotificationCategory[];
const GROUPS: AppNotification['group'][] = ['Today', 'Yesterday', 'Earlier This Week'];

/** Stitch "Notifications Dropdown Panel" anchored to the top-bar bell. */
export function NotificationsBell() {
  const { notifications, markNotifications, dismissNotification } = useClinicalData();
  const navigate = useNavigate();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState<'All' | NotificationCategory>('All');
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = useMemo(
    () => notifications.filter((n) => (!unreadOnly || n.unread) && (category === 'All' || n.category === category)),
    [notifications, unreadOnly, category],
  );

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const act = (n: AppNotification, which: 'primary' | 'secondary') => {
    const label = which === 'primary' ? n.actions?.primary : n.actions?.secondary;
    markNotifications([n.id]);
    if (n.category === 'Critical Alerts' && which === 'primary' && n.patientId) return go(`/patients/${n.patientId}`);
    if (n.category === 'Prescriptions' && which === 'primary') return go('/prescriptions?status=Refill%20Due');
    if (n.category === 'Appointments') {
      dismissNotification(n.id);
      notify(which === 'primary' ? 'Reschedule approved · patient notified by SMS' : 'Reschedule request declined', which === 'primary' ? 'success' : 'info');
      return;
    }
    notify(`${label ?? 'Acknowledged'} · ${n.title}`, 'info');
  };

  return (
    <div ref={ref} className="relative">
      <IconButton
        icon={Bell}
        label={`Notifications (${unread} unread)`}
        size={20}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn('p-2', open && 'bg-primary-fixed/50 text-primary ring-2 ring-primary-container')}
      />
      {unread > 0 && (
        <span className="pointer-events-none absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 font-mono text-[10px] font-bold text-on-error">{unread}</span>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-2 top-16 z-50 flex max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-overlay sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[440px]"
        >
          <div className="flex flex-col gap-space-sm p-space-md pb-space-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-headline-sm font-bold text-on-surface">Notifications</h3>
                <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-mono text-data-code-label font-semibold text-primary">{unread} New</span>
                <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant">{notifications.length} Total</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={unread === 0} onClick={() => markNotifications('all')} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-caption font-semibold text-primary hover:bg-surface-container-low disabled:opacity-40">
                  <CheckCheck size={15} aria-hidden /> Mark all read
                </button>
                <IconButton icon={Settings2} label="Notification settings" onClick={() => go('/settings?tab=notifications')} />
              </div>
            </div>
            <div role="tablist" aria-label="Read state" className="grid grid-cols-2 rounded-lg bg-surface-container-low p-1 text-body-sm">
              {[false, true].map((u) => (
                <button
                  key={String(u)}
                  role="tab"
                  type="button"
                  aria-selected={unreadOnly === u}
                  onClick={() => setUnreadOnly(u)}
                  className={cn('flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors', unreadOnly === u ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}
                >
                  {u ? (
                    <>
                      Unread <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ({unread})
                    </>
                  ) : (
                    `All (${notifications.length})`
                  )}
                </button>
              ))}
            </div>
            <div className="no-scrollbar -mx-space-md flex gap-1.5 overflow-x-auto px-space-md">
              {(['All', ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-data-code-label transition-colors',
                    category === c ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  {c !== 'All' && <span className={cn('h-1.5 w-1.5 rounded-full', category === c ? 'bg-on-primary' : CATEGORY_STYLE[c].dot)} />}
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-space-lg py-10 text-center">
                <CircleCheck size={22} className="text-primary" aria-hidden />
                <span className="text-body-sm font-semibold text-on-surface">You&apos;re all caught up</span>
                <span className="text-caption text-on-surface-variant">No notifications in this view.</span>
              </div>
            )}
            {GROUPS.map((g) => {
              const items = visible.filter((n) => n.group === g);
              if (!items.length) return null;
              return (
                <section key={g}>
                  <div className="flex items-center justify-between bg-surface-container-low/70 px-space-md py-1.5 text-caption font-semibold uppercase tracking-wider text-on-surface-variant">
                    {g}
                    <span className="font-mono font-normal normal-case">{items.filter((n) => n.unread).length} unread</span>
                  </div>
                  <ul>
                    {items.map((n) => {
                      const s = CATEGORY_STYLE[n.category];
                      const critical = n.category === 'Critical Alerts' && n.unread;
                      return (
                        <li key={n.id} className={cn('border-b border-surface-container/70 last:border-0', critical && 'bg-error-container/25')}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => markNotifications([n.id])}
                            onKeyDown={(e) => e.key === 'Enter' && markNotifications([n.id])}
                            className="flex gap-space-sm px-space-md py-space-md text-left transition-colors hover:bg-surface-container-low/60"
                          >
                            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', s.tile)}>
                              <s.icon size={18} aria-hidden />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="flex items-start justify-between gap-2">
                                <span className={cn('text-body-sm text-on-surface', n.unread ? 'font-bold' : 'font-semibold')}>{n.title}</span>
                                <span className="flex shrink-0 items-center gap-1.5 font-mono text-data-code-label text-on-surface-variant">
                                  {n.ago}
                                  {n.unread && <span className={cn('h-2 w-2 rounded-full', critical ? 'bg-error' : 'bg-primary')} />}
                                </span>
                              </span>
                              <span className="text-body-sm text-on-surface-variant">{n.body}</span>
                              <span className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5">
                                  <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold', s.chip)}>{n.category === 'Critical Alerts' ? 'Critical Alert' : n.category}</span>
                                  {n.ref && <span className="font-mono text-data-code-label text-on-surface-variant">{n.ref}</span>}
                                </span>
                                {n.actions && (
                                  <span className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        act(n, 'primary');
                                      }}
                                      className={cn(
                                        'rounded px-2 py-1 text-caption font-semibold transition-colors',
                                        n.category === 'Critical Alerts' ? 'bg-error text-on-error hover:bg-on-error-container' : n.category === 'Appointments' ? 'bg-primary-container text-on-primary hover:bg-primary' : 'bg-primary-fixed/60 text-primary hover:bg-primary-fixed',
                                      )}
                                    >
                                      {n.actions.primary}
                                    </button>
                                    {n.actions.secondary && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          act(n, 'secondary');
                                        }}
                                        className="rounded bg-surface-container-low px-2 py-1 text-caption font-medium text-on-surface hover:bg-surface-container"
                                      >
                                        {n.actions.secondary}
                                      </button>
                                    )}
                                  </span>
                                )}
                              </span>
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 bg-surface-container-low/70 px-space-md py-2">
            <span className="flex items-center gap-2 text-caption">
              <CircleCheck size={16} className="text-primary" aria-hidden />
              <span className="flex flex-col">
                <span className="font-semibold text-on-surface">{notifications.some((n) => n.unread && n.category === 'Critical Alerts') ? 'Critical ward alerts need review' : 'All caught up on high priority ward alerts'}</span>
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 px-space-md py-space-sm">
            <button type="button" onClick={() => go('/settings?tab=notifications')} className="inline-flex items-center gap-1.5 text-body-sm font-medium text-on-surface-variant hover:text-on-surface">
              <Settings2 size={16} aria-hidden /> Notification Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(false);
                setCategory('All');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-2 text-body-sm font-semibold text-on-primary shadow-sm hover:bg-primary"
            >
              View All ({notifications.length}) <ArrowRight size={15} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
