import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseMedical,
  CalendarClock,
  CircleAlert,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  MessageSquareText,
  Pill,
  Siren,
  Syringe,
  Thermometer,
  TriangleAlert,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import type { Appointment, LabResult, MedicalRecord, Patient, PatientClinicalProfile, Prescription } from '../../types';
import { getDoctor } from '../../data/doctors';
import { NOW, formatDate, parseLocalIso, relativeStamp } from '../../lib/date';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/Button';
import { ProgressBar } from '../ui/StatCards';
import { useToast } from '../ui/Toast';

/* ------------------------------- Shared shell ------------------------------- */

function Panel({ icon: Icon, title, subtitle, actions, children, className }: { icon: LucideIcon; title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('card flex flex-col gap-space-md p-space-lg', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-space-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
            <Icon size={18} aria-hidden />
          </span>
          <div className="flex flex-col">
            <h2 className="text-headline-md font-semibold tracking-tight text-on-surface">{title}</h2>
            {subtitle && <span className="text-caption text-on-surface-variant">{subtitle}</span>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/* -------------------------------- Vital signs ------------------------------- */

function Spark({ data, color = '#2d67e4' }: { data: number[]; color?: string }) {
  return (
    <div className="h-6 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v) => ({ v }))}>
          <YAxis hide domain={['dataMin - 4', 'dataMax + 4']} />
          <Line isAnimationActive={false} type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VitalTile({ label, icon: Icon, chip, value, unit, foot, aside, alert, className }: { label: string; icon?: LucideIcon; chip?: ReactNode; value: ReactNode; unit?: string; foot: ReactNode; aside?: ReactNode; alert?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-xl p-space-md', alert ? 'bg-danger-container' : 'bg-surface-container-low', className)}>
      <span className="flex items-center justify-between gap-2 text-caption text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          {label}
          {chip}
        </span>
        {Icon && <Icon size={15} className={alert ? 'text-danger' : 'text-error/80'} aria-hidden />}
      </span>
      <span className="flex items-baseline gap-1">
        <span className={cn('font-mono text-data-metric-lg font-semibold', alert ? 'text-danger' : 'text-on-surface')}>{value}</span>
        {unit && <span className="text-body-sm text-on-surface-variant">{unit}</span>}
      </span>
      <span className="flex items-center justify-between gap-2 text-caption text-on-surface-variant">
        {foot}
        {aside}
      </span>
    </div>
  );
}

export function VitalSignsCard({ patient, profile }: { patient: Patient; profile: PatientClinicalProfile }) {
  const v = profile.vitals;
  const map = Math.round((v.systolic + 2 * v.diastolic) / 3);
  const bpHigh = v.systolic >= 140;
  const bmi = (703 * profile.weightLbs) / profile.heightIn ** 2;
  const bmiLabel = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'BMI Optimal' : bmi < 30 ? 'Overweight' : 'Obese';
  const nurse = patient.status === 'Critical' ? 'ICU Charge Nurse' : 'Nurse Reynolds';

  return (
    <Panel
      icon={HeartPulse}
      title="Current Vital Signs"
      subtitle={`Last verified ${formatDate(parseLocalIso(patient.lastVisit)) === formatDate(NOW) ? 'today' : `on ${formatDate(parseLocalIso(patient.lastVisit))}`} by ${nurse}`}
    >
      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
        <VitalTile
          label="Blood Pressure"
          chip={<Badge tone={bpHigh ? 'danger' : 'neutral'} className="px-1.5 py-0">{bpHigh ? 'High' : 'Normal'}</Badge>}
          value={`${v.systolic}/${v.diastolic}`}
          unit="mmHg"
          alert={bpHigh}
          foot={`MAP: ${map} mmHg`}
          aside={<Spark data={profile.vitalsTrend.map((t) => t.systolic)} color={bpHigh ? '#be423f' : undefined} />}
        />
        <VitalTile
          label="Heart Rate"
          icon={HeartPulse}
          value={v.heartRate}
          unit="bpm"
          alert={v.heartRate > 100}
          foot={v.heartRate > 100 ? 'Sinus Tachycardia' : 'Sinus Rhythm'}
          aside={<Spark data={profile.vitalsTrend.map((t) => t.heartRate)} color="#be423f" />}
        />
        <VitalTile
          label="Oxygen Sat (SpO2)"
          icon={Wind}
          value={v.spo2}
          unit="%"
          alert={v.spo2 < 94}
          foot={v.spo2 < 94 ? '2L Nasal Cannula' : 'Room Air'}
          aside={<Spark data={profile.vitalsTrend.map((_, i) => v.spo2 - (i % 3 === 0 ? 1 : 0))} />}
        />
        <VitalTile
          label="Body Temp"
          icon={Thermometer}
          value={v.temperatureF}
          unit="°F"
          alert={v.temperatureF >= 100.4}
          foot={v.temperatureF >= 100.4 ? 'Oral · Febrile' : 'Oral · Afebrile'}
          aside={<span className="font-mono">{(((v.temperatureF - 32) * 5) / 9).toFixed(1)}°C</span>}
        />
        <div className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-md sm:col-span-2">
          <span className="flex items-center justify-between text-caption text-on-surface-variant">
            Weight &amp; Mass Index
            <span className="rounded bg-surface-container px-1.5 font-mono text-data-code-label">{bmiLabel}</span>
          </span>
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="flex items-baseline gap-1">
              <span className="font-mono text-data-metric-lg font-semibold text-on-surface">{profile.weightLbs}</span>
              <span className="text-body-sm text-on-surface-variant">lbs ({(profile.weightLbs * 0.4536).toFixed(1)} kg)</span>
            </span>
            <span className="flex items-baseline gap-2 text-caption uppercase text-on-surface-variant">
              Calculated BMI <span className="font-mono text-data-metric-md font-semibold text-on-surface">{bmi.toFixed(1)}</span>
            </span>
          </span>
          <ProgressBar value={(bmi / 40) * 100} size="md" barClassName={bmi >= 30 ? 'bg-error' : bmi >= 25 ? 'bg-warning' : undefined} />
        </div>
      </div>
    </Panel>
  );
}

/* --------------------------- Safety & chronic regimen ------------------------ */

const ICD: Record<string, string> = {
  Penicillin: 'Z88.0',
  'Sulfa drugs': 'Z88.2',
  Latex: 'Z91.040',
  Peanuts: 'Z91.010',
  Shellfish: 'Z91.013',
  Ibuprofen: 'Z88.6',
  Pollen: 'J30.1',
  Hypertension: 'I10',
  'Type 2 Diabetes': 'E11.9',
  Asthma: 'J45.909',
  Hyperlipidemia: 'E78.5',
  Hypothyroidism: 'E03.9',
  Osteoarthritis: 'M19.90',
  Migraine: 'G43.909',
  'Atrial Fibrillation': 'I48.91',
  'Acute Coronary Syndrome': 'I24.9',
};

export function SafetyRegimenCard({ patient, profile, onManage }: { patient: Patient; profile: PatientClinicalProfile; onManage: () => void }) {
  const doctor = getDoctor(patient.doctorId);
  return (
    <section className="card flex flex-col gap-space-md p-space-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md font-semibold tracking-tight text-on-surface">Critical Safety &amp; Chronic Regimen</h2>
        <button type="button" onClick={onManage} className="text-body-sm font-semibold text-primary hover:underline">
          Manage Flags
        </button>
      </div>
      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
        {profile.allergies.length > 0 ? (
          profile.allergies.map((a) => (
            <div key={a} className="flex flex-col gap-1.5 rounded-xl bg-danger-container p-space-md">
              <span className="flex flex-wrap items-center gap-2">
                <TriangleAlert size={16} className="text-danger" aria-hidden />
                <span className="text-body-md font-semibold text-danger">{a} Allergy</span>
                <span className="rounded bg-danger px-1.5 font-mono text-[10px] font-bold text-white">CRITICAL</span>
              </span>
              <p className="text-body-sm text-danger/90">Documented hypersensitivity reaction. Avoid {a.toLowerCase()} and cross-reactive agents; verify before every order.</p>
              <span className="mt-auto flex justify-between font-mono text-data-code-label text-danger/80">
                <span>Verified by Immunology</span>
                <span>ICD-10 {ICD[a] ?? 'Z88.9'}</span>
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-space-md">
            <span className="flex items-center gap-2 text-body-md font-semibold text-on-surface">
              <CircleAlert size={16} className="text-success" aria-hidden /> No Known Drug Allergies
            </span>
            <p className="text-body-sm text-on-surface-variant">NKDA confirmed at last intake. Re-verify at each admission.</p>
          </div>
        )}
        {profile.conditions.map((c) => (
          <div key={c} className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-space-md">
            <span className="flex flex-wrap items-center gap-2">
              <ClipboardList size={16} className="text-primary" aria-hidden />
              <span className="text-body-md font-semibold text-on-surface">{c}</span>
              <span className="rounded bg-surface-container-high px-1.5 font-mono text-[10px] font-semibold text-on-surface-variant">CHRONIC</span>
            </span>
            <p className="text-body-sm text-on-surface-variant">Maintenance regimen per care plan; home monitoring synced with the health portal.</p>
            <span className="mt-auto flex justify-between font-mono text-data-code-label text-on-surface-variant">
              <span>Care Lead: {doctor.shortName}</span>
              <span>ICD-10 {ICD[c] ?? 'R69'}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- History timeline ---------------------------- */

export interface TimelineEvent {
  id: string;
  date: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  body: string;
  meta: string[];
  link?: { label: string; onClick: () => void };
}

const RECORD_ICON: Record<MedicalRecord['type'], LucideIcon> = {
  'Clinical Note': MessageSquareText,
  'Lab Report': FlaskConical,
  'Radiology MRI': BriefcaseMedical,
  'Discharge Summary': Siren,
  Pathology: Syringe,
};

export function buildTimeline(patient: Patient, profile: PatientClinicalProfile, appointments: Appointment[], onOpenNote: () => void): TimelineEvent[] {
  const past = appointments.filter((a) => parseLocalIso(a.start) <= NOW && a.status !== 'Cancelled');
  const events: TimelineEvent[] = [
    ...past.map((a) => {
      const d = getDoctor(a.doctorId);
      return {
        id: a.id,
        date: a.start,
        icon: MessageSquareText,
        tone: 'bg-primary-container text-on-primary',
        title: `${a.reason} ${a.status === 'In Progress' ? 'In Progress' : 'Consultation Completed'}`,
        body: `${d.name} ${a.status === 'In Progress' ? 'is conducting' : 'completed'} the ${a.department.toLowerCase()} evaluation. ${a.note ?? 'Treatment protocol reviewed and documented in the chart.'}`,
        meta: [`Attending: ${d.name}`],
        link: { label: 'View Consultation Note →', onClick: onOpenNote },
      };
    }),
    ...profile.labs.map((l) => ({
      id: l.id,
      date: l.date,
      icon: FlaskConical,
      tone: 'bg-surface-container-high text-on-surface-variant',
      title: `${l.name} ${l.flag === 'NORMAL' ? 'Resulted' : 'Flagged'}`,
      body: l.detail ? `Abnormal value reported — ${l.detail}.` : `${getDoctor(l.reviewerId).name} reviewed results; all markers within reference range.`,
      meta: [`${getDoctor(l.reviewerId).department} Clinic`, `LAB-${l.specimen.slice(1)}`],
    })),
    ...profile.records
      .filter((r) => r.type !== 'Lab Report')
      .map((r) => ({
        id: r.id,
        date: r.date,
        icon: RECORD_ICON[r.type],
        tone: r.type === 'Discharge Summary' ? 'bg-tertiary-container text-on-tertiary' : 'bg-surface-container-high text-on-surface-variant',
        title: `${r.title} (${r.type})`,
        body: r.type === 'Discharge Summary' ? `Discharged stable from ${patient.unit}. Follow-up scheduled with the attending team.` : `${r.type} filed by ${getDoctor(r.doctorId).name}. Status: ${r.status}.`,
        meta: [getDoctor(r.doctorId).name, r.id],
      })),
  ];
  return events.sort((a, b) => b.date.localeCompare(a.date));
}

export function HistoryTimeline({ events, limit, onViewAll }: { events: TimelineEvent[]; limit?: number; onViewAll?: () => void }) {
  const list = limit ? events.slice(0, limit) : events;
  return (
    <Panel
      icon={CalendarClock}
      title="Medical History Timeline"
      subtitle="Audit log of inpatient, outpatient, and diagnostic interventions"
      actions={
        limit && events.length > limit ? (
          <button type="button" onClick={onViewAll} className="shrink-0 rounded-lg bg-surface-container-low px-2 py-1 font-mono text-data-code-label text-on-surface-variant hover:text-primary">
            Latest {limit} of {events.length}
          </button>
        ) : (
          <span className="shrink-0 rounded-lg bg-surface-container-low px-2 py-1 font-mono text-data-code-label text-on-surface-variant">{events.length} Events</span>
        )
      }
    >
      {list.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-on-surface-variant">No interventions recorded.</p>
      ) : (
        <ol className="relative flex flex-col gap-space-lg border-l-2 border-surface-container pl-space-lg">
          {list.map((e) => (
            <li key={e.id} className="relative">
              <span className={cn('absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-surface-container-lowest', e.tone)}>
                <e.icon size={13} aria-hidden />
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-body-md font-semibold text-on-surface">{e.title}</span>
                <span className="font-mono text-data-code-label text-on-surface-variant">{relativeStamp(parseLocalIso(e.date))}</span>
              </div>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{e.body}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {e.meta.map((m) => (
                  <span key={m} className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant">
                    {m}
                  </span>
                ))}
                {e.link && (
                  <button type="button" onClick={e.link.onClick} className="text-caption font-semibold text-primary hover:underline">
                    {e.link.label}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* ----------------------------- Active prescriptions -------------------------- */

function splitMedication(med: string): [string, string] {
  const m = med.match(/^(.*?)\s+([\d.]+\s*(?:mg|mcg|U\/mL|mL|g)\b.*)$/i);
  return m ? [m[1], m[2]] : [med, ''];
}

export function ActivePrescriptionsCard({ rx, profile, onBatchRefill, onViewAll }: { rx: Prescription[]; profile: PatientClinicalProfile; onBatchRefill: () => void; onViewAll: () => void }) {
  const active = rx.filter((r) => r.status === 'Active' || r.status === 'Refill Due');
  const rows = active.length
    ? active.map((r) => {
        const [name, strength] = splitMedication(r.medication);
        const age = Math.round((NOW.getTime() - parseLocalIso(r.issued).getTime()) / 86400000);
        return { id: r.id, name, strength, sig: `${r.sig} · ${getDoctor(r.doctorId).department}`, due: r.status === 'Refill Due', days: Math.max(1, 30 - (age % 30)) };
      })
    : profile.medications.map((m, i) => ({ id: `HOME-${i + 1}`, name: m.name, strength: m.dosage, sig: `${m.schedule} · Home medication`, due: false, days: 14 + i * 16 }));
  const anyDue = rows.some((r) => r.due);

  return (
    <Panel
      icon={Pill}
      title="Active Prescriptions"
      subtitle={`${rows.length} active regimen${rows.length === 1 ? '' : 's'} on file`}
      actions={
        <span className="flex shrink-0 items-center gap-1 text-body-sm font-semibold text-primary">
          <button type="button" onClick={onBatchRefill} disabled={!anyDue} className="hover:underline disabled:cursor-not-allowed disabled:text-on-surface-variant disabled:no-underline">
            Batch Refill
          </button>
          <span className="text-on-surface-variant">·</span>
          <button type="button" onClick={onViewAll} className="hover:underline">
            View All
          </button>
        </span>
      }
    >
      <ul className="flex flex-col gap-space-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-md">
            <span className="flex items-center justify-between gap-2">
              <span className="text-body-md font-semibold text-on-surface">
                {r.name} <span className="font-mono text-body-sm text-primary">{r.strength}</span>
              </span>
              <Badge tone={r.due ? 'warning' : 'neutral'}>{r.due ? 'Refill Due' : 'Active'}</Badge>
            </span>
            <span className="text-caption text-on-surface-variant">{r.sig}</span>
            <span className="flex items-center justify-between text-caption">
              <span className={cn('flex items-center gap-1', r.due ? 'font-semibold text-tertiary' : 'text-on-surface-variant')}>
                <CalendarClock size={13} aria-hidden />
                {r.due ? 'Refill due now (Pending Review)' : (
                  <>
                    Refill in <strong className="text-on-surface">{r.days} days</strong>
                  </>
                )}
              </span>
              <span className="font-mono text-data-code-label text-on-surface-variant">Rx #{r.id.replace('RX-', '')}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* --------------------------------- Lab reports ------------------------------- */

export function LabReportsCard({ labs, limit, onViewAll }: { labs: LabResult[]; limit?: number; onViewAll?: () => void }) {
  const notify = useToast();
  const list = limit ? labs.slice(0, limit) : labs;
  return (
    <Panel
      icon={FlaskConical}
      title="Recent Lab Reports"
      subtitle="Diagnostic pathology & blood serum results"
      actions={
        onViewAll && (
          <button type="button" onClick={onViewAll} className="shrink-0 text-body-sm font-semibold text-primary hover:underline">
            All Labs ({labs.length})
          </button>
        )
      }
    >
      <ul className="flex flex-col gap-space-sm">
        {list.map((l) => (
          <li key={l.id} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-md">
            <span className="flex items-start justify-between gap-2">
              <span className="text-body-md font-semibold text-on-surface">{l.name}</span>
              <Badge tone={l.flag === 'NORMAL' ? 'neutral' : 'danger'}>{l.flag}</Badge>
            </span>
            <span className="text-caption text-on-surface-variant">
              {formatDate(parseLocalIso(l.date))} · Specimen {l.specimen}
            </span>
            {l.detail && <span className="rounded-lg bg-surface-container-lowest px-3 py-2 font-mono text-data-code-label text-danger">{l.detail}</span>}
            <span className="flex items-center justify-between text-caption">
              <span className="text-on-surface-variant">Reviewed by {getDoctor(l.reviewerId).name}</span>
              <button type="button" onClick={() => notify(`${l.name} report opened`, 'info')} className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">
                Report PDF <ArrowUpRight size={13} aria-hidden />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------ Assigned care team --------------------------- */

export function AssignedCareTeam({ patient, appointments }: { patient: Patient; appointments: Appointment[] }) {
  const notify = useToast();
  const attending = getDoctor(patient.doctorId);
  const consulting = [...new Set(appointments.map((a) => a.doctorId))].filter((id) => id !== attending.id).slice(0, 2).map(getDoctor);
  const team = [
    { doctor: attending, role: `Lead Primary Physician · ${attending.department}` },
    ...consulting.map((d) => ({ doctor: d, role: `Consulting ${d.title}` })),
  ];
  return (
    <section className="card flex flex-col gap-space-sm p-space-lg">
      <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Assigned Care Team</span>
      <ul className="flex flex-col gap-space-sm">
        {team.map(({ doctor, role }) => (
          <li key={doctor.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-space-sm">
              <Avatar name={doctor.name} size="md" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body-sm font-semibold text-on-surface">{doctor.name}</span>
                <span className="truncate text-caption text-on-surface-variant">{role}</span>
              </span>
            </span>
            <IconButton icon={MessageSquareText} label={`Message ${doctor.name}`} className="text-primary" onClick={() => notify(`Secure chat opened with ${doctor.name}`, 'info')} />
          </li>
        ))}
      </ul>
      <Link to={`/doctors/${attending.id}`} className="inline-flex items-center gap-1 self-start pt-1 text-caption font-semibold text-primary hover:underline">
        View attending profile <ArrowRight size={13} aria-hidden />
      </Link>
    </section>
  );
}
