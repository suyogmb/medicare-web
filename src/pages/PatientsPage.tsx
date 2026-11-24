import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, BedDouble, CheckCircle2, Download, FileDown, ListFilter, Plus, Siren, Tag, TrendingUp, Users } from 'lucide-react';
import type { Department, Gender, Patient, PatientStatus } from '../types';
import { DEPARTMENTS, doctors, getDoctor } from '../data/doctors';
import { useClinicalData } from '../context/ClinicalDataContext';
import { useTable } from '../hooks/useTable';
import { useHotkey } from '../hooks/useHotkey';
import { NOW, dateKey, formatVisit, parseLocalIso } from '../lib/date';
import { downloadCsv } from '../lib/csv';
import { formatNumber, padCount } from '../lib/format';
import { cn } from '../lib/cn';
import { Button } from '../components/ui/Button';
import { FilterTabs, SearchInput, Select, type FilterTabItem } from '../components/ui/Controls';
import { Popover } from '../components/ui/Menu';
import { Field } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/Section';
import { PulseStat } from '../components/ui/StatCards';
import { useToast } from '../components/ui/Toast';
import { PatientsTable, type PatientSortKey } from '../components/patients/PatientsTable';
import { PatientIntakeModal } from '../components/patients/PatientIntakeModal';
import { BatchAssignModal } from '../components/patients/BatchAssignModal';
import { NewAppointmentModal } from '../components/appointments/NewAppointmentModal';

type StatusTab = 'all' | PatientStatus;
const STATUS_TABS = new Set<StatusTab>(['all', 'Active', 'Critical', 'Pending', 'Inactive', 'Discharged']);
const PAGE_SIZES = [10, 25, 50, 100];

interface AdvancedFilters {
  gender: 'all' | Gender;
  doctorId: 'all' | string;
  age: 'all' | 'child' | 'adult' | 'senior';
}
const NO_ADVANCED: AdvancedFilters = { gender: 'all', doctorId: 'all', age: 'all' };

const SORTERS: Record<PatientSortKey, (a: Patient, b: Patient) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  id: (a, b) => a.id.localeCompare(b.id),
  age: (a, b) => a.age - b.age,
  doctor: (a, b) => getDoctor(a.doctorId).name.localeCompare(getDoctor(b.doctorId).name),
  lastVisit: (a, b) => a.lastVisit.localeCompare(b.lastVisit),
};

function toCsvRow(p: Patient) {
  return {
    'Patient ID': p.id,
    Name: p.name,
    Email: p.email,
    Age: p.age,
    Gender: p.gender,
    Phone: p.phone,
    Doctor: getDoctor(p.doctorId).name,
    Unit: p.unit,
    'Last Visit': formatVisit(parseLocalIso(p.lastVisit)),
    Status: p.status,
  };
}

export function PatientsPage() {
  const { patients, setPatientStatus } = useClinicalData();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [department, setDepartment] = useState<'all' | Department>('all');
  const initialStatus = params.get('status') as StatusTab | null;
  const [status, setStatus] = useState<StatusTab>(initialStatus && STATUS_TABS.has(initialStatus) ? initialStatus : 'all');
  const [advanced, setAdvanced] = useState<AdvancedFilters>(NO_ADVANCED);
  const [pageSize, setPageSize] = useState(10);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [bookFor, setBookFor] = useState<string | undefined>();

  // Sync deep links from the top-bar search / dashboard shortcuts
  useEffect(() => {
    const q = params.get('q');
    if (q !== null) setQuery(q);
    const s = params.get('status') as StatusTab | null;
    if (s && STATUS_TABS.has(s)) setStatus(s);
    if (params.get('focus')) searchRef.current?.focus();
    if (q !== null || s || params.get('focus')) setParams({}, { replace: true });
  }, [params, setParams]);

  useHotkey('f', () => searchRef.current?.focus());

  const counts = useMemo(() => {
    const c: Record<PatientStatus, number> = { Active: 0, Critical: 0, Pending: 0, Inactive: 0, Discharged: 0 };
    patients.forEach((p) => c[p.status]++);
    return c;
  }, [patients]);

  // Everything except the status tab, so tab counts reflect the other active filters
  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (department !== 'all' && getDoctor(p.doctorId).department !== department) return false;
      if (advanced.gender !== 'all' && p.gender !== advanced.gender) return false;
      if (advanced.doctorId !== 'all' && p.doctorId !== advanced.doctorId) return false;
      if (advanced.age === 'child' && p.age > 17) return false;
      if (advanced.age === 'adult' && (p.age < 18 || p.age > 64)) return false;
      if (advanced.age === 'senior' && p.age < 65) return false;
      if (!q) return true;
      return [p.name, p.id, p.email, p.visitNote, p.unit, p.phone].some((v) => v.toLowerCase().includes(q));
    });
  }, [patients, query, department, advanced]);

  const filtered = useMemo(() => (status === 'all' ? baseFiltered : baseFiltered.filter((p) => p.status === status)), [baseFiltered, status]);

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: baseFiltered.length };
    baseFiltered.forEach((p) => (c[p.status] = (c[p.status] ?? 0) + 1));
    return c;
  }, [baseFiltered]);

  const table = useTable<Patient, PatientSortKey>({
    rows: filtered,
    pageSize,
    getId: (p) => p.id,
    sorters: SORTERS,
    resetKeys: [query, department, status, advanced],
  });

  const tabs: FilterTabItem<StatusTab>[] = [
    { value: 'all', label: 'All Patients', count: tabCounts.all ?? 0 },
    { value: 'Active', label: 'Active', count: tabCounts.Active ?? 0, dotClassName: 'bg-success' },
    { value: 'Critical', label: 'Critical', count: tabCounts.Critical ?? 0, dotClassName: 'bg-error', countClassName: 'bg-error-container font-bold text-on-error-container' },
    { value: 'Discharged', label: 'Discharged', count: tabCounts.Discharged ?? 0 },
  ];

  const selectedIds = [...table.selected];
  const advancedCount = Object.values(advanced).filter((v) => v !== 'all').length;

  const discharge = (p: Patient) => {
    setPatientStatus(p.id, 'Discharged');
    notify(`${p.name} discharged`);
  };

  return (
    <div className="flex w-full flex-col">
      {/* Pulse bar */}
      <div className="px-space-lg pt-space-lg sm:px-space-xl">
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4 xl:gap-gutter-desktop">
          <PulseStat
            label="Registered Patients"
            value={formatNumber(patients.length)}
            icon={Users}
            footnote={
              <>
                <TrendingUp size={14} className="text-success" aria-hidden />
                <span className="font-mono text-data-code-label text-success">+4.2%</span>
                <span>vs last month</span>
              </>
            }
          />
          <PulseStat
            label="Active Inpatient"
            value={formatNumber(counts.Active)}
            icon={BedDouble}
            iconTone="success"
            footnote={
              <>
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="font-mono text-data-code-label">{((counts.Active / patients.length) * 100).toFixed(1)}% bed capacity</span>
              </>
            }
          />
          <PulseStat
            label="Critical Triage"
            value={padCount(counts.Critical)}
            icon={Siren}
            iconTone="danger"
            critical
            footnote={<span className="font-mono text-data-code-label font-semibold text-error">Immediate attention</span>}
          />
          <PulseStat
            label="Discharged (30D)"
            value={formatNumber(counts.Discharged)}
            icon={Award}
            iconTone="muted"
            footnote={
              <>
                <CheckCircle2 size={14} className="text-primary-container" aria-hidden />
                <span>Cleared recovery</span>
              </>
            }
          />
        </div>
      </div>

      {/* Header */}
      <div className="px-space-lg pb-space-md pt-space-xl sm:px-space-xl">
        <PageHeader
          title="Patients"
          tag="Live Registry"
          description="Manage and monitor all registered patients across hospital wards."
          actions={
            <>
              <Button icon={Download} onClick={() => downloadCsv(`patients-${dateKey(NOW)}.csv`, filtered.map(toCsvRow))}>
                Export CSV
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => setIntakeOpen(true)}>
                Add Patient
              </Button>
            </>
          }
        />
      </div>

      {/* Filter & segment bar */}
      <div className="px-space-lg pb-space-md sm:px-space-xl">
        <div className="card flex flex-col gap-space-md p-space-md">
          <div className="flex flex-col justify-between gap-space-md xl:flex-row xl:items-center">
            <SearchInput
              ref={searchRef}
              value={query}
              onValueChange={setQuery}
              shortcut="⌘F"
              placeholder="Search patients by name, ID, or condition..."
              aria-label="Search patients"
              wrapperClassName="flex-1 xl:max-w-xl"
            />
            <div className="flex flex-wrap items-center gap-space-sm">
              <Select aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value as 'all' | Department)}>
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <Popover
                trigger={(toggle, open) => (
                  <Button variant="tonal" icon={ListFilter} onClick={toggle} aria-expanded={open} className={cn('shadow-none', advancedCount > 0 && 'text-primary')}>
                    More Filters{advancedCount > 0 && ` (${advancedCount})`}
                  </Button>
                )}
              >
                {(close) => (
                  <div className="flex flex-col gap-space-md">
                    <Field label="Gender">
                      <select className="field" value={advanced.gender} onChange={(e) => setAdvanced((a) => ({ ...a, gender: e.target.value as AdvancedFilters['gender'] }))}>
                        <option value="all">Any</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Non-binary</option>
                      </select>
                    </Field>
                    <Field label="Age Group">
                      <select className="field" value={advanced.age} onChange={(e) => setAdvanced((a) => ({ ...a, age: e.target.value as AdvancedFilters['age'] }))}>
                        <option value="all">Any</option>
                        <option value="child">Pediatric (0-17)</option>
                        <option value="adult">Adult (18-64)</option>
                        <option value="senior">Senior (65+)</option>
                      </select>
                    </Field>
                    <Field label="Assigned Doctor">
                      <select className="field" value={advanced.doctorId} onChange={(e) => setAdvanced((a) => ({ ...a, doctorId: e.target.value }))}>
                        <option value="all">Any</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="flex justify-between gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setAdvanced(NO_ADVANCED)}>
                        Reset
                      </Button>
                      <Button variant="primary" size="sm" onClick={close}>
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </Popover>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-space-md pt-2 md:flex-row md:items-center">
            <FilterTabs label="Filter by status" items={tabs} value={status} onChange={setStatus} className="self-start" />
            <div className="flex flex-wrap items-center justify-between gap-space-md md:justify-end">
              <span className="text-body-sm text-on-surface-variant" aria-live="polite">
                {selectedIds.length > 0 ? (
                  <>
                    <strong className="font-semibold text-on-surface">{selectedIds.length}</strong> selected
                  </>
                ) : (
                  <>
                    Showing <strong className="font-semibold text-on-surface">{formatNumber(filtered.length)}</strong> patients total
                  </>
                )}
              </span>
              <div className="flex items-center gap-space-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={FileDown}
                  disabled={selectedIds.length === 0}
                  onClick={() => downloadCsv(`patients-selected-${dateKey(NOW)}.csv`, patients.filter((p) => table.selected.has(p.id)).map(toCsvRow))}
                >
                  Export Selected
                </Button>
                <Button variant="ghost" size="sm" icon={Tag} disabled={selectedIds.length === 0} onClick={() => setBatchOpen(true)}>
                  Batch Assign
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-space-lg pb-space-xl sm:px-space-xl">
        <div className="card flex flex-col overflow-hidden">
          <PatientsTable
            rows={table.pageRows}
            sort={table.sort}
            onSort={table.toggleSort}
            selected={table.selected}
            onToggleRow={table.toggleRow}
            onTogglePage={table.togglePage}
            allSelected={table.allOnPageSelected}
            someSelected={table.someOnPageSelected}
            onBook={setBookFor}
            onDischarge={discharge}
          />
          <div className="flex flex-col items-center justify-between gap-space-md bg-surface-container-low/60 px-4 py-3 md:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-space-md text-body-sm text-on-surface-variant">
              <span>
                Showing <strong className="font-semibold text-on-surface">{formatNumber(table.rangeStart)}</strong> to{' '}
                <strong className="font-semibold text-on-surface">{formatNumber(table.rangeEnd)}</strong> of{' '}
                <strong className="font-semibold text-on-surface">{formatNumber(table.total)}</strong> patients
              </span>
              <label className="flex items-center gap-2 border-l border-surface-container pl-space-md">
                Rows:
                <Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="bg-surface-container-lowest py-1 shadow-sm">
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <Pagination page={table.page} pageCount={table.pageCount} onPageChange={table.setPage} />
          </div>
        </div>
      </div>

      <PatientIntakeModal open={intakeOpen} onClose={() => setIntakeOpen(false)} />
      <BatchAssignModal open={batchOpen} patientIds={selectedIds} onClose={() => setBatchOpen(false)} onDone={table.clearSelection} />
      <NewAppointmentModal open={!!bookFor} patientId={bookFor} onClose={() => setBookFor(undefined)} />
    </div>
  );
}
