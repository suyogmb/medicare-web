import type { LabResult, MedicalRecord, Patient, PatientClinicalProfile, RecordStatus, RecordType } from '../types';
import { createRng, hashString } from '../lib/random';
import { addDays, parseLocalIso, toLocalIso } from '../lib/date';
import { doctors } from './doctors';

const ALLERGIES = ['Penicillin', 'Latex', 'Peanuts', 'Sulfa drugs', 'Shellfish', 'Ibuprofen', 'Pollen'];
const CONDITIONS = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Hyperlipidemia', 'Hypothyroidism', 'Osteoarthritis', 'Migraine', 'Atrial Fibrillation'];
const MEDICATIONS = [
  { name: 'Lisinopril', dosage: '10 mg', schedule: 'Once daily' },
  { name: 'Metformin', dosage: '500 mg', schedule: 'Twice daily' },
  { name: 'Atorvastatin', dosage: '20 mg', schedule: 'Nightly' },
  { name: 'Levothyroxine', dosage: '50 mcg', schedule: 'Morning, fasting' },
  { name: 'Albuterol', dosage: '90 mcg', schedule: 'As needed' },
  { name: 'Apixaban', dosage: '5 mg', schedule: 'Twice daily' },
];
const RECORD_TYPES: RecordType[] = ['Clinical Note', 'Lab Report', 'Radiology MRI', 'Discharge Summary', 'Pathology'];
const RECORD_TITLES: Record<RecordType, string[]> = {
  'Clinical Note': ['Progress Note', 'Consultation Note', 'Triage Assessment'],
  'Lab Report': ['Complete Blood Count', 'Lipid Panel', 'Metabolic Panel'],
  'Radiology MRI': ['Brain MRI w/ Contrast', 'Lumbar Spine MRI', 'Knee MRI'],
  'Discharge Summary': ['Post-Operative Summary', 'Inpatient Discharge Summary'],
  Pathology: ['Tissue Biopsy Report', 'Cytology Report'],
};
const LAB_PANELS: { name: string; code: string; abnormal: string }[] = [
  { name: 'Comprehensive Metabolic Panel (CMP)', code: 'CMP', abnormal: 'Potassium: 5.6 mEq/L (Ref 3.5 - 5.0)' },
  { name: 'Lipid Profile Fasting', code: 'LIP', abnormal: 'LDL Cholesterol: 138 mg/dL (Optimal < 100)' },
  { name: 'Complete Blood Count (CBC) with Diff', code: 'CBC', abnormal: 'WBC: 12.4 K/uL (Ref 4.5 - 11.0)' },
  { name: 'HbA1c Glycated Hemoglobin', code: 'GLY', abnormal: 'HbA1c: 7.4% (Target < 7.0%)' },
  { name: 'Thyroid Panel (TSH, Free T4)', code: 'THY', abnormal: 'TSH: 0.2 mIU/L (Ref 0.4 - 4.0)' },
  { name: 'Troponin I High-Sensitivity', code: 'TRP', abnormal: 'hs-cTnI: 64 ng/L (Ref < 26)' },
];

const STREETS = ['Maple Ave', 'Harbor St', 'Elm Court', 'Riverside Dr', 'Oak Lane', 'Summit Rd'];
const CITIES = ['Boston, MA', 'Hartford, CT', 'Providence, RI', 'Albany, NY'];
const INSURERS = ['BlueShield PPO', 'Aetna Choice', 'UnitedCare HMO', 'Cigna Open Access', 'Medicare Part B'];
const CONTACTS = ['Alex', 'Jordan', 'Morgan', 'Sam', 'Taylor', 'Casey'];
const RELATIONS = ['Spouse', 'Sibling', 'Parent', 'Child', 'Partner'];

/**
 * Deterministic clinical profile per patient (vitals, history, documents).
 * Generated lazily so the 2,450-row registry stays light.
 */
export function getClinicalProfile(patient: Patient): PatientClinicalProfile {
  const rng = createRng(hashString(patient.id));
  const critical = patient.status === 'Critical';

  const vitals = {
    heartRate: critical ? rng.int(104, 128) : rng.int(62, 88),
    systolic: critical ? rng.int(150, 172) : rng.int(108, 132),
    diastolic: critical ? rng.int(94, 108) : rng.int(68, 84),
    spo2: critical ? rng.int(89, 93) : rng.int(96, 99),
    temperatureF: Number((critical ? 100.4 + rng.next() * 1.4 : 97.6 + rng.next() * 1.2).toFixed(1)),
  };

  const lastVisit = parseLocalIso(patient.lastVisit);
  const vitalsTrend = Array.from({ length: 8 }, (_, i) => {
    const date = addDays(lastVisit, -(7 - i) * 4);
    return {
      label: `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}`,
      heartRate: Math.max(55, vitals.heartRate - (critical ? 24 - i * 3 : 0) + rng.int(-6, 6)),
      systolic: vitals.systolic - (critical ? 18 - i * 2 : 0) + rng.int(-6, 6),
      diastolic: vitals.diastolic - (critical ? 10 - i : 0) + rng.int(-4, 4),
    };
  });
  vitalsTrend[vitalsTrend.length - 1] = { ...vitalsTrend[vitalsTrend.length - 1], heartRate: vitals.heartRate, systolic: vitals.systolic, diastolic: vitals.diastolic };

  const pickSome = <T,>(items: readonly T[], min: number, max: number): T[] => {
    const pool = [...items];
    const n = rng.int(min, max);
    const out: T[] = [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
    return out;
  };

  const records: MedicalRecord[] = Array.from({ length: rng.int(4, 7) }, (_, i) => {
    const type = i === 0 && critical ? 'Clinical Note' : rng.pick(RECORD_TYPES);
    const date = addDays(lastVisit, -i * rng.int(3, 12));
    date.setHours(rng.int(8, 17), rng.pick([0, 10, 15, 30, 40, 45]));
    const status: RecordStatus = i === 0 && critical ? 'Flagged' : i === 0 ? 'Pending Review' : rng.next() < 0.9 ? 'Verified' : 'Pending Review';
    const doctorId = i % 3 === 0 ? patient.doctorId : rng.pick(doctors).id;
    return {
      id: `REC-${hashString(patient.id + i) % 900000 + 100000}`,
      type,
      title: rng.pick(RECORD_TITLES[type]),
      doctorId,
      date: toLocalIso(date),
      status,
    };
  });

  const firstName = patient.name.split(' ').slice(-1)[0];

  const labs: LabResult[] = Array.from({ length: rng.int(3, 5) }, (_, i) => {
    const panel = LAB_PANELS[(hashString(patient.id) + i * 2) % LAB_PANELS.length];
    const date = addDays(lastVisit, -i * rng.int(10, 40));
    const abnormal = (critical && i === 0) || rng.next() < 0.2;
    return {
      id: `${panel.code}-${rng.int(10000, 99999)}`,
      name: panel.name,
      date: toLocalIso(date),
      specimen: `#${panel.code}-${rng.int(10000, 99999)}`,
      flag: abnormal ? (panel.code === 'THY' ? 'LOW' : 'ELEVATED') : 'NORMAL',
      detail: abnormal ? panel.abnormal : undefined,
      reviewerId: i % 2 === 0 ? patient.doctorId : rng.pick(doctors).id,
    };
  });

  const heightIn = patient.age < 18 ? rng.int(40, 66) : rng.int(60, 74);
  const bmiTarget = critical ? 29 + rng.next() * 4 : 20 + rng.next() * 7;
  const weightLbs = Math.round((bmiTarget * heightIn * heightIn) / 703);
  const birthYear = 2026 - patient.age;
  const dob = `${birthYear}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`;
  return {
    vitals,
    vitalsTrend,
    allergies: pickSome(ALLERGIES, 0, 2),
    conditions: critical ? ['Acute Coronary Syndrome', ...pickSome(CONDITIONS, 1, 2)] : pickSome(CONDITIONS, 0, 3),
    medications: pickSome(MEDICATIONS, 1, 3),
    records,
    address: `${rng.int(12, 980)} ${rng.pick(STREETS)}, ${rng.pick(CITIES)}`,
    insurance: { provider: rng.pick(INSURERS), memberId: `MBR-${rng.int(100000, 999999)}` },
    emergencyContact: {
      name: `${rng.pick(CONTACTS)} ${firstName}`,
      relation: rng.pick(RELATIONS),
      phone: `(555) ${rng.int(200, 989)}-${String(rng.int(0, 9999)).padStart(4, '0')}`,
    },
    findings: critical
      ? 'Elevated troponin with ST-segment changes on telemetry. Continuous cardiac monitoring in ICU; chief countersignature required before step-down transfer.'
      : `${patient.visitNote}: patient stable, vitals within normal bounds. Continue current care plan and reassess at next scheduled visit.`,
    mrn: `MRN-${String(hashString(patient.id + 'mrn') % 900 + 100)}-${String(hashString(patient.id) % 900 + 100)}`,
    dob,
    weightLbs,
    heightIn,
    adherence: critical ? rng.int(68, 82) : rng.int(86, 99),
    labs,
  };
}
