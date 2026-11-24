import type { Prescription, PrescriptionStatus } from '../types';
import { createRng } from '../lib/random';
import { NOW, addDays, toLocalIso } from '../lib/date';
import { initialPatients } from './patients';

/** Stitch "Prescriptions Management" shows 1,420 orders. */
export const RX_TOTAL = 1420;

export interface Medication {
  name: string;
  sig: string;
  controlled?: boolean;
}

export const MEDICATIONS: Medication[] = [
  { name: 'Amoxicillin 500mg', sig: 'Capsule (TID x 10d)' },
  { name: 'Lisinopril 10mg', sig: 'Tablet (Daily)' },
  { name: 'Metformin 850mg', sig: 'Tablet (BID with meals)' },
  { name: 'Azithromycin 250mg', sig: '6-pack Regimen' },
  { name: 'Levothyroxine 75mcg', sig: 'Morning QAM (Fasting)' },
  { name: 'Atorvastatin 20mg', sig: 'Tablet (Nightly)' },
  { name: 'Sertraline 50mg', sig: 'Tablet (Daily)' },
  { name: 'Omeprazole 40mg', sig: 'Delayed Release' },
  { name: 'Albuterol HFA 90mcg', sig: 'Inhaler (PRN Bronchospasm)' },
  { name: 'Hydrochlorothiazide 25mg', sig: 'Tablet (Daily)' },
  { name: 'Apixaban 5mg', sig: 'Tablet (BID)' },
  { name: 'Aspirin Low Dose 81mg', sig: 'Tablet (Daily)' },
  { name: 'Oxycodone 5mg', sig: 'Tablet (Q6H PRN pain)', controlled: true },
  { name: 'Lorazepam 1mg', sig: 'Tablet (HS PRN anxiety)', controlled: true },
  { name: 'Gabapentin 300mg', sig: 'Capsule (TID)' },
  { name: 'Insulin Glargine 100U/mL', sig: 'Pen (10 units nightly)' },
];

type Seed = Pick<Prescription, 'id' | 'patientId' | 'doctorId' | 'status'> & { med: number; issued: string };

/** First page reproduced verbatim from the Stitch table. */
const STITCH_ROWS: Seed[] = [
  { id: 'RX-84920', patientId: 'PT-84920', doctorId: 'DR-1001', status: 'Active', med: 0, issued: '2026-11-19T09:10' },
  { id: 'RX-84919', patientId: 'PT-84921', doctorId: 'DR-1002', status: 'Active', med: 1, issued: '2026-11-18T14:20' },
  { id: 'RX-84880', patientId: 'PT-84924', doctorId: 'DR-1005', status: 'Refill Due', med: 2, issued: '2026-11-10T10:00' },
  { id: 'RX-84752', patientId: 'PT-84923', doctorId: 'DR-1001', status: 'Completed', med: 3, issued: '2026-10-28T15:30' },
  { id: 'RX-84915', patientId: 'PT-84926', doctorId: 'DR-1006', status: 'Active', med: 4, issued: '2026-11-17T08:45' },
  { id: 'RX-84911', patientId: 'PT-84927', doctorId: 'DR-1002', status: 'Active', med: 5, issued: '2026-11-16T11:05' },
  { id: 'RX-84908', patientId: 'PT-84922', doctorId: 'DR-1003', status: 'Active', med: 6, issued: '2026-11-15T16:40' },
  { id: 'RX-84895', patientId: 'PT-84925', doctorId: 'DR-1002', status: 'Refill Due', med: 7, issued: '2026-11-12T09:30' },
  { id: 'RX-84902', patientId: 'PT-84928', doctorId: 'DR-1003', status: 'Active', med: 8, issued: '2026-11-14T13:15' },
  { id: 'RX-84899', patientId: 'PT-84929', doctorId: 'DR-1001', status: 'Active', med: 9, issued: '2026-11-13T10:50' },
];

function generate(): Prescription[] {
  const rng = createRng(1420);
  const list: Prescription[] = STITCH_ROWS.map((s) => ({
    id: s.id,
    patientId: s.patientId,
    doctorId: s.doctorId,
    status: s.status,
    medication: MEDICATIONS[s.med].name,
    sig: MEDICATIONS[s.med].sig,
    issued: s.issued,
    controlled: false,
    refillsLeft: s.status === 'Completed' ? 0 : s.status === 'Refill Due' ? 0 : 3,
  }));
  const used = new Set(list.map((p) => p.id));
  const candidates = initialPatients.filter((p) => p.status !== 'Discharged' || rng.next() < 0.3);
  let serial = 84890;

  while (list.length < RX_TOTAL) {
    const patient = candidates[rng.int(13, candidates.length - 1)];
    let med = rng.pick(MEDICATIONS);
    // Controlled substances are rare (~1%), matching the Stitch "Schedule II-IV" tile.
    while (med.controlled && rng.next() > 0.1) med = rng.pick(MEDICATIONS);
    // Generated orders predate the Stitch first page (Nov 13–19).
    const ageDays = rng.int(8, 120);
    const issued = addDays(NOW, -ageDays);
    issued.setHours(rng.int(8, 17), rng.pick([0, 10, 20, 30, 45]));
    const roll = rng.next();
    let status: PrescriptionStatus = 'Active';
    if (roll < 0.034) status = 'Refill Due';
    else if (roll < 0.064) status = ageDays > 60 ? 'Expired' : 'Completed';
    let id = `RX-${serial--}`;
    while (used.has(id)) id = `RX-${serial--}`;
    used.add(id);
    list.push({
      id,
      patientId: patient.id,
      doctorId: patient.doctorId,
      status,
      medication: med.name,
      sig: med.sig,
      issued: toLocalIso(issued),
      controlled: Boolean(med.controlled),
      refillsLeft: status === 'Active' ? rng.int(1, 5) : 0,
    });
  }
  return list.sort((a, b) => b.issued.localeCompare(a.issued));
}

export const initialPrescriptions: Prescription[] = generate();

export function nextPrescriptionId(list: Prescription[]): string {
  const max = list.reduce((acc, p) => Math.max(acc, Number(p.id.slice(3))), 84920);
  return `RX-${max + 1}`;
}
