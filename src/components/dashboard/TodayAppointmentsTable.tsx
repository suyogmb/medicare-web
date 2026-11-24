import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX2, Download, Eye, UserRound } from 'lucide-react';
import { useClinicalData } from '../../context/ClinicalDataContext';
import { getDoctor } from '../../data/doctors';
import { useTable } from '../../hooks/useTable';
import { NOW, formatTime, isSameDay, parseLocalIso, dateKey } from '../../lib/date';
import { downloadCsv } from '../../lib/csv';
import { cn } from '../../lib/cn';
import { AppointmentStatusBadge, Tag } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/Button';
import { SearchInput } from '../ui/Controls';
import { RowMenu } from '../ui/Menu';
import { Pagination } from '../ui/Pagination';
import { EmptyState } from '../ui/Section';

const PAGE_SIZE = 6;

/** Stitch dashboard "Today's Appointments" table. */
export function TodayAppointmentsTable() {
  const { appointments, getPatient } = useClinicalData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const today = useMemo(
    () =>
      appointments
        .filter((a) => isSameDay(parseLocalIso(a.start), NOW))
        .map((a) => ({ appointment: a, patient: getPatient(a.patientId)!, doctor: getDoctor(a.doctorId) }))
        .filter((r) => r.patient),
    [appointments, getPatient],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return today;
    return today.filter((r) => [r.patient.name, r.patient.id, r.doctor.name, r.appointment.department].some((v) => v.toLowerCase().includes(q)));
  }, [today, query]);

  const table = useTable({ rows: filtered, pageSize: PAGE_SIZE, getId: (r) => r.appointment.id, resetKeys: [query] });

  const exportCsv = () =>
    downloadCsv(
      `appointments-${dateKey(NOW)}.csv`,
      filtered.map(({ appointment, patient, doctor }) => ({
        Patient: patient.name,
        'Patient ID': patient.id,
        Doctor: doctor.name,
        Time: formatTime(parseLocalIso(appointment.start)),
        Department: appointment.department,
        Status: appointment.status,
      })),
    );

  return (
    <section className="card flex flex-col overflow-hidden">
      <div className="flex flex-col justify-between gap-space-sm p-space-lg sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-md font-semibold tracking-tight text-on-surface">Today&apos;s Appointments</h2>
          <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant">
            {table.pageRows.length} of {filtered.length} Showing
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Filter patient or doctor..." aria-label="Filter today's appointments" wrapperClassName="w-full sm:w-60" className="py-1.5 pr-8" />
          <IconButton icon={Download} label="Export today's appointments" onClick={exportCsv} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="th py-2.5">Patient Name</th>
              <th className="th">Patient ID</th>
              <th className="th">Assigned Doctor</th>
              <th className="th">Time Slot</th>
              <th className="th hidden 2xl:table-cell">Department</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-body-sm">
            {table.pageRows.map(({ appointment, patient, doctor }) => {
              const live = appointment.status === 'In Progress';
              return (
                <tr
                  key={appointment.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className={cn('group cursor-pointer transition-colors', live ? 'bg-primary-fixed/20 hover:bg-primary-fixed/30' : 'hover:bg-surface-container-low/60')}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-space-sm">
                      <Avatar name={patient.name} size="sm" critical={patient.status === 'Critical'} />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-on-surface">{patient.name}</span>
                        <span className="max-w-[150px] truncate text-caption text-on-surface-variant">{patient.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-3 font-mono text-data-mono-body font-medium', live ? 'font-semibold text-primary' : 'text-on-surface-variant')}>{patient.id}</td>
                  <td className={cn('whitespace-nowrap px-3 py-3 text-on-surface', live ? 'font-semibold' : 'font-medium')}>{doctor.name}</td>
                  <td className={cn('whitespace-nowrap px-3 py-3 font-mono text-data-mono-body', live ? 'font-semibold text-primary' : 'text-on-surface')}>
                    {formatTime(parseLocalIso(appointment.start))}
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <Tag>{appointment.department}</Tag>
                  </td>
                  <td className="px-3 py-3">
                    <AppointmentStatusBadge status={appointment.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <RowMenu
                      label={`Actions for ${patient.name}`}
                      items={[
                        { label: 'View patient', icon: UserRound, onSelect: () => navigate(`/patients/${patient.id}`) },
                        { label: 'Open schedule', icon: Eye, onSelect: () => navigate('/appointments') },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon={CalendarX2} title="No matching appointments" description="Try a different patient, doctor or department." />}
      </div>

      <div className="flex flex-col items-center justify-between gap-space-sm bg-surface-container-low/60 px-space-lg py-space-md sm:flex-row">
        <span className="text-body-sm text-on-surface-variant">
          Showing <strong className="font-semibold text-on-surface">{table.rangeStart} - {table.rangeEnd}</strong> of {filtered.length} appointments
        </span>
        <Pagination variant="text" page={table.page} pageCount={table.pageCount} onPageChange={table.setPage} />
      </div>
    </section>
  );
}
