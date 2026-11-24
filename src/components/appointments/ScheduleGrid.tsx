import { Plus } from 'lucide-react';
import type { Appointment, Patient } from '../../types';
import { NOW, WEEKDAYS_SHORT, dateKey, formatTime, isSameDay, parseLocalIso, toLocalIso } from '../../lib/date';
import { cn } from '../../lib/cn';
import { AppointmentCard } from './AppointmentCard';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const HANDOVER_HOUR = 12;
const CLOSE_HOUR = 17;

interface ScheduleGridProps {
  days: Date[];
  appointments: Appointment[];
  getPatient: (id: string) => Patient | undefined;
  onOpenSlot: (startIso: string) => void;
}

const hourLabel = (h: number) => formatTime(new Date(2026, 0, 1, h, 0));

/** Stitch "Triage & Scheduling Grid" — time-slot rows × day columns. Works for 1 (day) or 7 (week) columns. */
export function ScheduleGrid({ days, appointments, getPatient, onOpenSlot }: ScheduleGridProps) {
  const byCell = new Map<string, Appointment[]>();
  appointments.forEach((a) => {
    const d = parseLocalIso(a.start);
    const key = `${dateKey(d)}|${d.getHours()}`;
    byCell.set(key, [...(byCell.get(key) ?? []), a]);
  });

  const single = days.length === 1;
  const cols = { gridTemplateColumns: single ? '88px minmax(0,1fr)' : `64px repeat(${days.length}, minmax(0,1fr))` };
  const nowHour = NOW.getHours();
  const todayInView = days.some((d) => isSameDay(d, NOW));

  return (
    <div className="card overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <div className={cn(!single && 'min-w-[720px]')}>
          {/* Day header */}
          <div className="grid bg-surface-container-low/70 py-3 text-center" style={cols}>
            <div className="flex items-center justify-center font-mono text-data-code-label font-bold uppercase text-on-surface-variant">Time Slot</div>
            {days.map((d) => {
              const today = isSameDay(d, NOW);
              return (
                <div key={dateKey(d)} className="relative flex flex-col items-center">
                  {today && <span className="absolute -top-1 h-1 w-8 rounded-full bg-primary" />}
                  <span className={cn('text-caption uppercase', today ? 'font-bold text-primary' : 'font-medium text-on-surface-variant')}>
                    {WEEKDAYS_SHORT[d.getDay()]}
                    {today && ' · Today'}
                  </span>
                  {today ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-headline-sm font-bold text-on-primary shadow-sm">{d.getDate()}</span>
                  ) : (
                    <span className="text-headline-sm font-semibold text-on-surface">{d.getDate()}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          <div className="divide-y divide-surface-container-high/40">
            {HOURS.map((hour) => {
              if (hour === HANDOVER_HOUR) {
                return (
                  <div key={hour} className="grid min-h-[50px] bg-surface-container-low/40" style={cols}>
                    <div className="px-3 py-2 text-right font-mono text-data-code-label text-on-surface-variant">{hourLabel(hour)}</div>
                    <div className="flex items-center justify-center px-2 text-center" style={{ gridColumn: `span ${days.length}` }}>
                      <span className="text-caption font-medium uppercase tracking-wide text-on-surface-variant">Midday Shift Handover &amp; Sterilization Window</span>
                    </div>
                  </div>
                );
              }
              const showNowLine = todayInView && hour === nowHour;
              return (
                <div key={hour} className={cn('relative grid transition-colors hover:bg-surface-container-low/30', hour === CLOSE_HOUR ? 'min-h-[52px]' : 'min-h-[76px]')} style={cols}>
                  <div className="px-3 py-2.5 text-right font-mono text-data-code-label text-on-surface-variant">{hourLabel(hour)}</div>
                  {days.map((d) => {
                    const items = byCell.get(`${dateKey(d)}|${hour}`) ?? [];
                    const slotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0);
                    const bookable = hour < CLOSE_HOUR && slotStart.getTime() + 3600_000 > NOW.getTime() && d.getDay() !== 0;
                    const highlightOpen = single || isSameDay(d, NOW);
                    return (
                      <div key={dateKey(d)} className="group/cell flex flex-col gap-1 p-1">
                        {items.map((a) => {
                          const patient = getPatient(a.patientId);
                          return patient ? <AppointmentCard key={a.id} appointment={a} patient={patient} compact={!single} /> : null;
                        })}
                        {hour === CLOSE_HOUR && isSameDay(d, NOW) && (
                          <span className="flex flex-1 items-center justify-center text-caption font-medium text-on-surface-variant/60">Shift Closes</span>
                        )}
                        {items.length === 0 && bookable && (
                          <button
                            type="button"
                            onClick={() => onOpenSlot(toLocalIso(slotStart))}
                            aria-label={`Book open slot ${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} at ${hourLabel(hour)}`}
                            className={cn(
                              'flex flex-1 items-center justify-center gap-1 rounded-xl p-2 text-caption font-medium text-on-surface-variant transition-all hover:bg-surface-container-low hover:text-primary focus:opacity-100',
                              highlightOpen ? 'opacity-100' : 'opacity-0 group-hover/cell:opacity-100',
                            )}
                          >
                            <Plus size={14} aria-hidden /> Slot Open
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {showNowLine && (
                    <div className="pointer-events-none absolute left-0 right-0 z-20 flex items-center" style={{ top: `${(NOW.getMinutes() / 60) * 100}%` }}>
                      <div className="w-[64px] whitespace-nowrap bg-surface-container-lowest/80 pr-1 text-right font-mono text-[10px] font-bold text-error">{formatTime(NOW)}</div>
                      <div className="h-[2px] flex-1 bg-error" />
                      <div className="-ml-1.5 h-2.5 w-2.5 rounded-full bg-error shadow" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
