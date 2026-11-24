import type { Appointment } from '../../types';
import { NOW, addDays, dateKey, isSameDay, parseLocalIso, startOfWeek } from '../../lib/date';
import { cn } from '../../lib/cn';
import { STATUS_STYLE } from './AppointmentCard';

const HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthGridProps {
  month: Date;
  appointments: Appointment[];
  onSelectDay: (day: Date) => void;
}

/** Month overview — day cells with per-status counts; clicking drills into Day view. */
export function MonthGrid({ month, appointments, onSelectDay }: MonthGridProps) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const byDay = new Map<string, Appointment[]>();
  appointments.forEach((a) => {
    const k = dateKey(parseLocalIso(a.start));
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  });

  return (
    <div className="card overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 bg-surface-container-low/70 py-2.5 text-center">
            {HEAD.map((d) => (
              <span key={d} className="text-caption font-medium uppercase text-on-surface-variant">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-surface-container-high/40">
            {days.map((d) => {
              const inMonth = d.getMonth() === month.getMonth();
              const items = byDay.get(dateKey(d)) ?? [];
              const today = isSameDay(d, NOW);
              const counts = items.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }), {});
              return (
                <button
                  key={dateKey(d)}
                  type="button"
                  onClick={() => onSelectDay(d)}
                  className={cn('flex min-h-[96px] flex-col gap-1 bg-surface-container-lowest p-2 text-left transition-colors hover:bg-surface-container-low', !inMonth && 'bg-surface-container-low/40')}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-body-sm',
                      today ? 'bg-primary font-bold text-on-primary' : inMonth ? 'font-semibold text-on-surface' : 'text-on-surface-variant/40',
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {items.length > 0 && (
                    <>
                      <span className="font-mono text-data-code-label font-semibold text-on-surface">{items.length} appts</span>
                      <span className="flex flex-wrap gap-1">
                        {Object.entries(counts).map(([status, n]) => (
                          <span key={status} title={`${n} ${status}`} className="inline-flex items-center gap-0.5 font-mono text-[10px] text-on-surface-variant">
                            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_STYLE[status as Appointment['status']].dot)} />
                            {n}
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
