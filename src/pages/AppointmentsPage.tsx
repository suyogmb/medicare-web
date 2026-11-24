import { useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Clock, Download, PlusCircle, SlidersHorizontal } from 'lucide-react';
import type { AppointmentStatus, Department } from '../types';
import { DEPARTMENTS } from '../data/doctors';
import { useClinicalData } from '../context/ClinicalDataContext';
import { MONTHS_LONG, NOW, addDays, dateKey, formatDate, formatMonthDay, formatTime, isSameDay, isoWeekNumber, parseLocalIso, startOfWeek } from '../lib/date';
import { downloadCsv } from '../lib/csv';
import { getDoctor } from '../data/doctors';
import { cn } from '../lib/cn';
import { Button, IconButton } from '../components/ui/Button';
import { Chip, SegmentedControl } from '../components/ui/Controls';
import { Popover } from '../components/ui/Menu';
import { ScheduleGrid } from '../components/appointments/ScheduleGrid';
import { MonthGrid } from '../components/appointments/MonthGrid';
import { DoctorAvailabilityCard, HourlyLoadChart, MiniCalendar, QueueList } from '../components/appointments/SidePanels';
import { NewAppointmentModal } from '../components/appointments/NewAppointmentModal';

type View = 'Day' | 'Week' | 'Month';
type QuickRange = 'today' | 'thisWeek' | 'nextWeek' | 'thisMonth';

const STRIP: { status: AppointmentStatus; dot: string }[] = [
  { status: 'Confirmed', dot: 'bg-success' },
  { status: 'Completed', dot: 'bg-primary' },
  { status: 'Pending', dot: 'bg-warning' },
  { status: 'Cancelled', dot: 'bg-danger' },
];

const isPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

export function AppointmentsPage() {
  const { appointments, getPatient } = useClinicalData();
  const [view, setView] = useState<View>(() => (isPhone() ? 'Day' : 'Week'));
  const [anchor, setAnchor] = useState<Date>(NOW);
  const [department, setDepartment] = useState<'all' | Department>('all');
  const [hideCancelled, setHideCancelled] = useState(false);
  const [slot, setSlot] = useState<string | undefined>();
  const [bookOpen, setBookOpen] = useState(false);

  const deptFiltered = useMemo(
    () => appointments.filter((a) => (department === 'all' || a.department === department) && (!hideCancelled || a.status !== 'Cancelled')),
    [appointments, department, hideCancelled],
  );

  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const visibleDays = view === 'Day' ? [anchor] : weekDays;

  const rangeAppointments = useMemo(() => {
    if (view === 'Month') return deptFiltered.filter((a) => parseLocalIso(a.start).getMonth() === anchor.getMonth());
    const keys = new Set(visibleDays.map(dateKey));
    return deptFiltered.filter((a) => keys.has(a.start.slice(0, 10)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptFiltered, view, anchor]);

  const dayAppointments = useMemo(() => deptFiltered.filter((a) => isSameDay(parseLocalIso(a.start), anchor)), [deptFiltered, anchor]);
  const todayAll = useMemo(() => appointments.filter((a) => isSameDay(parseLocalIso(a.start), NOW)), [appointments]);

  const deptCounts = useMemo(() => {
    const day = appointments.filter((a) => isSameDay(parseLocalIso(a.start), anchor));
    const c: Record<string, number> = { all: day.length };
    day.forEach((a) => (c[a.department] = (c[a.department] ?? 0) + 1));
    return c;
  }, [appointments, anchor]);

  const busyDays = useMemo(() => new Set(deptFiltered.map((a) => a.start.slice(0, 10))), [deptFiltered]);

  const step = (dir: 1 | -1) => {
    if (view === 'Day') setAnchor((d) => addDays(d, dir));
    else if (view === 'Week') setAnchor((d) => addDays(d, 7 * dir));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const quick = (r: QuickRange) => {
    if (r === 'today') {
      setAnchor(NOW);
      setView('Day');
    } else if (r === 'thisWeek') {
      setAnchor(NOW);
      setView('Week');
    } else if (r === 'nextWeek') {
      setAnchor(addDays(NOW, 7));
      setView('Week');
    } else {
      setAnchor(NOW);
      setView('Month');
    }
  };

  const activeQuick: QuickRange | null =
    view === 'Day' && isSameDay(anchor, NOW)
      ? 'today'
      : view === 'Week' && isSameDay(weekStart, startOfWeek(NOW))
        ? 'thisWeek'
        : view === 'Week' && isSameDay(weekStart, startOfWeek(addDays(NOW, 7)))
          ? 'nextWeek'
          : view === 'Month' && anchor.getMonth() === NOW.getMonth()
            ? 'thisMonth'
            : null;

  const rangeTitle =
    view === 'Day'
      ? formatDate(anchor)
      : view === 'Week'
        ? `${formatMonthDay(weekDays[0])} – ${formatMonthDay(weekDays[6])}, ${weekDays[6].getFullYear()}`
        : `${MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`;

  const exportSchedule = () =>
    downloadCsv(
      `schedule-${view.toLowerCase()}-${dateKey(anchor)}.csv`,
      rangeAppointments.map((a) => {
        const p = getPatient(a.patientId);
        const start = parseLocalIso(a.start);
        return {
          Date: formatDate(start),
          Time: formatTime(start),
          Duration: `${a.durationMin}m`,
          Patient: p?.name ?? a.patientId,
          'Patient ID': a.patientId,
          Doctor: getDoctor(a.doctorId).name,
          Department: a.department,
          Status: a.status,
          Reason: a.reason,
        };
      }),
    );

  const openBooking = (start?: string) => {
    setSlot(start);
    setBookOpen(true);
  };

  return (
    <div className="flex w-full flex-col">
      {/* Ops strip */}
      <div className="flex w-full flex-wrap items-center justify-between gap-4 bg-surface-container-lowest px-space-lg py-3 shadow-sm lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-surface-container-low p-2 text-primary">
            <CalendarClock size={20} aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-data-code-label font-semibold uppercase tracking-wider text-on-surface-variant">Clinical Ops</span>
              <span className="text-xs text-on-surface-variant/40">/</span>
              <span className="font-mono text-data-code-label font-semibold text-primary">Triage &amp; Scheduling Grid</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-primary-container" />
              <span className="text-body-sm font-medium text-on-surface">Auto-Sync Enabled · Next sync in 42s</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STRIP.map(({ status, dot }) => (
            <div key={status} className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5">
              <span className={cn('h-2 w-2 rounded-full', dot)} />
              <span className="text-caption font-semibold text-on-surface">
                {todayAll.filter((a) => a.status === status).length} {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col justify-between gap-6 px-space-lg pb-4 pt-6 lg:px-8 xl:flex-row xl:items-end">
        <div className="flex max-w-2xl flex-col gap-1">
          <span className="font-mono text-data-code-label font-semibold uppercase tracking-wider text-primary">EHR Patient Dispatch</span>
          <h1 className="text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">Appointment Management</h1>
          <p className="text-body-md text-on-surface-variant">
            Schedule and coordinate today&apos;s {todayAll.length} appointments, doctor shifts, and department visits across clinical wings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl label="Calendar view" options={['Day', 'Week', 'Month'] as const} value={view} onChange={setView} className="rounded-xl shadow-inner" />
          <Button icon={Download} onClick={exportSchedule}>
            Export Schedule
          </Button>
          <Button variant="primary" icon={PlusCircle} onClick={() => openBooking()} className="bg-primary shadow-md hover:bg-primary-container">
            + New Appointment
          </Button>
        </div>
      </div>

      {/* Filter rail */}
      <div className="flex flex-col justify-between gap-4 bg-surface-container-low/60 px-space-lg py-3 md:flex-row md:items-center lg:px-8">
        <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
          <span className="mr-1 hidden text-caption font-semibold uppercase tracking-wider text-on-surface-variant sm:inline">Depts:</span>
          <Chip active={department === 'all'} onClick={() => setDepartment('all')} count={deptCounts.all ?? 0}>
            All Departments
          </Chip>
          {DEPARTMENTS.map((d) => (
            <Chip key={d} active={department === d} onClick={() => setDepartment(d)} count={deptCounts[d] ?? 0}>
              {d === 'General Practice' ? 'General' : d}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto rounded-lg bg-surface-container-lowest p-1 shadow-sm">
          {(
            [
              ['today', `Today (${formatDate(NOW).replace(/ 0(\d),/, ' $1,')})`],
              ['thisWeek', 'This Week'],
              ['nextWeek', 'Next Week'],
              ['thisMonth', 'This Month'],
            ] as [QuickRange, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => quick(key)}
              className={cn(
                'whitespace-nowrap rounded px-2.5 py-1 font-mono text-data-code-label',
                activeQuick === key ? 'bg-primary font-bold text-on-primary' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 items-start gap-6 px-space-lg py-6 lg:px-8 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-8">
          {/* Range navigator */}
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <IconButton icon={ChevronLeft} label={`Previous ${view.toLowerCase()}`} size={20} onClick={() => step(-1)} />
                <IconButton icon={ChevronRight} label={`Next ${view.toLowerCase()}`} size={20} onClick={() => step(1)} />
              </div>
              <span className="text-headline-sm font-semibold text-on-surface">{rangeTitle}</span>
              <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-data-code-label font-semibold text-primary">
                {view === 'Month' ? `${rangeAppointments.length} appts` : `Week ${isoWeekNumber(anchor)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1 text-on-surface-variant">
                <Clock size={15} className="text-primary" aria-hidden />
                <span className="text-caption font-medium">EST (UTC-5)</span>
              </div>
              <Popover
                trigger={(toggle, open) => <IconButton icon={SlidersHorizontal} label="Schedule options" tone="tray" onClick={toggle} aria-expanded={open} className={cn(hideCancelled && 'text-primary')} />}
              >
                {() => (
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-body-sm text-on-surface">
                    Hide cancelled appointments
                    <input type="checkbox" className="h-4 w-4 accent-primary-container" checked={hideCancelled} onChange={(e) => setHideCancelled(e.target.checked)} />
                  </label>
                )}
              </Popover>
            </div>
          </div>

          {view === 'Month' ? (
            <MonthGrid
              month={anchor}
              appointments={rangeAppointments}
              onSelectDay={(d) => {
                setAnchor(d);
                setView('Day');
              }}
            />
          ) : (
            <ScheduleGrid days={visibleDays} appointments={rangeAppointments} getPatient={getPatient} onOpenSlot={openBooking} />
          )}

          <HourlyLoadChart appointments={dayAppointments} />
        </div>

        <div className="flex min-w-0 flex-col gap-6 xl:col-span-4">
          <MiniCalendar key={`${anchor.getFullYear()}-${anchor.getMonth()}`} selected={anchor} onSelect={setAnchor} busyDays={busyDays} />
          <DoctorAvailabilityCard />
          <QueueList key={dateKey(anchor)} day={anchor} appointments={dayAppointments} getPatient={getPatient} />
        </div>
      </div>

      <NewAppointmentModal open={bookOpen} start={slot} onClose={() => setBookOpen(false)} />
    </div>
  );
}
