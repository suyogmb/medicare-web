import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppNotification, Appointment, Patient, PatientStatus, Prescription } from '../types';
import { initialPatients, nextPatientId } from '../data/patients';
import { initialAppointments } from '../data/appointments';
import { initialPrescriptions, nextPrescriptionId } from '../data/prescriptions';
import { initialNotifications } from '../data/analytics';

export type NewPatientInput = Omit<Patient, 'id' | 'registeredOn' | 'bloodType'>;
export type NewAppointmentInput = Omit<Appointment, 'id'>;
export type NewPrescriptionInput = Omit<Prescription, 'id'>;

interface ClinicalDataValue {
  patients: Patient[];
  appointments: Appointment[];
  getPatient: (id: string) => Patient | undefined;
  addPatient: (input: NewPatientInput) => Patient;
  updatePatients: (ids: string[], patch: Partial<Pick<Patient, 'status' | 'doctorId' | 'unit'>>) => void;
  setPatientStatus: (id: string, status: PatientStatus) => void;
  addAppointment: (input: NewAppointmentInput) => Appointment;
  prescriptions: Prescription[];
  addPrescription: (input: NewPrescriptionInput) => Prescription;
  updatePrescriptions: (ids: string[], patch: Partial<Pick<Prescription, 'status' | 'refillsLeft' | 'issued'>>) => void;
  notifications: AppNotification[];
  markNotifications: (ids: string[] | 'all', unread?: boolean) => void;
  dismissNotification: (id: string) => void;
}

const ClinicalDataContext = createContext<ClinicalDataValue | null>(null);

/** In-memory clinical store backed by mock data; swap for an API client later. */
export function ClinicalDataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  const patientIndex = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const getPatient = useCallback((id: string) => patientIndex.get(id), [patientIndex]);

  const patientsRef = useRef(patients);
  patientsRef.current = patients;

  const addPatient = useCallback((input: NewPatientInput) => {
    const created: Patient = {
      ...input,
      id: nextPatientId(patientsRef.current),
      bloodType: 'Pending',
      registeredOn: input.lastVisit,
    };
    patientsRef.current = [created, ...patientsRef.current];
    setPatients(patientsRef.current);
    return created;
  }, []);

  const updatePatients = useCallback<ClinicalDataValue['updatePatients']>((ids, patch) => {
    const target = new Set(ids);
    setPatients((prev) => prev.map((p) => (target.has(p.id) ? { ...p, ...patch } : p)));
  }, []);

  const setPatientStatus = useCallback((id: string, status: PatientStatus) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const addAppointment = useCallback((input: NewAppointmentInput) => {
    const created: Appointment = { ...input, id: `APT-N${Date.now().toString(36).toUpperCase()}` };
    setAppointments((prev) => [...prev, created].sort((a, b) => a.start.localeCompare(b.start)));
    return created;
  }, []);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const prescriptionsRef = useRef(prescriptions);
  prescriptionsRef.current = prescriptions;

  const addPrescription = useCallback((input: NewPrescriptionInput) => {
    const created: Prescription = { ...input, id: nextPrescriptionId(prescriptionsRef.current) };
    prescriptionsRef.current = [created, ...prescriptionsRef.current];
    setPrescriptions(prescriptionsRef.current);
    return created;
  }, []);

  const updatePrescriptions = useCallback<ClinicalDataValue['updatePrescriptions']>((ids, patch) => {
    const target = new Set(ids);
    setPrescriptions((prev) => prev.map((p) => (target.has(p.id) ? { ...p, ...patch } : p)));
  }, []);

  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const markNotifications = useCallback<ClinicalDataValue['markNotifications']>((ids, unread = false) => {
    setNotifications((prev) => prev.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, unread } : n)));
  }, []);
  const dismissNotification = useCallback((id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id)), []);

  const value = useMemo(
    () => ({
      patients, appointments, getPatient, addPatient, updatePatients, setPatientStatus, addAppointment,
      prescriptions, addPrescription, updatePrescriptions, notifications, markNotifications, dismissNotification,
    }),
    [patients, appointments, getPatient, addPatient, updatePatients, setPatientStatus, addAppointment, prescriptions, addPrescription, updatePrescriptions, notifications, markNotifications, dismissNotification],
  );

  return <ClinicalDataContext.Provider value={value}>{children}</ClinicalDataContext.Provider>;
}

export function useClinicalData(): ClinicalDataValue {
  const ctx = useContext(ClinicalDataContext);
  if (!ctx) throw new Error('useClinicalData must be used within ClinicalDataProvider');
  return ctx;
}
