import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft,
  ArrowUpRight,
  AtSign,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CircleCheck,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Hospital,
  IdCard,
  ListChecks,
  MessageSquare,
  Pencil,
  Phone,
  Printer,
  Radio,
  ShieldCheck,
  Star,
  StarHalf,
  Stethoscope,
  ThumbsUp,
  Timer,
  TrendingUp,
  UserX,
  Users,
  Waypoints,
} from 'lucide-react';
import { useClinicalData } from '../context/ClinicalDataContext';
import { STAFF_STATUS_LABEL, getDoctorProfileContent, getStaffDoctor } from '../data/staff';
import { getDoctor } from '../data/doctors';
import { NOW, formatTime, isSameDay, parseLocalIso, addDays, formatDate } from '../lib/date';
import { downloadCsv } from '../lib/csv';
import { hashString } from '../lib/random';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { Badge, StaffStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Popover } from '../components/ui/Menu';
import { EmptyState, SectionCard } from '../components/ui/Section';
import { KpiTile, TrendPill } from '../components/ui/StatCards';
import { useToast } from '../components/ui/Toast';
import { NewAppointmentModal } from '../components/appointments/NewAppointmentModal';

const ROSTER_TONE = { Critical: 'danger', Active: 'primary', Pending: 'warning', Inactive: 'neutral', Discharged: 'muted' } as const;
const ROSTER_LABEL = { Critical: 'Critical', Active: 'Stable', Pending: 'Pending Review', Inactive: 'Follow-up', Discharged: 'Discharged' } as const;

/** Stitch "Doctor Profile". */
export function DoctorProfilePage() {
  const { doctorId = '' } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const { patients, appointments, getPatient } = useClinicalData();
  const [bookOpen, setBookOpen] = useState(false);

  const doctor = getStaffDoctor(doctorId);
  const content = useMemo(() => (doctor ? getDoctorProfileContent(doctor) : undefined), [doctor]);

  const roster = useMemo(() => {
    if (!doctor) return [];
    const pool = doctor.attending
      ? patients.filter((p) => p.doctorId === doctor.id && p.status !== 'Discharged')
      : patients.filter((p) => p.status !== 'Discharged' && getDoctor(p.doctorId).department === doctor.department && hashString(p.id + doctor.id) % 40 === 0);
    const rank = { Critical: 0, Pending: 1, Active: 2, Inactive: 3, Discharged: 4 };
    return [...pool].sort((a, b) => rank[a.status] - rank[b.status] || b.lastVisit.localeCompare(a.lastVisit));
  }, [doctor, patients]);

  const agenda = useMemo(
    () =>
      doctor?.attending
        ? appointments.filter((a) => a.doctorId === doctor.id && a.status !== 'Cancelled' && a.status !== 'Completed' && parseLocalIso(a.start) >= addDays(NOW, 0)).slice(0, 4)
        : [],
    [appointments, doctor],
  );

  if (!doctor || !content) {
    return (
      <div className="p-space-xl">
        <div className="card">
          <EmptyState icon={UserX} title="Doctor not found" description={`No staff profile matches “${doctorId}”.`} />
          <div className="flex justify-center pb-8">
            <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/doctors')}>
              Back to Directory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { stats } = content;
  const sparkline = Array.from({ length: 8 }, (_, i) => ({ v: 60 + i * 5 + (hashString(doctor.id + i) % 14) }));
  const fullStars = Math.floor(doctor.rating);

  const exportEncounters = () =>
    downloadCsv(
      `${doctor.id}-encounters.csv`,
      appointments
        .filter((a) => a.doctorId === doctor.id)
        .map((a) => ({ ID: a.id, Patient: getPatient(a.patientId)?.name ?? a.patientId, Start: a.start, Status: a.status, Reason: a.reason })),
    );

  const book = () => (doctor.attending ? setBookOpen(true) : notify(`Direct case request sent to ${doctor.name}`));

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      {/* Utility bar */}
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-start">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-caption">
            <Link to="/doctors" className="font-medium text-on-surface-variant hover:text-primary">
              Doctors
            </Link>
            <ChevronRight size={13} className="text-on-surface-variant/60" aria-hidden />
            <span className="text-on-surface-variant">Management</span>
            <ChevronRight size={13} className="text-on-surface-variant/60" aria-hidden />
            <span className="font-semibold text-on-surface">{doctor.name}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-space-sm">
            <Badge tone="primary" dot pulse>
              {doctor.status === 'Away' ? 'On Leave' : 'Active Outpatient & Surgical Duty'}
            </Badge>
            <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant">NPI: {doctor.npi}</span>
            <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant">Staff: #{doctor.id}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <Button icon={Printer} onClick={() => window.print()}>
            Print Clinical Summary
          </Button>
          <Button icon={MessageSquare} onClick={() => notify(`Secure chat opened with ${doctor.name}`, 'info')}>
            Message
          </Button>
          <Button icon={Download} onClick={exportEncounters} disabled={!doctor.attending}>
            Export Encounters
          </Button>
          <Button variant="primary" icon={Pencil} onClick={() => navigate('/settings')}>
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="card flex flex-col justify-between gap-space-lg p-space-lg lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-space-lg">
          <Avatar name={doctor.name} size="xl" className="h-20 w-20 rounded-2xl bg-primary-container text-display text-on-primary" status={doctor.status === 'Away' ? 'muted' : 'success'} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-space-sm">
              <h1 className="text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">{doctor.name}, MD</h1>
              <Badge tone="info">{doctor.attending ? 'Chief Attending' : 'Consulting Specialist'}</Badge>
            </div>
            <span className="inline-flex items-center gap-1.5 text-body-md font-semibold text-primary">
              <Stethoscope size={16} aria-hidden /> {doctor.role}
            </span>
            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1 text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <Building2 size={14} aria-hidden /> {doctor.department} ({doctor.location})
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={14} aria-hidden /> {doctor.experienceYears}+ Years Clinical Practice
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-warning">
                <Star size={14} aria-hidden /> {doctor.rating} / 5.0 ({doctor.reviews} reviews)
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-space-xs font-mono text-data-code-label text-on-surface-variant">
              <Chip icon={Hospital}>{doctor.location}</Chip>
              <Chip icon={Phone}>Ext: {doctor.extension}</Chip>
              <Chip icon={Radio}>Pager: {doctor.pager}</Chip>
              <a href={`mailto:${doctor.email}`} className="inline-flex items-center gap-1 rounded bg-surface-container-low px-2 py-1 hover:text-primary">
                <AtSign size={13} aria-hidden /> {doctor.email}
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-space-sm lg:items-end">
          <StaffStatusBadge status={doctor.status} label={doctor.status === 'Available' ? 'Available for Consultations & Rounds' : STAFF_STATUS_LABEL[doctor.status]} />
          <div className="flex items-center gap-space-sm">
            <Popover align="right" trigger={(toggle) => <Button variant="tonal" onClick={toggle}>More Actions</Button>}>
              {(close) => (
                <div className="-m-2 flex flex-col">
                  {[
                    ['View in Analytics', () => navigate('/analytics')],
                    ['Open Appointment Grid', () => navigate('/appointments')],
                    ['Copy NPI', () => void navigator.clipboard?.writeText(doctor.npi).then(() => notify('NPI copied'))],
                  ].map(([label, fn]) => (
                    <button
                      key={label as string}
                      type="button"
                      onClick={() => {
                        close();
                        (fn as () => void)();
                      }}
                      className="rounded-lg px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-container-low"
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </Popover>
            <Button variant="primary" icon={CalendarPlus} onClick={book}>
              Schedule Direct Case
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <div className="card flex flex-col gap-space-sm p-space-lg">
          <div className="flex items-start justify-between">
            <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Total Patients</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
              <Users size={17} aria-hidden />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-data-metric-lg font-semibold text-on-surface">{stats.totalPatients.toLocaleString('en-US')}</span>
            <span className="text-body-sm text-on-surface-variant">encounters</span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="flex items-center gap-1.5 text-caption text-on-surface-variant">
              <TrendPill icon={TrendingUp}>+8.4%</TrendPill> vs last year
            </span>
            <div className="h-8 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkline}>
                  <Area isAnimationActive={false} type="monotone" dataKey="v" stroke="#2d67e4" strokeWidth={2} fill="#2d67e4" fillOpacity={0.08} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <KpiTile
          label="Completed (MTD)"
          icon={CalendarCheck}
          value={stats.completedMtd}
          unit="cases"
          pill={
            <span>
              <strong className="text-on-surface">{stats.surgicalMtd} Surgical</strong>, {stats.completedMtd - stats.surgicalMtd} Outpatient
            </span>
          }
          note={`${((stats.completedMtd / stats.target) * 100).toFixed(1)}% of ${stats.target}`}
          progress={(stats.completedMtd / stats.target) * 100}
          progressClassName="bg-tertiary-container"
        />
        <KpiTile
          label="Patient Satisfaction"
          icon={ThumbsUp}
          iconTone="success"
          value={`${stats.satisfaction}%`}
          unit="Score"
          pill={<Badge tone="primary">Top 2%</Badge>}
          note={
            <span className="inline-flex items-center gap-0.5 text-warning">
              {Array.from({ length: fullStars }, (_, i) => (
                <Star key={i} size={13} fill="currentColor" aria-hidden />
              ))}
              {doctor.rating - fullStars >= 0.5 && <StarHalf size={13} fill="currentColor" aria-hidden />}
              <span className="ml-1 text-on-surface-variant">HCAPS</span>
            </span>
          }
        />
        <KpiTile
          label="Consultation Hours"
          icon={Timer}
          iconTone="muted"
          value={stats.hours}
          unit="hrs"
          pill={<span>Avg {stats.avgMinutes} mins / encounter</span>}
          note={<span className="font-mono font-semibold text-primary">{stats.utilization}%</span>}
          progress={stats.utilization}
        />
      </div>

      <div className="grid grid-cols-1 gap-space-xl lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-xl lg:col-span-8">
          <SectionCard title="Clinical Biography & Practice Focus" icon={HeartPulse}>
            <div className="flex flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
              {content.bio.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
              <div className="flex flex-col gap-space-sm">
                <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Core Clinical Subspecialties</span>
                <div className="flex flex-wrap gap-space-sm">
                  {content.subspecialties.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1 text-body-sm text-on-surface">
                      <CircleCheck size={14} className="text-primary" aria-hidden /> {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Education & Academic Qualifications" icon={GraduationCap}>
            <ul className="flex flex-col gap-space-lg">
              {content.education.map((e) => (
                <li key={e.school} className="flex gap-space-md">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                    <GraduationCap size={17} aria-hidden />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-headline-sm font-semibold text-on-surface">{e.school}</span>
                      <span className="font-mono text-data-code-label text-on-surface-variant">{e.years}</span>
                    </div>
                    <span className="text-body-sm font-medium text-primary">{e.degree}</span>
                    <span className="text-caption text-on-surface-variant">{e.note}</span>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Board Certifications & Licensure" icon={BadgeCheck}>
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              {content.certifications.map((c) => (
                <div key={c.title} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-data-code-label font-semibold uppercase text-primary">{c.issuer}</span>
                    <span className="font-mono text-data-code-label font-semibold text-success">{c.badge}</span>
                  </div>
                  <span className="text-headline-sm font-semibold text-on-surface">{c.title}</span>
                  <span className="font-mono text-data-code-label text-on-surface-variant">{c.detail}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Professional Experience & Appointments" icon={IdCard} actions={<Badge tone="neutral">{content.publications} Publications</Badge>}>
            <ul className="flex flex-col gap-space-sm">
              {content.experience.map((x) => (
                <li key={x.title + x.years} className="flex flex-col justify-between gap-2 rounded-xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-headline-sm font-semibold text-on-surface">{x.title}</span>
                    <span className="text-body-sm font-medium text-primary">{x.org}</span>
                    <span className="text-caption text-on-surface-variant">{x.note}</span>
                  </div>
                  <span className="shrink-0 self-start rounded-lg bg-surface-container-lowest px-2.5 py-1 font-mono text-data-code-label text-on-surface shadow-sm sm:self-center">{x.years}</span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-2 rounded-xl bg-primary-fixed/40 p-space-md">
                <span className="flex items-center gap-space-sm">
                  <BookOpen size={18} className="text-primary" aria-hidden />
                  <span className="flex flex-col">
                    <span className="text-body-sm font-semibold text-on-surface">Peer-Reviewed Scientific Output</span>
                    <span className="text-caption text-on-surface-variant">NEJM, JAMA, Circulation and specialty journals</span>
                  </span>
                </span>
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(doctor.name.replace('Dr. ', ''))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-body-sm font-semibold text-primary hover:underline"
                >
                  View PubMed Index <ArrowUpRight size={14} aria-hidden />
                </a>
              </li>
            </ul>
          </SectionCard>
        </div>

        <div className="flex min-w-0 flex-col gap-space-xl lg:col-span-4">
          <SectionCard size="sm" title="Weekly Schedule Matrix" icon={CalendarDays} actions={<Badge tone="success">On Track</Badge>}>
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 text-body-sm">
                <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                  <Clock size={14} aria-hidden /> Next Slot: <strong className="text-on-surface">{doctor.nextSlot ?? 'Tomorrow, 09:30 AM'}</strong>
                </span>
                <span className="rounded bg-primary-fixed px-1.5 font-mono text-data-code-label text-on-primary-fixed">{doctor.location}</span>
              </div>
              {content.schedule.map((day) => (
                <div key={day.day} className="flex gap-space-md rounded-lg bg-surface-container-low/60 p-space-sm">
                  <span className={cn('w-10 shrink-0 pt-0.5 font-mono text-body-sm font-bold', day.day === 'TUE' ? 'text-primary' : 'text-on-surface')}>{day.day}</span>
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                    {day.blocks.map((b) => (
                      <div key={b.label} className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-caption font-semibold text-on-surface">
                          <span className={cn('h-1.5 w-1.5 rounded-full', b.tone === 'danger' ? 'bg-error' : b.tone === 'primary' ? 'bg-primary' : 'bg-outline')} />
                          {b.label}
                        </span>
                        <span className="font-mono text-[10px] text-on-surface-variant">{b.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard size="sm" title="Active Patient Roster" icon={ListChecks} actions={<Badge tone="neutral">{roster.length} In-Care</Badge>}>
            {roster.length === 0 ? (
              <p className="py-4 text-center text-body-sm text-on-surface-variant">No assigned inpatients.</p>
            ) : (
              <ul className="flex flex-col gap-space-sm">
                {roster.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link to={`/patients/${p.id}`} className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container">
                      <span className="flex min-w-0 items-center gap-space-sm">
                        <Avatar name={p.name} size="sm" critical={p.status === 'Critical'} />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-body-sm font-semibold text-on-surface">
                            {p.name} <span className="font-normal text-on-surface-variant">{p.age}y, {p.gender[0]}</span>
                          </span>
                          <span className="truncate text-caption text-on-surface-variant">
                            {p.visitNote} · {p.unit}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Badge tone={ROSTER_TONE[p.status]}>{ROSTER_LABEL[p.status]}</Badge>
                        <ExternalLink size={14} className="text-on-surface-variant" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {roster.length > 5 && <p className="mt-2 text-center font-mono text-data-code-label text-on-surface-variant">+{roster.length - 5} more on census</p>}
          </SectionCard>

          <SectionCard
            size="sm"
            title="Upcoming Agenda"
            icon={Waypoints}
            actions={
              <Link to="/appointments" className="text-body-sm font-semibold text-primary hover:underline">
                Full Calendar
              </Link>
            }
          >
            {agenda.length === 0 ? (
              <p className="py-4 text-center text-body-sm text-on-surface-variant">No booked encounters in the scheduling grid.</p>
            ) : (
              <ol className="relative flex flex-col gap-space-sm border-l-2 border-surface-container pl-space-md">
                {agenda.map((a) => {
                  const when = parseLocalIso(a.start);
                  const p = getPatient(a.patientId);
                  return (
                    <li key={a.id} className="relative">
                      <span className={cn('absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ring-2 ring-surface-container-lowest', a.status === 'In Progress' ? 'bg-primary' : a.status === 'Pending' ? 'bg-warning' : 'bg-success')} />
                      <div className="flex flex-col rounded-lg bg-surface-container-low p-space-sm">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-mono text-data-code-label font-semibold text-primary">
                            {formatTime(when)} · {isSameDay(when, NOW) ? 'Today' : formatDate(when).slice(0, 6)}
                          </span>
                          <Badge tone={a.status === 'Pending' ? 'warning' : a.status === 'In Progress' ? 'solid' : 'success'}>{a.status}</Badge>
                        </span>
                        <span className="text-body-sm font-semibold text-on-surface">{a.reason}</span>
                        <span className="text-caption text-on-surface-variant">{p?.name ?? a.patientId}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>
        </div>
      </div>

      <NewAppointmentModal open={bookOpen} doctorId={doctor.attending ? doctor.id : undefined} onClose={() => setBookOpen(false)} />
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof Phone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-surface-container-low px-2 py-1">
      <Icon size={13} aria-hidden /> {children}
    </span>
  );
}
