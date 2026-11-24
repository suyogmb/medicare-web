import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BedSingle, Clock, Smile, Timer, type LucideIcon } from 'lucide-react';
import { hospitalPerformance, recentActivity } from '../../data/dashboard';
import { useClinicalData } from '../../context/ClinicalDataContext';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/format';
import { SectionCard } from '../ui/Section';
import { useToast } from '../ui/Toast';

const PERF_ICONS: Record<string, LucideIcon> = { beds: BedSingle, satisfaction: Smile, consult: Timer };
const NOTE_TONE = { error: 'text-error', primary: 'text-primary', muted: 'text-on-surface-variant' };

export function HospitalPerformance() {
  return (
    <SectionCard title="Hospital Performance" actions={<BarChart3 size={20} className="text-primary-container" aria-hidden />}>
      <div className="grid grid-cols-1 gap-space-sm">
        {hospitalPerformance.map((m) => {
          const Icon = PERF_ICONS[m.key];
          return (
            <div key={m.key} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-container-lowest text-primary-container shadow-sm">
                  <Icon size={17} aria-hidden />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-caption font-semibold uppercase tracking-wider text-on-surface-variant">{m.label}</span>
                  <span className="truncate text-caption text-on-surface-variant">{m.detail}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-mono text-data-metric-md font-bold text-on-surface">{m.value}</span>
                {m.unit && <span className="ml-1 text-body-sm text-on-surface-variant">{m.unit}</span>}
                <span className={cn('block font-mono text-data-code-label font-medium', NOTE_TONE[m.tone])}>{m.note}</span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

const BRACKETS = [
  { label: 'Young Adults (18-35 yrs)', min: 18, max: 35, bar: 'bg-primary-container' },
  { label: 'Adults (36-55 yrs)', min: 36, max: 55, bar: 'bg-primary-fixed-dim' },
  { label: 'Seniors (56-75 yrs)', min: 56, max: 75, bar: 'bg-secondary' },
  { label: 'Pediatrics (0-17 yrs)', min: 0, max: 17, bar: 'bg-tertiary-container' },
  { label: 'Geriatric (76+ yrs)', min: 76, max: 200, bar: 'bg-outline' },
];

/** Age bracket distribution, computed live from the patient registry. */
export function Demographics() {
  const { patients } = useClinicalData();
  const rows = useMemo(() => {
    const total = patients.length || 1;
    return BRACKETS.map((b) => {
      const count = patients.filter((p) => p.age >= b.min && p.age <= b.max).length;
      return { ...b, count, pct: Math.round((count / total) * 100) };
    });
  }, [patients]);

  return (
    <SectionCard
      title="Demographics"
      badge={<span className="rounded-full bg-primary-fixed px-2 py-0.5 font-mono text-data-code-label font-bold text-on-primary-fixed">{formatNumber(patients.length)}</span>}
      actions={<span className="text-caption font-medium text-on-surface-variant">By Age Bracket</span>}
    >
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-body-sm">
              <span className="font-medium text-on-surface">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-data-mono-body font-medium text-on-surface-variant">{formatNumber(r.count)}</span>
                <span className="w-8 text-right font-mono text-data-code-label font-bold text-on-surface">{r.pct}%</span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low" role="progressbar" aria-valuenow={r.pct} aria-valuemin={0} aria-valuemax={100} aria-label={r.label}>
              <div className={cn('h-full rounded-full transition-[width] duration-500', r.bar)} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const DOT_TONE = { primary: 'bg-primary-container', secondary: 'bg-secondary', tertiary: 'bg-tertiary-container', muted: 'bg-primary-fixed-dim' };

export function RecentActivity() {
  const notify = useToast();
  return (
    <SectionCard
      title="Recent Activity"
      badge={<span className="h-2 w-2 animate-ping rounded-full bg-primary-container" />}
      actions={
        <button type="button" onClick={() => notify('Audit log export queued', 'info')} className="text-caption font-semibold text-primary transition-colors hover:text-primary-container">
          View Audit Log
        </button>
      }
    >
      <ol className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-surface-container">
        {recentActivity.map((item) => (
          <li key={item.id} className="relative">
            <span className={cn('absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-surface-container-lowest', DOT_TONE[item.tone])} />
            <p className="text-body-sm leading-snug text-on-surface">
              <span className="font-semibold">{item.actor}</span> {item.action}{' '}
              {item.subject && item.subjectId && (
                <Link to={`/patients/${item.subjectId}`} className={cn('font-semibold hover:underline', item.tone === 'primary' ? 'text-primary' : 'text-on-surface')}>
                  {item.subject}
                </Link>
              )}{' '}
              {item.subjectId && <span className="font-mono text-[11px] font-semibold text-on-surface-variant">({item.subjectId})</span>}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 text-caption text-on-surface-variant">
                <Clock size={12} aria-hidden />
                {item.ago}
              </span>
              <span className="rounded bg-surface-container-low px-1.5 font-mono text-[10px] text-on-surface-variant">{item.tag}</span>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
