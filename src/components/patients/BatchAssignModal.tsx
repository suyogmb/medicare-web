import { useState, type FormEvent } from 'react';
import { Tag as TagIcon } from 'lucide-react';
import { doctors, getDoctor } from '../../data/doctors';
import { useClinicalData } from '../../context/ClinicalDataContext';
import { Button } from '../ui/Button';
import { Field, Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

interface BatchAssignModalProps {
  open: boolean;
  patientIds: string[];
  onClose: () => void;
  onDone: () => void;
}

/** Reassigns the attending physician for all selected patients. */
export function BatchAssignModal({ open, patientIds, onClose, onDone }: BatchAssignModalProps) {
  const { updatePatients } = useClinicalData();
  const notify = useToast();
  const [doctorId, setDoctorId] = useState(doctors[0].id);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const doctor = getDoctor(doctorId);
    updatePatients(patientIds, { doctorId, unit: doctor.department });
    notify(`${patientIds.length} patient${patientIds.length === 1 ? '' : 's'} assigned to ${doctor.name}`);
    onDone();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} icon={TagIcon} title="Batch Assign" subtitle={`Reassign attending physician for ${patientIds.length} selected patients`} maxWidth="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-space-md">
        <Field label="Assigned Attending">
          <select className="field" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.department}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-center justify-end gap-space-sm border-t border-surface-container pt-space-md">
          <Button variant="tonal" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Assign Patients
          </Button>
        </div>
      </form>
    </Modal>
  );
}
