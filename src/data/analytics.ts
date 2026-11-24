import type { AppNotification } from '../types';

export type AnalyticsRange = 'Today' | '7 Days' | '30 Days';

export interface AnalyticsKpis {
  revenue: number;
  revenueDelta: string;
  revenueTarget: string;
  realization: string;
  revenueTrend: number[];
  admissions: number;
  admissionsDelta: string;
  planned: number;
  emergency: number;
  admissionsBars: number[];
  alos: number;
  alosDelta: string;
  readmission: number;
  readmissionDelta: string;
}

/** KPI tiles per range — "30 Days" reproduces the Stitch Hospital Analytics screen. */
export const ANALYTICS_KPIS: Record<AnalyticsRange, AnalyticsKpis> = {
  Today: {
    revenue: 148_200, revenueDelta: '+3.1%', revenueTarget: '$140K', realization: '98.2%', revenueTrend: [12, 14, 13, 16, 18, 17, 21],
    admissions: 64, admissionsDelta: '+2.4%', planned: 41, emergency: 23, admissionsBars: [6, 8, 7, 9, 10, 12, 12],
    alos: 4.0, alosDelta: '-0.8d target', readmission: 5.1, readmissionDelta: '-0.4% DoD',
  },
  '7 Days': {
    revenue: 1_012_600, revenueDelta: '+8.9%', revenueTarget: '$0.95M', realization: '97.1%', revenueTrend: [120, 136, 128, 142, 150, 146, 158],
    admissions: 431, admissionsDelta: '+4.1%', planned: 284, emergency: 147, admissionsBars: [52, 61, 58, 66, 70, 62, 62],
    alos: 4.1, alosDelta: '-0.7d target', readmission: 5.3, readmissionDelta: '-0.9% WoW',
  },
  '30 Days': {
    revenue: 4_285_400, revenueDelta: '+12.4%', revenueTarget: '$4.00M', realization: '96.8%', revenueTrend: [30, 34, 31, 38, 42, 40, 47],
    admissions: 1842, admissionsDelta: '+5.8%', planned: 1210, emergency: 632, admissionsBars: [30, 34, 32, 40, 44, 48, 64],
    alos: 4.2, alosDelta: '-0.6d target', readmission: 5.4, readmissionDelta: '-1.2% MoM',
  },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT = [820, 905, 1130, 1210, 1380, 1520, 1690, 1920, 1880, 1790, 1842, null];
const PREVIOUS = [640, 700, 820, 960, 1050, 1180, 1260, 1390, 1450, 1520, 1690, 1740];

export const admissionsMonthly = MONTHS.map((month, i) => ({ label: month, current: CURRENT[i], previous: PREVIOUS[i], target: 1800 }));

export const admissionsQuarterly = [0, 1, 2, 3].map((q) => {
  const sum = (arr: (number | null)[]) => arr.slice(q * 3, q * 3 + 3).reduce<number>((s, v) => s + (v ?? 0), 0);
  return { label: `Q${q + 1}`, current: q === 3 ? sum(CURRENT) || null : sum(CURRENT), previous: sum(PREVIOUS), target: 5400 };
});

export const departmentLoad = [
  { name: 'Cardiology', patients: 640, pct: 88 },
  { name: 'Emergency & Trauma', patients: 580, pct: 95, alert: true },
  { name: 'Neurology', patients: 420, pct: 74 },
  { name: 'Pediatrics', patients: 390, pct: 68 },
  { name: 'Orthopedics', patients: 350, pct: 82 },
  { name: 'Oncology', patients: 280, pct: 79 },
];

export const satisfaction = {
  index: 94.6,
  delta: '+2.4% QoQ',
  trend: [90.1, 91.4, 91.0, 92.6, 93.1, 93.8, 94.6],
  breakdown: [
    { label: 'Doctor Communication', pct: 96.2 },
    { label: 'Nursing & Bedside Care', pct: 94.8 },
    { label: 'Cleanliness & Environment', pct: 95.1 },
    { label: 'Wait Time & Discharge Efficiency', pct: 88.4, muted: true },
  ],
  surveys: 2410,
};

export const wards = [
  { name: 'ICU & Critical Care', location: 'Wing A · Floor 4', occupied: 36, total: 40, label: 'Warning' },
  { name: 'General Surgical Ward', location: 'Wing B · Floor 2 & 3', occupied: 95, total: 100, label: 'High Load' },
  { name: 'Cardiology Wing', location: 'Wing C · Floor 1', occupied: 52, total: 60, label: 'Normal' },
  { name: 'Pediatrics Ward', location: 'Wing D · Floor 2', occupied: 38, total: 50, label: 'Optimal' },
  { name: 'Maternity & Neonatal', location: 'Wing E · Floor 3', occupied: 44, total: 50, label: 'Active' },
  { name: 'Orthopedic Unit', location: 'Wing B · Floor 4', occupied: 87, total: 100, label: 'Normal' },
];

/** Workload per attending physician (Stitch "Doctor Workload & Utilization"). */
export const doctorWorkload: Record<string, { appointments: number; hours: number; utilization: number }> = {
  'DR-1001': { appointments: 142, hours: 7.8, utilization: 94 },
  'DR-1002': { appointments: 128, hours: 8.2, utilization: 91 },
  'DR-1003': { appointments: 115, hours: 6.9, utilization: 86 },
  'DR-1004': { appointments: 98, hours: 6.2, utilization: 78 },
  'DR-1005': { appointments: 86, hours: 7.1, utilization: 88 },
  'DR-1006': { appointments: 134, hours: 7.9, utilization: 92 },
  'DR-1007': { appointments: 104, hours: 6.6, utilization: 81 },
  'DR-1008': { appointments: 72, hours: 5.4, utilization: 64 },
};

/* ------------------------------- Notifications ------------------------------ */

export const initialNotifications: AppNotification[] = [
  {
    id: 'N-1', category: 'Critical Alerts', group: 'Today', unread: true, ago: '12m ago', ref: 'PT-84920', patientId: 'PT-84920',
    title: 'Critical Lab Value: Eleanor Vance', body: 'Serum Potassium elevated at 6.1 mEq/L (Ref: 3.5 - 5.0). Immediate cardiology review recommended.',
    actions: { primary: 'Review Labs', secondary: 'Ack' },
  },
  {
    id: 'N-2', category: 'Appointments', group: 'Today', unread: true, ago: '45m ago', ref: 'PT-84921', patientId: 'PT-84921',
    title: 'Reschedule Request: Marcus Brody', body: 'Patient requested shifting Cardiology Consult from 09:30 AM to 02:00 PM today.',
    actions: { primary: 'Approve', secondary: 'Decline' },
  },
  {
    id: 'N-3', category: 'Prescriptions', group: 'Today', unread: true, ago: '1h ago',
    title: 'DEA-EPCS Signature Pending', body: "3 controlled medication renewal orders awaiting Dr. Jenkins' biometric e-signature.",
    actions: { primary: 'Sign Now (3)' },
  },
  {
    id: 'N-4', category: 'Lab Results', group: 'Today', unread: false, ago: '3h ago', ref: 'Ward 4B',
    title: 'Cardiac Enzyme Panel Finalized', body: 'Troponin I and CK-MB results finalized for Inpatient Bed 402. All markers within baseline.',
  },
  {
    id: 'N-5', category: 'Appointments', group: 'Yesterday', unread: true, ago: '4:15 PM', ref: 'PT-84922', patientId: 'PT-84922',
    title: 'New Patient Consultation Booked', body: 'Sophia Martinez scheduled for Initial Neurological Assessment for Nov 24, 2026.',
  },
  {
    id: 'N-6', category: 'System', group: 'Yesterday', unread: true, ago: '11:30 AM',
    title: 'System Update Installed', body: 'Scheduled maintenance completed overnight with no downtime.',
  },
  {
    id: 'N-7', category: 'Prescriptions', group: 'Earlier This Week', unread: false, ago: 'Nov 17', patientId: 'PT-84920',
    title: 'Pharmacy Dispense Confirmation', body: 'Atorvastatin 40mg dispensed for Eleanor Vance by Central Hospital Pharmacy.',
  },
  {
    id: 'N-8', category: 'Lab Results', group: 'Earlier This Week', unread: false, ago: 'Nov 17', ref: 'PT-84926', patientId: 'PT-84926',
    title: 'Thyroid Panel Available', body: 'TSH and Free T4 results posted for Beatrice Hall. Values within reference range.',
  },
  {
    id: 'N-9', category: 'System', group: 'Earlier This Week', unread: false, ago: 'Nov 16',
    title: 'Scheduled Maintenance Complete', body: 'EHR cloud sync engine maintenance window closed with zero data loss.',
  },
  {
    id: 'N-10', category: 'Critical Alerts', group: 'Earlier This Week', unread: false, ago: 'Nov 16', ref: 'PT-84921', patientId: 'PT-84921',
    title: 'Telemetry Alarm Resolved: Marcus Brody', body: 'Ventricular ectopy alarm acknowledged and resolved by ICU charge nurse.',
  },
  {
    id: 'N-11', category: 'Appointments', group: 'Earlier This Week', unread: false, ago: 'Nov 15',
    title: 'Clinic Capacity Adjusted', body: 'Cardiology outpatient capacity increased by 4 slots for Nov 21.',
  },
  {
    id: 'N-12', category: 'Lab Results', group: 'Earlier This Week', unread: false, ago: 'Nov 14', ref: 'PT-84927', patientId: 'PT-84927',
    title: 'PET Scan Report Signed', body: 'Oncology PET-CT report for Thomas Wright countersigned by Dr. Rostova.',
  },
];
