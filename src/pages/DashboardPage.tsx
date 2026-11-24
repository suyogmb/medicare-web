import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUp, Calendar, CalendarClock, ChevronDown, SlidersHorizontal, Siren, Stethoscope, TrendingUp, UserPlus, Users } from 'lucide-react';
import { useClinicalData } from '../context/ClinicalDataContext';
import { doctors } from '../data/doctors';
import { NOW, formatDate, formatLongDate, isSameDay, parseLocalIso } from '../lib/date';
import { formatNumber, initials, padCount } from '../lib/format';
import { Button } from '../components/ui/Button';
import { MetricCard, TrendPill } from '../components/ui/StatCards';
import { WeeklyAppointmentsChart } from '../components/dashboard/WeeklyAppointmentsChart';
import { TodayAppointmentsTable } from '../components/dashboard/TodayAppointmentsTable';
import { Demographics, HospitalPerformance, RecentActivity } from '../components/dashboard/SidePanels';
import { PatientIntakeModal } from '../components/patients/PatientIntakeModal';

const STACK_TONES = ['bg-primary text-on-primary', 'bg-secondary text-on-secondary', 'bg-tertiary text-on-tertiary'];

function Sparkline() {
  return (
    <svg viewBox="0 0 96 32" className="h-8 w-24 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d67e4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2d67e4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M2 26 C 12 22, 18 24, 26 20 S 40 22, 48 16 S 62 18, 70 12 S 84 10, 94 4 L94 32 L2 32 Z" fill="url(#spark)" />
      <path d="M2 26 C 12 22, 18 24, 26 20 S 40 22, 48 16 S 62 18, 70 12 S 84 10, 94 4" fill="none" stroke="#2d67e4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardPage() {
  const { patients, appointments } = useClinicalData();
  const navigate = useNavigate();
  const [intakeOpen, setIntakeOpen] = useState(false);

  const stats = useMemo(() => {
    const today = appointments.filter((a) => isSameDay(parseLocalIso(a.start), NOW));
    const morning = today.filter((a) => parseLocalIso(a.start).getHours() < 12).length;
    const critical = patients.filter((p) => p.status === 'Critical');
    const icu = critical.filter((p) => p.unit.includes('Cardiology')).length;
    const onDuty = doctors.filter((d) => d.availability !== 'Off Duty');
    return { today: today.length, morning, evening: today.length - morning, critical: critical.length, icu, ccu: critical.length - icu, onDuty };
  }, [patients, appointments]);

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      {/* Greeting header */}
      <div className="card flex flex-col justify-between gap-space-md p-space-lg md:flex-row md:items-center">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-space-xs">
            <h1 className="text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">Good Morning, Dr. Sarah</h1>
            <span className="inline-flex items-center rounded-full bg-primary-fixed px-2 py-0.5 font-mono text-data-code-label font-semibold text-on-primary-fixed">Shift Lead</span>
          </div>
          <p className="mt-0.5 text-body-md text-on-surface-variant">Here&apos;s what&apos;s happening at your hospital today · {formatLongDate(NOW)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <Button variant="tonal" icon={Calendar} trailingIcon={ChevronDown} onClick={() => navigate('/appointments')}>
            {formatDate(NOW).replace(/ 0(\d),/, ' $1,')}
          </Button>
          <Button variant="tonal" icon={SlidersHorizontal} onClick={() => navigate('/patients')}>
            Filter View
          </Button>
          <Button variant="primary" icon={UserPlus} onClick={() => setIntakeOpen(true)}>
            + Add New Patient
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total Patients"
          badge={<TrendPill icon={TrendingUp}>+4.2%</TrendPill>}
          value={formatNumber(patients.length)}
          footnote="vs last month"
          aside={<Sparkline />}
        />
        <MetricCard
          icon={CalendarClock}
          label="Today's Appointments"
          badge={<TrendPill icon={ArrowUp}>+12%</TrendPill>}
          value={stats.today}
          footnote={`${stats.morning} morning · ${stats.evening} afternoon`}
          aside={
            <span className="shrink-0 font-mono text-data-code-label text-on-surface-variant">
              Avg. wait: <span className="font-semibold text-on-surface">14m</span>
            </span>
          }
        />
        <MetricCard
          icon={Stethoscope}
          label="Available Doctors"
          badge={<TrendPill tone="neutral">0% vs last week</TrendPill>}
          value={stats.onDuty.length}
          valueSuffix={`/ ${doctors.length}`}
          footnote={`${Math.round((stats.onDuty.length / doctors.length) * 100)}% capacity deployed`}
          aside={
            <div className="flex -space-x-1.5">
              {stats.onDuty.slice(0, 3).map((d, i) => (
                <span key={d.id} title={d.name} className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold ring-2 ring-surface-container-lowest ${STACK_TONES[i]}`}>
                  {initials(d.name)}
                </span>
              ))}
            </div>
          }
        />
        <MetricCard
          icon={Siren}
          iconTone="danger"
          label="Critical Patients"
          badge={
            <TrendPill tone="danger" icon={AlertCircle}>
              Alert
            </TrendPill>
          }
          value={padCount(stats.critical)}
          valueClassName="text-error"
          footnote="-2 vs yesterday (stabilized)"
          aside={
            <button
              type="button"
              onClick={() => navigate('/patients?status=Critical')}
              className="shrink-0 rounded bg-error-container/40 px-2 py-1 text-left font-mono text-data-code-label font-semibold text-error hover:bg-error-container/70"
            >
              ICU: {stats.icu} · CCU: {stats.ccu}
            </button>
          }
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-space-xl lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-xl lg:col-span-8">
          <WeeklyAppointmentsChart />
          <TodayAppointmentsTable />
        </div>
        <div className="flex min-w-0 flex-col gap-space-xl lg:col-span-4">
          <HospitalPerformance />
          <Demographics />
          <RecentActivity />
        </div>
      </div>

      <PatientIntakeModal open={intakeOpen} onClose={() => setIntakeOpen(false)} onCreated={(id) => navigate(`/patients/${id}`)} />
    </div>
  );
}
