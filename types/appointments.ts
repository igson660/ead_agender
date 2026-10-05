export const APPOINTMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED"
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type PublicAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  purpose: string;
  department: string;
  status: AppointmentStatus;
};

export type AdminAppointment = PublicAppointment & {
  requesterName: string;
  email: string;
  phone: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  approvedBy: string | null;
};

export type AppointmentHistoryItem = {
  id: string;
  appointmentId: string;
  action: string;
  actor: string;
  note: string | null;
  createdAt: string;
};

export type AvailabilityResponse = {
  date: string;
  events: PublicAppointment[];
  timezone: string;
  bufferMinutes: number;
};
