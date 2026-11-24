import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import type { Department, Gender, PatientStatus } from '../../types';
import { DEPARTMENTS, doctors, doctorsForDepartment } from '../../data/doctors';
import { useClinicalData } from '../../context/ClinicalDataContext';
import { NOW, toLocalIso } from '../../lib/date';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Field, Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

const GENDERS: Gender[] = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const TRIAGE: { value: PatientStatus; label: string; className: string }[] = [
  { value: 'Active', label: 'Standard / Active', className: 'font-medium' },
  { value: 'Critical', label: 'Critical ICU', className: 'font-semibold text-error' },
  { value: 'Pending', label: 'Observation', className: 'font-medium text-tertiary' },
];

interface FormState {
  name: string;
  email: string;
  age: string;
  gender: Gender;
  phone: string;
  department: Department;
  doctorId: string;
  status: PatientStatus;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  age: '',
  gender: 'Female',
  phone: '',
  department: 'Cardiology',
  doctorId: doctorsForDepartment('Cardiology')[0].id,
  status: 'Active',
};

interface PatientIntakeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (patientId: string) => void;
}

/** Stitch "Patient Intake Registration" dialog. */
export function PatientIntakeModal({ open, onClose, onCreated }: PatientIntakeModalProps) {
  const { addPatient } = useClinicalData();
  const notify = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const deptDoctors = doctorsForDepartment(form.department);
  const attendingOptions = deptDoctors.length ? deptDoctors : doctors;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const patient = addPatient({
      name: form.name.trim(),
      email: form.email.trim(),
      age: Number(form.age),
      gender: form.gender,
      phone: form.phone.trim(),
      doctorId: form.doctorId,
      unit: form.status === 'Critical' ? `${form.department} ICU` : form.department,
      lastVisit: toLocalIso(NOW),
      visitNote: 'New Intake',
      status: form.status,
    });
    notify(`${patient.name} admitted · ${patient.id}`);
    onCreated?.(patient.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserPlus}
      title="Patient Intake Registration"
      subtitle="Assign electronic medical record and hospital ward"
    >
      <form id="intake-form" onSubmit={submit} className="flex flex-col gap-space-md">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field label="Full Legal Name">
            <input className="field" required minLength={2} placeholder="e.g. Rachel Sterling" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Email Address">
            <input className="field" required type="email" placeholder="e.g. rachel@health.org" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
          <Field label="Age">
            <input className="field" required type="number" min={0} max={120} placeholder="45" value={form.age} onChange={(e) => set('age', e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className="field" value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
              {GENDERS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Contact Phone">
            <input
              className="field"
              required
              type="tel"
              pattern="\(\d{3}\) \d{3}-\d{4}"
              title="Format: (555) 000-0000"
              placeholder="(555) 000-0000"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field label="Department">
            <select
              className="field"
              value={form.department}
              onChange={(e) => {
                const department = e.target.value as Department;
                const first = doctorsForDepartment(department)[0] ?? doctors[0];
                setForm((f) => ({ ...f, department, doctorId: first.id }));
              }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned Attending">
            <select className="field" value={form.doctorId} onChange={(e) => set('doctorId', e.target.value)}>
              {attendingOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.title})
                </option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className="field-label mb-1">Initial Triage Level</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TRIAGE.map((t) => (
              <label
                key={t.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg bg-surface-container-low p-2.5 transition-colors hover:bg-surface-container',
                  form.status === t.value && 'ring-2 ring-primary-container/40',
                )}
              >
                <input type="radio" name="triage" className="accent-primary-container" checked={form.status === t.value} onChange={() => set('status', t.value)} />
                <span className={cn('text-body-sm', t.className)}>{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex items-center justify-end gap-space-sm border-t border-surface-container pt-space-md">
          <Button variant="tonal" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Confirm &amp; Admit Patient
          </Button>
        </div>
      </form>
    </Modal>
  );
}
