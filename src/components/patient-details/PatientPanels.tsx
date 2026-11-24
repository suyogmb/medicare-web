import type { ReactNode } from 'react';
import { CalendarX2, FileText, FolderOpen, HeartPulse, Pill, ShieldAlert, Stethoscope, UserRound, Eye, Download, Printer } from 'lucide-react';
import type { Appointment, Doctor, MedicalRecord, Patient, PatientClinicalProfile } from '../../types';
import { getDoctor } from '../../data/doctors';
import { formatDate, formatTime, parseLocalIso } from '../../lib/date';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { AppointmentStatusBadge, Badge, RecordStatusBadge, Tag } from '../ui/Badge';
import { Button, IconButton } from '../ui/Button';
import { EmptyState, SectionCard } from '../ui/Section';
import { useToast } from '../ui/Toast';

/* ----------------------------- Key/value rows ------------------------------ */

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-body-sm">
      <span className="shrink-0 text-on-surface-variant">{label}:</span>
      <span className="min-w-0 text-right font-medium text-on-surface">{children}</span>
    </div>
  );
}

/** Demographics & coverage — styled after the Stitch "Record Inspector". */
export function PatientInfoCard({ patient, profile }: { patient: Patient; profile: PatientClinicalProfile }) {
  return (
    <SectionCard title="Patient Profile" icon={UserRound} size="sm">
      <div className="divide-y divide-surface-container-low">
        <InfoRow label="Date of Registration">{formatDate(parseLocalIso(patient.registeredOn))}</InfoRow>
        <InfoRow label="Blood Type">
          <span className="font-mono">{patient.bloodType}</span>
        </InfoRow>
        <InfoRow label="Phone">
          <span className="font-mono">{patient.phone}</span>
        </InfoRow>
        <InfoRow label="Email">
          <span className="break-all">{patient.email}</span>
        </InfoRow>
        <InfoRow label="Address">{profile.address}</InfoRow>
        <InfoRow label="Insurance">
          {profile.insurance.provider}
          <span className="block font-mono text-data-code-label text-on-surface-variant">{profile.insurance.memberId}</span>
        </InfoRow>
        <InfoRow label="Emergency Contact">
          {profile.emergencyContact.name} · {profile.emergencyContact.relation}
          <span className="block font-mono text-data-code-label text-on-surface-variant">{profile.emergencyContact.phone}</span>
        </InfoRow>
      </div>
    </SectionCard>
  );
}

const AVAILABILITY_TONE: Record<Doctor['availability'], { badge: 'success' | 'info' | 'warning' | 'neutral'; dot: 'success' | 'primary' | 'warning' | 'muted' }> = {
  Available: { badge: 'success', dot: 'success' },
  'In Consultation': { badge: 'info', dot: 'primary' },
  'In Surgery': { badge: 'warning', dot: 'warning' },
  'Off Duty': { badge: 'neutral', dot: 'muted' },
};

/** Single doctor row — reused from the Stitch "Doctor Availability" card. */
export function DoctorAvailabilityRow({ doctor }: { doctor: Doctor }) {
  const tone = AVAILABILITY_TONE[doctor.availability];
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={doctor.name} size="lg" status={tone.dot} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-bold text-on-surface">{doctor.name}</span>
          <span className="truncate text-caption text-on-surface-variant">
            {doctor.title} · {doctor.department}
          </span>
        </div>
      </div>
      <Badge tone={tone.badge} className="shrink-0 py-1">
        {doctor.availabilityNote ?? doctor.availability}
      </Badge>
    </div>
  );
}

export function CareTeamCard({ patient, appointments }: { patient: Patient; appointments: Appointment[] }) {
  const attending = getDoctor(patient.doctorId);
  const consulting = [...new Set(appointments.map((a) => a.doctorId))].filter((id) => id !== attending.id).slice(0, 2).map(getDoctor);
  return (
    <SectionCard title="Care Team" icon={Stethoscope} size="sm" actions={<span className="font-mono text-data-code-label font-semibold text-on-surface-variant">{patient.unit}</span>}>
      <div className="flex flex-col gap-3">
        <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Attending</span>
        <DoctorAvailabilityRow doctor={attending} />
        {consulting.length > 0 && <span className="pt-1 text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Consulting</span>}
        {consulting.map((d) => (
          <DoctorAvailabilityRow key={d.id} doctor={d} />
        ))}
      </div>
    </SectionCard>
  );
}

export function ClinicalSummaryCard({ profile, critical }: { profile: PatientClinicalProfile; critical: boolean }) {
  return (
    <SectionCard title="Clinical Summary" icon={HeartPulse} size="sm">
      <div className="flex flex-col gap-space-md">
        <div>
          <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Clinical Findings Abstract</span>
          <p className={cn('mt-2 rounded-lg p-3 text-body-sm leading-relaxed text-on-surface', critical ? 'bg-danger-container' : 'bg-surface-container-low')}>{profile.findings}</p>
        </div>
        <div>
          <span className="flex items-center gap-1 text-caption font-semibold uppercase tracking-wider text-on-surface-variant">
            <ShieldAlert size={13} aria-hidden /> Allergies
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.allergies.length ? profile.allergies.map((a) => <Badge key={a} tone="danger">{a}</Badge>) : <Badge tone="neutral">No known allergies</Badge>}
          </div>
        </div>
        <div>
          <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Active Conditions</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.conditions.length ? profile.conditions.map((c) => <Badge key={c} tone="warning">{c}</Badge>) : <Badge tone="success">None recorded</Badge>}
          </div>
        </div>
        <div>
          <span className="flex items-center gap-1 text-caption font-semibold uppercase tracking-wider text-on-surface-variant">
            <Pill size={13} aria-hidden /> Medications
          </span>
          <ul className="mt-2 divide-y divide-surface-container-low">
            {profile.medications.map((m) => (
              <li key={m.name} className="flex items-center justify-between gap-2 py-2 text-body-sm">
                <span className="font-medium text-on-surface">{m.name}</span>
                <span className="text-right text-caption text-on-surface-variant">
                  <span className="font-mono text-data-code-label text-on-surface">{m.dosage}</span> · {m.schedule}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

/* --------------------------------- Tables ---------------------------------- */

export function AppointmentHistory({ appointments, onBook }: { appointments: Appointment[]; onBook: () => void }) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-space-lg">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-md font-semibold tracking-tight text-on-surface">Appointment History</h2>
          <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant">{appointments.length} visits</span>
        </div>
        <Button size="sm" variant="tonal" onClick={onBook}>
          + Book
        </Button>
      </div>
      <div className="max-h-[380px] overflow-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead className="sticky top-0">
            <tr className="bg-surface-container-low">
              <th className="th py-2.5">Date &amp; Time</th>
              <th className="th">Reason</th>
              <th className="th">Doctor</th>
              <th className="th">Department</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="text-body-sm">
            {appointments.map((a) => {
              const start = parseLocalIso(a.start);
              return (
                <tr key={a.id} className={cn('border-b border-surface-container-low transition-colors last:border-0', a.status === 'In Progress' ? 'bg-primary-fixed/20' : 'hover:bg-surface-container-low/60')}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="block font-mono text-[12px] font-medium text-on-surface">{formatDate(start)}</span>
                    <span className="font-mono text-data-code-label text-on-surface-variant">
                      {formatTime(start)} · {a.durationMin}m
                    </span>
                  </td>
                  <td className={cn('px-4 py-3 text-on-surface', a.status === 'Cancelled' && 'text-on-surface-variant line-through')}>{a.reason}</td>
                  <td className="px-4 py-3 font-medium text-on-surface">{getDoctor(a.doctorId).name}</td>
                  <td className="px-4 py-3">
                    <Tag>{a.department}</Tag>
                  </td>
                  <td className="px-4 py-3">
                    <AppointmentStatusBadge status={a.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {appointments.length === 0 && <EmptyState icon={CalendarX2} title="No appointments on file" description="Book a consultation to start this patient's visit history." />}
      </div>
    </section>
  );
}

const DOC_TYPE_STYLE: Record<MedicalRecord['type'], string> = {
  'Clinical Note': 'bg-primary-fixed/60 text-on-primary-fixed',
  'Lab Report': 'bg-surface-container text-on-surface-variant',
  'Radiology MRI': 'bg-surface-container text-on-surface-variant',
  'Discharge Summary': 'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant',
  Pathology: 'bg-error-container/60 text-error',
};

/** Document list styled after the Stitch "Medical Records" table. */
export function RecordsTable({ records }: { records: MedicalRecord[] }) {
  const notify = useToast();
  return (
    <section className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-space-lg">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-md font-semibold tracking-tight text-on-surface">Medical Records</h2>
          <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant">{records.length} documents</span>
        </div>
        <FolderOpen size={19} className="text-primary-container" aria-hidden />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="th py-2.5">Document</th>
              <th className="th">Type</th>
              <th className="th">Doctor</th>
              <th className="th">Status</th>
              <th className="th">Date &amp; Time</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-body-sm">
            {records.map((r) => {
              const date = parseLocalIso(r.date);
              const flagged = r.status === 'Flagged';
              return (
                <tr key={r.id} className={cn('border-b border-surface-container-low last:border-0', flagged ? 'bg-[#fff5f5]/60' : r.status === 'Pending Review' ? 'bg-tertiary-fixed/10' : 'hover:bg-surface-container-low/60')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="shrink-0 text-on-surface-variant" aria-hidden />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-on-surface">{r.title}</span>
                        <span className="font-mono text-data-code-label text-on-surface-variant">{r.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-data-code-label font-medium', DOC_TYPE_STYLE[r.type])}>{r.type}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-on-surface" title={getDoctor(r.doctorId).name}>{getDoctor(r.doctorId).shortName}</td>
                  <td className="px-4 py-3">
                    <RecordStatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="block font-mono text-[12px] text-on-surface">{formatDate(date)}</span>
                    <span className="font-mono text-data-code-label text-on-surface-variant">{formatTime(date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-0.5">
                      <IconButton icon={Eye} label={`Open ${r.title}`} size={16} onClick={() => notify(`Opening ${r.id} in EHR viewer`, 'info')} />
                      <IconButton icon={Download} label={`Download ${r.title}`} size={16} onClick={() => notify(`${r.id} download started`, 'info')} />
                      <IconButton icon={Printer} label={`Print ${r.title}`} size={16} onClick={() => window.print()} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
