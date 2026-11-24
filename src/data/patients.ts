import type { Department, Gender, Patient, PatientStatus } from '../types';
import { createRng } from '../lib/random';
import { NOW, addDays, toLocalIso } from '../lib/date';
import { doctors } from './doctors';

/** Total registry size shown throughout the Stitch designs. */
export const REGISTRY_SIZE = 2450;
const FIRST_ID = 84920;

type Seed = Omit<Patient, 'id' | 'bloodType' | 'registeredOn'>;

/** Rows reproduced verbatim from the Stitch "Patients Management" + "Appointment Management" screens. */
const STITCH_PATIENTS: Seed[] = [
  { name: 'Eleanor Vance', email: 'eleanor.vance@medicare360.org', age: 42, gender: 'Female', phone: '(555) 382-9102', doctorId: 'DR-1002', unit: 'Cardiology', lastVisit: '2026-11-18T09:40', visitNote: 'Cardiology Ward A', status: 'Active' },
  { name: 'Marcus Brody', email: 'm.brody68@horizon-net.org', age: 68, gender: 'Male', phone: '(555) 491-8234', doctorId: 'DR-1001', unit: 'Cardiology ICU', lastVisit: '2026-11-20T08:30', visitNote: 'Cardiac Resuscitation', status: 'Critical' },
  { name: 'Sophia Martinez', email: 'smartinez@apexhealth.io', age: 29, gender: 'Female', phone: '(555) 928-3741', doctorId: 'DR-1003', unit: 'Neurology', lastVisit: '2026-11-15T11:20', visitNote: 'Neuro EEG Lab', status: 'Active' },
  { name: 'Arthur Pendelton', email: 'arthur.p@postoffice.uk', age: 74, gender: 'Male', phone: '(555) 201-9384', doctorId: 'DR-1004', unit: 'General Practice', lastVisit: '2026-10-28T14:00', visitNote: 'Annual Review', status: 'Inactive' },
  { name: 'Clara Oswald', email: 'clara.oswald@coalhill.edu', age: 33, gender: 'Female', phone: '(555) 837-2910', doctorId: 'DR-1001', unit: 'Cardiology', lastVisit: '2026-11-19T16:10', visitNote: 'Post-Op Checkup', status: 'Active' },
  { name: 'Liam Gallagher', email: 'l.gallagher@oasis-records.co', age: 51, gender: 'Male', phone: '(555) 192-8374', doctorId: 'DR-1008', unit: 'Orthopedics', lastVisit: '2026-11-12T08:30', visitNote: 'Knee Arthroscopy', status: 'Pending' },
  { name: 'Beatrice Hall', email: 'beatrice.hall@northwell.org', age: 62, gender: 'Female', phone: '(555) 319-4820', doctorId: 'DR-1006', unit: 'Endocrinology', lastVisit: '2026-11-10T13:10', visitNote: 'Thyroid Ultrasound', status: 'Active' },
  { name: 'Thomas Wright', email: 'twright@globalarch.com', age: 45, gender: 'Male', phone: '(555) 772-9104', doctorId: 'DR-1005', unit: 'Oncology', lastVisit: '2026-11-05T10:00', visitNote: 'PET Scan Oncology', status: 'Active' },
  { name: 'Hannah Abbott', email: 'habbott@huffle-academy.edu', age: 16, gender: 'Female', phone: '(555) 420-1928', doctorId: 'DR-1007', unit: 'Pediatrics', lastVisit: '2026-11-20T10:15', visitNote: 'Pediatric Consultation', status: 'Active' },
  { name: 'David Kim', email: 'david.kim@seoultech.kr', age: 38, gender: 'Male', phone: '(555) 819-2041', doctorId: 'DR-1004', unit: 'General Practice', lastVisit: '2026-11-01T09:00', visitNote: 'Discharge Clearance', status: 'Discharged' },
  { name: 'Marcus Sterling', email: 'marcus.sterling@fastmail.com', age: 57, gender: 'Male', phone: '(555) 640-1187', doctorId: 'DR-1003', unit: 'Neurology', lastVisit: '2026-11-13T09:15', visitNote: 'Migraine Follow-up', status: 'Active' },
  { name: 'Beatrice Thorne', email: 'b.thorne.family@gmail.com', age: 7, gender: 'Female', phone: '(555) 233-7741', doctorId: 'DR-1007', unit: 'Pediatrics', lastVisit: '2026-11-06T10:00', visitNote: 'Vaccination Review', status: 'Pending' },
  { name: 'Jonathan Pryce', email: 'jpryce@stonebridge.co', age: 49, gender: 'Male', phone: '(555) 918-2290', doctorId: 'DR-1008', unit: 'Orthopedics', lastVisit: '2026-11-11T11:15', visitNote: 'Hip Replacement Consult', status: 'Active' },
];

const FIRST_NAMES_F = ['Olivia', 'Emma', 'Ava', 'Mia', 'Isla', 'Grace', 'Chloe', 'Nora', 'Zoe', 'Aisha', 'Priya', 'Mei', 'Leah', 'Ruth', 'Ingrid', 'Lucia', 'Naomi', 'Freya', 'Elena', 'Hana', 'Amara', 'Sofia', 'Julia', 'Maya'];
const FIRST_NAMES_M = ['Noah', 'Liam', 'Ethan', 'Mason', 'Lucas', 'Owen', 'Henry', 'Samuel', 'Omar', 'Arjun', 'Kenji', 'Mateo', 'Felix', 'Hugo', 'Isaac', 'Victor', 'Daniel', 'Elias', 'Rohan', 'Tobias', 'Gabriel', 'Andre', 'Leo', 'Caleb'];
const LAST_NAMES = ['Anderson', 'Bennett', 'Carter', 'Delgado', 'Ellison', 'Fischer', 'Garcia', 'Hughes', 'Ibrahim', 'Jensen', 'Kowalski', 'Lindqvist', 'Moreno', 'Nakamura', 'Okafor', 'Patel', 'Quinn', 'Ramirez', 'Schultz', 'Tanaka', 'Underwood', 'Varga', 'Whitaker', 'Yilmaz', 'Zhang', 'Brooks', 'Coleman', 'Duarte', 'Novak', 'Sato'];
const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'proton.me', 'icloud.com', 'fastmail.com', 'yahoo.com'];

const VISIT_NOTES: Record<Department, string[]> = {
  Cardiology: ['ECG Follow-up', 'Stress Test', 'Holter Review', 'Post-Op Checkup'],
  Neurology: ['Neuro EEG Lab', 'Migraine Follow-up', 'MRI Review', 'Nerve Conduction'],
  Pediatrics: ['Pediatric Consultation', 'Vaccination Review', 'Growth Assessment'],
  Orthopedics: ['Knee Arthroscopy', 'Fracture Review', 'Physio Assessment'],
  Oncology: ['PET Scan Oncology', 'Chemo Cycle Review', 'Biopsy Consult'],
  Endocrinology: ['Thyroid Ultrasound', 'HbA1c Review', 'Insulin Titration'],
  'General Practice': ['Annual Review', 'Routine Checkup', 'Discharge Clearance'],
};

const PEDIATRICIAN = doctors.find((d) => d.department === 'Pediatrics')!;
const ADULT_DOCTORS = doctors.filter((d) => d.department !== 'Pediatrics');

const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

/** Age brackets roughly matching the Stitch demographics panel (17/30/28/18/7 %). */
function sampleAge(r: number, rng: ReturnType<typeof createRng>): number {
  if (r < 0.17) return rng.int(1, 17);
  if (r < 0.47) return rng.int(18, 35);
  if (r < 0.75) return rng.int(36, 55);
  if (r < 0.93) return rng.int(56, 75);
  return rng.int(76, 94);
}

/** Positions of the remaining critical-triage patients (Stitch shows 8 total). */
const CRITICAL_SLOTS = new Set([37, 141, 402, 777, 1203, 1660, 2311]);

function generatePatients(): Patient[] {
  const rng = createRng(360);
  const list: Patient[] = STITCH_PATIENTS.map((seed, i) => ({
    ...seed,
    id: `PT-${FIRST_ID + i}`,
    bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
    registeredOn: toLocalIso(addDays(NOW, -(120 + i * 37))),
  }));

  for (let i = list.length; i < REGISTRY_SIZE; i++) {
    const gender: Gender = rng.next() < 0.52 ? 'Female' : 'Male';
    const first = rng.pick(gender === 'Female' ? FIRST_NAMES_F : FIRST_NAMES_M);
    const last = rng.pick(LAST_NAMES);
    const age = sampleAge(rng.next(), rng);
    const doctor = age < 18 ? PEDIATRICIAN : rng.pick(ADULT_DOCTORS);
    const roll = rng.next();
    let status: PatientStatus = 'Active';
    if (CRITICAL_SLOTS.has(i)) status = 'Critical';
    else if (roll < 0.107) status = 'Discharged';
    else if (roll < 0.112) status = 'Pending';
    else if (roll < 0.116) status = 'Inactive';

    const visit = addDays(NOW, -rng.int(1, 75));
    visit.setHours(rng.int(8, 16), rng.pick([0, 15, 30, 45]));

    list.push({
      id: `PT-${FIRST_ID + i}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${rng.int(1, 99)}@${rng.pick(EMAIL_DOMAINS)}`.toLowerCase(),
      age,
      gender,
      phone: `(555) ${rng.int(200, 989)}-${String(rng.int(0, 9999)).padStart(4, '0')}`,
      doctorId: doctor.id,
      unit: status === 'Critical' ? `${doctor.department} ICU` : doctor.department,
      lastVisit: toLocalIso(visit),
      visitNote: status === 'Critical' ? 'Intensive Monitoring' : rng.pick(VISIT_NOTES[doctor.department]),
      status,
      bloodType: rng.pick(BLOOD_TYPES),
      registeredOn: toLocalIso(addDays(NOW, -rng.int(90, 1500))),
    });
  }
  return list;
}

export const initialPatients: Patient[] = generatePatients();

export function nextPatientId(patients: Patient[]): string {
  const max = patients.reduce((acc, p) => Math.max(acc, Number(p.id.slice(3))), FIRST_ID);
  return `PT-${max + 1}`;
}
