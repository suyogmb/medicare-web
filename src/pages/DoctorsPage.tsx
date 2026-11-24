import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BellRing,
  CalendarClock,
  CalendarX2,
  Clock,
  Download,
  Hourglass,
  LayoutGrid,
  List,
  Mail,
  MessageSquareText,
  AlertCircle,
  Stethoscope,
  Star,
  UserPlus,
  UserSearch,
} from 'lucide-react';
import type { StaffDoctor, StaffStatus } from '../types';
import { STAFF_STATUS_LABEL, STAFF_STATUS_ORDER, staffDepartments, staffDoctors } from '../data/staff';
import { useTable } from '../hooks/useTable';
import { downloadCsv } from '../lib/csv';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { StaffStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Chip, SearchInput, Select } from '../components/ui/Controls';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState, PageHeader } from '../components/ui/Section';
import { PulseStat } from '../components/ui/StatCards';
import { useToast } from '../components/ui/Toast';
import { NewAppointmentModal } from '../components/appointments/NewAppointmentModal';

type SortKey = 'experience' | 'rating' | 'caseload' | 'name';
const SORTS: Record<SortKey, { label: string; cmp: (a: StaffDoctor, b: StaffDoctor) => number }> = {
  experience: { label: 'Experience (High to Low)', cmp: (a, b) => b.experienceYears - a.experienceYears },
  rating: { label: 'Rating (Highest)', cmp: (a, b) => b.rating - a.rating },
  caseload: { label: 'Patient Caseload', cmp: (a, b) => b.activePatients - a.activePatients },
  name: { label: 'Name (A-Z)', cmp: (a, b) => a.name.replace('Dr. ', '').localeCompare(b.name.replace('Dr. ', '')) },
};

const PAGE_SIZE = 6;

export function DoctorsPage() {
  const navigate = useNavigate();
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | StaffStatus>('All');
  const [department, setDepartment] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('experience');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [booking, setBooking] = useState<string | null>(null);

  const departments = useMemo(staffDepartments, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staffDoctors
      .filter((d) => status === 'All' || d.status === status)
      .filter((d) => department === 'All' || d.department === department)
      .filter((d) => !q || [d.name, d.department, d.role, d.location, d.id, d.npi].some((v) => v.toLowerCase().includes(q)))
      .sort(SORTS[sort].cmp);
  }, [query, status, department, sort]);

  const table = useTable({ rows: filtered, pageSize: PAGE_SIZE, getId: (d) => d.id, resetKeys: [query, status, department, sort] });

  const count = (s: StaffStatus) => staffDoctors.filter((d) => d.status === s).length;
  const avgRating = staffDoctors.reduce((s, d) => s + d.rating, 0) / staffDoctors.length;
  const reviews = staffDoctors.reduce((s, d) => s + d.reviews, 0);
  const inSurgery = staffDoctors.filter((d) => d.status === 'In Surgery');

  const primaryAction = (d: StaffDoctor) => {
    if (d.status === 'On Duty') notify(`Paging ${d.name} on ${d.pager}`, 'info');
    else if (d.status === 'Away') notify(`Message queued for ${d.name}`, 'info');
    else if (d.attending) setBooking(d.id);
    else notify(`Consult request sent to ${d.name}`);
  };

  const exportCsv = () =>
    downloadCsv(
      'doctors-directory.csv',
      filtered.map((d) => ({
        ID: d.id,
        Name: d.name,
        Department: d.department,
        Role: d.role,
        Status: STAFF_STATUS_LABEL[d.status],
        Location: d.location,
        'Experience (yrs)': d.experienceYears,
        'Active Patients': d.activePatients,
        Rating: d.rating,
        NPI: d.npi,
      })),
    );

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      <PageHeader
        eyebrow="● Clinical Staff Operations"
        title="Doctors Directory"
        description={`Browse and manage ${staffDoctors.length} on-duty and consulting medical specialists across all clinical units.`}
        actions={
          <>
            <Button icon={Download} onClick={exportCsv}>
              Export Directory
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={() => notify('Credentialing request opened with Medical Staff Office', 'info')}>
              + Add Doctor
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <PulseStat label="Active Specialists" value={staffDoctors.length} icon={Stethoscope} footnote={<span className="text-primary">100% Verified Credentials</span>} />
        <PulseStat label="Available On-Site" value={count('Available')} icon={Activity} footnote="Ready for instant consult" />
        <PulseStat
          label="In Surgical Theatres"
          value={<span className="text-tertiary">{inSurgery.length}</span>}
          icon={Hourglass}
          iconTone="warning"
          footnote={<span className="truncate">{inSurgery.map((d) => d.statusNote?.match(/OR-\d/)?.[0]).filter(Boolean).join(', ')} Active</span>}
        />
        <PulseStat
          label="Avg. Satisfaction"
          value={
            <>
              {avgRating.toFixed(2)}
              <span className="text-body-sm font-medium text-on-surface-variant">/5.0</span>
            </>
          }
          icon={MessageSquareText}
          iconTone="muted"
          footnote={`From ${reviews.toLocaleString('en-US')} patient audits`}
        />
      </div>

      {/* Filter bar */}
      <div className="card flex flex-col gap-space-md p-space-lg">
        <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search doctors by name, specialty, clinical ward, or NPI badge..."
            aria-label="Search doctors"
            wrapperClassName="flex-1"
          />
          <div className="flex flex-wrap items-center gap-space-sm">
            <Select aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="All">Status: All ({staffDoctors.length})</option>
              {STAFF_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAFF_STATUS_LABEL[s]} ({count(s)})
                </option>
              ))}
            </Select>
            <Select aria-label="Sort doctors" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {(Object.keys(SORTS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  Sort: {SORTS[k].label}
                </option>
              ))}
            </Select>
            <div className="flex items-center rounded-lg bg-surface-container-low p-1" role="radiogroup" aria-label="Layout">
              {(
                [
                  ['grid', LayoutGrid],
                  ['list', List],
                ] as const
              ).map(([v, Icon]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  aria-label={`${v} view`}
                  onClick={() => setView(v)}
                  className={cn('rounded p-1.5 transition-colors', view === v ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}
                >
                  <Icon size={17} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="no-scrollbar flex items-center gap-space-sm overflow-x-auto pb-0.5">
          <Chip active={department === 'All'} onClick={() => setDepartment('All')}>
            All Doctors ({staffDoctors.length})
          </Chip>
          {departments.map((d) => (
            <Chip key={d.department} active={department === d.department} onClick={() => setDepartment(d.department)}>
              {d.department} ({d.count})
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={UserSearch} title="No doctors match these filters" description="Clear the search or pick another department." />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 min-[1400px]:grid-cols-3">
          {table.pageRows.map((d) => (
            <DoctorCard key={d.id} doctor={d} onView={() => navigate(`/doctors/${d.id}`)} onAction={() => primaryAction(d)} />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="th py-3">Doctor</th>
                <th className="th">Department</th>
                <th className="th">Status</th>
                <th className="th">Location</th>
                <th className="th text-right">Experience</th>
                <th className="th text-right">Patients</th>
                <th className="th text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="text-body-sm">
              {table.pageRows.map((d) => (
                <tr key={d.id} onClick={() => navigate(`/doctors/${d.id}`)} className="cursor-pointer transition-colors hover:bg-surface-container-low/60">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-space-sm">
                      <Avatar name={d.name} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{d.name}</span>
                        <span className="text-caption text-on-surface-variant">{d.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-on-surface">{d.department}</td>
                  <td className="px-3 py-3">
                    <StaffStatusBadge status={d.status} label={STAFF_STATUS_LABEL[d.status]} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-data-mono-body text-on-surface-variant">{d.location}</td>
                  <td className="px-3 py-3 text-right font-mono text-data-mono-body">{d.experienceYears} yrs</td>
                  <td className="px-3 py-3 text-right font-mono text-data-mono-body">{d.activePatients}</td>
                  <td className="px-3 py-3 text-right font-mono text-data-mono-body">★ {d.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-space-sm sm:flex-row">
        <span className="text-body-sm text-on-surface-variant">
          Showing <strong className="font-semibold text-on-surface">{table.rangeStart} - {table.rangeEnd}</strong> of <strong className="text-on-surface">{filtered.length}</strong> registered doctors
        </span>
        <Pagination variant="text" page={table.page} pageCount={table.pageCount} onPageChange={table.setPage} />
      </div>

      <NewAppointmentModal open={booking !== null} doctorId={booking ?? undefined} onClose={() => setBooking(null)} />
    </div>
  );
}

const ACTION_LABEL: Record<StaffStatus, { label: string; icon?: typeof Mail; variant: 'primary' | 'tonal' }> = {
  Available: { label: 'Book Consult', variant: 'primary' },
  'In Consultation': { label: 'Book Consult', variant: 'primary' },
  'In Surgery': { label: 'Schedule Slot', variant: 'tonal' },
  'On Duty': { label: 'Contact Pager', icon: BellRing, variant: 'primary' },
  Away: { label: 'Leave Message', icon: Mail, variant: 'tonal' },
};

function DoctorCard({ doctor: d, onView, onAction }: { doctor: StaffDoctor; onView: () => void; onAction: () => void }) {
  const action = ACTION_LABEL[d.status];
  const tile = (() => {
    switch (d.status) {
      case 'In Surgery':
        return { icon: Hourglass, label: 'Current Status:', value: d.statusNote ?? 'In theatre', className: 'bg-tertiary-fixed/40 text-tertiary' };
      case 'On Duty':
        return { icon: AlertCircle, label: 'Triage Priority', value: d.statusNote ?? 'Pager active', className: 'bg-surface-container-low text-primary' };
      case 'Away':
        return { icon: CalendarX2, label: 'Planned Return:', value: d.statusNote ?? '—', className: 'bg-surface-container-low text-on-surface-variant' };
      case 'In Consultation':
        return { icon: CalendarClock, label: 'Current Status:', value: d.statusNote ?? 'In consult', className: 'bg-surface-container-low text-on-surface-variant' };
      default:
        return { icon: Clock, label: 'Next available slot:', value: d.nextSlot ?? 'Today', className: 'bg-surface-container-low text-on-surface-variant' };
    }
  })();

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="flex flex-col gap-space-md p-space-lg">
        <div className="flex items-start gap-space-md">
          <Avatar name={d.name} size="xl" className="rounded-xl" status={d.status === 'Away' ? 'muted' : 'primary'} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="truncate text-headline-sm font-bold text-on-surface">{d.name}</h3>
              <StaffStatusBadge status={d.status} label={STAFF_STATUS_LABEL[d.status]} />
            </div>
            <span className="truncate text-body-sm text-on-surface-variant">
              {d.department} Department · {d.role}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-on-surface">
                <Star size={14} className="text-warning" aria-hidden /> {d.rating}
              </span>
              <span className="text-caption">({d.reviews} reviews)</span>
              <span>•</span>
              <span className="font-mono text-data-code-label">{d.location}</span>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-surface-container">
          <div className="bg-surface-container-low px-space-md py-space-sm">
            <span className="block text-caption uppercase tracking-wider text-on-surface-variant">Experience</span>
            <span className="font-mono text-data-metric-md font-semibold text-on-surface">
              {d.experienceYears} <span className="text-body-sm font-normal text-on-surface-variant">yrs</span>
            </span>
          </div>
          <div className="bg-surface-container-low px-space-md py-space-sm">
            <span className="block text-caption uppercase tracking-wider text-on-surface-variant">{d.status === 'On Duty' ? 'Patients Handled' : 'Active Patients'}</span>
            <span className="font-mono text-data-metric-md font-semibold text-on-surface">{d.activePatients}</span>
          </div>
        </div>
        <div className={cn('flex items-center justify-between gap-space-sm rounded-lg px-space-md py-2.5 text-body-sm', tile.className)}>
          <span className="inline-flex items-center gap-1.5">
            <tile.icon size={15} aria-hidden />
            {tile.label}
          </span>
          <span className="text-right font-mono text-data-mono-body font-semibold">{tile.value}</span>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-space-sm bg-surface-container-low/60 px-space-lg py-space-md">
        <Button onClick={onView}>View Profile</Button>
        <Button variant={action.variant} icon={action.icon} onClick={onAction}>
          {action.label}
        </Button>
      </div>
    </article>
  );
}
