import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  FileDown,
  FilePlus2,
  FlaskConical,
  History,
  LayoutGrid,
  LogOut,
  Mail,
  MessageSquareText,
  Phone,
  Pill,
  Printer,
  ShieldPlus,
  SlidersHorizontal,
  Siren,
  UserX,
} from 'lucide-react';
import type { MedicalRecord, PatientStatus } from '../types';
import { useClinicalData } from '../context/ClinicalDataContext';
import { getClinicalProfile } from '../data/clinical';
import { getDoctor } from '../data/doctors';
import { NOW, formatDate, parseLocalIso, toLocalIso } from '../lib/date';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { Badge, PatientStatusBadge, PrescriptionStatusBadge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { PillTabs } from '../components/ui/Controls';
import { Popover } from '../components/ui/Menu';
import { EmptyState, SectionCard } from '../components/ui/Section';
import { useToast } from '../components/ui/Toast';
import { VitalsTrendChart } from '../components/patient-details/VitalsTrendChart';
import { AppointmentHistory, CareTeamCard, ClinicalSummaryCard, PatientInfoCard, RecordsTable } from '../components/patient-details/PatientPanels';
import { ActivePrescriptionsCard, AssignedCareTeam, HistoryTimeline, LabReportsCard, SafetyRegimenCard, VitalSignsCard, buildTimeline } from '../components/patient-details/OverviewPanels';
import { NewAppointmentModal } from '../components/appointments/NewAppointmentModal';

type Tab = 'overview' | 'history' | 'appointments' | 'prescriptions' | 'labs' | 'notes';
const STATUS_OPTIONS: PatientStatus[] = ['Active', 'Critical', 'Pending', 'Inactive', 'Discharged'];
const ABBREV: Record<string, string> = {
  Hypertension: 'HTN',
  'Type 2 Diabetes': 'T2DM',
  Asthma: 'Asthma',
  Hyperlipidemia: 'HLD',
  Hypothyroidism: 'Hypothyroid',
  Osteoarthritis: 'OA',
  Migraine: 'Migraine',
  'Atrial Fibrillation': 'AFib',
  'Acute Coronary Syndrome': 'ACS',
};

/** Stitch "Patient Details – Eleanor Vance". */
export function PatientDetailsPage() {
  const { patientId = '' } = useParams();
  const { getPatient, appointments, setPatientStatus, prescriptions, updatePrescriptions } = useClinicalData();
  const navigate = useNavigate();
  const notify = useToast();
  const [bookOpen, setBookOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [notes, setNotes] = useState<MedicalRecord[]>([]);

  const patient = getPatient(patientId);
  const profile = useMemo(() => (patient ? getClinicalProfile(patient) : undefined), [patient]);
  const history = useMemo(() => appointments.filter((a) => a.patientId === patientId).sort((a, b) => b.start.localeCompare(a.start)), [appointments, patientId]);
  const rx = useMemo(() => prescriptions.filter((p) => p.patientId === patientId), [prescriptions, patientId]);
  const timeline = useMemo(() => (patient && profile ? buildTimeline(patient, profile, history, () => setTab('notes')) : []), [patient, profile, history]);

  if (!patient || !profile) {
    return (
      <div className="p-space-xl">
        <div className="card">
          <EmptyState icon={UserX} title="Patient not found" description={`No chart matches “${patientId}”. It may have been merged or the link is outdated.`} />
          <div className="flex justify-center pb-8">
            <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/patients')}>
              Back to Patients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const critical = patient.status === 'Critical';
  const doctor = getDoctor(patient.doctorId);
  const records = [...notes, ...profile.records];
  const clinicalNotes = records.filter((r) => r.type === 'Clinical Note' || r.type === 'Discharge Summary');
  const encounters = history.filter((a) => a.status === 'Completed' || a.status === 'In Progress').length + profile.records.length;

  const exportSummary = () => {
    const blob = new Blob([JSON.stringify({ patient, profile, appointments: history, prescriptions: rx }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${patient.id}-ehr-summary.json` });
    a.click();
    URL.revokeObjectURL(url);
    notify('EHR summary exported');
  };

  const addNote = () => {
    const note: MedicalRecord = { id: `REC-N${Date.now().toString().slice(-5)}`, type: 'Clinical Note', title: 'Progress Note (draft)', doctorId: patient.doctorId, date: toLocalIso(NOW), status: 'Pending Review' };
    setNotes((n) => [note, ...n]);
    setTab('notes');
    notify(`Draft clinical note ${note.id} created`);
  };

  const batchRefill = () => {
    const due = rx.filter((r) => r.status === 'Refill Due').map((r) => r.id);
    updatePrescriptions(due, { status: 'Active', refillsLeft: 3, issued: toLocalIso(NOW) });
    notify(`${due.length} refill${due.length === 1 ? '' : 's'} renewed`);
  };

  const tabs: { value: Tab; label: string; count?: number; icon: typeof LayoutGrid }[] = [
    { value: 'overview', label: 'Overview', icon: LayoutGrid },
    { value: 'history', label: 'Medical History', count: timeline.length, icon: History },
    { value: 'appointments', label: 'Appointments', count: history.length, icon: CalendarDays },
    { value: 'prescriptions', label: 'Prescriptions', count: rx.length || profile.medications.length, icon: Pill },
    { value: 'labs', label: 'Lab Reports', count: profile.labs.length, icon: FlaskConical },
    { value: 'notes', label: 'Clinical Notes', count: clinicalNotes.length, icon: MessageSquareText },
  ];

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      {/* Breadcrumb + sync state */}
      <div className="-mb-space-sm flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-caption">
          <Link to="/" className="text-on-surface-variant hover:text-primary">
            Clinical Workbench
          </Link>
          <ChevronRight size={13} className="text-on-surface-variant/60" aria-hidden />
          <Link to="/patients" className="text-on-surface-variant hover:text-primary">
            Patients
          </Link>
          <ChevronRight size={13} className="text-on-surface-variant/60" aria-hidden />
          <span className="rounded bg-surface-container px-1 font-mono text-data-code-label text-on-surface-variant">{patient.id}</span>
          <ChevronRight size={13} className="text-on-surface-variant/60" aria-hidden />
          <span className="font-semibold text-on-surface">{patient.name}</span>
        </nav>
      </div>

      {/* Header card */}
      <div className="card relative flex flex-col gap-space-lg overflow-hidden p-space-lg">
        {critical && <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-error-container/40 blur-2xl" />}
        <div className="flex flex-col justify-between gap-space-lg xl:flex-row xl:items-start">
          <div className="flex min-w-0 items-start gap-space-lg">
            <div className="relative shrink-0">
              <Avatar name={patient.name} size="xl" critical={critical} className="h-20 w-20 rounded-2xl text-display" />
              <span className="absolute -bottom-1.5 -right-1.5 rounded bg-primary px-1 font-mono text-[10px] font-bold text-on-primary">{patient.id.slice(-3)}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-space-sm">
                <h1 className={cn('text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg', critical ? 'text-error' : 'text-on-surface')}>{patient.name}</h1>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant">{patient.id}</span>
                <PatientStatusBadge status={patient.status} />
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <span className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant">{profile.mrn}</span>
                <Badge tone="info" icon={ShieldPlus}>
                  {profile.insurance.provider.includes('HMO') ? 'In-Network HMO' : 'In-Network Primary'}
                </Badge>
              </div>
              <p className="text-body-md text-on-surface-variant">
                {patient.age}Y {patient.gender} · Blood: <span className="font-mono font-semibold text-on-surface">{patient.bloodType}</span> · DOB: {formatDate(parseLocalIso(`${profile.dob}T00:00`))} · Primary:{' '}
                <Link to={`/doctors/${doctor.id}`} className="font-medium text-on-surface hover:text-primary">
                  {doctor.name}
                </Link>
              </p>
              <div className="flex flex-wrap gap-space-xs">
                <a href={`tel:${patient.phone}`} className="inline-flex items-center gap-1.5 rounded bg-surface-container-low px-2 py-1 font-mono text-data-code-label text-on-surface-variant hover:text-primary">
                  <Phone size={13} aria-hidden /> {patient.phone}
                </a>
                <a href={`mailto:${patient.email}`} className="inline-flex max-w-full items-center gap-1.5 rounded bg-surface-container-low px-2 py-1 text-caption text-on-surface-variant hover:text-primary">
                  <Mail size={13} aria-hidden /> <span className="truncate">{patient.email}</span>
                </a>
                <span className="inline-flex items-center gap-1.5 rounded bg-surface-container-low px-2 py-1 text-caption text-on-surface-variant">
                  <Siren size={13} className="text-error" aria-hidden /> {profile.emergencyContact.name} ({profile.emergencyContact.relation}) <span className="font-mono">{profile.emergencyContact.phone}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <Popover align="right" trigger={(toggle) => <Button icon={SlidersHorizontal} onClick={toggle}>Edit Profile</Button>}>
              {(close) => (
                <div className="flex flex-col gap-space-sm">
                  <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Chart Status</span>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={patient.status === s}
                        onClick={() => {
                          setPatientStatus(patient.id, s);
                          notify(`${patient.name} marked ${s}`);
                          close();
                        }}
                        className={cn('rounded-full px-2.5 py-1 text-caption font-medium', patient.status === s ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container')}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 border-t border-surface-container pt-space-sm">
                    <Button
                      variant="ghost"
                      icon={CalendarPlus}
                      className="justify-start"
                      onClick={() => {
                        close();
                        setBookOpen(true);
                      }}
                    >
                      Book Appointment
                    </Button>
                    <Button
                      variant="ghost"
                      icon={LogOut}
                      className="justify-start text-danger"
                      disabled={patient.status === 'Discharged'}
                      onClick={() => {
                        setPatientStatus(patient.id, 'Discharged');
                        notify(`${patient.name} discharged`);
                        close();
                      }}
                    >
                      Discharge Patient
                    </Button>
                  </div>
                </div>
              )}
            </Popover>
            <Button icon={FileDown} onClick={exportSummary}>
              Export EHR Summary
            </Button>
            <Button variant="primary" icon={FilePlus2} onClick={addNote}>
              + New Clinical Note
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-space-md rounded-xl bg-surface-container-low p-space-md lg:grid-cols-4">
          <Kpi label="Total Encounters" value={encounters} note="visits recorded" />
          <Kpi label="Known Allergies" value={profile.allergies.length} note={profile.allergies.join(', ') || 'NKDA'} danger={profile.allergies.length > 0} />
          <Kpi label="Chronic Pathologies" value={profile.conditions.length} note={profile.conditions.map((c) => ABBREV[c] ?? c).join(', ') || 'None'} />
          <Kpi label="Compliance Status" value={`${profile.adherence}%`} note="Rx Adherence" accent />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-space-sm">
        <PillTabs label="Chart sections" value={tab} onChange={setTab} items={tabs} className="card min-w-0 flex-1 p-1" />
        <IconButton icon={Printer} label="Print chart" tone="tray" className="p-2.5" onClick={() => window.print()} />
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-space-xl xl:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-space-xl xl:col-span-7">
            <VitalSignsCard patient={patient} profile={profile} />
            <SafetyRegimenCard patient={patient} profile={profile} onManage={() => setTab('history')} />
            <HistoryTimeline events={timeline} limit={4} onViewAll={() => setTab('history')} />
          </div>
          <div className="flex min-w-0 flex-col gap-space-xl xl:col-span-5">
            <ActivePrescriptionsCard rx={rx} profile={profile} onBatchRefill={batchRefill} onViewAll={() => setTab('prescriptions')} />
            <LabReportsCard labs={profile.labs} limit={4} onViewAll={() => setTab('labs')} />
            <AssignedCareTeam patient={patient} appointments={history} />
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="grid grid-cols-1 gap-space-xl xl:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-space-xl xl:col-span-8">
            <VitalsTrendChart trend={profile.vitalsTrend} />
            <HistoryTimeline events={timeline} />
          </div>
          <div className="flex min-w-0 flex-col gap-space-xl xl:col-span-4">
            <ClinicalSummaryCard profile={profile} critical={critical} />
            <PatientInfoCard patient={patient} profile={profile} />
          </div>
        </div>
      )}

      {tab === 'appointments' && (
        <div className="grid grid-cols-1 gap-space-xl xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">
            <AppointmentHistory appointments={history} onBook={() => setBookOpen(true)} />
          </div>
          <div className="min-w-0 xl:col-span-4">
            <CareTeamCard patient={patient} appointments={history} />
          </div>
        </div>
      )}

      {tab === 'prescriptions' && (
        <SectionCard
          title="Prescription History"
          icon={Pill}
          subtitle={`${rx.length} orders on file`}
          actions={
            <Button variant="tonal" onClick={() => navigate(`/prescriptions`)}>
              Open Pharmacy Module
            </Button>
          }
        >
          {rx.length === 0 ? (
            <ActivePrescriptionsCard rx={rx} profile={profile} onBatchRefill={batchRefill} onViewAll={() => navigate('/prescriptions')} />
          ) : (
            <ul className="flex flex-col divide-y divide-surface-container">
              {rx.map((r) => (
                <li key={r.id} className="flex flex-col justify-between gap-2 py-space-sm sm:flex-row sm:items-center">
                  <span className="flex flex-col">
                    <span className="text-body-md font-semibold text-on-surface">{r.medication}</span>
                    <span className="text-caption text-on-surface-variant">
                      {r.sig} · {getDoctor(r.doctorId).name} · {r.refillsLeft} refills left
                    </span>
                  </span>
                  <span className="flex items-center gap-space-md">
                    <span className="font-mono text-data-code-label text-on-surface-variant">
                      {r.id} · {formatDate(parseLocalIso(r.issued))}
                    </span>
                    <PrescriptionStatusBadge status={r.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {tab === 'labs' && (
        <div className="grid grid-cols-1 gap-space-xl xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-7">
            <LabReportsCard labs={profile.labs} />
          </div>
          <div className="min-w-0 xl:col-span-5">
            <RecordsTable records={records.filter((r) => r.type === 'Lab Report' || r.type === 'Pathology' || r.type === 'Radiology MRI')} />
          </div>
        </div>
      )}

      {tab === 'notes' && <RecordsTable records={clinicalNotes} />}

      <NewAppointmentModal open={bookOpen} patientId={patient.id} onClose={() => setBookOpen(false)} />
    </div>
  );
}

function Kpi({ label, value, note, danger, accent }: { label: string; value: string | number; note: string; danger?: boolean; accent?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className={cn('font-mono text-data-metric-md font-semibold', danger ? 'text-error' : accent ? 'text-primary' : 'text-on-surface')}>{value}</span>
        <span className={cn('truncate text-caption', danger ? 'font-medium text-error' : 'text-on-surface-variant')}>{note}</span>
      </span>
    </div>
  );
}
