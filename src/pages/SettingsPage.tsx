import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarDays,
  Camera,
  ChevronRight,
  CircleCheck,
  CircleUserRound,
  HeartPulse,
  History,
  Hospital,
  IdCard,
  Info,
  KeyRound,
  Languages,
  LifeBuoy,
  Loader2,
  Mail,
  Monitor,
  Network,
  Phone,
  Plus,
  Save,
  Shield,
  Smartphone,
  Stethoscope,
  Trash2,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { staffDoctors, STAFF_STATUS_LABEL } from '../data/staff';
import { CURRENT_USER } from '../components/layout/navigation';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { Badge, StaffStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput, Toggle } from '../components/ui/Controls';
import { ProgressBar } from '../components/ui/StatCards';
import { useToast } from '../components/ui/Toast';

type Tab = 'profile' | 'hospital' | 'roles' | 'notifications' | 'security' | 'integrations' | 'audit';

const TABS: { id: Tab; label: string; icon: LucideIcon; aside?: ReactNode }[] = [
  { id: 'profile', label: 'Profile & Credentials', icon: CircleUserRound },
  { id: 'hospital', label: 'Hospital Information', icon: Hospital },
  { id: 'roles', label: 'Users & Roles', icon: IdCard, aside: <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-caption text-on-surface-variant">24 Active</span> },
  { id: 'notifications', label: 'Notifications', icon: Bell, aside: <span className="rounded-full bg-error-container px-2 py-0.5 font-mono text-caption font-semibold text-on-error-container">3 Alerts</span> },
  { id: 'security', label: 'Security & 2FA', icon: Shield, aside: <span className="h-2 w-2 rounded-full bg-primary-container" /> },
  { id: 'integrations', label: 'Integrations', icon: Network, aside: <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">HL7 / FHIR</span> },
  { id: 'audit', label: 'Audit Log', icon: History },
];

const INITIAL_PROFILE = {
  fullName: 'Dr. Sarah Jenkins, MD',
  email: 'sarah.jenkins@medicare360.org',
  phone: '+1 (555) 234-8910',
  title: 'Lead Physician & Chief of Cardiology',
  department: 'Cardiology & Intensive Care Unit',
  npi: 'NPI-9482018471',
  timezone: 'Eastern Time (US) · UTC-05:00',
  language: 'English (United States)',
  dateFormat: 'YYYY-MM-DD · 12-hr (09:30 AM)',
  bio: 'Board-certified Cardiologist specializing in acute interventional therapies, transcatheter aortic valve replacement (TAVR), and clinical trial oversight. 14 years clinical experience at MediCare 360 Memorial Hospital with dual appointment at University School of Medicine.',
  tags: ['Interventional Cardiology', 'Acute Coronary Syndromes', 'Clinical Trial PI'],
};
type Profile = typeof INITIAL_PROFILE;

/** Stitch "Settings" — Profile tab reproduced; remaining tabs reuse the same section card pattern. */
export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'profile') as Tab;

  return (
    <div className="flex w-full flex-col">
      {/* Top utility context bar */}
      <div className="flex flex-col justify-between gap-space-md bg-surface-container-lowest px-space-lg py-space-lg shadow-sm sm:px-space-xl md:flex-row md:items-center">
        <div className="flex flex-col gap-0.5">
          <Badge tone="primary" dot className="self-start uppercase tracking-wider">
            System Preferences · Staff &amp; Clinical Configuration
          </Badge>
          <div className="mt-1 flex flex-wrap items-baseline gap-space-sm">
            <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">Settings</h1>
            <span className="text-body-sm text-on-surface-variant">· User Context: {CURRENT_USER.name}</span>
          </div>
          <p className="max-w-2xl text-body-md text-on-surface-variant">Manage personal clinical credentials, hospital workspace preferences, and multi-factor security access controls.</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-space-xl p-space-lg sm:p-space-xl lg:flex-row">
        {/* Settings navigation */}
        <aside className="flex w-full shrink-0 flex-col gap-space-lg lg:sticky lg:top-20 lg:w-72">
          <nav aria-label="Settings sections" className="card flex flex-col gap-1 p-space-sm">
            <span className="mb-1 px-space-sm py-space-xs text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Workspace Controls</span>
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setParams(t.id === 'profile' ? {} : { tab: t.id })}
                  className={cn(
                    'relative flex items-center justify-between overflow-hidden rounded-lg px-space-md py-2.5 text-left transition-colors',
                    active ? 'bg-primary-container/10 font-semibold text-primary-container' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                  )}
                >
                  {active && <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full bg-primary-container" />}
                  <span className="flex items-center gap-space-sm">
                    <t.icon size={19} aria-hidden />
                    <span className={cn('text-body-md', !active && 'font-medium')}>{t.label}</span>
                  </span>
                  {active ? <ChevronRight size={17} className="opacity-70" aria-hidden /> : t.aside}
                </button>
              );
            })}
          </nav>
          <div className="card flex flex-col gap-space-sm p-space-md">
            <span className="flex items-center justify-between">
              <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Compliance Meter</span>
              <span className="font-mono text-caption font-bold text-primary-container">98.4%</span>
            </span>
            <ProgressBar value={98.4} size="md" />
            <p className="text-caption leading-relaxed text-on-surface-variant">HIPAA &amp; SOC2 Type II compliance verified for current session token. Next audit in 14 days.</p>
          </div>
          <div className="card flex flex-col gap-space-sm bg-gradient-to-br from-surface-container-low via-surface-container-lowest to-surface-container-low p-space-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary-container">
              <LifeBuoy size={18} aria-hidden />
            </span>
            <span className="text-headline-sm font-semibold text-on-surface">Enterprise IT Support</span>
            <span className="text-body-sm leading-relaxed text-on-surface-variant">Need organization-wide changes, NPI license reassignment, or elevated ward access privileges?</span>
            <a href="mailto:it-admin@medicare360.org" className="group inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary-container hover:text-primary">
              Contact IT Administration <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </aside>

        <div className="flex w-full min-w-0 max-w-4xl flex-1 flex-col gap-space-xl">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'hospital' && <HospitalTab />}
          {tab === 'roles' && <RolesTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'integrations' && <IntegrationsTab />}
          {tab === 'audit' && <AuditTab />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Building blocks ----------------------------- */

function Panel({ title, description, aside, children }: { title: string; description: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-space-lg rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm sm:p-space-xl">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex flex-col">
          <h2 className="text-headline-md font-bold text-on-surface">{title}</h2>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">{description}</p>
        </div>
        {aside}
      </div>
      <div className="h-px w-full bg-surface-container" />
      {children}
    </section>
  );
}

interface InputRowProps {
  label: string;
  hint?: ReactNode;
  help?: string;
  icon: LucideIcon;
  children: ReactNode;
}

function InputRow({ label, hint, help, icon: Icon, children }: InputRowProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-body-sm font-semibold text-on-surface">
        <span>{label}</span>
        {hint && <span className="text-caption font-normal text-on-surface-variant">{hint}</span>}
      </span>
      <span className="relative flex items-center">
        <Icon size={18} className="pointer-events-none absolute left-3 text-on-surface-variant" aria-hidden />
        {children}
      </span>
      {help && <span className="text-caption text-on-surface-variant">{help}</span>}
    </label>
  );
}

const INPUT = 'w-full rounded-lg bg-surface-container-low py-2 pl-10 pr-4 text-body-md text-on-surface transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container';

/* ---------------------------------- Profile ---------------------------------- */

function ProfileTab() {
  const notify = useToast();
  const [saved, setSaved] = useState<Profile>(INITIAL_PROFILE);
  const [form, setForm] = useState<Profile>(INITIAL_PROFILE);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaved(form);
      setSaving(false);
      notify('Profile saved and synced to physician directory');
    }, 700);
  };

  return (
    <>
      <Panel
        title="Personal Information"
        description="Update your clinical profile photo, verified hospital credentials, and public identification across wards."
        aside={
          <Badge tone="neutral" dot>
            Profile Active
          </Badge>
        }
      >
        <div className="flex flex-col items-center gap-space-lg sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            {photo ? (
              <img src={photo} alt="Profile" className="h-24 w-24 rounded-2xl object-cover shadow-sm" />
            ) : (
              <Avatar name={CURRENT_USER.name} size="xl" className="h-24 w-24 rounded-2xl text-display" />
            )}
            <span className="absolute -bottom-2 -right-2 rounded-full bg-primary-container p-1.5 text-on-primary shadow-sm">
              <BadgeCheck size={16} aria-hidden />
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-space-sm text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <span className="text-headline-sm font-bold text-on-surface">Dr. Sarah Jenkins, MD, FACC</span>
              <Badge tone="neutral">Chief Medical Officer</Badge>
            </div>
            <p className="text-caption text-on-surface-variant">Recommended dimensions: 400×400px. High-resolution PNG, JPG, or WEBP under 5MB. Verified by MediCare 360 Credentialing Desk.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) return notify('Photo must be under 5MB', 'info');
                setPhoto(URL.createObjectURL(f));
                notify('Photo updated — pending credentialing review');
              }}
            />
            <div className="flex flex-wrap items-center justify-center gap-space-sm pt-1 sm:justify-start">
              <Button variant="tonal" icon={Camera} onClick={() => fileRef.current?.click()}>
                Upload New Photo
              </Button>
              <Button variant="danger" icon={Trash2} disabled={!photo} onClick={() => setPhoto(null)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Identity & Clinical Directory" description="Essential communication endpoints used by the nursing stations, emergency dispatchers, and triage pagers.">
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
          <InputRow label="Full Name" hint="Official Legal Title" icon={UserRound} help="Shown on electronic patient discharge slips and prescriptions.">
            <input className={INPUT} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
          </InputRow>
          <InputRow
            label="Email Address"
            hint={
              <span className="inline-flex items-center gap-1 font-medium text-primary-container">
                <CircleCheck size={13} aria-hidden /> SSO Verified
              </span>
            }
            icon={Mail}
            help="Institutional domain authenticated via Microsoft Azure AD."
          >
            <input className={INPUT} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </InputRow>
          <InputRow label="Emergency Mobile / Pager" hint="On-call line" icon={Phone} help="Routed to secure VoIP when inside hospital geofenced zone.">
            <input className={INPUT} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </InputRow>
          <InputRow label="Job Title & Position" icon={Briefcase} help="Determines role-based charting permissions in EHR.">
            <input className={INPUT} value={form.title} onChange={(e) => set('title', e.target.value)} />
          </InputRow>
          <InputRow label="Primary Clinical Department" icon={Stethoscope} help="Sets default ward telemetry views and duty rosters.">
            <select className={cn(INPUT, 'cursor-pointer appearance-none')} value={form.department} onChange={(e) => set('department', e.target.value)}>
              {['Cardiology & Intensive Care Unit', 'Neurology & Stroke Center', 'Pediatrics & Neonatal Care', 'Emergency & Level 1 Trauma', 'Orthopedic Surgery', 'Oncology & Infusion Therapy'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </InputRow>
          <InputRow label="National Provider Identifier (NPI)" hint="AMA Verified" icon={KeyRound} help="Verified against the NPPES registry on October 12, 2024.">
            <input className={cn(INPUT, 'pr-24 font-mono text-data-mono-body font-semibold uppercase')} value={form.npi} onChange={(e) => set('npi', e.target.value)} />
            <span className="absolute right-2 rounded bg-surface-container px-2 py-0.5 font-mono text-caption font-bold text-on-surface-variant">VALIDATED</span>
          </InputRow>
        </div>
      </Panel>

      <Panel title="Regional & Localization" description="Set your operational timezone, calendar formats, and display languages for lab reports, shift assignments, and telemetry timestamps.">
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          <InputRow label="Operational Timezone" icon={History} help="Vital monitor logs synchronized to this clock.">
            <select className={cn(INPUT, 'cursor-pointer appearance-none text-body-sm')} value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
              {['Eastern Time (US) · UTC-05:00', 'Central Time (US) · UTC-06:00', 'Mountain Time (US) · UTC-07:00', 'Pacific Time (US) · UTC-08:00', 'Greenwich Mean Time · UTC+00:00'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </InputRow>
          <InputRow label="Display Language" icon={Languages} help="Includes medical terminology dictionaries.">
            <select className={cn(INPUT, 'cursor-pointer appearance-none text-body-sm')} value={form.language} onChange={(e) => set('language', e.target.value)}>
              {['English (United States)', 'Español (América Latina)', 'Français (Canada)', 'Deutsch (Deutschland)', 'Mandarin Chinese (Simplified)'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </InputRow>
          <InputRow label="Date & Time Notation" icon={CalendarDays} help="Standardized on laboratory pathology exports.">
            <select className={cn(INPUT, 'cursor-pointer appearance-none text-body-sm')} value={form.dateFormat} onChange={(e) => set('dateFormat', e.target.value)}>
              {['YYYY-MM-DD · 12-hr (09:30 AM)', 'DD/MM/YYYY · 24-hr (21:30)', 'MM/DD/YYYY · 12-hr (09:30 PM)', 'ISO 8601 Military · UTC-Z'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </InputRow>
        </div>
      </Panel>

      <Panel
        title="Clinical Credentials & Specialties"
        description="Summary published to the internal physician directory and patient referral portal."
        aside={<span className="font-mono text-caption text-on-surface-variant">{form.bio.length} / 500 chars</span>}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-body-sm font-semibold text-on-surface">Professional Bio &amp; Clinical Scope</span>
          <textarea
            rows={4}
            maxLength={500}
            className="w-full resize-y rounded-lg bg-surface-container-low p-3 text-body-md text-on-surface transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
          />
          <span className="text-caption text-on-surface-variant">Visible during inter-departmental patient transfers and consult paging requests.</span>
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-body-sm font-semibold text-on-surface">Assigned Practice Badges</span>
          <div className="flex flex-wrap items-center gap-2">
            {form.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1 text-body-sm text-on-surface">
                <HeartPulse size={15} className="text-primary-container" aria-hidden />
                {t}
                <button type="button" aria-label={`Remove ${t}`} onClick={() => set('tags', form.tags.filter((x) => x !== t))} className="ml-1 text-on-surface-variant transition-colors hover:text-error">
                  <X size={15} />
                </button>
              </span>
            ))}
            {tagDraft === null ? (
              <button type="button" onClick={() => setTagDraft('')} className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1 text-body-sm font-semibold text-primary-container transition-colors hover:bg-surface-container-high">
                <Plus size={15} aria-hidden /> Add Tag
              </button>
            ) : (
              <input
                autoFocus
                className="rounded-lg bg-surface-container-lowest px-3 py-1 text-body-sm ring-2 ring-primary-container focus:outline-none"
                placeholder="New badge, Enter to add"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onBlur={() => setTagDraft(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setTagDraft(null);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = tagDraft.trim();
                    if (v && !form.tags.includes(v)) set('tags', [...form.tags, v]);
                    setTagDraft(null);
                  }
                }}
              />
            )}
          </div>
        </div>
      </Panel>

      <div className="sticky bottom-4 z-20 flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-lowest/95 p-space-md shadow-modal backdrop-blur-md sm:flex-row">
        <span className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Info size={18} aria-hidden />
          {dirty ? 'You have unsaved changes. They will be discarded if you navigate away.' : 'All changes saved.'}
        </span>
        <div className="flex w-full items-center justify-end gap-space-sm sm:w-auto">
          <Button variant="tonal" disabled={!dirty || saving} onClick={() => setForm(saved)}>
            Cancel
          </Button>
          <Button variant="primary" icon={saving ? Loader2 : Save} disabled={!dirty || saving} onClick={save} className={cn(saving && '[&>svg]:animate-spin')}>
            {saving ? 'Saving Records...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ----------------------------- Other settings tabs --------------------------- */

function HospitalTab() {
  const notify = useToast();
  const fields: [string, string, LucideIcon][] = [
    ['Facility Name', 'MediCare 360 Memorial Hospital', Hospital],
    ['CMS Certification Number', 'CCN-490112', IdCard],
    ['Main Switchboard', '+1 (800) 555-2273', Phone],
    ['Licensed Beds', '400', Users],
    ['Trauma Designation', 'Level 1 Trauma Center', Shield],
  ];
  return (
    <Panel title="Hospital Information" description="Facility identity used on discharge paperwork, claims and HL7 message headers.">
      <form
        className="grid grid-cols-1 gap-space-lg md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          notify('Hospital information saved');
        }}
      >
        {fields.map(([label, value, icon]) => (
          <InputRow key={label} label={label} icon={icon}>
            <input className={INPUT} defaultValue={value} />
          </InputRow>
        ))}
        <div className="flex justify-end md:col-span-2">
          <Button variant="primary" type="submit" icon={Save}>
            Save Facility Details
          </Button>
        </div>
      </form>
    </Panel>
  );
}

const ROLES = ['Chief Physician', 'Attending Physician', 'Consulting Specialist', 'Charge Nurse', 'Read Only'];

function RolesTab() {
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [roles, setRoles] = useState<Record<string, string>>(() => Object.fromEntries(staffDoctors.map((d) => [d.id, d.id === 'DR-1001' ? ROLES[0] : d.attending ? ROLES[1] : ROLES[2]])));
  const rows = useMemo(() => staffDoctors.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  return (
    <Panel title="Users & Roles" description="Role-based access controls for charting, prescribing and administrative privileges." aside={<SearchInput value={query} onValueChange={setQuery} placeholder="Filter staff..." aria-label="Filter staff" wrapperClassName="md:w-56" />}>
      <div className="-mx-space-lg overflow-x-auto sm:-mx-space-xl">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="th py-2.5 pl-space-xl">Staff Member</th>
              <th className="th">Status</th>
              <th className="th pr-space-xl">Access Role</th>
            </tr>
          </thead>
          <tbody className="text-body-sm">
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-surface-container-low/50">
                <td className="py-2.5 pl-space-xl pr-3">
                  <span className="flex items-center gap-space-sm">
                    <Avatar name={d.name} size="sm" />
                    <span className="flex flex-col">
                      <span className="font-semibold text-on-surface">{d.name}</span>
                      <span className="text-caption text-on-surface-variant">{d.email}</span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <StaffStatusBadge status={d.status} label={STAFF_STATUS_LABEL[d.status]} />
                </td>
                <td className="py-2.5 pl-3 pr-space-xl">
                  <select
                    aria-label={`Role for ${d.name}`}
                    className="field py-1.5"
                    value={roles[d.id]}
                    onChange={(e) => {
                      setRoles((r) => ({ ...r, [d.id]: e.target.value }));
                      notify(`${d.name} is now ${e.target.value}`);
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ToggleList({ items }: { items: { id: string; label: string; detail: string; on: boolean }[] }) {
  const [state, setState] = useState(() => Object.fromEntries(items.map((i) => [i.id, i.on])));
  return (
    <ul className="flex flex-col divide-y divide-surface-container">
      {items.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-space-md py-space-md">
          <span className="flex flex-col">
            <span className="text-body-md font-semibold text-on-surface">{i.label}</span>
            <span className="text-caption text-on-surface-variant">{i.detail}</span>
          </span>
          <Toggle label={i.label} checked={state[i.id]} onChange={(v) => setState((s) => ({ ...s, [i.id]: v }))} />
        </li>
      ))}
    </ul>
  );
}

function NotificationsTab() {
  return (
    <Panel title="Notifications" description="Choose which clinical events page you, and through which channel." aside={<Badge tone="danger">3 Alerts pending</Badge>}>
      <ToggleList
        items={[
          { id: 'crit', label: 'Critical lab values', detail: 'Immediate push + pager for out-of-range potassium, troponin, lactate.', on: true },
          { id: 'appt', label: 'Appointment changes', detail: 'Reschedule and cancellation requests from patients.', on: true },
          { id: 'rx', label: 'E-prescribing signatures', detail: 'DEA-EPCS orders awaiting biometric signature.', on: true },
          { id: 'lab', label: 'Routine lab results', detail: 'Daily digest at 07:00 EST instead of instant alerts.', on: false },
          { id: 'sys', label: 'System & integration notices', detail: 'Gateway upgrades, maintenance windows.', on: false },
        ]}
      />
    </Panel>
  );
}

function SecurityTab() {
  const notify = useToast();
  const [sessions, setSessions] = useState([
    { id: 's1', device: 'Workstation · Ward 4C', icon: Monitor, where: 'Main campus · Chrome', when: 'Active now', current: true },
    { id: 's2', device: 'iPhone 16 Pro', icon: Smartphone, where: 'Boston, MA · MediCare 360 app', when: '2h ago', current: false },
    { id: 's3', device: 'Bedside tablet · ICU 402', icon: Monitor, where: 'ICU · Kiosk', when: 'Yesterday', current: false },
  ]);
  return (
    <>
      <Panel title="Multi-Factor Authentication" description="Hardware keys and biometrics required for EPCS and remote access." aside={<Badge tone="success" dot>2FA Enforced</Badge>}>
        <ToggleList
          items={[
            { id: 'fido', label: 'FIDO2 hardware security key', detail: 'YubiKey 5 NFC registered Oct 12, 2026.', on: true },
            { id: 'bio', label: 'Biometric e-signature (EPCS)', detail: 'Required for Schedule II-V prescriptions.', on: true },
            { id: 'sms', label: 'SMS fallback codes', detail: 'Less secure; disabled by hospital policy for admins.', on: false },
          ]}
        />
      </Panel>
      <Panel title="Active Sessions" description="Sign out of devices you no longer use.">
        <ul className="flex flex-col gap-space-sm">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md">
              <span className="flex items-center gap-space-md">
                <s.icon size={20} className="text-primary" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-body-sm font-semibold text-on-surface">{s.device}</span>
                  <span className="font-mono text-data-code-label text-on-surface-variant">
                    {s.where} · {s.when}
                  </span>
                </span>
              </span>
              {s.current ? (
                <Badge tone="primary">This device</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setSessions((list) => list.filter((x) => x.id !== s.id));
                    notify(`Signed out ${s.device}`);
                  }}
                >
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

function IntegrationsTab() {
  const items = [
    { name: 'HL7 v2 Interface Engine', detail: 'ADT, ORM, ORU feeds to central repository', on: true },
    { name: 'FHIR R4 API Gateway', detail: 'Patient, Encounter, Observation resources', on: true },
    { name: 'Surescripts e-Prescribing', detail: 'NewRx, RxRenewal, CancelRx', on: true },
    { name: 'PACS Imaging Archive', detail: 'DICOM viewer deep links', on: false },
  ];
  const [state, setState] = useState(items.map((i) => i.on));
  return (
    <Panel title="Integrations" description="Clinical data interfaces connected to this workspace.">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        {items.map((i, idx) => (
          <div key={i.name} className="flex items-start justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md">
            <span className="flex flex-col">
              <span className="text-body-md font-semibold text-on-surface">{i.name}</span>
              <span className="text-caption text-on-surface-variant">{i.detail}</span>
              <span className={cn('mt-1 font-mono text-data-code-label font-semibold', state[idx] ? 'text-success' : 'text-on-surface-variant')}>{state[idx] ? '● Connected' : '○ Disconnected'}</span>
            </span>
            <Toggle label={i.name} checked={state[idx]} onChange={(v) => setState((s) => s.map((x, j) => (j === idx ? v : x)))} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AuditTab() {
  const rows = [
    ['09:42:18', 'Profile updated', 'Dr. Sarah Jenkins', 'Workstation 4C'],
    ['09:30:02', 'Viewed chart PT-84920', CURRENT_USER.name, 'Workstation 4C'],
    ['09:12:47', 'Signed RX-84920', CURRENT_USER.name, 'Workstation 4C'],
    ['08:58:10', 'Countersigned REC-391204', CURRENT_USER.name, 'Workstation 4C'],
    ['08:31:55', 'Login (FIDO2)', CURRENT_USER.name, 'Workstation 4C'],
    ['Yesterday', 'Role changed: Dr. Marco Rossi', 'IT Admin', 'Admin Console'],
  ];
  return (
    <Panel title="Audit Log" description="Tamper-evident record of PHI access and configuration changes (HIPAA §164.312(b)).">
      <ul className="flex flex-col divide-y divide-surface-container">
        {rows.map(([t, action, actor, where]) => (
          <li key={t + action} className="flex flex-col justify-between gap-1 py-space-sm sm:flex-row sm:items-center">
            <span className="flex items-center gap-space-md">
              <span className="w-20 font-mono text-data-code-label text-on-surface-variant">{t}</span>
              <span className="text-body-sm font-medium text-on-surface">{action}</span>
            </span>
            <span className="font-mono text-data-code-label text-on-surface-variant">
              {actor} · {where}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
