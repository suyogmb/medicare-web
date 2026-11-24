import { useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { appointmentTraffic, type ChartRange } from '../../data/dashboard';
import { cn } from '../../lib/cn';
import { SegmentedControl } from '../ui/Controls';

const RANGES: ChartRange[] = ['1D', '1W', '1M', '1Y'];

type SeriesKey = 'completed' | 'pending' | 'cancelled';

const SERIES: { key: SeriesKey; label: string; color: string; dot: string; activePill: string }[] = [
  { key: 'completed', label: 'Completed', color: '#2d67e4', dot: 'bg-primary-container', activePill: 'bg-primary-fixed text-on-primary-fixed font-semibold' },
  { key: 'pending', label: 'Pending', color: '#5b5f65', dot: 'bg-secondary', activePill: 'bg-secondary-container text-on-secondary-fixed font-semibold' },
  { key: 'cancelled', label: 'Cancelled', color: '#ba1a1a', dot: 'bg-error', activePill: 'bg-error-container text-on-error-container font-semibold' },
];

const AXIS_TICK = { fill: '#434654', fontSize: 11, fontFamily: 'JetBrains Mono' };

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded bg-inverse-surface px-2 py-1.5 font-mono text-data-code-label text-inverse-on-surface shadow-overlay">
      <div className="mb-0.5 font-semibold">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey as string} className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          {p.value} {String(p.name)}
        </div>
      ))}
    </div>
  );
}

/** Stitch "Weekly Appointments Overview" — area for completed, dashed trend for pending. */
export function WeeklyAppointmentsChart() {
  const [range, setRange] = useState<ChartRange>('1W');
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({ completed: true, pending: true, cancelled: false });
  const { caption, points } = appointmentTraffic[range];
  const totals = SERIES.reduce(
    (acc, s) => ({ ...acc, [s.key]: points.reduce((sum, p) => sum + p[s.key], 0) }),
    {} as Record<SeriesKey, number>,
  );

  return (
    <section className="card flex flex-col gap-space-md p-space-lg">
      <div className="flex flex-col justify-between gap-space-sm pb-space-xs sm:flex-row sm:items-center">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-headline-md font-semibold tracking-tight text-on-surface">Weekly Appointments Overview</h2>
            <span className="rounded bg-surface-container-low px-2 py-0.5 font-mono text-data-code-label font-medium text-on-surface-variant">{caption}</span>
          </div>
          <span className="mt-0.5 text-caption text-on-surface-variant">Aggregated consultation traffic across outpatient &amp; specialty departments</span>
        </div>
        <SegmentedControl label="Chart range" options={RANGES} value={range} onChange={setRange} className="self-start sm:self-auto" />
      </div>

      <div className="flex flex-wrap items-center gap-space-xs">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={visible[s.key]}
            onClick={() => setVisible((v) => ({ ...v, [s.key]: !v[s.key] }))}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-data-code-label transition-colors',
              visible[s.key] ? s.activePill : 'bg-surface-container-low font-medium text-on-surface-variant hover:text-on-surface',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', s.dot, !visible[s.key] && 'opacity-50')} />
            {s.label} ({totals[s.key].toLocaleString('en-US')})
          </button>
        ))}
      </div>

      <div className="h-64 w-full pt-space-xs">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 10, right: 24, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2d67e4" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2d67e4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={8} interval="preserveStartEnd" />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#b3c5ff', strokeDasharray: '3 3' }} />
            {visible.completed && (
              <Area isAnimationActive={false}
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#2d67e4"
                strokeWidth={2.5}
                fill="url(#completedFill)"
                dot={{ r: 3, fill: '#2d67e4', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#2d67e4', stroke: '#dae1ff', strokeWidth: 4 }}
              />
            )}
            {visible.pending && (
              <Line isAnimationActive={false} type="monotone" dataKey="pending" name="Pending" stroke="#5b5f65" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 4 }} />
            )}
            {visible.cancelled && <Line isAnimationActive={false} type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ba1a1a" strokeWidth={2} dot={{ r: 2.5, fill: '#ba1a1a', strokeWidth: 0 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
