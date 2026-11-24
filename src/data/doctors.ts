import type { Department, Doctor } from '../types';

export const DEPARTMENTS: Department[] = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Oncology',
  'Endocrinology',
  'General Practice',
];

export const doctors: Doctor[] = [
  {
    id: 'DR-1001',
    name: 'Dr. Sarah Jenkins',
    shortName: 'Dr. Jenkins',
    title: 'Lead Physician',
    department: 'Cardiology',
    availability: 'Available',
  },
  {
    id: 'DR-1002',
    name: 'Dr. Robert Chen',
    shortName: 'Dr. Chen',
    title: 'Consultant',
    department: 'Cardiology',
    availability: 'In Consultation',
  },
  {
    id: 'DR-1003',
    name: 'Dr. Emily Wong',
    shortName: 'Dr. Wong',
    title: 'Chief Neurologist',
    department: 'Neurology',
    availability: 'In Surgery',
    availabilityNote: 'Surgery till 12:00 PM',
  },
  {
    id: 'DR-1004',
    name: 'Dr. Michael Chang',
    shortName: 'Dr. Chang',
    title: 'General Physician',
    department: 'General Practice',
    availability: 'Available',
  },
  {
    id: 'DR-1005',
    name: 'Dr. Elena Rostova',
    shortName: 'Dr. Rostova',
    title: 'Oncologist',
    department: 'Oncology',
    availability: 'In Consultation',
  },
  {
    id: 'DR-1006',
    name: 'Dr. James Wilson',
    shortName: 'Dr. Wilson',
    title: 'Endocrinologist',
    department: 'Endocrinology',
    availability: 'Available',
  },
  {
    id: 'DR-1007',
    name: 'Dr. Marco Rossi',
    shortName: 'Dr. Rossi',
    title: 'Senior Pediatrician',
    department: 'Pediatrics',
    availability: 'Available',
  },
  {
    id: 'DR-1008',
    name: 'Dr. Amanda Taylor',
    shortName: 'Dr. Taylor',
    title: 'Orthopedic Surgeon',
    department: 'Orthopedics',
    availability: 'Off Duty',
  },
];

const doctorIndex = new Map(doctors.map((d) => [d.id, d]));

export function getDoctor(id: string): Doctor {
  const doctor = doctorIndex.get(id);
  if (!doctor) throw new Error(`Unknown doctor ${id}`);
  return doctor;
}

export function doctorsForDepartment(department: Department): Doctor[] {
  return doctors.filter((d) => d.department === department);
}
