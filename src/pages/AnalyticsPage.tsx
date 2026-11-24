import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, BarChart3, BedDouble, ChevronRight, Download, GitCompareArrows, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { ANALYTICS_KPIS, admissionsMonthly, admissionsQuarterly, departmentLoad, doctorWorkload, satisfaction, wards, type AnalyticsRange } from '../data/analytics';
import { doctors } from '../data/doctors';
import { STAFF_STATUS_LABEL, getStaffDoctor } from '../data/staff';
import { useTable } from '../hooks/useTable';
import { downloadCsv } from '../lib/csv';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { Badge, StaffStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput, SegmentedControl, Select } from '../components/ui/Controls';
import { Pagination } from '../components/ui/Pagination';
import { SectionCard } from '../components/ui/Section';
import { ProgressBar, TrendPill } from '../components/ui/StatCards';

const RANGES: AnalyticsRange[] = ['Today', '7 Days', '30 Days'];
const AXIS_TICK = { fill: '#434654', fontSize: 11, fontFamily: 'JetBrains Mono' };
const TOOLTIP = {
  contentStyle: { background: '#2c3137', border: 'none', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11 },
  itemStyle: { color: '#eef1f9' },
  labelStyle: { color: '#eef1f9', fontWeight: 600 },
};

const money = (v: number) => `$${v.toLocaleString('en-US')}`;

/** Stitch "Hospital Analytics". */
export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('30 Days');
  const [compare, setCompare] = useState(true);
  const [granularity, setGranularity] = useState<'Monthly' | 'Quarterly'>('Monthly');
  const k = ANALYTICS_KPIS[range];

  const exportReport = () =>
    downloadCsv(`hospital-analytics-${range.replace(' ', '').toLowerCase()}.csv`, [
      { Metric: 'Total Revenue', Value: k.revenue, Delta: k.revenueDelta },
      { Metric: 'Patient Admissions', Value: k.admissions, Delta: k.admissionsDelta },
      { Metric: 'Avg Length of Stay (days)', Value: k.alos, Delta: k.alosDelta },
      { Metric: 'Readmission Rate (%)', Value: k.readmission, Delta: k.readmissionDelta },
      ...departmentLoad.map((d) => ({ Metric: `Dept load · ${d.name}`, Value: d.patients, Delta: `${d.pct}%` })),
      ...wards.map((w) => ({ Metric: `Beds · ${w.name}`, Value: `${w.occupied}/${w.total}`, Delta: `${((w.occupied / w.total) * 100).toFixed(1)}%` })),
    ]);

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      <div className="flex flex-col justify-between gap-space-md xl:flex-row xl:items-end">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-space-sm">
            <Badge tone="primary" dot>
              Intelligence &amp; Operations · Clinical &amp; Financial Performance
            </Badge>
          </div>
          <h1 className="text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">Hospital Analytics</h1>
          <p className="max-w-xl text-body-md text-on-surface-variant">Monitor hospital performance and operational insights across inpatient, outpatient, and specialty care units.</p>
        </div>
        <div className="flex flex-col items-start gap-space-sm xl:items-end">
          <SegmentedControl label="Reporting range" options={RANGES} value={range} onChange={setRange} />
          <div className="flex flex-wrap items-center gap-space-sm">
            <Button icon={GitCompareArrows} aria-pressed={compare} onClick={() => setCompare((v) => !v)} className={cn(compare && 'text-primary')}>
              Compare: Prev. Period
            </Button>
            <Button variant="primary" icon={Download} onClick={exportReport}>
              + Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Revenue" pill={<TrendPill icon={TrendingUp}>{k.revenueDelta}</TrendPill>} value={money(k.revenue)}>
          <div className="h-12 rounded-lg bg-surface-container-low px-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={k.revenueTrend.map((v) => ({ v }))} margin={{ top: 8, bottom: 8, left: 0, right: 0 }}>
                <Line isAnimationActive={false} type="monotone" dataKey="v" stroke="#2d67e4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="truncate text-caption text-on-surface-variant">
            Target: <strong className="font-mono text-on-surface">{k.revenueTarget}</strong> · Realization <strong className="font-mono text-on-surface">{k.realization}</strong>
          </span>
        </Kpi>
        <Kpi label="Patient Admissions" pill={<TrendPill icon={TrendingUp}>{k.admissionsDelta}</TrendPill>} value={k.admissions.toLocaleString('en-US')}>
          <div className="h-12 rounded-lg bg-surface-container-low px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={k.admissionsBars.map((v, i) => ({ v, i }))} margin={{ top: 6, bottom: 0, left: 0, right: 0 }}>
                <Bar isAnimationActive={false} dataKey="v" fill="#b3c5ff" radius={[2, 2, 0, 0]} activeBar={{ fill: '#2d67e4' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="truncate text-caption text-on-surface-variant">
            <strong className="font-mono text-on-surface">{k.planned.toLocaleString('en-US')}</strong> Planned · <strong className="font-mono text-on-surface">{k.emergency}</strong> Emergency
          </span>
        </Kpi>
        <Kpi
          label="Avg. Length of Stay (ALOS)"
          pill={<TrendPill icon={ArrowDown}>{k.alosDelta}</TrendPill>}
          value={
            <>
              {k.alos}
              <span className="ml-1 text-body-sm font-normal text-on-surface-variant">days</span>
            </>
          }
        >
          <div className="flex h-12 items-center rounded-lg bg-surface-container-low px-3">
            <ProgressBar value={(k.alos / 4.8) * 85} size="md" />
          </div>
          <span className="truncate text-caption text-on-surface-variant">
            Benchmark: <strong className="font-mono text-on-surface">4.8d</strong> · Fast-track: <strong className="font-mono text-on-surface">2.1d</strong>
          </span>
        </Kpi>
        <Kpi label="Readmission Rate" pill={<TrendPill icon={TrendingDown}>{k.readmissionDelta}</TrendPill>} value={`${k.readmission}%`}>
          <div className="flex h-12 flex-col justify-center gap-1 rounded-lg bg-surface-container-low px-3">
            <span className="flex justify-between text-caption text-on-surface-variant">
              Threshold Range <strong className="text-on-surface">Optimal &lt;6.5%</strong>
            </span>
            <div className="flex h-1.5 overflow-hidden rounded-full">
              <div className="bg-primary-container" style={{ width: `${(k.readmission / 10) * 100}%` }} />
              <div className="bg-surface-container" style={{ width: `${((6.5 - k.readmission) / 10) * 100}%` }} />
              <div className="flex-1 bg-error" />
            </div>
          </div>
          <span className="truncate text-caption text-on-surface-variant">
            National avg: <strong className="font-mono text-on-surface">7.8%</strong> · 30-day post-op
          </span>
        </Kpi>
      </div>

      <div className="grid grid-cols-1 gap-space-xl xl:grid-cols-12">
        <AdmissionsTrend compare={compare} granularity={granularity} onGranularity={setGranularity} />
        <SectionCard
          className="xl:col-span-4"
          title="Department Load"
          subtitle="Clinical consultation & capacity usage"
          actions={<BarChart3 size={18} className="text-primary" aria-hidden />}
          bodyClassName="flex h-full flex-col gap-space-md"
        >
          {departmentLoad.map((d) => (
            <div key={d.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-body-sm">
                <span className={cn('flex items-center gap-1.5', d.alert ? 'font-semibold text-error' : 'text-on-surface')}>
                  {d.name}
                  {d.alert && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />}
                </span>
                <span className="flex items-center gap-2 font-mono">
                  <strong className={d.alert ? 'text-error' : 'text-on-surface'}>{d.patients} pts</strong>
                  {d.alert ? <Badge tone="danger">{d.pct}% Alert</Badge> : <span className="text-data-code-label text-on-surface-variant">{d.pct}%</span>}
                </span>
              </div>
              <ProgressBar value={d.pct} size="md" barClassName={d.alert ? 'bg-error' : undefined} />
            </div>
          ))}
          <div className="mt-auto flex justify-between rounded-lg bg-surface-container-low px-3 py-2 font-mono text-data-code-label text-on-surface-variant">
            <span>
              Outpatient ratio: <strong className="text-on-surface">62.4%</strong>
            </span>
            <span>
              Inpatient ratio: <strong className="text-on-surface">37.6%</strong>
            </span>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-space-xl xl:grid-cols-12">
        <SectionCard
          className="xl:col-span-5"
          title="Patient Satisfaction"
          subtitle="Net Promoter Score & care evaluation"
          actions={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <ShieldCheck size={17} aria-hidden />
            </span>
          }
          bodyClassName="flex flex-col gap-space-md"
        >
          <div className="flex items-center justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md">
            <div className="flex flex-col">
              <span className="text-caption text-on-surface-variant">Overall Care Index</span>
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-data-metric-lg font-bold text-on-surface">{satisfaction.index}%</span>
                <span className="font-mono text-data-code-label font-semibold text-primary">{satisfaction.delta}</span>
              </span>
            </div>
            <div className="h-10 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={satisfaction.trend.map((v) => ({ v }))}>
                  <Line isAnimationActive={false} type="monotone" dataKey="v" stroke="#2d67e4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {satisfaction.breakdown.map((b) => (
            <div key={b.label} className="flex flex-col gap-1">
              <span className="flex justify-between text-body-sm">
                <span className="text-on-surface">{b.label}</span>
                <span className="font-mono font-semibold text-on-surface">{b.pct}%</span>
              </span>
              <ProgressBar value={b.pct} size="md" barClassName={b.muted ? 'bg-secondary' : undefined} />
            </div>
          ))}
          <p className="flex items-center gap-1.5 text-caption text-on-surface-variant">
            <Sparkles size={14} className="text-primary" aria-hidden /> Sampled across {satisfaction.surveys.toLocaleString('en-US')} validated patient post-discharge surveys.
          </p>
        </SectionCard>

        <SectionCard
          className="xl:col-span-7"
          title="Bed Occupancy Overview"
          subtitle="Available vs occupied beds categorized by hospital wing"
          badge={null}
          actions={
            <Badge tone="info" dot>
              {wards.reduce((s, w) => s + w.occupied, 0)} / {wards.reduce((s, w) => s + w.total, 0)} Beds (
              {((wards.reduce((s, w) => s + w.occupied, 0) / wards.reduce((s, w) => s + w.total, 0)) * 100).toFixed(1)}% Total)
            </Badge>
          }
          bodyClassName="flex flex-col gap-space-md"
        >
          <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2">
            {wards.map((w) => {
              const pct = (w.occupied / w.total) * 100;
              const high = pct >= 90;
              return (
                <div key={w.name} className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-space-md">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex flex-col">
                      <span className="text-body-sm font-semibold text-on-surface">{w.name}</span>
                      <span className="text-caption text-on-surface-variant">{w.location}</span>
                    </span>
                    <Badge tone={high ? 'danger' : pct < 80 ? 'primary' : 'neutral'}>
                      {Number.isInteger(pct) ? pct : pct.toFixed(1)}% {w.label}
                    </Badge>
                  </div>
                  <span className="flex justify-between font-mono text-data-code-label">
                    <strong className="text-on-surface">{w.occupied} Occupied</strong>
                    <span className="text-on-surface-variant">{w.total - w.occupied} Available</span>
                  </span>
                  <ProgressBar value={pct} size="md" barClassName={high ? 'bg-error' : undefined} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-body-sm">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <BedDouble size={15} className="text-primary" aria-hidden /> Total available beds:{' '}
              <strong className="font-mono text-on-surface">{wards.reduce((s, w) => s + w.total - w.occupied, 0)} beds</strong>
            </span>
            <Link to="/patients" className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">
              Manage Ward Allotment <ChevronRight size={15} aria-hidden />
            </Link>
          </div>
        </SectionCard>
      </div>

      <DoctorWorkloadTable />
    </div>
  );
}

function Kpi({ label, pill, value, children }: { label: string; pill: ReactNode; value: ReactNode; children: ReactNode }) {
  return (
    <div className="card flex flex-col gap-space-sm p-space-lg">
      <div className="flex items-start justify-between gap-2">
        <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
        {pill}
      </div>
      <span className="font-mono text-data-metric-lg font-semibold tracking-tight text-on-surface">{value}</span>
      {children}
    </div>
  );
}

function AdmissionsTrend({ compare, granularity, onGranularity }: { compare: boolean; granularity: 'Monthly' | 'Quarterly'; onGranularity: (g: 'Monthly' | 'Quarterly') => void }) {
  const data = granularity === 'Monthly' ? admissionsMonthly : admissionsQuarterly;
  const values = admissionsMonthly.map((m) => m.current ?? 0);
  const peakIdx = values.indexOf(Math.max(...values));
  const filled = values.filter(Boolean);
  const avg = Math.round(filled.reduce((s, v) => s + v, 0) / filled.length);

  return (
    <SectionCard
      className="xl:col-span-8"
      title="Admissions Trend"
      subtitle="Monthly inpatient and outpatient admissions volume compared to previous fiscal period."
      actions={
        <div className="flex flex-col items-end gap-space-xs">
          <div className="flex items-center gap-space-md font-mono text-data-code-label text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-primary-container" /> 2026 Current
            </span>
            {compare && (
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-outline" /> 2025 Prev
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border-2 border-primary-fixed-dim" /> Target
            </span>
          </div>
          <SegmentedControl label="Granularity" options={['Monthly', 'Quarterly'] as const} value={granularity} onChange={onGranularity} />
        </div>
      }
      bodyClassName="flex flex-col gap-space-md"
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="admFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2d67e4" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#2d67e4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => v.toLocaleString('en-US')} />
            <Tooltip {...TOOLTIP} formatter={(v: number, n: string) => [`${v?.toLocaleString('en-US') ?? '—'} pts`, n]} />
            <Line isAnimationActive={false} type="monotone" dataKey="target" name="Target" stroke="#b3c5ff" strokeWidth={1.5} strokeDasharray="2 4" dot={false} />
            {compare && <Line isAnimationActive={false} type="monotone" dataKey="previous" name="2025 Prev" stroke="#737686" strokeWidth={2} strokeDasharray="4 4" dot={false} />}
            <Area isAnimationActive={false} type="monotone" dataKey="current" name="2026 Current" stroke="#2d67e4" strokeWidth={2.5} fill="url(#admFill)" dot={{ r: 3, fill: '#fff', stroke: '#2d67e4', strokeWidth: 2 }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 gap-space-sm rounded-xl bg-surface-container-low p-space-md sm:grid-cols-3">
        <MiniStat label={`Peak Volume (${admissionsMonthly[peakIdx].label})`} value={values[peakIdx].toLocaleString('en-US')} unit="pts" />
        <MiniStat label="Avg. Monthly Volume" value={avg.toLocaleString('en-US')} unit="pts" />
        <MiniStat label="YoY Admissions Growth" value="+8.6%" unit="expansion" accent />
      </div>
    </SectionCard>
  );
}

function MiniStat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-caption text-on-surface-variant">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={cn('font-mono text-data-metric-md font-semibold', accent ? 'text-primary' : 'text-on-surface')}>{value}</span>
        <span className="text-caption text-on-surface-variant">{unit}</span>
      </span>
    </div>
  );
}

function DoctorWorkloadTable() {
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('All');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors
      .filter((d) => dept === 'All' || d.department === dept)
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.department.toLowerCase().includes(q) || d.title.toLowerCase().includes(q));
  }, [query, dept]);
  const table = useTable({ rows, pageSize: 6, getId: (d) => d.id, resetKeys: [query, dept] });

  return (
    <section className="card flex flex-col overflow-hidden">
      <div className="flex flex-col justify-between gap-space-md p-space-lg lg:flex-row lg:items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-headline-md font-semibold tracking-tight text-on-surface">Doctor Workload &amp; Utilization</h2>
            <Badge tone="neutral">{doctors.length} Staff Active</Badge>
          </div>
          <span className="mt-0.5 text-caption text-on-surface-variant">Tracking clinician consultation quotas, scheduled hours, and real-time availability.</span>
        </div>
        <div className="flex flex-col gap-space-sm sm:flex-row">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search doctor name or specialty..." aria-label="Search doctors" wrapperClassName="sm:w-64" />
          <Select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="All">Dept: All Specialties</option>
            {[...new Set(doctors.map((d) => d.department))].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="th py-3">Doctor Name &amp; Profile</th>
              <th className="th">Department</th>
              <th className="th text-right">Appointments</th>
              <th className="th text-right">Avg Hours / Day</th>
              <th className="th">Utilization</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-body-sm">
            {table.pageRows.map((d) => {
              const w = doctorWorkload[d.id];
              const staff = getStaffDoctor(d.id);
              return (
                <tr key={d.id} className="transition-colors hover:bg-surface-container-low/50">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-space-sm">
                      <Avatar name={d.name} size="sm" />
                      <span className="flex flex-col">
                        <span className="font-semibold text-on-surface">{d.name}</span>
                        <span className="text-caption text-on-surface-variant">{d.title}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-on-surface">{d.department}</td>
                  <td className="px-3 py-3 text-right font-mono text-data-mono-body">{w.appointments}</td>
                  <td className="px-3 py-3 text-right font-mono text-data-mono-body">{w.hours} hrs</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <ProgressBar value={w.utilization} className="w-24" barClassName={w.utilization < 70 ? 'bg-secondary' : undefined} />
                      <span className="font-mono text-data-code-label text-on-surface">{w.utilization}%</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">{staff && <StaffStatusBadge status={staff.status} label={staff.status === 'Away' ? 'On Leave' : STAFF_STATUS_LABEL[staff.status].replace(' On-Site', '')} />}</td>
                  <td className="px-3 py-3 text-right">
                    <Link to={staff?.status === 'Away' ? '/appointments' : `/doctors/${d.id}`} className="font-semibold text-primary hover:underline">
                      {staff?.status === 'Away' ? 'Reassign' : 'View Schedule'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-space-sm bg-surface-container-low/60 px-space-lg py-space-md sm:flex-row">
        <span className="text-body-sm text-on-surface-variant">
          Showing <strong className="text-on-surface">{table.pageRows.length} of {rows.length}</strong> attending physicians
        </span>
        <Pagination page={table.page} pageCount={table.pageCount} onPageChange={table.setPage} />
      </div>
    </section>
  );
}
