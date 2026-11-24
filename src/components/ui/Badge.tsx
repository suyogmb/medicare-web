import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { AppointmentStatus, PatientStatus, PrescriptionStatus, RecordStatus, StaffStatus } from '../../types';

export type BadgeTone = 'primary' | 'solid' | 'success' | 'warning' | 'danger' | 'neutral' | 'muted' | 'info';

const TONES: Record<BadgeTone, { pill: string; dot: string }> = {
  primary: { pill: 'bg-primary-fixed text-on-primary-fixed', dot: 'bg-primary' },
  solid: { pill: 'bg-primary text-on-primary', dot: 'bg-surface-bright' },
  info: { pill: 'bg-surface-container-high text-primary', dot: 'bg-primary' },
  success: { pill: 'bg-success-container text-success', dot: 'bg-success' },
  warning: { pill: 'bg-warning-container text-warning', dot: 'bg-warning' },
  danger: { pill: 'bg-danger-container text-danger', dot: 'bg-danger' },
  neutral: { pill: 'bg-surface-container text-on-surface-variant', dot: 'bg-on-surface-variant/50' },
  muted: { pill: 'bg-surface-container text-on-surface-variant', dot: 'bg-outline' },
};

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}

/** Pill badge — Stitch `rounded-full px-2.5 py-0.5 font-data-code-label`. */
export function Badge({ tone = 'neutral', dot, pulse, icon: Icon, className, children }: BadgeProps) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-data-code-label font-semibold',
        t.pill,
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', t.dot)} />}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', t.dot)} />
        </span>
      )}
      {Icon && <Icon size={12} strokeWidth={2.5} aria-hidden />}
      {children}
    </span>
  );
}

/** Small mono tag (Stitch `rounded bg-surface-container font-data-code-label`), e.g. department chips. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block whitespace-nowrap rounded bg-surface-container px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant', className)}>
      {children}
    </span>
  );
}

const PATIENT_TONE: Record<PatientStatus, BadgeTone> = {
  Active: 'success',
  Critical: 'danger',
  Pending: 'warning',
  Inactive: 'neutral',
  Discharged: 'muted',
};

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return (
    <Badge tone={PATIENT_TONE[status]} dot pulse={status === 'Critical'}>
      {status}
    </Badge>
  );
}

/** Appointment palette follows the Stitch Appointment Management screen (status strip + slot cards). */
export const APPOINTMENT_TONE: Record<AppointmentStatus, BadgeTone> = {
  Confirmed: 'success',
  'In Progress': 'solid',
  Pending: 'warning',
  Completed: 'info',
  Cancelled: 'danger',
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge tone={APPOINTMENT_TONE[status]} dot pulse={status === 'In Progress'}>
      {status}
    </Badge>
  );
}

const RECORD_TONE: Record<RecordStatus, BadgeTone> = {
  Verified: 'info',
  'Pending Review': 'warning',
  Flagged: 'danger',
};

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  return (
    <Badge tone={RECORD_TONE[status]} dot>
      {status}
    </Badge>
  );
}

const RX_TONE: Record<PrescriptionStatus, BadgeTone> = {
  Active: 'primary',
  'Refill Due': 'warning',
  Completed: 'muted',
  Expired: 'danger',
};

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  return (
    <Badge tone={RX_TONE[status]} dot pulse={status === 'Refill Due'}>
      {status}
    </Badge>
  );
}

export const STAFF_TONE: Record<StaffStatus, BadgeTone> = {
  Available: 'primary',
  'In Consultation': 'neutral',
  'In Surgery': 'danger',
  'On Duty': 'solid',
  Away: 'muted',
};

export function StaffStatusBadge({ status, label }: { status: StaffStatus; label?: string }) {
  return (
    <Badge tone={STAFF_TONE[status]} dot pulse={status === 'In Surgery'}>
      {label ?? status}
    </Badge>
  );
}
