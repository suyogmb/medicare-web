import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, BellRing, CalendarPlus, LogOut, UserRound, Users } from 'lucide-react';
import type { Patient } from '../../types';
import { getDoctor } from '../../data/doctors';
import { formatVisit, parseLocalIso } from '../../lib/date';
import { cn } from '../../lib/cn';
import type { SortState } from '../../hooks/useTable';
import { Avatar } from '../ui/Avatar';
import { PatientStatusBadge } from '../ui/Badge';
import { Checkbox } from '../ui/Controls';
import { RowMenu } from '../ui/Menu';
import { EmptyState } from '../ui/Section';

export type PatientSortKey = 'name' | 'id' | 'age' | 'doctor' | 'lastVisit';

interface PatientsTableProps {
  rows: Patient[];
  sort?: SortState<PatientSortKey>;
  onSort: (key: PatientSortKey) => void;
  selected: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: () => void;
  allSelected: boolean;
  someSelected: boolean;
  onBook: (patientId: string) => void;
  onDischarge: (patient: Patient) => void;
}

function SortHeader({ label, sortKey, sort, onSort, className }: { label: string; sortKey: PatientSortKey; sort?: SortState<PatientSortKey>; onSort: (k: PatientSortKey) => void; className?: string }) {
  const active = sort?.key === sortKey;
  const Icon = sort?.direction === 'desc' ? ArrowDown : ArrowUp;
  return (
    <th className={cn('th', className)} aria-sort={active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : 'none'} scope="col">
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-on-surface">
        {label}
        <Icon size={12} className={active ? 'text-primary' : 'opacity-0'} aria-hidden />
      </button>
    </th>
  );
}

/** Stitch "Primary Medical Data Table" on the Patients screen. */
export function PatientsTable({ rows, sort, onSort, selected, onToggleRow, onTogglePage, allSelected, someSelected, onBook, onDischarge }: PatientsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[1080px] select-text border-collapse text-left">
        <thead>
          <tr className="h-10 select-none bg-surface-container-low">
            <th className="w-12 px-4 py-2 text-center" scope="col">
              <Checkbox
                aria-label="Select all patients on this page"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={onTogglePage}
              />
            </th>
            <SortHeader label="Patient Details" sortKey="name" sort={sort} onSort={onSort} className="min-w-[240px]" />
            <SortHeader label="Patient ID" sortKey="id" sort={sort} onSort={onSort} className="min-w-[110px]" />
            <SortHeader label="Age / Gender" sortKey="age" sort={sort} onSort={onSort} className="min-w-[120px]" />
            <th className="th min-w-[140px]" scope="col">Contact Number</th>
            <SortHeader label="Assigned Doctor" sortKey="doctor" sort={sort} onSort={onSort} className="min-w-[180px]" />
            <SortHeader label="Last Visit" sortKey="lastVisit" sort={sort} onSort={onSort} className="min-w-[160px]" />
            <th className="th min-w-[110px]" scope="col">Status</th>
            <th className="th w-14 text-right" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody className="text-body-md">
          {rows.map((p) => {
            const critical = p.status === 'Critical';
            const doctor = getDoctor(p.doctorId);
            const isSelected = selected.has(p.id);
            return (
              <tr
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className={cn(
                  'group cursor-pointer border-b border-surface-container-low transition-colors last:border-0',
                  isSelected ? 'bg-primary-fixed/30' : critical ? 'bg-[#fff5f5]/60 hover:bg-[#fff0f0]' : 'hover:bg-surface-bright',
                )}
              >
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox aria-label={`Select ${p.name}`} checked={isSelected} onChange={() => onToggleRow(p.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-space-sm">
                    <Avatar name={p.name} critical={critical} />
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('truncate font-semibold transition-colors', critical ? 'text-error group-hover:underline' : 'text-on-surface group-hover:text-primary')}>{p.name}</span>
                        {critical && <BellRing size={14} className="shrink-0 text-error" aria-label="ICU monitored" />}
                      </div>
                      <span className="truncate text-caption text-on-surface-variant">{p.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded px-1.5 py-0.5 font-mono text-data-mono-body', critical ? 'bg-error-container/40 font-semibold text-error' : 'bg-surface-container-low font-medium text-on-surface-variant')}>
                    {p.id}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={cn('text-on-surface', critical && 'font-medium')}>
                    {p.age} <span className="font-normal text-on-surface-variant">/ {p.gender}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-data-mono-body text-on-surface-variant">{p.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-body-sm font-medium text-on-surface">{doctor.name}</span>
                    <span className={cn('text-caption', critical ? 'font-medium text-error' : 'text-on-surface-variant')}>{p.unit}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className={cn('flex items-center gap-1 whitespace-nowrap font-mono text-[12px]', critical ? 'font-semibold text-error' : 'font-medium text-on-surface')}>
                      {critical && <span className="h-1.5 w-1.5 rounded-full bg-error" />}
                      {formatVisit(parseLocalIso(p.lastVisit))}
                    </span>
                    <span className="text-caption text-on-surface-variant">{p.visitNote}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PatientStatusBadge status={p.status} />
                </td>
                <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    label={`Actions for ${p.name}`}
                    items={[
                      { label: 'View details', icon: UserRound, onSelect: () => navigate(`/patients/${p.id}`) },
                      { label: 'Book appointment', icon: CalendarPlus, onSelect: () => onBook(p.id) },
                      { label: 'Discharge patient', icon: LogOut, danger: true, disabled: p.status === 'Discharged', onSelect: () => onDischarge(p) },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyState icon={Users} title="No patients match these filters" description="Adjust the search, department or status filters to widen the results." />}
    </div>
  );
}
