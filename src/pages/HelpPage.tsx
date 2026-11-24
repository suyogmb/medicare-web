import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  ChevronDown,
  CircleHelp,
  CloudUpload,
  Copy,
  Headset,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Rocket,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  BadgeCheck,
  Clock,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PillTabs } from '../components/ui/Controls';
import { EmptyState } from '../components/ui/Section';
import { useToast } from '../components/ui/Toast';

const CATEGORIES = ['Patient Management', 'Appointments', 'Prescriptions', 'Medical Records', 'Account & Security'] as const;
type Category = (typeof CATEGORIES)[number];

const FAQ: { category: Category; q: string; a: string; note?: string }[] = [
  {
    category: 'Patient Management',
    q: 'How do I merge duplicate patient charts or update a National Provider Identifier (NPI)?',
    a: 'Navigate to Patients > Clinical Actions > Merge Records. Under HIPAA Audit Protocol §164.312, dual supervisor authentication is mandated. Both records will remain cross-indexed with an automatic cryptographic provenance hash.',
    note: 'Compliance Check: Requires Role Attending_Physician or HIM_Supervisor.',
  },
  { category: 'Patient Management', q: 'How are patient vital telemetry and allergy warnings updated in real time?', a: 'Telemetry nodes stream bidirectional data using the ISO/IEEE 11073 standard directly into the Ward Gateway. Drug interaction and allergy warnings are re-evaluated on every new order and surface in the Patient Details safety panel.' },
  { category: 'Patient Management', q: 'Can I export HIPAA-compliant patient audit logs to CSV or PDF?', a: 'Yes. Select the patient record, open the Audit Trail pane, choose the date interval and select Export Tamper-Proof Audit Bundle. The file is encrypted using AES-256 with an embedded chain of custody.' },
  { category: 'Appointments', q: 'How do I book a visit into a slot that already looks full?', a: 'Open Appointments, pick the day and use the “Slot Open” buttons in the grid. Overlapping encounters are blocked automatically by the EHR conflict check in the scheduling dialog.' },
  { category: 'Appointments', q: 'Can patients reschedule themselves?', a: 'Patients can request a change from the portal; requests arrive in Notifications as “Reschedule Request” and can be approved or declined in one click.' },
  { category: 'Prescriptions', q: 'What is the procedure for DEA Schedule II-IV controlled substance e-signing?', a: 'EPCS (Electronic Prescriptions for Controlled Substances) requires hardware FIDO2 token validation or push biometric confirmation. Pending signatures appear in Notifications under “DEA-EPCS Signature Pending”.' },
  { category: 'Prescriptions', q: 'How do I batch-renew refills that are due?', a: 'In Prescriptions, filter by “Refill Due”, select rows and choose Batch Renew. Without a selection, every due prescription is renewed for three refills.' },
  { category: 'Medical Records', q: 'Who can countersign a pending discharge summary?', a: 'Chief physicians and attending physicians can countersign from the Record Inspector. Flagged documents require chief sign-off before rehab or step-down transfer.' },
  { category: 'Medical Records', q: 'How do I resolve HL7/FHIR connection timeouts with the central hospital repository?', a: 'First verify whether your subnet has access to port 8443 on the clinical LAN. Then open Settings > Integrations and re-enable the FHIR R4 API Gateway to force a fresh handshake.' },
  { category: 'Account & Security', q: 'How do I enforce mandatory Multi-Factor Authentication (MFA) across ward terminals?', a: 'Department administrators can mandate smartcard tap (NFC) or hardware security key enrollment through Settings > Security & 2FA. Non-compliant sessions are revoked at next login.' },
  { category: 'Account & Security', q: 'I lost my hardware token. How do I get back in?', a: 'Call Clinical IT on +1 (800) 555-CARE ext. 4. After identity verification a temporary 15-minute recovery token is issued and your lost key is revoked across all nodes.' },
];

const TRENDING = ['EHR Sync Issue', 'Batch Prescriptions', 'Reset 2FA', 'HL7 / FHIR Gateway', 'Patient Intake Forms', 'Discharge Summaries'];

const RESOURCES: { icon: LucideIcon; tag: string; title: string; text: string; cta: string }[] = [
  { icon: BookOpen, tag: 'Updated', title: 'User Guide', text: 'Comprehensive manuals for clinicians, nurses, and hospital administration staff.', cta: 'Read Manual' },
  { icon: Rocket, tag: '5 min read', title: 'Getting Started', text: 'Quick walkthroughs on patient admission, appointment scheduling, and EHR logging.', cta: 'Start Tour' },
  { icon: CircleHelp, tag: '48 Articles', title: 'FAQs & Knowledge Base', text: 'Step-by-step solutions to common clinical operational and technical questions.', cta: 'Explore Knowledge' },
  { icon: Sparkles, tag: 'Nov 2026', title: 'Release Notes', text: "What's new: Telemetry dashboards and enhanced drug allergy alerts.", cta: 'View Changelog' },
];

const PRIORITIES = [
  { id: 'P4', label: 'P4 · Low', sla: '24h SLA', dot: 'bg-outline' },
  { id: 'P3', label: 'P3 · Medium', sla: '4h SLA', dot: 'bg-primary' },
  { id: 'P2', label: 'P2 · High', sla: '1h SLA', dot: 'bg-tertiary' },
  { id: 'P1', label: 'P1 · Critical', sla: '<15m', dot: 'bg-error' },
];

const SERVICES = [
  ['Application Core & Web App', '99.98%'],
  ['FHIR & HL7 API Gateway', '99.95%'],
  ['EHR Cloud Sync Engine', '100.0%'],
  ['SMS & Emergency Paging', '99.91%'],
];
const LATENCY = [44, 41, 46, 39, 42, 48, 43, 40, 45, 41, 38, 42].map((v) => ({ v }));

/** Stitch "Help & Support". */
export function HelpPage() {
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Patient Management');
  const [open, setOpen] = useState<string | null>(FAQ[0].q);
  const faqRef = useRef<HTMLDivElement>(null);

  const faqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return FAQ.filter((f) => `${f.q} ${f.a} ${f.category}`.toLowerCase().includes(q));
    return FAQ.filter((f) => f.category === category);
  }, [query, category]);

  const runSearch = (term: string) => {
    setQuery(term);
    faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex w-full flex-col gap-space-xl p-space-lg sm:p-space-xl">
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div className="flex flex-col gap-1">
          <Badge tone="primary" dot className="self-start uppercase tracking-wider">
            Clinical Assistance &amp; IT Helpdesk · 24/7 Support Center
          </Badge>
          <h1 className="text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">Help &amp; Support</h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">Find answers, explore documentation, submit IT support tickets, and get real-time assistance for MediCare 360.</p>
        </div>
        <div className="flex flex-col items-start gap-space-sm lg:items-end">
          <Badge tone="info" dot pulse>
            System Status: 100% Operational
          </Badge>
          <a href="tel:+18005552273" className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-error shadow-sm hover:bg-danger-container">
            <Siren size={16} aria-hidden /> Call IT Emergency Dispatch
          </a>
        </div>
      </div>

      {/* Search hero */}
      <section className="card flex flex-col items-center gap-space-md px-space-lg py-space-xl text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <LifeBuoy size={20} aria-hidden />
        </span>
        <h2 className="text-headline-md font-semibold text-on-surface">How can our clinical support team help you today?</h2>
        <form
          role="search"
          className="relative w-full max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
        >
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search help articles"
            placeholder="Search help articles, clinical workflows, and FAQs... (e.g. EHR sync, e-prescribing)"
            className="w-full rounded-xl bg-surface-container-low py-3 pl-11 pr-12 text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-on-surface-variant hover:bg-surface-container">
              <X size={16} />
            </button>
          )}
        </form>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">Trending:</span>
          {TRENDING.map((t) => (
            <button key={t} type="button" onClick={() => runSearch(t.split(' ')[0])} className="rounded-md bg-surface-container-low px-2 py-1 font-mono text-data-code-label text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary">
              {t}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        {RESOURCES.map((r) => (
          <button
            key={r.title}
            type="button"
            onClick={() => (r.title.startsWith('FAQs') ? faqRef.current?.scrollIntoView({ behavior: 'smooth' }) : notify(`${r.title} opened in documentation portal`, 'info'))}
            className="card group flex flex-col gap-space-sm p-space-lg text-left transition-shadow hover:shadow-overlay"
          >
            <span className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                <r.icon size={18} aria-hidden />
              </span>
              <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-data-code-label text-on-surface-variant">{r.tag}</span>
            </span>
            <span className="text-headline-sm font-semibold text-on-surface">{r.title}</span>
            <span className="line-clamp-2 text-body-sm text-on-surface-variant">{r.text}</span>
            <span className="mt-auto flex items-center justify-between pt-1 text-body-sm font-semibold text-primary">
              {r.cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-space-xl xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-xl xl:col-span-8">
          {/* FAQ */}
          <section ref={faqRef} className="card flex scroll-mt-20 flex-col gap-space-md p-space-lg">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col">
                <h2 className="text-headline-md font-semibold text-on-surface">Frequently Asked Questions</h2>
                <span className="text-caption text-on-surface-variant">{query ? `${faqs.length} results for “${query}” across all sections` : 'Validated clinical workflows and diagnostic system operations.'}</span>
              </div>
            </div>
            {!query && <PillTabs label="FAQ category" value={category} onChange={setCategory} items={CATEGORIES.map((c) => ({ value: c, label: c }))} />}
            {faqs.length === 0 ? (
              <EmptyState icon={CircleHelp} title="No articles found" description="Try different keywords or submit a support ticket below." />
            ) : (
              <ul className="flex flex-col gap-space-sm">
                {faqs.map((f, i) => {
                  const expanded = open === f.q;
                  return (
                    <li key={f.q} className="overflow-hidden rounded-xl bg-surface-container-low">
                      <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : f.q)} className="flex w-full items-start gap-space-md p-space-md text-left">
                        <span className="pt-0.5 font-mono text-data-code-label font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1 text-body-md font-semibold text-on-surface">{f.q}</span>
                        <ChevronDown size={18} className={cn('shrink-0 text-on-surface-variant transition-transform', expanded && 'rotate-180')} aria-hidden />
                      </button>
                      {expanded && (
                        <div className="flex flex-col gap-space-sm px-space-md pb-space-md pl-12 text-body-sm leading-relaxed text-on-surface-variant">
                          <p>{f.a}</p>
                          {f.note && (
                            <p className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 font-mono text-data-code-label text-on-surface">
                              <ShieldCheck size={14} className="text-primary" aria-hidden /> {f.note}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <TicketForm />
        </div>

        <aside className="flex min-w-0 flex-col gap-space-xl xl:col-span-4">
          <section className="card flex flex-col gap-space-md p-space-lg">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <Headset size={20} aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-headline-sm font-semibold text-on-surface">Hospital Support Desk</span>
                <span className="text-caption text-on-surface-variant">Dedicated Clinical Line</span>
              </span>
            </div>
            <ContactRow icon={Mail} label="Direct IT Support Email" value="support@medicare360.org" onCopy={() => void navigator.clipboard?.writeText('support@medicare360.org').then(() => notify('Email copied'))} />
            <ContactRow icon={Phone} label="Dedicated Emergency Desk" value="+1 (800) 555-CARE (2273)" aside="Ext 4" href="tel:+18005552273" />
            <div className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
              <BadgeCheck size={17} className="mt-0.5 text-primary" aria-hidden />
              <span className="flex flex-col">
                <span className="text-body-sm font-semibold text-on-surface">24/7/365 On-Call Coverage</span>
                <span className="text-caption text-on-surface-variant">Biomedical engineers on-site. Current queue wait: &lt; 4 mins</span>
              </span>
            </div>
            <Button variant="primary" icon={MessageCircle} onClick={() => notify('Connecting you to a Tier 2 engineer…', 'info')}>
              Launch Live Support Chat
            </Button>
            <Button variant="tonal" icon={CalendarPlus} onClick={() => notify('Training request sent to Clinical Informatics', 'info')}>
              Schedule IT Training Session
            </Button>
          </section>

          <section className="card flex flex-col gap-space-md p-space-lg">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-headline-sm font-semibold text-on-surface">
                <span className="h-2 w-2 rounded-full bg-primary" /> All Systems Operational
              </h3>
            </div>
            <p className="-mt-2 text-caption text-on-surface-variant">Real-time telemetry and infrastructure service health.</p>
            <ul className="flex flex-col gap-space-sm">
              {SERVICES.map(([name, up]) => (
                <li key={name} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
                  <span className="flex flex-col">
                    <span className="text-body-sm font-medium text-on-surface">{name}</span>
                    <span className="font-mono text-data-code-label text-on-surface-variant">{up} 30-day uptime</span>
                  </span>
                  <span className="font-mono text-data-code-label font-semibold text-primary">Active</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-surface-container-low p-space-sm">
              <span className="flex justify-between text-caption text-on-surface-variant">
                Telemetry Response Latency (24h) <strong className="font-mono text-on-surface">42ms avg</strong>
              </span>
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={LATENCY}>
                    <YAxis hide domain={[30, 55]} />
                    <Line isAnimationActive={false} type="monotone" dataKey="v" stroke="#2d67e4" strokeWidth={1.75} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <button type="button" onClick={() => notify('Opening infrastructure dashboard…', 'info')} className="inline-flex items-center gap-1 self-start text-body-sm font-semibold text-primary hover:underline">
              View Comprehensive Infrastructure Dashboard <ArrowRight size={15} aria-hidden />
            </button>
          </section>

          <section className="flex flex-col gap-space-sm rounded-xl bg-danger-container p-space-lg">
            <h3 className="flex items-center gap-2 text-headline-sm font-semibold text-danger">
              <ShieldAlert size={18} aria-hidden /> Emergency IT Critical Protocol
            </h3>
            <p className="text-body-sm leading-relaxed text-on-surface">
              For Code Blue telemetry disruptions, ICU patient monitor freezes, or operating theatre workstation downtime:{' '}
              <strong className="text-danger">dial pager #9901 immediately</strong> for immediate bedside intervention.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, aside, href, onCopy }: { icon: LucideIcon; label: string; value: string; aside?: string; href?: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-space-sm">
      <span className="flex min-w-0 items-center gap-space-sm">
        <Icon size={17} className="shrink-0 text-on-surface-variant" aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="text-caption text-on-surface-variant">{label}</span>
          {href ? (
            <a href={href} className="truncate font-mono text-data-mono-body font-semibold text-on-surface hover:text-primary">
              {value}
            </a>
          ) : (
            <span className="truncate font-mono text-data-mono-body font-semibold text-on-surface">{value}</span>
          )}
        </span>
      </span>
      {onCopy && (
        <button type="button" aria-label={`Copy ${label}`} onClick={onCopy} className="rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
          <Copy size={15} />
        </button>
      )}
      {aside && <span className="rounded bg-surface-container-lowest px-1.5 font-mono text-data-code-label text-on-surface-variant">{aside}</span>}
    </div>
  );
}

function TicketForm() {
  const notify = useToast();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical / EHR Sync & Telemetry');
  const [priority, setPriority] = useState('P3');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok = [...list].filter((f) => f.size <= 25 * 1024 * 1024);
    if (ok.length < list.length) notify('Some files exceeded 25MB and were skipped', 'info');
    setFiles((prev) => [...prev, ...ok].slice(0, 5));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = `TKT-${Math.floor(10000 + Math.random() * 89999)}`;
    notify(`${id} submitted · ${priority} routed to Tier 2 Clinical IT`);
    setSubject('');
    setDescription('');
    setFiles([]);
    setPriority('P3');
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-space-md p-space-lg">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-headline-md font-semibold text-on-surface">Submit a Support Ticket</h2>
          <span className="text-caption text-on-surface-variant">Need technical assistance or encountering system glitches? Our biomedical IT engineers respond within 15 minutes.</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">Subject / Issue Summary</span>
          <input className="field" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. HL7 telemetry feed intermittent disconnect in Ward 4C" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">System Category</span>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {['Technical / EHR Sync & Telemetry', 'Billing & Insurance Pre-Authorization', 'Clinical Workstation & Peripherals', 'Account, Role & Access Controls', 'Feature Request / Workflow Feedback'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="field-label mb-1">Clinical Urgency &amp; Priority Level</legend>
        <div className="grid grid-cols-2 gap-space-sm md:grid-cols-4">
          {PRIORITIES.map((p) => (
            <label
              key={p.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-body-sm transition-colors',
                priority === p.id ? (p.id === 'P1' ? 'bg-danger-container font-semibold text-danger ring-2 ring-danger/40' : 'bg-primary-fixed/50 font-semibold text-on-surface ring-2 ring-primary-container/40') : 'bg-surface-container-low text-on-surface hover:bg-surface-container',
              )}
            >
              <input type="radio" name="priority" value={p.id} checked={priority === p.id} onChange={() => setPriority(p.id)} className="sr-only" />
              <span className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', p.dot)} />
                {p.label}
              </span>
              <span className="font-mono text-data-code-label text-on-surface-variant">{p.sla}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1">
        <span className="field-label">Detailed Description</span>
        <textarea className="field resize-y" rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened and any error messages shown." />
      </label>
      <div className="flex flex-col gap-1">
        <span className="field-label">Diagnostic Files &amp; Crash Logs</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn('flex flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors', dragging ? 'border-primary bg-primary-fixed/30' : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container')}
        >
          <CloudUpload size={22} className="text-primary" aria-hidden />
          <span className="text-body-sm font-semibold text-on-surface">Drag &amp; drop crash logs, screenshots, or diagnostic reports</span>
          <span className="text-caption text-on-surface-variant">Maximum file size 25MB · Supported formats: PNG, PDF, LOG, JSON</span>
        </button>
        <input ref={fileRef} type="file" multiple accept=".png,.pdf,.log,.json,.txt,.jpg" className="hidden" onChange={(e) => addFiles(e.target.files)} />
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1">
            {files.map((f, i) => (
              <li key={f.name + i} className="inline-flex items-center gap-1.5 rounded bg-surface-container px-2 py-1 font-mono text-data-code-label text-on-surface">
                {f.name}
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((list) => list.filter((_, j) => j !== i))} className="text-on-surface-variant hover:text-error">
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col items-center justify-between gap-space-sm border-t border-surface-container pt-space-md sm:flex-row">
        <span className="flex items-center gap-1.5 text-caption text-on-surface-variant">
          <Clock size={14} aria-hidden /> Ticket will be routed directly to Tier 2 Clinical IT Support team.
        </span>
        <Button variant="primary" type="submit" trailingIcon={Send}>
          Submit Ticket
        </Button>
      </div>
    </form>
  );
}
