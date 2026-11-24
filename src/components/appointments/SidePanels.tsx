import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowRight, BarChart3, ChevronLeft, ChevronRight, ListFilter, Stethoscope } from 'lucide-react';
import type { Appointment, AppointmentStatus, Patient } from '../../types';
import { doctors, getDoctor } from '../../data/doctors';
import { MONTHS_LONG, NOW, addDays, dateKey, formatLongDate, formatTime, isSameDay, parseLocalIso } from '../../lib/date';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/Button';
import { SectionCard } from '../ui/Section';
import { DoctorAvailabilityRow } from '../patient-details/PatientPanels';
import { STATUS_STYLE } from './AppointmentCard';

/* ------------------------------- Mini calendar ------------------------------ */

interface MiniCalendarProps {
  selected: Date;
  onSelect: (d: Date) => void;
  busyDays: Set<string>;
}

export function MiniCalendar({ selected, onSelect, busyDays }: MiniCalendarProps) {
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(first, -first.getDay()); // Sunday-first like Stitch
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, i) => addDays(gridStart, i));

  return (
    <SectionCard
      size="sm"
      title={`${MONTHS_LONG[month.getMonth()]} ${month.getFullYear()}`}
      actions={
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
          <IconButton icon={ChevronRight} label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-x-1 gap-y-2 text-center text-body-sm">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d} className="py-1 font-mono text-data-code-label font-bold uppercase text-on-surface-variant">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const isSelected = isSameDay(d, selected);
          const isToday = isSameDay(d, NOW);
          return (
            <button
              key={dateKey(d)}
              type="button"
              onClick={() => onSelect(d)}
              aria-pressed={isSelected}
              aria-label={formatLongDate(d)}
              className={cn(
                'relative flex h-8 items-center justify-center rounded-lg transition-colors',
                isSelected ? 'bg-primary font-bold text-on-primary shadow-sm' : inMonth ? 'text-on-surface hover:bg-surface-container' : 'text-on-surface-variant/40 hover:bg-surface-container',
                isToday && !isSelected && 'font-bold text-primary ring-1 ring-primary/40',
              )}
            >
              {d.getDate()}
              {busyDays.has(dateKey(d)) && <span className={cn('absolute bottom-1 h-1 w-1 rounded-full', isSelected ? 'bg-on-primary' : 'bg-primary-container/60')} />}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ---------------------------- Doctor availability --------------------------- */

export function DoctorAvailabilityCard() {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? doctors : doctors.slice(0, 3);
  return (
    <SectionCard
      size="sm"
      icon={Stethoscope}
      title="Doctor Availability"
      actions={
        <button type="button" onClick={() => setShowAll((v) => !v)} className="font-mono text-data-code-label font-semibold text-on-surface-variant hover:text-primary">
          {showAll ? 'Wing 3B · All' : 'Wing 3B'}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        {list.map((d) => (
          <DoctorAvailabilityRow key={d.id} doctor={d} />
        ))}
      </div>
    </SectionCard>
  );
}

/* --------------------------------- Queue list -------------------------------- */

const QUEUE_FILTERS: Array<'All' | AppointmentStatus> = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

interface QueueListProps {
  day: Date;
  appointments: Appointment[];
  getPatient: (id: string) => Patient | undefined;
}

/** Stitch "Today's Schedule" realtime queue. */
export function QueueList({ day, appointments, getPatient }: QueueListProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<(typeof QUEUE_FILTERS)[number]>('All');
  const items = appointments.filter((a) => filter === 'All' || a.status === filter);
  const visible = expanded ? items : items.slice(0, 7);
  const today = isSameDay(day, NOW);

  return (
    <SectionCard
      size="sm"
      title={today ? "Today's Schedule" : 'Day Schedule'}
      badge={<span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-data-code-label font-bold text-primary">{appointments.length} total</span>}
      actions={
        <label className="relative flex items-center">
          <span className="sr-only">Filter queue by status</span>
          <ListFilter size={17} className={cn('pointer-events-none absolute left-1.5', filter !== 'All' ? 'text-primary' : 'text-on-surface-variant')} aria-hidden />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="cursor-pointer appearance-none rounded-lg bg-transparent py-1 pl-7 pr-1 text-caption font-medium text-on-surface-variant hover:bg-surface-container focus:outline-none"
          >
            {QUEUE_FILTERS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      }
    >
      <p className="-mt-1 mb-2 text-caption text-on-surface-variant">
        {today ? 'Showing realtime patient queue for ' : 'Showing patient queue for '}
        {formatLongDate(day)}.
      </p>
      <ul className={cn('flex flex-col divide-y divide-surface-container-high/40 pr-1', expanded && 'max-h-[460px] overflow-y-auto')}>
        {visible.map((a) => {
          const patient = getPatient(a.patientId);
          if (!patient) return null;
          const s = STATUS_STYLE[a.status];
          const cancelled = a.status === 'Cancelled';
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-surface-container-low/50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="relative shrink-0">
                    <Avatar name={patient.name} />
                    <span className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface-container-lowest', s.dot)} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5">
                      <span className={cn('truncate text-body-sm font-bold', cancelled ? 'text-on-surface-variant line-through' : 'text-on-surface')}>{patient.name}</span>
                      <span className="hidden shrink-0 font-mono text-data-code-label text-on-surface-variant sm:inline">#{patient.id}</span>
                    </span>
                    <span className="truncate text-caption text-on-surface-variant">
                      {a.department} · {a.note ?? getDoctor(a.doctorId).name}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={cn('block font-mono text-data-code-label font-bold', cancelled ? 'text-on-surface-variant line-through' : 'text-on-surface')}>
                    {formatTime(parseLocalIso(a.start))}
                  </span>
                  <span className={cn('rounded px-1.5 font-mono text-[10px] font-semibold', s.pill)}>{a.status}</span>
                </span>
              </button>
            </li>
          );
        })}
        {items.length === 0 && <li className="py-6 text-center text-body-sm text-on-surface-variant">No appointments in this view.</li>}
      </ul>
      {items.length > 7 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-container-low py-2.5 text-body-sm font-semibold text-primary transition-colors hover:bg-surface-container"
        >
          {expanded ? 'Show Less' : `View All ${items.length} Records`}
          <ArrowRight size={15} className={cn('transition-transform', expanded && '-rotate-90')} aria-hidden />
        </button>
      )}
    </SectionCard>
  );
}

/* ------------------------------ Hourly load chart ----------------------------- */

export function HourlyLoadChart({ appointments }: { appointments: Appointment[] }) {
  const data = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour: formatTime(new Date(2026, 0, 1, hour, 0)),
      visits: appointments.filter((a) => a.status !== 'Cancelled' && parseLocalIso(a.start).getHours() === hour).length,
    };
  });
  const peak = data.reduce((m, d) => (d.visits > m.visits ? d : m), data[0]);
  const labels = [data[0], data[2], data[4], data[6], data[9]];

  return (
    <SectionCard
      size="sm"
      icon={BarChart3}
      title="Hourly Queue Load & Staffing Ratio"
      actions={<span className="font-mono text-data-code-label font-medium text-on-surface-variant">Optimal Band: 1-3 visits/hr</span>}
    >
      <div className="h-24 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#004dc6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#004dc6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceArea y1={1} y2={3} fill="#f0f3fc" fillOpacity={0.7} />
            <XAxis dataKey="hour" hide />
            <Tooltip
              formatter={(v: number) => [`${v} visits`, 'Load']}
              contentStyle={{ background: '#2c3137', border: 'none', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11 }}
              itemStyle={{ color: '#eef1f9' }}
              labelStyle={{ color: '#eef1f9' }}
            />
            <Area isAnimationActive={false} type="monotone" dataKey="visits" stroke="#004dc6" strokeWidth={2.5} fill="url(#loadFill)" dot={{ r: 3, fill: '#004dc6', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between gap-2 overflow-x-auto px-1 pt-1 font-mono text-data-code-label text-on-surface-variant">
        {labels.map((d) => (
          <span key={d.hour} className={cn('whitespace-nowrap', d === peak && 'font-semibold text-primary')}>
            {d.hour} ({d === peak ? `Peak · ${d.visits}` : d.visits})
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
