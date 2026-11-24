import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, ArrowLeftRight, BellRing, Check, CircleCheck, ClipboardPlus, Download, Lock, Pencil, Pill, Printer, RotateCcw, Shield, Stethoscope, TrendingUp } from 'lucide-react';
import type { Prescription, PrescriptionStatus } from '../types';
import { useClinicalData } from '../context/ClinicalDataContext';
import { DEPARTMENTS, doctors, getDoctor } from '../data/doctors';
import { MEDICATIONS } from '../data/prescriptions';
import { useTable } from '../hooks/useTable';
import { NOW, addDays, formatDate, parseLocalIso, toLocalIso } from '../lib/date';
import { downloadCsv } from '../lib/csv';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { Badge, PrescriptionStatusBadge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { Checkbox, FilterTabs, SearchInput, Select } from '../components/ui/Controls';
import { Field, Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState, PageHeader } from '../components/ui/Section';
import { KpiTile } from '../components/ui/StatCards';
import { useToast } from '../components/ui/Toast';

type Tab = 'All' | 'Active' | 'Refill Due' | 'Closed';
type SortKey = 'newest' | 'oldest' | 'patient' | 'id';
const PAGE_SIZES = [10, 25, 50, 100];

/** Stitch "Prescriptions Management". */
export function PrescriptionsPage() {
  const navigate = useNavigate();
  const notify = useToast();
  const { prescriptions, getPatient, updatePrescriptions } = useClinicalData();
  const [query, setQuery] = useState('');
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const s = params.get('status');
    return s === 'Active' || s === 'Refill Due' || s === 'Closed' ? s : 'All';
  });
  const [department, setDepartment] = useState('All');
  const [doctorId, setDoctorId] = useState('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);

  const counts = useMemo(() => {
    const c: Record<PrescriptionStatus, number> = { Active: 0, 'Refill Due': 0, Completed: 0, Expired: 0 };
    prescriptions.forEach((p) => c[p.status]++);
    return c;
  }, [prescriptions]);
  const controlled = prescriptions.filter((p) => p.controlled && p.status !== 'Completed' && p.status !== 'Expired').length;
  const discontinued30 = prescriptions.filter((p) => (p.status === 'Completed' || p.status === 'Expired') && parseLocalIso(p.issued) >= addDays(NOW, -30)).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = prescriptions.filter((rx) => {
      if (tab === 'Active' && rx.status !== 'Active') return false;
      if (tab === 'Refill Due' && rx.status !== 'Refill Due') return false;
      if (tab === 'Closed' && rx.status !== 'Completed' && rx.status !== 'Expired') return false;
      if (doctorId !== 'All' && rx.doctorId !== doctorId) return false;
      if (department !== 'All' && getDoctor(rx.doctorId).department !== department) return false;
      if (!q) return true;
      const p = getPatient(rx.patientId);
      return [rx.id, rx.medication, p?.name ?? '', rx.patientId].some((v) => v.toLowerCase().includes(q));
    });
    const cmp: Record<SortKey, (a: Prescription, b: Prescription) => number> = {
      newest: (a, b) => b.issued.localeCompare(a.issued),
      oldest: (a, b) => a.issued.localeCompare(b.issued),
      patient: (a, b) => (getPatient(a.patientId)?.name ?? '').localeCompare(getPatient(b.patientId)?.name ?? ''),
      id: (a, b) => b.id.localeCompare(a.id),
    };
    return [...list].sort(cmp[sort]);
  }, [prescriptions, query, tab, doctorId, department, sort, getPatient]);

  const table = useTable({ rows: filtered, pageSize, getId: (r) => r.id, resetKeys: [query, tab, doctorId, department, sort] });

  const renew = (ids: string[]) => {
    updatePrescriptions(ids, { status: 'Active', issued: toLocalIso(NOW), refillsLeft: 3 });
    notify(ids.length === 1 ? `${ids[0]} renewed for 3 refills` : `${ids.length} prescriptions renewed`);
  };

  const batchRenew = () => {
    const ids = table.selected.size ? [...table.selected] : prescriptions.filter((p) => p.status === 'Refill Due').map((p) => p.id);
    if (!ids.length) return notify('No prescriptions are due for renewal', 'info');
    renew(ids);
    table.clearSelection();
  };

  const exportCsv = () =>
    downloadCsv(
      'prescriptions.csv',
      filtered.map((rx) => ({
        'Rx ID': rx.id,
        Patient: getPatient(rx.patientId)?.name ?? '',
        'Patient ID': rx.patientId,
        Medication: rx.medication,
        Sig: rx.sig,
        Doctor: getDoctor(rx.doctorId).name,
        Issued: rx.issued,
        Status: rx.status,
        'Refills Left': rx.refillsLeft,
        Controlled: rx.controlled ? 'Yes' : 'No',
      })),
    );

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      <PageHeader
        eyebrow="Pharmacy & Regimens"
        title="Prescriptions"
        description="Track active and historical medication orders, dosages, and prescribing doctors across hospital wards."
        actions={
          <>
            <Button icon={ArrowLeftRight} onClick={batchRenew}>
              Batch Renew{table.selected.size ? ` (${table.selected.size})` : ''}
            </Button>
            <Button variant="primary" icon={ClipboardPlus} onClick={() => setCreateOpen(true)}>
              + New Prescription
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Active Prescriptions"
          icon={Pill}
          value={counts.Active.toLocaleString('en-US')}
          unit="orders"
          pill={<Badge tone="primary" icon={TrendingUp}>+6.4%</Badge>}
          note="vs last month"
          progress={(counts.Active / prescriptions.length) * 100}
        />
        <KpiTile
          label="Pending Refills"
          icon={BellRing}
          iconTone="warning"
          value={counts['Refill Due']}
          unit="queuing"
          pill={<Badge tone="warning" icon={BellRing}>Action</Badge>}
          note="Requires review"
          progress={Math.min(100, counts['Refill Due'] * 1.2)}
          progressClassName="bg-tertiary"
        />
        <KpiTile
          label="Controlled Substances"
          icon={Shield}
          iconTone="danger"
          value={controlled}
          unit="Schedule II-IV"
          pill={<Badge tone="danger" icon={Lock}>DEA Safe</Badge>}
          note="Strict audit protocol"
          progress={Math.min(100, (controlled / Math.max(1, counts.Active)) * 400)}
          progressClassName="bg-error"
        />
        <KpiTile
          label="Discontinued (30D)"
          icon={Archive}
          iconTone="muted"
          value={discontinued30}
          unit="completed"
          pill={<Badge tone="neutral" icon={CircleCheck}>Closed</Badge>}
          note="Regimen cleared"
          progress={55}
          progressClassName="bg-outline-variant"
        />
      </div>

      <div className="card flex flex-col gap-space-md p-space-lg">
        <div className="flex flex-col gap-space-sm xl:flex-row xl:items-center">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search prescriptions by medication, patient name, or RX-ID..."
            aria-label="Search prescriptions"
            shortcut="⌘F"
            wrapperClassName="flex-1"
          />
          <FilterTabs
            label="Prescription status"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'All', label: 'All Prescriptions', count: prescriptions.length },
              { value: 'Active', label: 'Active', count: counts.Active, countClassName: 'text-primary' },
              { value: 'Refill Due', label: 'Refill Due', count: counts['Refill Due'], countClassName: 'text-tertiary' },
              { value: 'Closed', label: 'Completed / Expired', count: counts.Completed + counts.Expired },
            ]}
          />
        </div>
        <div className="flex flex-col justify-between gap-space-sm lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-space-sm">
            <Select aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="All">Department: All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            <Select aria-label="Prescribing physician" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="All">Prescribing Physician: All</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="patient">Sort: Patient Name (A-Z)</option>
              <option value="id">Sort: Prescription ID</option>
            </Select>
          </div>
          <Button icon={Download} onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="card flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="th w-10 py-3">
                  <Checkbox
                    aria-label="Select page"
                    checked={table.allOnPageSelected}
                    ref={(el) => el && (el.indeterminate = table.someOnPageSelected && !table.allOnPageSelected)}
                    onChange={table.togglePage}
                  />
                </th>
                <th className="th">Patient</th>
                <th className="th">Status</th>
                <th className="th">Rx ID</th>
                <th className="th">Medication &amp; Dosage</th>
                <th className="th">Prescribing Doctor</th>
                <th className="th">Date Issued</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-sm">
              {table.pageRows.map((rx) => {
                const p = getPatient(rx.patientId);
                const due = rx.status === 'Refill Due';
                return (
                  <tr key={rx.id} className={cn('transition-colors', due ? 'bg-surface-container-low/80' : 'hover:bg-surface-container-low/50')}>
                    <td className="px-3 py-3">
                      <Checkbox aria-label={`Select ${rx.id}`} checked={table.selected.has(rx.id)} onChange={() => table.toggleRow(rx.id)} />
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => navigate(`/patients/${rx.patientId}`)} className="flex items-center gap-space-sm text-left">
                        <Avatar name={p?.name ?? '?'} size="sm" critical={p?.status === 'Critical'} />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-semibold text-on-surface hover:text-primary">{p?.name}</span>
                          <span className="max-w-[190px] truncate text-caption text-on-surface-variant">{p?.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <PrescriptionStatusBadge status={rx.status} />
                    </td>
                    <td className={cn('whitespace-nowrap px-3 py-3 font-mono text-data-mono-body', due ? 'font-semibold text-on-surface' : 'text-on-surface-variant')}>{rx.id}</td>
                    <td className="px-3 py-3">
                      <span className="flex flex-col">
                        <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                          {rx.medication}
                          {rx.controlled && <Lock size={12} className="text-error" aria-label="Controlled substance" />}
                        </span>
                        <span className="text-caption text-on-surface-variant">{rx.sig}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-on-surface">
                        <Stethoscope size={15} className="text-on-surface-variant" aria-hidden />
                        {getDoctor(rx.doctorId).name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-data-mono-body text-on-surface-variant">{formatDate(parseLocalIso(rx.issued))}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {due ? (
                          <Button size="sm" variant="tonal" icon={Check} className="text-primary" onClick={() => renew([rx.id])}>
                            Refill
                          </Button>
                        ) : (
                          <IconButton icon={RotateCcw} label="Renew" onClick={() => renew([rx.id])} />
                        )}
                        <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(rx)} />
                        <IconButton icon={Printer} label="Print label" onClick={() => notify(`Pharmacy label for ${rx.id} sent to printer`, 'info')} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={Pill} title="No prescriptions found" description="Try another status, physician or search term." />}
        </div>
        <div className="flex flex-col items-center justify-between gap-space-sm bg-surface-container-low/60 px-space-lg py-space-md sm:flex-row">
          <span className="flex flex-wrap items-center gap-space-md text-body-sm text-on-surface-variant">
            <span>
              Showing <strong className="font-mono text-on-surface">{table.rangeStart}</strong> to <strong className="font-mono text-on-surface">{table.rangeEnd}</strong> of{' '}
              <strong className="font-mono text-on-surface">{filtered.length.toLocaleString('en-US')}</strong> prescriptions
            </span>
            <span className="flex items-center gap-space-xs">
              Rows per page:
              <Select aria-label="Rows per page" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="bg-surface-container-lowest py-1 font-mono">
                {PAGE_SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </span>
          </span>
          <Pagination page={table.page} pageCount={table.pageCount} onPageChange={table.setPage} />
        </div>
      </div>

      <NewPrescriptionModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditPrescriptionModal rx={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function NewPrescriptionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { patients, getPatient, addPrescription } = useClinicalData();
  const notify = useToast();
  const [patientId, setPatientId] = useState('');
  const [med, setMed] = useState(0);
  const [refills, setRefills] = useState(3);
  const patient = getPatient(patientId.trim().toUpperCase());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    const m = MEDICATIONS[med];
    const created = addPrescription({
      patientId: patient.id,
      doctorId: patient.doctorId,
      medication: m.name,
      sig: m.sig,
      issued: toLocalIso(NOW),
      status: 'Active',
      controlled: Boolean(m.controlled),
      refillsLeft: refills,
    });
    notify(`${created.id} issued · ${m.name} for ${patient.name}`);
    setPatientId('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} icon={ClipboardPlus} title="New Prescription" subtitle="E-prescribe and route to the central hospital pharmacy">
      <form onSubmit={submit} className="flex flex-col gap-space-md">
        <Field label="Patient ID">
          <input className="field font-mono" list="rx-patients" placeholder="PT-84920" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <datalist id="rx-patients">
            {patients.slice(0, 40).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </datalist>
          {patient && (
            <span className="text-caption text-on-surface-variant">
              {patient.name} · {patient.age}y · Prescriber: {getDoctor(patient.doctorId).name}
            </span>
          )}
        </Field>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
          <Field label="Medication & Dosage" className="sm:col-span-2">
            <select className="field" value={med} onChange={(e) => setMed(Number(e.target.value))}>
              {MEDICATIONS.map((m, i) => (
                <option key={m.name} value={i}>
                  {m.name} — {m.sig}
                  {m.controlled ? ' (Controlled)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Refills">
            <input className="field font-mono" type="number" min={0} max={11} value={refills} onChange={(e) => setRefills(Number(e.target.value))} />
          </Field>
        </div>
        {MEDICATIONS[med].controlled && (
          <p className="flex items-center gap-2 rounded-lg bg-danger-container px-3 py-2 text-body-sm text-danger">
            <Lock size={15} aria-hidden /> Schedule II-IV order — DEA-EPCS biometric signature required on submit.
          </p>
        )}
        <div className="flex justify-end gap-space-sm border-t border-surface-container pt-space-md">
          <Button variant="tonal" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!patient}>
            Issue Prescription
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditPrescriptionModal({ rx, onClose }: { rx: Prescription | null; onClose: () => void }) {
  const { updatePrescriptions, getPatient } = useClinicalData();
  const notify = useToast();
  const [status, setStatus] = useState<PrescriptionStatus>('Active');
  const [refills, setRefills] = useState(0);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (rx && rx.id !== loadedId) {
    setLoadedId(rx.id);
    setStatus(rx.status);
    setRefills(rx.refillsLeft);
  }

  return (
    <Modal open={rx !== null} onClose={onClose} icon={Pencil} title={`Edit ${rx?.id ?? ''}`} subtitle={rx ? `${rx.medication} · ${getPatient(rx.patientId)?.name ?? ''}` : undefined}>
      <form
        className="flex flex-col gap-space-md"
        onSubmit={(e) => {
          e.preventDefault();
          if (!rx) return;
          updatePrescriptions([rx.id], { status, refillsLeft: refills });
          notify(`${rx.id} updated`);
          onClose();
        }}
      >
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label="Status">
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value as PrescriptionStatus)}>
              {(['Active', 'Refill Due', 'Completed', 'Expired'] as const).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Refills Remaining">
            <input className="field font-mono" type="number" min={0} max={11} value={refills} onChange={(e) => setRefills(Number(e.target.value))} />
          </Field>
        </div>
        <div className="flex justify-end gap-space-sm border-t border-surface-container pt-space-md">
          <Button variant="tonal" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
