import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownWideNarrow,
  CircleCheck,
  CloudUpload,
  Download,
  Eye,
  FileHeart,
  FileSearch,
  FileText,
  Flag,
  FolderHeart,
  Hourglass,
  PenLine,
  Plus,
  Printer,
  Share2,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import type { RecordIndexRow, RecordStatus, RecordType } from '../types';
import { recordIndex } from '../data/records';
import { getDoctor } from '../data/doctors';
import { getClinicalProfile } from '../data/clinical';
import { useClinicalData } from '../context/ClinicalDataContext';
import { useTable } from '../hooks/useTable';
import { NOW, formatDate, formatTime, parseLocalIso, toLocalIso } from '../lib/date';
import { downloadCsv } from '../lib/csv';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { RecordStatusBadge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { Checkbox, FilterTabs, PillTabs, SearchInput, Select } from '../components/ui/Controls';
import { Field, Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState, PageHeader } from '../components/ui/Section';
import { PulseStat } from '../components/ui/StatCards';
import { useToast } from '../components/ui/Toast';

export const RECORD_TYPE_STYLE: Record<RecordType, string> = {
  'Clinical Note': 'bg-primary-fixed/70 text-on-primary-fixed',
  'Discharge Summary': 'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant',
  'Radiology MRI': 'bg-surface-container text-on-surface',
  Pathology: 'bg-error-container text-on-error-container',
  'Lab Report': 'bg-surface-container-high text-on-surface',
};

const DEPT_TABS = ['All Records', 'Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pending Review'] as const;
type DeptTab = (typeof DEPT_TABS)[number];
const PAGE_SIZES = [8, 25, 50];

/** Stitch "Medical Records" — EHR repository with Record Inspector. */
export function RecordsPage() {
  const navigate = useNavigate();
  const notify = useToast();
  const { getPatient, patients } = useClinicalData();
  const [records, setRecords] = useState<RecordIndexRow[]>(recordIndex);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | RecordStatus>('All');
  const [tab, setTab] = useState<DeptTab>('All Records');
  const [newestFirst, setNewestFirst] = useState(true);
  const [pageSize, setPageSize] = useState(8);
  const [inspectedId, setInspectedId] = useState<string>(records.find((r) => r.status === 'Pending Review')?.id ?? records[0].id);
  const [noteOpen, setNoteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => {
    const c = { Verified: 0, 'Pending Review': 0, Flagged: 0 } as Record<RecordStatus, number>;
    records.forEach((r) => c[r.status]++);
    return c;
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = records.filter((r) => {
      if (status !== 'All' && r.status !== status) return false;
      if (tab === 'Pending Review' && r.status !== 'Pending Review') return false;
      if (tab !== 'All Records' && tab !== 'Pending Review' && r.department !== tab) return false;
      if (!q) return true;
      const p = getPatient(r.patientId);
      return [p?.name ?? '', r.patientId, r.type, r.title, getDoctor(r.doctorId).name, r.department].some((v) => v.toLowerCase().includes(q));
    });
    return newestFirst ? list : [...list].reverse();
  }, [records, query, status, tab, newestFirst, getPatient]);

  const table = useTable({ rows: filtered, pageSize, getId: (r) => r.id, resetKeys: [query, status, tab, newestFirst] });
  const inspected = records.find((r) => r.id === inspectedId) ?? filtered[0];

  const setRecordStatus = (id: string, next: RecordStatus) => setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));

  const exportSelected = () => {
    const rows = table.selected.size ? records.filter((r) => table.selected.has(r.id)) : filtered;
    downloadCsv(
      'medical-records.csv',
      rows.map((r) => ({
        Record: r.id,
        Patient: getPatient(r.patientId)?.name ?? '',
        'Patient ID': r.patientId,
        Type: r.type,
        Title: r.title,
        Department: r.department,
        Doctor: getDoctor(r.doctorId).name,
        Status: r.status,
        Date: r.date,
      })),
    );
  };

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      <PageHeader
        title="Medical Records"
        tag="EHR Repository"
        description={`Review and manage clinical notes, lab results, and diagnostic reports across ${patients.length.toLocaleString('en-US')} patient charts.`}
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.dcm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) notify(`${f.name} uploaded to EHR inbox for indexing`);
                e.target.value = '';
              }}
            />
            <Button icon={CloudUpload} onClick={() => fileRef.current?.click()}>
              Upload Record
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setNoteOpen(true)}>
              New Clinical Note
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <PulseStat label="Indexed Records" value={records.length.toLocaleString('en-US')} icon={FolderHeart} footnote="48.2 GB Total Storage" />
        <PulseStat
          label="Verified & Signed"
          value={counts.Verified.toLocaleString('en-US')}
          icon={ShieldCheck}
          footnote={<span className="text-primary">{((counts.Verified / records.length) * 100).toFixed(1)}% Compliance rate</span>}
        />
        <PulseStat label="Pending Review" value={<span className="text-tertiary">{counts['Pending Review']}</span>} icon={Hourglass} iconTone="warning" footnote="Avg wait: 4.2 hours" />
        <PulseStat label="Flagged / Urgent" value={counts.Flagged} icon={Flag} iconTone="danger" critical footnote={<span className="text-error">Requires Chief Sign-off</span>} />
      </div>

      <div className="card flex flex-col gap-space-md p-space-lg">
        <div className="flex flex-col gap-space-sm xl:flex-row xl:items-center">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search patient records, diagnoses, document types, or Patient ID..."
            aria-label="Search records"
            shortcut="⌘F"
            wrapperClassName="flex-1"
          />
          <FilterTabs
            label="Record status"
            value={status}
            onChange={setStatus}
            items={[
              { value: 'All', label: 'All Statuses', count: records.length },
              { value: 'Verified', label: 'Verified', count: counts.Verified, dotClassName: 'bg-primary' },
              { value: 'Pending Review', label: 'Pending Review', count: counts['Pending Review'], dotClassName: 'bg-tertiary' },
              { value: 'Flagged', label: 'Flagged', count: counts.Flagged, dotClassName: 'bg-error', countClassName: 'text-error font-bold' },
            ]}
          />
        </div>
        <div className="flex flex-col justify-between gap-space-sm lg:flex-row lg:items-center">
          <PillTabs label="Department" value={tab} onChange={setTab} items={DEPT_TABS.map((t) => ({ value: t, label: t }))} />
          <div className="flex items-center gap-space-md text-body-sm">
            <span className="font-mono text-data-mono-body text-on-surface-variant">{filtered.length.toLocaleString('en-US')} records</span>
            <button type="button" onClick={() => setNewestFirst((v) => !v)} className="inline-flex items-center gap-1 font-medium text-on-surface hover:text-primary">
              <ArrowDownWideNarrow size={16} className={cn(!newestFirst && 'rotate-180')} aria-hidden /> {newestFirst ? 'Newest First' : 'Oldest First'}
            </button>
            <button type="button" onClick={exportSelected} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              <Download size={16} aria-hidden /> Export {table.selected.size ? `Selected (${table.selected.size})` : 'All'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-xl 2xl:grid-cols-12">
        <div className="card flex min-w-0 flex-col overflow-hidden 2xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
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
                  <th className="th">Record / Patient</th>
                  <th className="th">Document Type</th>
                  <th className="th">Patient ID</th>
                  <th className="th">Department &amp; Doctor</th>
                  <th className="th">Status</th>
                  <th className="th">Date &amp; Time</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-body-sm">
                {table.pageRows.map((r) => {
                  const p = getPatient(r.patientId);
                  const when = parseLocalIso(r.date);
                  const active = inspected?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setInspectedId(r.id)}
                      aria-selected={active}
                      className={cn(
                        'cursor-pointer transition-colors',
                        active ? 'bg-primary-fixed/30' : r.status === 'Flagged' ? 'bg-error-container/20 hover:bg-error-container/30' : r.status === 'Pending Review' ? 'bg-tertiary-fixed/15 hover:bg-tertiary-fixed/25' : 'hover:bg-surface-container-low/60',
                      )}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox aria-label={`Select ${r.id}`} checked={table.selected.has(r.id)} onChange={() => table.toggleRow(r.id)} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-space-sm">
                          <Avatar name={p?.name ?? '?'} size="sm" critical={p?.status === 'Critical'} />
                          <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-1 font-semibold text-on-surface">
                              {p?.name}
                              {r.status === 'Flagged' && <TriangleAlert size={14} className="text-error" aria-hidden />}
                            </span>
                            <span className="max-w-[160px] truncate text-caption text-on-surface-variant">{p?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-data-code-label font-medium', RECORD_TYPE_STYLE[r.type])}>{r.type}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-data-mono-body text-on-surface">{r.patientId}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="whitespace-nowrap text-on-surface">{r.department}</span>
                          <span className="whitespace-nowrap text-caption text-on-surface-variant">{getDoctor(r.doctorId).name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <RecordStatusBadge status={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="flex flex-col font-mono text-data-mono-body">
                          <span className="text-on-surface">{formatDate(when)}</span>
                          <span className="text-caption text-on-surface-variant">{formatTime(when)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton icon={FileText} label="Open PDF" onClick={() => notify(`${r.title} opened in viewer`, 'info')} />
                          {r.status === 'Verified' ? (
                            <IconButton icon={PenLine} label="Addend note" onClick={() => notify(`Addendum started for ${r.id}`, 'info')} />
                          ) : (
                            <IconButton
                              icon={CircleCheck}
                              label="Countersign"
                              onClick={() => {
                                setRecordStatus(r.id, 'Verified');
                                notify(`${r.id} countersigned`);
                              }}
                            />
                          )}
                          <IconButton
                            icon={Share2}
                            label="Copy link"
                            onClick={() => void navigator.clipboard?.writeText(`${location.origin}/patients/${r.patientId}`).then(() => notify('Secure chart link copied'))}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={FileSearch} title="No records found" description="Adjust the status filter or search terms." />}
          </div>
          <div className="mt-auto flex flex-col items-center justify-between gap-space-sm bg-surface-container-low/60 px-space-lg py-space-md sm:flex-row">
            <span className="flex items-center gap-space-sm text-body-sm text-on-surface-variant">
              Showing <strong className="text-on-surface">{table.rangeStart}</strong> to <strong className="text-on-surface">{table.rangeEnd}</strong> of{' '}
              <strong className="text-on-surface">{filtered.length.toLocaleString('en-US')}</strong> entries
              <Select aria-label="Rows per page" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="bg-surface-container-lowest py-1">
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} per page
                  </option>
                ))}
              </Select>
            </span>
            <Pagination page={table.page} pageCount={table.pageCount} onPageChange={table.setPage} />
          </div>
        </div>

        {inspected && (
          <RecordInspector
            record={inspected}
            onOpen={() => navigate(`/patients/${inspected.patientId}`)}
            onSign={() => {
              setRecordStatus(inspected.id, 'Verified');
              notify(`${inspected.id} countersigned by chief`);
            }}
            onDownload={() => notify(`${inspected.title}.pdf downloaded`)}
          />
        )}
      </div>

      <NewNoteModal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        onCreate={(row) => {
          setRecords((prev) => [row, ...prev]);
          setInspectedId(row.id);
          setTab('All Records');
          setStatus('All');
          notify(`Clinical note ${row.id} created`);
        }}
      />
    </div>
  );
}

function RecordInspector({ record, onOpen, onSign, onDownload }: { record: RecordIndexRow; onOpen: () => void; onSign: () => void; onDownload: () => void }) {
  const { getPatient } = useClinicalData();
  const patient = getPatient(record.patientId);
  const profile = useMemo(() => (patient ? getClinicalProfile(patient) : undefined), [patient]);
  if (!patient || !profile) return null;
  const when = parseLocalIso(record.date);
  const statusColor = record.status === 'Verified' ? 'text-primary' : record.status === 'Flagged' ? 'text-error' : 'text-tertiary';

  return (
    <aside className="card flex flex-col gap-space-md self-start p-space-lg 2xl:sticky 2xl:top-20 2xl:col-span-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-headline-md font-semibold text-on-surface">
          <FileHeart size={20} className="text-primary" aria-hidden /> Record Inspector
        </h2>
      </div>
      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center justify-between">
          <span className={cn('rounded-full px-2.5 py-0.5 font-mono text-data-code-label font-medium', RECORD_TYPE_STYLE[record.type])}>{record.type}</span>
          <span className="font-mono text-data-mono-body font-semibold text-primary">{record.patientId}</span>
        </div>
        <div className="flex items-center gap-space-md">
          <Avatar name={patient.name} size="lg" className="h-12 w-12" critical={patient.status === 'Critical'} />
          <div className="flex flex-col">
            <span className="text-headline-sm font-bold text-on-surface">{patient.name}</span>
            <span className="font-mono text-data-code-label text-on-surface-variant">
              {formatDate(when)} · {formatTime(when)}
            </span>
          </div>
        </div>
      </div>
      <dl className="flex flex-col divide-y divide-surface-container text-body-sm">
        {[
          ['Document Title:', record.title],
          ['Attending Specialist:', getDoctor(record.doctorId).name],
          ['Clinical Specialty:', record.department],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-space-md py-2">
            <dt className="shrink-0 text-on-surface-variant">{k}</dt>
            <dd className="truncate text-right font-medium text-on-surface">{v}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between py-2">
          <dt className="text-on-surface-variant">Signing Status:</dt>
          <dd className={cn('font-semibold', statusColor)}>{record.status}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-space-xs">
        <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Clinical Findings Abstract</span>
        <p className="rounded-xl bg-surface-container-low p-space-md text-body-sm leading-relaxed text-on-surface">{profile.findings}</p>
      </div>
      <div className="rounded-xl bg-surface-container-low p-space-md">
        <div className="mb-space-sm flex items-center justify-between">
          <span className="text-body-sm font-semibold text-on-surface">Recorded Vitals at Timestamp</span>
          <span className={cn('font-mono text-data-code-label', patient.status === 'Critical' ? 'text-error' : 'text-primary')}>{patient.status === 'Critical' ? 'Out of Bounds' : 'Normal Bounds'}</span>
        </div>
        <div className="grid grid-cols-3 gap-space-sm text-center">
          {[
            ['BP', `${profile.vitals.systolic}/${profile.vitals.diastolic}`],
            ['Pulse', `${profile.vitals.heartRate} bpm`],
            ['SpO2', `${profile.vitals.spo2}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-surface-container-lowest py-space-sm">
              <span className="block text-caption text-on-surface-variant">{k}</span>
              <span className="font-mono text-data-mono-body font-semibold text-on-surface">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        <Button variant="primary" icon={Eye} className="flex-1" onClick={onOpen}>
          Open Full EHR
        </Button>
        {record.status !== 'Verified' && (
          <Button variant="tonal" icon={CircleCheck} onClick={onSign}>
            Sign
          </Button>
        )}
        <IconButton icon={Download} label="Download record" tone="tray" className="p-2.5" onClick={onDownload} />
        <IconButton icon={Printer} label="Print record" tone="tray" className="p-2.5" onClick={() => window.print()} />
      </div>
    </aside>
  );
}

const RECORD_TYPES: RecordType[] = ['Clinical Note', 'Lab Report', 'Radiology MRI', 'Discharge Summary', 'Pathology'];

function NewNoteModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (row: RecordIndexRow) => void }) {
  const { patients, getPatient } = useClinicalData();
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState<RecordType>('Clinical Note');
  const [title, setTitle] = useState('Progress Note');
  const valid = Boolean(getPatient(patientId.trim().toUpperCase()));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = getPatient(patientId.trim().toUpperCase());
    if (!p) return;
    onCreate({
      id: `REC-${Date.now().toString().slice(-6)}`,
      patientId: p.id,
      type,
      title: title.trim() || type,
      doctorId: p.doctorId,
      department: getDoctor(p.doctorId).department,
      date: toLocalIso(NOW),
      status: 'Pending Review',
    });
    setPatientId('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} icon={FileText} title="New Clinical Note" subtitle="Draft a chart entry — it enters the Pending Review queue for countersignature">
      <form onSubmit={submit} className="flex flex-col gap-space-md">
        <Field label="Patient ID">
          <input className="field font-mono" list="record-patients" placeholder="PT-84920" value={patientId} onChange={(e) => setPatientId(e.target.value)} aria-invalid={patientId.length > 0 && !valid} />
          <datalist id="record-patients">
            {patients.slice(0, 40).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label="Document Type">
            <select className="field" value={type} onChange={(e) => setType(e.target.value as RecordType)}>
              {RECORD_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-space-sm border-t border-surface-container pt-space-md">
          <Button variant="tonal" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!valid}>
            Create Note
          </Button>
        </div>
      </form>
    </Modal>
  );
}
