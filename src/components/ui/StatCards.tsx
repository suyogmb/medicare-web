import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type IconTone = 'primary' | 'success' | 'danger' | 'warning' | 'muted';

const ICON_TONES: Record<IconTone, string> = {
  primary: 'bg-surface-container-low text-primary-container',
  success: 'bg-success-container text-success',
  danger: 'bg-error-container/60 text-error',
  warning: 'bg-warning-container text-warning',
  muted: 'bg-surface-container-low text-on-surface-variant',
};

interface MetricCardProps {
  icon: LucideIcon;
  iconTone?: IconTone;
  label: string;
  badge?: ReactNode;
  value: ReactNode;
  valueSuffix?: ReactNode;
  valueClassName?: string;
  footnote: ReactNode;
  aside?: ReactNode;
}

/** Dashboard KPI tile (Stitch: "Total Patients", "Today's Appointments", …). */
export function MetricCard({ icon: Icon, iconTone = 'primary', label, badge, value, valueSuffix, valueClassName, footnote, aside }: MetricCardProps) {
  return (
    <div className="card flex flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-space-xs">
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', ICON_TONES[iconTone])}>
            <Icon size={18} aria-hidden />
          </div>
          <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
        </div>
        {badge}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className={cn('font-mono text-data-metric-lg font-bold text-on-surface', valueClassName)}>{value}</span>
            {valueSuffix && <span className="text-body-sm font-medium text-on-surface-variant">{valueSuffix}</span>}
          </div>
          <span className="mt-0.5 block text-caption text-on-surface-variant">{footnote}</span>
        </div>
        {aside}
      </div>
    </div>
  );
}

/** Small trend / status pill for MetricCard headers. */
export function TrendPill({ tone = 'primary', icon: Icon, children }: { tone?: 'primary' | 'neutral' | 'danger'; icon?: LucideIcon; children: ReactNode }) {
  const tones = {
    primary: 'bg-surface-container-low text-primary-container',
    neutral: 'bg-surface-container text-secondary',
    danger: 'bg-error-container text-on-error-container font-semibold',
  };
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-data-code-label font-medium', tones[tone])}>
      {Icon && <Icon size={12} strokeWidth={2.5} aria-hidden />}
      {children}
    </span>
  );
}

interface PulseStatProps {
  label: ReactNode;
  value: ReactNode;
  footnote: ReactNode;
  icon: LucideIcon;
  iconTone?: IconTone;
  critical?: boolean;
}

/** Compact registry stat (Stitch Patients / Records "pulse bar"). */
export function PulseStat({ label, value, footnote, icon: Icon, iconTone = 'primary', critical }: PulseStatProps) {
  return (
    <div className="card relative flex items-center justify-between overflow-hidden p-space-md">
      {critical && <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-error-container/30 blur-xl" />}
      <div className="flex min-w-0 flex-col">
        <span className={cn('flex items-center gap-1 text-caption font-medium uppercase tracking-wider', critical ? 'font-semibold text-error' : 'text-on-surface-variant')}>
          {critical && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-error" />}
          {label}
        </span>
        <span className={cn('mt-0.5 font-mono text-data-metric-lg font-semibold tracking-tight', critical ? 'text-error' : 'text-on-surface')}>{value}</span>
        <div className="mt-1 flex items-center gap-space-xs text-caption text-on-surface-variant">{footnote}</div>
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', ICON_TONES[iconTone])}>
        <Icon size={20} aria-hidden />
      </div>
    </div>
  );
}

interface KpiTileProps {
  label: ReactNode;
  icon: LucideIcon;
  iconTone?: IconTone;
  value: ReactNode;
  unit?: ReactNode;
  pill?: ReactNode;
  note?: ReactNode;
  /** 0–100 progress shown along the bottom edge (Stitch Prescriptions KPI tiles). */
  progress?: number;
  progressClassName?: string;
  valueClassName?: string;
}

/** KPI tile with label/icon header, mono metric, pill + note row and an optional progress rail. */
export function KpiTile({ label, icon: Icon, iconTone = 'primary', value, unit, pill, note, progress, progressClassName, valueClassName }: KpiTileProps) {
  return (
    <div className="card flex flex-col gap-space-sm p-space-lg">
      <div className="flex items-start justify-between gap-2">
        <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', ICON_TONES[iconTone])}>
          <Icon size={17} aria-hidden />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('font-mono text-data-metric-lg font-semibold tracking-tight text-on-surface', valueClassName)}>{value}</span>
        {unit && <span className="text-body-sm text-on-surface-variant">{unit}</span>}
      </div>
      {(pill || note) && (
        <div className="flex items-center justify-between gap-2 text-caption text-on-surface-variant">
          {pill}
          {note && <span className="truncate">{note}</span>}
        </div>
      )}
      {progress !== undefined && <ProgressBar value={progress} className="mt-1" barClassName={progressClassName} />}
    </div>
  );
}

/** Thin rounded progress rail used across Analytics, Settings and the Prescriptions KPI tiles. */
export function ProgressBar({ value, className, barClassName, size = 'sm' }: { value: number; className?: string; barClassName?: string; size?: 'xs' | 'sm' | 'md' }) {
  const h = size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-surface-container', h, className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full bg-primary-container transition-[width]', barClassName)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
