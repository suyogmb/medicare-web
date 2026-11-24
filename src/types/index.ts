export type Department =
  | 'Cardiology'
  | 'Neurology'
  | 'Pediatrics'
  | 'Orthopedics'
  | 'Oncology'
  | 'Endocrinology'
  | 'General Practice';

export type Gender = 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say';

export type PatientStatus = 'Active' | 'Critical' | 'Pending' | 'Inactive' | 'Discharged';

export type AppointmentStatus = 'Confirmed' | 'In Progress' | 'Pending' | 'Completed' | 'Cancelled';

export type DoctorAvailability = 'Available' | 'In Consultation' | 'In Surgery' | 'Off Duty';

export interface Doctor {
  id: string;
  name: string;
  shortName: string;
  title: string;
  department: Department;
  availability: DoctorAvailability;
  availabilityNote?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: Gender;
  phone: string;
  doctorId: string;
  /** Ward / unit shown under the doctor's name */
  unit: string;
  /** ISO date-time of last visit */
  lastVisit: string;
  /** Short reason line shown under the last visit date */
  visitNote: string;
  status: PatientStatus;
  bloodType: string;
  registeredOn: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  department: Department;
  /** ISO date-time (local, no timezone) */
  start: string;
  durationMin: number;
  status: AppointmentStatus;
  reason: string;
  note?: string;
}

export interface Vitals {
  heartRate: number;
  systolic: number;
  diastolic: number;
  spo2: number;
  temperatureF: number;
}

export type RecordType = 'Clinical Note' | 'Lab Report' | 'Radiology MRI' | 'Discharge Summary' | 'Pathology';

export type RecordStatus = 'Verified' | 'Pending Review' | 'Flagged';

export interface MedicalRecord {
  id: string;
  type: RecordType;
  title: string;
  doctorId: string;
  date: string;
  status: RecordStatus;
}

export interface PatientClinicalProfile {
  vitals: Vitals;
  vitalsTrend: { label: string; heartRate: number; systolic: number; diastolic: number }[];
  allergies: string[];
  conditions: string[];
  medications: { name: string; dosage: string; schedule: string }[];
  records: MedicalRecord[];
  address: string;
  insurance: { provider: string; memberId: string };
  emergencyContact: { name: string; relation: string; phone: string };
  findings: string;
  mrn: string;
  dob: string;
  weightLbs: number;
  heightIn: number;
  /** Rx adherence % shown in the Stitch "Compliance Status" tile */
  adherence: number;
  labs: LabResult[];
}

export interface LabResult {
  id: string;
  name: string;
  date: string;
  specimen: string;
  flag: 'NORMAL' | 'ELEVATED' | 'LOW';
  detail?: string;
  reviewerId: string;
}

export type ActivityTone = 'primary' | 'secondary' | 'tertiary' | 'muted';

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  subject?: string;
  subjectId?: string;
  ago: string;
  tag: string;
  tone: ActivityTone;
}

/* ------------------------------ Staff directory ----------------------------- */

export type StaffStatus = 'Available' | 'In Consultation' | 'In Surgery' | 'On Duty' | 'Away';

/** Departments visible in the staff directory (superset of clinical departments). */
export type StaffDepartment = Department | 'Emergency & Trauma';

export interface StaffDoctor {
  id: string;
  name: string;
  department: StaffDepartment;
  role: string;
  status: StaffStatus;
  /** Free-text context for the status tile ("In OR-3 until 01:30 PM", "Returns Nov 24") */
  statusNote?: string;
  rating: number;
  reviews: number;
  location: string;
  experienceYears: number;
  activePatients: number;
  nextSlot?: string;
  npi: string;
  extension: string;
  pager: string;
  email: string;
  /** True for the 8 attending physicians that own patients & appointments */
  attending: boolean;
}

/* -------------------------------- Prescriptions ----------------------------- */

export type PrescriptionStatus = 'Active' | 'Refill Due' | 'Completed' | 'Expired';

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medication: string;
  sig: string;
  issued: string;
  status: PrescriptionStatus;
  controlled: boolean;
  refillsLeft: number;
}

/* ------------------------------- Records index ------------------------------- */

export interface RecordIndexRow {
  id: string;
  patientId: string;
  type: RecordType;
  title: string;
  doctorId: string;
  department: string;
  date: string;
  status: RecordStatus;
}

/* ------------------------------- Notifications ------------------------------ */

export type NotificationCategory = 'Critical Alerts' | 'Appointments' | 'Lab Results' | 'Prescriptions' | 'System';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  ago: string;
  group: 'Today' | 'Yesterday' | 'Earlier This Week';
  unread: boolean;
  ref?: string;
  patientId?: string;
  actions?: { primary: string; secondary?: string };
}
