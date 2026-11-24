import type { StaffDepartment, StaffDoctor, StaffStatus } from '../types';
import { createRng, hashString } from '../lib/random';

type Seed = Pick<StaffDoctor, 'id' | 'name' | 'department' | 'role' | 'status' | 'location'> &
  Partial<Pick<StaffDoctor, 'statusNote' | 'nextSlot' | 'rating' | 'reviews' | 'experienceYears' | 'activePatients'>>;

/**
 * Staff directory (Stitch "Doctors Directory": 24 specialists).
 * DR-1001…1008 are the attending physicians already used by patients/appointments;
 * DR-2xxx are consulting specialists that only appear in the directory.
 */
const SEEDS: Seed[] = [
  { id: 'DR-1001', name: 'Dr. Sarah Jenkins', department: 'Cardiology', role: 'Chief Physician · Attending', status: 'Available', location: 'Room 412', nextSlot: 'Today, 02:00 PM', rating: 4.9, reviews: 312, experienceYears: 14, activePatients: 185 },
  { id: 'DR-1002', name: 'Dr. Robert Chen', department: 'Cardiology', role: 'Interventional Cardiologist', status: 'In Consultation', location: 'Room 304', statusNote: 'Consult until 11:30 AM', rating: 4.8, reviews: 241, experienceYears: 12 },
  { id: 'DR-1003', name: 'Dr. Emily Wong', department: 'Neurology', role: 'Chief Neurologist', status: 'In Surgery', location: 'Neuro ICU 5', statusNote: 'In OR-3 until 12:00 PM', rating: 4.9, reviews: 154, experienceYears: 16 },
  { id: 'DR-1004', name: 'Dr. Michael Chang', department: 'General Practice', role: 'General Physician', status: 'Available', location: 'Clinic Suite 101', nextSlot: 'Today, 01:15 PM' },
  { id: 'DR-1005', name: 'Dr. Elena Rostova', department: 'Oncology', role: 'Oncologist', status: 'In Consultation', location: 'Infusion Wing C', statusNote: 'Tumor board until 12:30 PM' },
  { id: 'DR-1006', name: 'Dr. James Wilson', department: 'Endocrinology', role: 'Endocrinologist', status: 'Available', location: 'Room 402-A', nextSlot: 'Today, 02:00 PM', rating: 4.9, reviews: 120, experienceYears: 14, activePatients: 185 },
  { id: 'DR-1007', name: 'Dr. Marco Rossi', department: 'Pediatrics', role: 'Senior Pediatrician', status: 'Available', location: 'Wing B, Level 2', nextSlot: 'Today, 03:30 PM' },
  { id: 'DR-1008', name: 'Dr. Amanda Taylor', department: 'Orthopedics', role: 'Joint Replacement Specialist', status: 'Away', location: 'Ortho Center 3B', statusNote: 'Returns Nov 24', rating: 4.7, reviews: 86, experienceYears: 11, activePatients: 165 },
  { id: 'DR-2001', name: 'Dr. Michael Anderson', department: 'Cardiology', role: 'Senior Cardiothoracic Surgeon', status: 'Available', location: 'Room 412', nextSlot: 'Tomorrow, 09:30 AM', rating: 4.95, reviews: 384, experienceYears: 16 },
  { id: 'DR-2002', name: 'Dr. Emily Chen', department: 'Pediatrics', role: 'Senior Pediatrician', status: 'In Surgery', location: 'Wing B, Level 2', statusNote: 'In OR-3 until 01:30 PM', rating: 4.8, reviews: 98, experienceYears: 9, activePatients: 210 },
  { id: 'DR-2003', name: 'Dr. Michael Ross', department: 'Neurology', role: 'Neurosurgeon', status: 'Available', location: 'Neuro ICU 5', nextSlot: 'Today, 03:15 PM', rating: 4.9, reviews: 154, experienceYears: 16, activePatients: 142 },
  { id: 'DR-2004', name: 'Dr. Robert Martinez', department: 'Emergency & Trauma', role: 'Emergency Medicine Director', status: 'On Duty', location: 'Trauma Bay A', statusNote: 'Direct Pager Line Active', rating: 4.9, reviews: 210, experienceYears: 15, activePatients: 290 },
  { id: 'DR-2005', name: 'Dr. Lisa Wong', department: 'Pediatrics', role: 'Neonatal Specialist', status: 'Away', location: 'Clinic Suite 104', statusNote: 'Returns Nov 24', rating: 4.6, reviews: 64, experienceYears: 8, activePatients: 118 },
  { id: 'DR-2006', name: 'Dr. Priya Raman', department: 'Cardiology', role: 'Electrophysiologist', status: 'Available', location: 'Cath Lab 2', nextSlot: 'Today, 04:00 PM' },
  { id: 'DR-2007', name: 'Dr. Daniel Okafor', department: 'Cardiology', role: 'Heart Failure Specialist', status: 'In Consultation', location: 'Room 306', statusNote: 'Consult until 11:15 AM' },
  { id: 'DR-2008', name: 'Dr. Hannah Weiss', department: 'Cardiology', role: 'Cardiac Imaging Lead', status: 'Available', location: 'Echo Suite 1', nextSlot: 'Today, 01:45 PM' },
  { id: 'DR-2009', name: 'Dr. Samuel Price', department: 'Pediatrics', role: 'Pediatric Cardiologist', status: 'Available', location: 'Wing B, Level 2', nextSlot: 'Today, 02:30 PM' },
  { id: 'DR-2010', name: 'Dr. Grace Liu', department: 'Pediatrics', role: 'Pediatric Intensivist', status: 'On Duty', location: 'PICU 2', statusNote: 'PICU rounds active' },
  { id: 'DR-2011', name: 'Dr. Omar Haddad', department: 'Neurology', role: 'Stroke Specialist', status: 'On Duty', location: 'Stroke Unit 4A', statusNote: 'Stroke alert pager active' },
  { id: 'DR-2012', name: 'Dr. Nina Kowalski', department: 'Neurology', role: 'Epileptologist', status: 'Available', location: 'EEG Lab', nextSlot: 'Today, 03:00 PM' },
  { id: 'DR-2013', name: 'Dr. Victor Hale', department: 'Orthopedics', role: 'Spine Surgeon', status: 'In Surgery', location: 'OR 4', statusNote: 'In OR-4 until 02:15 PM' },
  { id: 'DR-2014', name: 'Dr. Rachel Moreno', department: 'Orthopedics', role: 'Sports Medicine Lead', status: 'Available', location: 'Ortho Center 3B', nextSlot: 'Today, 11:30 AM' },
  { id: 'DR-2015', name: 'Dr. Kenji Sato', department: 'Orthopedics', role: 'Trauma Orthopedist', status: 'In Surgery', location: 'OR 1', statusNote: 'In OR-1 until 12:45 PM' },
  { id: 'DR-2016', name: 'Dr. Aisha Bello', department: 'Emergency & Trauma', role: 'Trauma Surgeon', status: 'On Duty', location: 'Trauma Bay B', statusNote: 'Direct Pager Line Active' },
];

function build(seed: Seed): StaffDoctor {
  const rng = createRng(hashString(seed.id));
  const handle = seed.name.replace(/^Dr\.\s*/, '').toLowerCase().split(' ');
  return {
    ...seed,
    rating: seed.rating ?? Number((4.5 + rng.next() * 0.45).toFixed(1)),
    reviews: seed.reviews ?? rng.int(48, 260),
    experienceYears: seed.experienceYears ?? rng.int(6, 22),
    activePatients: seed.activePatients ?? rng.int(90, 240),
    npi: String(1_000_000_000 + (hashString(seed.id + 'npi') % 899_999_999)),
    extension: String(rng.int(4100, 4990)),
    pager: `#${rng.int(7100, 7990)}`,
    email: `${handle[0][0]}.${handle[handle.length - 1]}@medicare360.org`,
    attending: seed.id.startsWith('DR-1'),
  };
}

export const staffDoctors: StaffDoctor[] = SEEDS.map(build);

const staffIndex = new Map(staffDoctors.map((d) => [d.id, d]));
export const getStaffDoctor = (id: string): StaffDoctor | undefined => staffIndex.get(id);

export const STAFF_STATUS_LABEL: Record<StaffStatus, string> = {
  Available: 'Available On-Site',
  'In Consultation': 'In Consultation',
  'In Surgery': 'In Surgery',
  'On Duty': 'On Duty · ER Ward',
  Away: 'Away / On Leave',
};

export function staffDepartments(): { department: StaffDepartment; count: number }[] {
  const counts = new Map<StaffDepartment, number>();
  staffDoctors.forEach((d) => counts.set(d.department, (counts.get(d.department) ?? 0) + 1));
  return [...counts.entries()].map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count);
}

/* ------------------------------ Profile content ----------------------------- */

export interface DoctorProfileContent {
  bio: string[];
  subspecialties: string[];
  education: { school: string; years: string; degree: string; note: string }[];
  certifications: { issuer: string; badge: string; title: string; detail: string }[];
  experience: { title: string; org: string; note: string; years: string }[];
  publications: number;
  schedule: { day: string; blocks: { label: string; time: string; tone: 'primary' | 'danger' | 'muted' }[] }[];
  stats: { totalPatients: number; completedMtd: number; surgicalMtd: number; target: number; satisfaction: number; hours: number; avgMinutes: number; utilization: number };
}

const SUBSPECIALTIES: Record<StaffDepartment, string[]> = {
  Cardiology: ['Transcatheter Aortic Valve Replacement (TAVR)', 'Acute Coronary Syndromes', 'Heart Failure Management', 'Cardiac Imaging & Echo'],
  Neurology: ['Stroke & Neurovascular Care', 'Epilepsy Monitoring', 'Movement Disorders', 'Neuro-Oncology Consults'],
  Pediatrics: ['Neonatal Intensive Care', 'Pediatric Infectious Disease', 'Developmental Assessment', 'Childhood Immunization'],
  Orthopedics: ['Total Joint Arthroplasty', 'Sports Injury Reconstruction', 'Spine Stabilization', 'Fracture Fixation'],
  Oncology: ['Solid Tumor Chemotherapy', 'Immunotherapy Protocols', 'Tumor Board Leadership', 'Palliative Symptom Control'],
  Endocrinology: ['Thyroid Disorders', 'Insulin Pump Therapy', 'Metabolic Bone Disease', 'Adrenal & Pituitary Care'],
  'General Practice': ['Preventive Medicine', 'Chronic Disease Management', 'Geriatric Assessment', 'Travel Medicine'],
  'Emergency & Trauma': ['Level 1 Trauma Resuscitation', 'Point-of-Care Ultrasound', 'Toxicology', 'Mass Casualty Triage'],
};

const SCHOOLS = [
  ['Harvard Medical School', 'Doctor of Medicine (M.D.)', 'Magna Cum Laude · Alpha Omega Alpha (AOA)'],
  ['Johns Hopkins Hospital', 'Residency in Internal Medicine', 'Outstanding Resident Research Award'],
  ['Cleveland Clinic Foundation', 'Clinical Fellowship', 'Concentration in complex inpatient care'],
  ['Princeton University', 'B.S. in Molecular Biology', 'Summa Cum Laude with Departmental Honors'],
];

export function getDoctorProfileContent(doctor: StaffDoctor): DoctorProfileContent {
  const rng = createRng(hashString(doctor.id + 'profile'));
  const grad = 2026 - doctor.experienceYears - 8;
  const surname = doctor.name.split(' ').slice(-1)[0];
  const subs = SUBSPECIALTIES[doctor.department];
  const completed = rng.int(110, 158);
  return {
    bio: [
      `Dr. ${surname} is a board-certified ${doctor.role.toLowerCase()} with ${doctor.experienceYears} years of specialized clinical experience in ${doctor.department.toLowerCase()}. Based at ${doctor.location}, they lead multidisciplinary rounds and coordinate complex inpatient and outpatient care across the MediCare 360 network.`,
      `Before joining MediCare 360, Dr. ${surname} contributed to evidence-based care pathways in high-acuity cohorts and now mentors residents and fellows through the institutional teaching programme.`,
    ],
    subspecialties: subs,
    education: [
      { school: SCHOOLS[0][0], years: `${grad} – ${grad + 4}`, degree: SCHOOLS[0][1], note: SCHOOLS[0][2] },
      { school: SCHOOLS[1][0], years: `${grad + 4} – ${grad + 7}`, degree: `Residency in ${doctor.department === 'Pediatrics' ? 'Pediatrics' : 'Internal Medicine'}`, note: SCHOOLS[1][2] },
      { school: SCHOOLS[2][0], years: `${grad + 7} – ${grad + 9}`, degree: `Fellowship in ${doctor.department}`, note: SCHOOLS[2][2] },
      { school: SCHOOLS[3][0], years: `${grad - 4} – ${grad}`, degree: SCHOOLS[3][1], note: SCHOOLS[3][2] },
    ],
    certifications: [
      { issuer: 'Specialty Board', badge: 'Active 2030', title: `American Board of ${doctor.department === 'Emergency & Trauma' ? 'Emergency Medicine' : doctor.department}`, detail: `Sub-specialty: ${subs[0].split(' (')[0]}` },
      { issuer: 'ABIM Certified', badge: 'Active', title: 'American Board of Internal Medicine', detail: 'Maintenance of Certification current' },
      { issuer: 'State Medical Board', badge: 'Unrestricted', title: 'Full Physician License', detail: `License ID: #MD-${rng.int(100000, 999999)}` },
      { issuer: 'Federal Agency', badge: 'EPCS Enabled', title: 'DEA Schedule II-V Prescribing', detail: `Reg ID: #FA-${rng.int(1000000, 9999999)}` },
    ],
    experience: [
      { title: `${doctor.role}`, org: 'MediCare 360 Comprehensive Health Network', note: `Leads ${doctor.department.toLowerCase()} service line rounds and quality reviews.`, years: `${2026 - Math.min(6, doctor.experienceYears)} – Present` },
      { title: 'Associate Professor of Medicine', org: 'University Medical Center & School of Medicine', note: 'Curriculum lead for the residency rotational block.', years: `${2026 - Math.min(10, doctor.experienceYears)} – ${2026 - Math.min(6, doctor.experienceYears)}` },
      { title: `Attending ${doctor.department === 'Emergency & Trauma' ? 'Emergency Physician' : 'Physician'}`, org: 'St. Jude Memorial Hospital', note: 'High-volume inpatient and emergent consult service.', years: `${2026 - doctor.experienceYears} – ${2026 - Math.min(10, doctor.experienceYears)}` },
    ],
    publications: rng.int(8, 48),
    schedule: [
      { day: 'MON', blocks: [{ label: 'Outpatient Clinic', time: '08:30 AM – 12:30 PM', tone: 'primary' }, { label: 'Ward Rounds', time: '02:00 PM – 05:00 PM', tone: 'danger' }] },
      { day: 'TUE', blocks: [{ label: doctor.department === 'Orthopedics' || doctor.role.includes('Surgeon') ? 'Dedicated OR Surgical Block' : 'Procedure Block', time: '07:30 AM – 03:30 PM', tone: 'danger' }] },
      { day: 'WED', blocks: [{ label: 'Outpatient Clinic', time: '09:00 AM – 01:00 PM', tone: 'primary' }, { label: 'Follow-up Reviews', time: '02:30 PM – 05:30 PM', tone: 'primary' }] },
      { day: 'THU', blocks: [{ label: 'Specialty Clinic', time: '08:30 AM – 12:30 PM', tone: 'primary' }, { label: 'Ward Rounds', time: '02:00 PM – 04:30 PM', tone: 'danger' }] },
      { day: 'FRI', blocks: [{ label: 'Research & Admin', time: '09:00 AM – 02:00 PM', tone: 'muted' }] },
    ],
    stats: {
      totalPatients: doctor.activePatients * rng.int(18, 26),
      completedMtd: completed,
      surgicalMtd: rng.int(6, 18),
      target: 160,
      satisfaction: Number((95 + rng.next() * 4).toFixed(1)),
      hours: Number((140 + rng.next() * 30).toFixed(1)),
      avgMinutes: rng.int(18, 32),
      utilization: Number((84 + rng.next() * 12).toFixed(1)),
    },
  };
}

export const STAFF_STATUS_ORDER: StaffStatus[] = ['Available', 'In Consultation', 'In Surgery', 'On Duty', 'Away'];
