import { useNavigate } from 'react-router-dom';
import type { Appointment, AppointmentStatus, Patient } from '../../types';
import { getDoctor } from '../../data/doctors';
import { formatTime, parseLocalIso } from '../../lib/date';
import { cn } from '../../lib/cn';

export const STATUS_STYLE: Record<AppointmentStatus, { bar: string; text: string; pill: string; hover: string; dot: string }> = {
  Confirmed: { bar: 'bg-success', text: 'text-success', pill: 'bg-success-container text-success', hover: 'hover:bg-success-container', dot: 'bg-success' },
  'In Progress': { bar: 'bg-primary-container', text: 'text-primary', pill: 'bg-primary text-on-primary', hover: 'hover:bg-primary-fixed/40', dot: 'bg-primary-container' },
  Pending: { bar: 'bg-warning', text: 'text-warning', pill: 'bg-warning-container text-warning', hover: 'hover:bg-warning-container', dot: 'bg-warning' },
  Completed: { bar: 'bg-primary', text: 'text-primary', pill: 'bg-primary-fixed/70 text-primary', hover: 'hover:bg-primary-fixed/40', dot: 'bg-primary' },
  Cancelled: { bar: 'bg-danger', text: 'text-danger', pill: 'bg-danger-container text-danger', hover: '', dot: 'bg-danger' },
};

interface AppointmentCardProps {
  appointment: Appointment;
  patient: Patient;
  compact?: boolean;
}

/** Slot card from the Stitch scheduling grid (left status bar, mono time, status pill). */
export function AppointmentCard({ appointment, patient, compact }: AppointmentCardProps) {
  const navigate = useNavigate();
  const s = STATUS_STYLE[appointment.status];
  const cancelled = appointment.status === 'Cancelled';
  const doctor = getDoctor(appointment.doctorId);
  const time = formatTime(parseLocalIso(appointment.start));

  return (
    <button
      type="button"
      onClick={() => navigate(`/patients/${patient.id}`)}
      title={`${patient.name} · ${time} · ${appointment.durationMin}m · ${appointment.status}`}
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-xl p-2.5 text-left shadow-sm transition-all',
        cancelled ? 'bg-surface-container-low opacity-75 hover:opacity-100' : cn('bg-surface-container-lowest', s.hover),
        appointment.status === 'In Progress' && 'bg-primary-fixed/30 ring-1 ring-primary-container/30',
      )}
    >
      <span className={cn('absolute left-0 top-0 h-full w-1', s.bar)} />
      <span className={cn('flex flex-wrap items-center justify-between gap-1 pl-1', compact && 'flex-col items-start')}>
        <span className={cn('whitespace-nowrap font-mono text-data-code-label font-semibold', s.text)}>
          {compact ? time : `${time} · ${appointment.durationMin}m`}
        </span>
        <span className={cn('whitespace-nowrap rounded-full px-1.5 font-mono text-[10px] font-bold', s.pill)}>{appointment.status}</span>
      </span>
      <span className="mt-1 pl-1">
        <span className={cn('block truncate text-body-sm transition-colors', cancelled ? 'font-semibold text-on-surface-variant line-through' : 'font-bold text-on-surface group-hover:text-primary')}>
          {patient.name}
        </span>
        <span className="block truncate text-caption text-on-surface-variant">
          {appointment.department} · {appointment.note ?? doctor.shortName}
        </span>
      </span>
    </button>
  );
}
