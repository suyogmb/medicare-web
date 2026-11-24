import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarPlus,
  Check,
  CircleAlert,
  History,
  ScrollText,
  ShieldPlus,
  Sun,
  Sunrise,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import type { AppointmentStatus, Department } from '../../types';
import { DEPARTMENTS, doctors, doctorsForDepartment, getDoctor } from '../../data/doctors';
import { getStaffDoctor } from '../../data/staff';
import { getClinicalProfile } from '../../data/clinical';
import { useClinicalData } from '../../context/ClinicalDataContext';
import { NOW, dateKey, formatDate, formatLongDate, formatTime, isSameDay, parseLocalIso } from '../../lib/date';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { SegmentedControl } from '../ui/Controls';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { CURRENT_USER } from '../layout/navigation';

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-select a patient (e.g. from Patient Details) */
  patientId?: string;
  /** Pre-select an attending doctor (e.g. from the Doctors directory) */
  doctorId?: string;
  /** Pre-fill a slot (e.g. clicking an open grid slot), local ISO */
  start?: string;
}

const DURATIONS = ['15m', '30m', '45m', '60m'] as const;
type Duration = (typeof DURATIONS)[number];
const MODALITIES = ['In-Person Consult', 'Telehealth Video', 'Bedside Ward Visit'];
const MORNING = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
const MAX_NOTES = 500;

const ICD_HINT: Record<Department, [string, string]> = {
  Cardiology: ['Z95.5', 'Presence of coronary angioplasty implant'],
  Neurology: ['G43.909', 'Migraine, unspecified'],
  Pediatrics: ['Z00.129', 'Routine child health examination'],
  Orthopedics: ['M17.11', 'Primary osteoarthritis, right knee'],
  Oncology: ['Z51.11', 'Encounter for antineoplastic chemotherapy'],
  Endocrinology: ['E11.9', 'Type 2 diabetes without complications'],
  'General Practice': ['Z00.00', 'General adult medical examination'],
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Stitch "Schedule New Appointment" — 4-step intake with a visual slot board. */
export function NewAppointmentModal({ open, onClose, patientId, doctorId, start }: NewAppointmentModalProps) {
  const { patients, appointments, addAppointment, getPatient } = useClinicalData();
  const notify = useToast();

  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [department, setDepartment] = useState<Department>('Cardiology');
  const [doctor, setDoctor] = useState(doctors[0].id);
  const [date, setDate] = useState(dateKey(NOW));
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<Duration>('30m');
  const [modality, setModality] = useState(MODALITIES[0]);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('Confirmed');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    const p = patientId ? getPatient(patientId) : undefined;
    const doc = getDoctor(doctorId ?? p?.doctorId ?? doctors[0].id);
    const [d, t] = (start ?? `${dateKey(NOW)}T`).split('T');
    setSelectedPatient(p?.id ?? '');
    setPatientQuery('');
    setDepartment(doc.department);
    setDoctor(doc.id);
    setDate(d);
    setTime(t ?? '');
    setDuration('30m');
    setModality(MODALITIES[0]);
    setReason('');
    setStatus('Confirmed');
    setNotes('');
  }, [open, patientId, doctorId, start, getPatient]);

  const patient = selectedPatient ? getPatient(selectedPatient) : undefined;
  const profile = useMemo(() => (patient ? getClinicalProfile(patient) : undefined), [patient]);
  const doc = getDoctor(doctor);
  const staff = getStaffDoctor(doctor);
  const durationMin = Number(duration.replace('m', ''));

  const matches = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return patients.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)).slice(0, 6);
  }, [patientQuery, patients]);

  const dayBookings = useMemo(
    () => appointments.filter((a) => a.doctorId === doctor && a.status !== 'Cancelled' && a.start.startsWith(date)),
    [appointments, doctor, date],
  );

  const slotState = (slot: string): 'booked' | 'past' | 'open' => {
    const s = toMinutes(slot);
    const clash = dayBookings.some((a) => {
      const as = toMinutes(a.start.split('T')[1]);
      return s < as + a.durationMin && as < s + durationMin;
    });
    if (clash) return 'booked';
    if (isSameDay(parseLocalIso(`${date}T${slot}`), NOW) && s < NOW.getHours() * 60 + NOW.getMinutes()) return 'past';
    return 'open';
  };

  const openSlots = [...MORNING, ...AFTERNOON].filter((s) => slotState(s) === 'open').length;
  const conflict = time ? slotState(time) === 'booked' : false;
  const canSubmit = Boolean(patient && time && !conflict && date);
  const [icd, icdLabel] = ICD_HINT[department];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!patient || !canSubmit) return;
    const created = addAppointment({
      patientId: patient.id,
      doctorId: doc.id,
      department: doc.department,
      start: `${date}T${time}`,
      durationMin,
      status,
      reason: reason.trim() || 'Consultation',
      note: modality !== MODALITIES[0] ? modality : undefined,
    });
    const when = parseLocalIso(created.start);
    notify(`Appointment scheduled · ${formatLongDate(when)}, ${formatTime(when)}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={CalendarCheck2}
      accent
      maxWidth="max-w-4xl"
      title="Schedule New Appointment"
      subtitle="Encounters auto-sync with EHR & Department Scheduling Queue"
      titleBadge={
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
          Standard Outpatient
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-space-xl">
        {/* 1 · Patient */}
        <section className="flex flex-col gap-space-sm">
          <StepLabel n={1} title="Patient Verification & Intake">
            <Link to="/patients" onClick={onClose} className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline">
              <UserPlus size={15} aria-hidden /> + New Patient Intake
            </Link>
          </StepLabel>
          {patient && profile ? (
            <div className="rounded-xl bg-surface-container-low p-space-md">
              <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
                <div className="flex min-w-0 items-center gap-space-md">
                  <Avatar name={patient.name} size="lg" className="h-12 w-12" status="primary" />
                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <span className="truncate text-headline-sm text-on-surface">{patient.name}</span>
                      <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant">{patient.id}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 font-mono text-data-code-label text-on-primary-fixed">
                        <BadgeCheck size={12} aria-hidden /> Verified Patient
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-space-md text-body-sm text-on-surface-variant">
                      <span>
                        {patient.age}y · {patient.gender}
                      </span>
                      <span>{patient.unit}</span>
                      <span className="font-mono text-[12px]">{patient.phone}</span>
                    </div>
                  </div>
                </div>
                {!patientId && (
                  <Button size="sm" icon={ArrowLeftRight} className="self-start md:self-center" onClick={() => setSelectedPatient('')}>
                    Switch Patient
                  </Button>
                )}
              </div>
              <div className="mt-space-md grid grid-cols-1 gap-space-sm rounded-lg bg-surface-container-lowest/70 p-space-sm sm:grid-cols-3">
                <StripItem icon={TriangleAlert} tone="danger" label="Allergies" value={profile.allergies.length ? profile.allergies.join(', ') : 'None recorded (NKDA)'} danger={profile.allergies.length > 0} />
                <StripItem icon={ShieldPlus} tone="primary" label="Active Insurance" value={`${profile.insurance.provider} #${profile.insurance.memberId.slice(-4)}`} />
                <StripItem icon={History} tone="muted" label="Last Encounter" value={`${formatDate(parseLocalIso(patient.lastVisit))} (${patient.visitNote})`} />
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                className="field"
                autoFocus
                placeholder="Search patient by name or PT-ID…"
                aria-label="Search patient"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
              />
              {matches.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-surface-container bg-surface-container-lowest py-1 shadow-overlay">
                  {matches.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-body-sm hover:bg-surface-container-low"
                        onClick={() => {
                          setSelectedPatient(p.id);
                          const d = getDoctor(p.doctorId);
                          if (!doctorId) {
                            setDepartment(d.department);
                            setDoctor(d.id);
                          }
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Avatar name={p.name} size="xs" />
                          <span className="font-medium text-on-surface">{p.name}</span>
                          <span className="text-caption text-on-surface-variant">
                            {p.age}y · {p.unit}
                          </span>
                        </span>
                        <span className="font-mono text-data-code-label text-on-surface-variant">{p.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {patientQuery.trim().length >= 2 && matches.length === 0 && <p className="mt-1 text-caption text-on-surface-variant">No patients match “{patientQuery}”.</p>}
            </div>
          )}
        </section>

        {/* 2 · Routing */}
        <section className="flex flex-col gap-space-sm">
          <StepLabel n={2} title="Department & Attending Physician Routing" />
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-caption font-medium text-on-surface-variant">Department / Clinic Wing</span>
              <select
                className="field"
                value={department}
                onChange={(e) => {
                  const dep = e.target.value as Department;
                  setDepartment(dep);
                  setDoctor(doctorsForDepartment(dep)[0]?.id ?? doctors[0].id);
                  setTime('');
                }}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-caption font-medium text-on-surface-variant">Attending Physician</span>
              <select
                className="field"
                value={doctor}
                onChange={(e) => {
                  setDoctor(e.target.value);
                  setTime('');
                }}
              >
                {doctorsForDepartment(department).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · NPI-{getStaffDoctor(d.id)?.npi.slice(-4)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="card flex flex-col justify-between gap-space-md p-space-md sm:flex-row sm:items-center">
            <div className="flex items-center gap-space-md">
              <div className="h-10 w-2 rounded-full bg-primary-container" />
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className="text-body-md font-semibold text-on-surface">{doc.shortName}&apos;s Clinic Schedule</span>
                  {staff && <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-data-code-label font-medium text-on-surface">{staff.location}</span>}
                </div>
                <span className="mt-0.5 text-caption text-on-surface-variant">
                  Load: {dayBookings.length} consultations scheduled · {openSlots} open booking windows on {formatDate(parseLocalIso(`${date}T00:00`))}
                </span>
              </div>
            </div>
            <span className="self-start rounded-full bg-primary-container/10 px-2.5 py-1 font-mono text-data-code-label font-semibold text-primary-container sm:self-auto">
              ● {doc.availability}
            </span>
          </div>
        </section>

        {/* 3 · Schedule */}
        <section className="flex flex-col gap-space-md">
          <StepLabel n={3} title="Schedule Parameters & Visual Time Slots" />
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-caption font-medium text-on-surface-variant">Appointment Date</span>
              <input
                type="date"
                className="field"
                required
                min="2026-10-01"
                max="2026-12-31"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime('');
                }}
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-caption font-medium text-on-surface-variant">Session Duration</span>
              <SegmentedControl label="Session duration" options={DURATIONS} value={duration} onChange={setDuration} className="[&>button]:flex-1" />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-caption font-medium text-on-surface-variant">Encounter Modality</span>
              <select className="field" value={modality} onChange={(e) => setModality(e.target.value)}>
                {MODALITIES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="card flex flex-col gap-space-md p-space-md">
            <div className="flex flex-col justify-between gap-space-xs sm:flex-row sm:items-center">
              <div className="flex items-center gap-space-sm">
                <span className="text-headline-sm text-on-surface">Available Slots · {formatDate(parseLocalIso(`${date}T00:00`)).slice(0, 6)}</span>
                <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant">EST (UTC-5)</span>
              </div>
              <div className="flex items-center gap-space-md text-caption text-on-surface-variant">
                <Legend className="bg-surface-container-lowest ring-1 ring-outline-variant">Available</Legend>
                <Legend className="bg-primary-container">Selected</Legend>
                <Legend className="bg-surface-container">Booked / Overlap</Legend>
              </div>
            </div>
            <SlotRow icon={Sunrise} title="Morning Cohort (08:00 - 12:00)" slots={MORNING} value={time} state={slotState} onPick={setTime} />
            <SlotRow icon={Sun} title="Afternoon Cohort (01:00 - 05:00)" slots={AFTERNOON} value={time} state={slotState} onPick={setTime} />
          </div>
        </section>

        {/* 4 · Clinical context */}
        <section className="flex flex-col gap-space-sm">
          <StepLabel n={4} title="Clinical Diagnostic Context & Encounter Safeguards" />
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-caption font-medium text-on-surface-variant">Chief Complaint / Reason for Visit</span>
              <div className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-sm">
                <input
                  className="w-full bg-transparent text-body-sm font-semibold text-on-surface placeholder:font-normal placeholder:text-on-surface-variant/70 focus:outline-none"
                  placeholder="e.g. Post-PCI follow-up & stent tolerance review"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <span className="flex items-center gap-1.5">
                  <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-data-code-label font-medium text-on-surface">ICD-10: {icd}</span>
                  <span className="truncate text-caption text-on-surface-variant">{icdLabel}</span>
                </span>
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-caption font-medium text-on-surface-variant">Triage Queue Status</span>
              <select className="field h-full min-h-[64px]" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
                <option value="Confirmed">Confirmed & Synchronized — SMS reminder ready</option>
                <option value="Pending">Pending — awaiting patient confirmation</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-caption font-medium text-on-surface-variant">
              Clinical Orders &amp; Nurse Preparation Directives
              <span className="font-mono text-data-code-label">
                {notes.length} / {MAX_NOTES} characters
              </span>
            </span>
            <textarea
              rows={2}
              maxLength={MAX_NOTES}
              className="field resize-none"
              placeholder="e.g. Check resting BP, troponin panel and review ECG telemetry before consultation."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className={cn('flex items-center justify-between gap-space-sm rounded-xl p-space-sm', conflict ? 'bg-danger-container' : 'bg-surface-container-low')}>
            <div className="flex items-center gap-space-sm">
              {conflict ? <CircleAlert size={20} className="text-danger" aria-hidden /> : <Check size={20} className="text-primary-container" aria-hidden />}
              <div className="flex flex-col">
                <span className={cn('text-body-sm font-semibold', conflict ? 'text-danger' : 'text-on-surface')}>{conflict ? 'EHR Conflict Detected' : time ? 'EHR Conflict Check Passed' : 'Select a time slot'}</span>
                <span className="text-caption text-on-surface-variant">
                  {time
                    ? conflict
                      ? `${doc.shortName} already has an encounter overlapping ${formatTime(parseLocalIso(`${date}T${time}`))}.`
                      : `No room collisions or provider overlapping shifts detected for ${formatDate(parseLocalIso(`${date}T${time}`)).slice(0, 6)}, ${formatTime(parseLocalIso(`${date}T${time}`))}.`
                    : 'Conflict checks run automatically once a slot is chosen.'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-space-md border-t border-surface-container pt-space-md sm:flex-row">
          <span className="flex min-w-0 items-center gap-space-xs text-caption text-on-surface-variant">
            <ScrollText size={15} className="shrink-0" aria-hidden />
            <span className="truncate">
              Audit Trail: Initiated by <strong className="text-on-surface">{CURRENT_USER.shortName} ({CURRENT_USER.sidebarRole})</strong>
            </span>
          </span>
          <div className="flex w-full items-center justify-end gap-space-sm sm:w-auto">
            <Button variant="tonal" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={CalendarPlus} disabled={!canSubmit}>
              Schedule Appointment
            </Button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}

function StepLabel({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-space-xs text-headline-sm text-on-surface">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container font-mono text-data-code-label">{n}</span>
        {title}
      </span>
      {children}
    </div>
  );
}

function StripItem({ icon: Icon, tone, label, value, danger }: { icon: typeof History; tone: 'danger' | 'primary' | 'muted'; label: string; value: string; danger?: boolean }) {
  const tones = { danger: 'bg-error-container text-error', primary: 'bg-primary-fixed text-primary', muted: 'bg-surface-container text-on-surface-variant' };
  return (
    <div className="flex min-w-0 items-center gap-space-sm px-space-xs">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
        <Icon size={15} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-caption uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className={cn('truncate text-body-sm', danger ? 'font-semibold text-error' : 'font-medium text-on-surface')}>{value}</span>
      </div>
    </div>
  );
}

function Legend({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded', className)} />
      {children}
    </span>
  );
}

interface SlotRowProps {
  icon: typeof Sun;
  title: string;
  slots: string[];
  value: string;
  state: (slot: string) => 'booked' | 'past' | 'open';
  onPick: (slot: string) => void;
}

function SlotRow({ icon: Icon, title, slots, value, state, onPick }: SlotRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-on-surface-variant">
        <Icon size={15} aria-hidden /> {title}
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {slots.map((slot) => {
          const s = state(slot);
          const selected = value === slot;
          const label = formatTime(parseLocalIso(`2026-01-01T${slot}`));
          return (
            <button
              key={slot}
              type="button"
              disabled={s !== 'open' && !selected}
              aria-pressed={selected}
              title={s === 'booked' ? 'Booked / overlapping encounter' : s === 'past' ? 'Slot already passed' : undefined}
              onClick={() => onPick(slot)}
              className={cn(
                'flex h-10 items-center justify-center gap-1 rounded-lg px-2 font-mono text-[12px] transition-all',
                selected
                  ? 'scale-[1.02] bg-primary-container font-bold text-on-primary shadow-md ring-2 ring-primary-container/30'
                  : s === 'open'
                    ? 'bg-surface-container-low font-medium text-on-surface hover:bg-surface-container'
                    : 'cursor-not-allowed bg-surface-container text-on-surface-variant/50 line-through opacity-70',
              )}
            >
              {selected && <Check size={14} aria-hidden />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
