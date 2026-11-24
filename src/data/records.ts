import type { RecordIndexRow, RecordStatus, RecordType } from '../types';
import { createRng, hashString } from '../lib/random';
import { addDays, parseLocalIso, toLocalIso } from '../lib/date';
import { initialPatients } from './patients';
import { getDoctor } from './doctors';

const TYPES: RecordType[] = ['Clinical Note', 'Lab Report', 'Radiology MRI', 'Discharge Summary', 'Pathology'];

const TITLES: Record<RecordType, string[]> = {
  'Clinical Note': ['Progress Note', 'Consultation Note', 'Triage Assessment'],
  'Lab Report': ['Complete Blood Count', 'Lipid Panel', 'Comprehensive Metabolic Panel'],
  'Radiology MRI': ['Brain MRI w/ Contrast', 'Lumbar Spine MRI', 'Knee MRI'],
  'Discharge Summary': ['Post-Operative Orthopedics Summary', 'Inpatient Discharge Summary'],
  Pathology: ['Tissue Biopsy Report', 'Cytology Report'],
};

/** Stitch first page (types/statuses keyed by patient ID). */
const STITCH: Record<string, { type: RecordType; status: RecordStatus; date: string; title?: string }> = {
  'PT-84920': { type: 'Clinical Note', status: 'Verified', date: '2026-11-19T09:40' },
  'PT-84921': { type: 'Discharge Summary', status: 'Pending Review', date: '2026-11-18T16:15', title: 'Post-Operative Cardiac Summary' },
  'PT-84922': { type: 'Radiology MRI', status: 'Verified', date: '2026-11-17T11:20' },
  'PT-84923': { type: 'Clinical Note', status: 'Verified', date: '2026-11-16T14:00' },
  'PT-84924': { type: 'Pathology', status: 'Flagged', date: '2026-11-15T17:45' },
  'PT-84927': { type: 'Lab Report', status: 'Verified', date: '2026-11-14T10:15' },
  'PT-84925': { type: 'Clinical Note', status: 'Verified', date: '2026-11-13T08:30' },
  'PT-84926': { type: 'Radiology MRI', status: 'Verified', date: '2026-11-12T13:10' },
};

/** One indexed (latest) record per chart — 2,450 records, matching the Stitch EHR repository. */
function generate(): RecordIndexRow[] {
  return initialPatients
    .map((p) => {
      const rng = createRng(hashString(p.id + 'rec'));
      const seed = STITCH[p.id];
      const type = seed?.type ?? rng.pick(TYPES);
      const roll = rng.next();
      const status: RecordStatus =
        seed?.status ?? (p.status === 'Critical' ? 'Flagged' : roll < 0.047 ? 'Pending Review' : roll < 0.054 ? 'Flagged' : 'Verified');
      return {
        id: `REC-${hashString(p.id) % 900000 + 100000}`,
        patientId: p.id,
        type,
        title: seed?.title ?? rng.pick(TITLES[type]),
        doctorId: p.doctorId,
        department: getDoctor(p.doctorId).department,
        // Indexed documents trail the visit so the Stitch first page (Nov 12–19) stays on top.
        date: seed?.date ?? toLocalIso(addDays(parseLocalIso(p.lastVisit), -rng.int(8, 20))),
        status,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const recordIndex: RecordIndexRow[] = generate();
