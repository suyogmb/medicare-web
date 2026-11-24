import type { ActivityItem } from '../types';

export type ChartRange = '1D' | '1W' | '1M' | '1Y';

export interface TrafficPoint {
  label: string;
  completed: number;
  pending: number;
  cancelled: number;
}

/** Hospital-wide consultation traffic (analytics feed), per range toggle on the dashboard chart. */
export const appointmentTraffic: Record<ChartRange, { caption: string; points: TrafficPoint[] }> = {
  '1D': {
    caption: 'Nov 20, 2026',
    points: [
      { label: '08:00', completed: 8, pending: 4, cancelled: 1 },
      { label: '09:00', completed: 12, pending: 5, cancelled: 0 },
      { label: '10:00', completed: 15, pending: 6, cancelled: 1 },
      { label: '11:00', completed: 11, pending: 6, cancelled: 2 },
      { label: '12:00', completed: 4, pending: 3, cancelled: 0 },
      { label: '13:00', completed: 9, pending: 5, cancelled: 1 },
      { label: '14:00', completed: 13, pending: 6, cancelled: 1 },
      { label: '15:00', completed: 10, pending: 5, cancelled: 0 },
      { label: '16:00', completed: 6, pending: 3, cancelled: 1 },
    ],
  },
  '1W': {
    caption: 'Nov 14 - Nov 20, 2026',
    points: [
      { label: 'Sat 14', completed: 50, pending: 38, cancelled: 3 },
      { label: 'Sun 15', completed: 68, pending: 42, cancelled: 2 },
      { label: 'Mon 16', completed: 86, pending: 45, cancelled: 2 },
      { label: 'Tue 17', completed: 85, pending: 50, cancelled: 3 },
      { label: 'Wed 18', completed: 88, pending: 56, cancelled: 2 },
      { label: 'Thu 19', completed: 79, pending: 60, cancelled: 1 },
      { label: 'Fri 20', completed: 83, pending: 59, cancelled: 1 },
    ],
  },
  '1M': {
    caption: 'Oct 22 - Nov 20, 2026',
    points: [
      { label: 'Wk 43', completed: 402, pending: 210, cancelled: 18 },
      { label: 'Wk 44', completed: 451, pending: 236, cancelled: 22 },
      { label: 'Wk 45', completed: 476, pending: 248, cancelled: 15 },
      { label: 'Wk 46', completed: 512, pending: 261, cancelled: 19 },
      { label: 'Wk 47', completed: 539, pending: 284, cancelled: 14 },
    ],
  },
  '1Y': {
    caption: 'Dec 2025 - Nov 2026',
    points: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((label, i) => ({
      label,
      completed: 1650 + Math.round(Math.sin(i / 1.7) * 160) + i * 38,
      pending: 820 + Math.round(Math.cos(i / 2) * 90) + i * 14,
      cancelled: 60 + ((i * 7) % 25),
    })),
  },
};

export const hospitalPerformance = [
  { key: 'beds', label: 'Bed Occupancy', detail: '352 / 400 Inpatient Beds', value: '88%', note: '+3% surge', tone: 'error' as const },
  { key: 'satisfaction', label: 'Patient Satisfaction', detail: 'Based on 1.2k surveys', value: '94.6%', note: 'Top Tier', tone: 'primary' as const },
  { key: 'consult', label: 'Avg Consultation', detail: 'Standard target: 15-20m', value: '18', unit: 'mins', note: 'Optimal', tone: 'muted' as const },
];

export const recentActivity: ActivityItem[] = [
  { id: 'a1', actor: 'Dr. Sarah Jenkins', action: 'updated medical record for', subject: 'Marcus Brody', subjectId: 'PT-84921', ago: '12m ago', tag: 'EHR Update', tone: 'primary' },
  { id: 'a2', actor: 'Nurse Thomas', action: 'completed triage assessment for', subject: 'Eleanor Vance', subjectId: 'PT-84920', ago: '45m ago', tag: 'Triage Done', tone: 'secondary' },
  { id: 'a3', actor: 'Dr. James Wilson', action: 'prescribed medication to', subject: 'Beatrice Hall', subjectId: 'PT-84926', ago: '1h ago', tag: 'Rx Issued', tone: 'tertiary' },
  { id: 'a4', actor: 'Zoe Alvarez', action: 'completed new patient registration', subjectId: 'PT-84933', ago: '2h ago', tag: 'New Intake', tone: 'muted' },
];
