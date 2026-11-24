import type { Appointment, AppointmentStatus } from '../types';
import { createRng } from '../lib/random';
import { NOW, addDays, toLocalIso, isSameDay } from '../lib/date';
import { getDoctor } from './doctors';
import { initialPatients } from './patients';

const byName = (name: string) => {
  const p = initialPatients.find((x) => x.name === name);
  if (!p) throw new Error(`Seed patient missing: ${name}`);
  return p;
};

type TodaySeed = [name: string, time: string, duration: number, doctorId: string, status: AppointmentStatus, reason: string, note?: string];

/** Today's queue — the Stitch "Appointment Management" schedule plus dashboard table rows. */
const TODAY_SEED: TodaySeed[] = [
  ['Sophia Martinez', '08:00', 30, 'DR-1003', 'Completed', 'EEG results review'],
  ['Eleanor Vance', '08:30', 30, 'DR-1001', 'Confirmed', 'Cardiac follow-up'],
  ['Liam Gallagher', '09:00', 30, 'DR-1008', 'Completed', 'Post-arthroscopy check'],
  ['Marcus Sterling', '09:15', 45, 'DR-1003', 'Confirmed', 'Migraine consultation'],
  ['Beatrice Thorne', '10:00', 30, 'DR-1007', 'Pending', 'Vaccination review'],
  ['Marcus Brody', '10:30', 30, 'DR-1001', 'In Progress', 'ICU cardiac assessment'],
  ['Jonathan Pryce', '11:15', 60, 'DR-1008', 'Confirmed', 'Hip replacement consult'],
  ['Hannah Abbott', '13:00', 30, 'DR-1007', 'Confirmed', 'Pediatric consultation'],
  ['Clara Oswald', '13:30', 30, 'DR-1002', 'Cancelled', 'Post-op checkup', 'Self-reschedule'],
  ['Thomas Wright', '14:00', 45, 'DR-1005', 'Confirmed', 'PET scan review'],
  ['Arthur Pendelton', '14:45', 45, 'DR-1003', 'Pending', 'Neurology referral'],
  ['David Kim', '15:30', 30, 'DR-1004', 'Confirmed', 'General review'],
];

const REASONS = ['Routine follow-up', 'Lab results review', 'Medication review', 'Initial consultation', 'Post-op checkup', 'Imaging review', 'Specialist referral'];
const SLOT_MINUTES = [0, 15, 30, 45];

function generateAppointments(): Appointment[] {
  const rng = createRng(47);
  const list: Appointment[] = [];
  let seq = 1;
  const push = (a: Omit<Appointment, 'id'>) => list.push({ ...a, id: `APT-${String(seq++).padStart(5, '0')}` });

  // Today (hand-authored to match Stitch)
  for (const [name, time, durationMin, doctorId, status, reason, note] of TODAY_SEED) {
    const patient = byName(name);
    push({
      patientId: patient.id,
      doctorId,
      department: getDoctor(doctorId).department,
      start: `2026-11-20T${time}`,
      durationMin,
      status,
      reason,
      note,
    });
  }

  // Surrounding range: Oct 1 → Dec 31, 2026
  const pool = initialPatients.slice(0, 320);
  for (let day = new Date(2026, 9, 1); day <= new Date(2026, 11, 31); day = addDays(day, 1)) {
    if (isSameDay(day, NOW)) continue;
    const dow = day.getDay();
    if (dow === 0) continue;
    const count = dow === 6 ? rng.int(1, 2) : rng.int(3, 5);
    const usedSlots = new Set<string>();
    for (let i = 0; i < count; i++) {
      let hour = rng.int(8, 16);
      if (hour === 12) hour = 13; // midday handover window
      const minute = rng.pick(SLOT_MINUTES);
      const key = String(hour); // keep one booking per hourly slot, like the Stitch grid
      if (usedSlots.has(key)) continue;
      usedSlots.add(key);

      const patient = rng.pick(pool);
      const doctor = getDoctor(patient.doctorId);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
      const isPast = start < NOW;
      const roll = rng.next();
      const status: AppointmentStatus = isPast
        ? roll < 0.88 ? 'Completed' : 'Cancelled'
        : roll < 0.75 ? 'Confirmed' : roll < 0.95 ? 'Pending' : 'Cancelled';

      push({
        patientId: patient.id,
        doctorId: doctor.id,
        department: doctor.department,
        start: toLocalIso(start),
        durationMin: rng.pick([30, 30, 45, 60]),
        status,
        reason: rng.pick(REASONS),
      });
    }
  }
  return list.sort((a, b) => a.start.localeCompare(b.start));
}

export const initialAppointments: Appointment[] = generateAppointments();
