import { addMinutes, isBefore, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const INSTITUTION_TIMEZONE = "America/Rio_Branco";
export const BUFFER_MINUTES = 15;

export class SchedulingError extends Error {
  constructor(
    message: string,
    public readonly code: "PAST" | "INVALID_WINDOW" | "CONFLICT" | "UNAVAILABLE"
  ) {
    super(message);
    this.name = "SchedulingError";
  }
}

export function toInstitutionDateTime(date: string, time: string) {
  return fromZonedTime(`${date}T${time}:00`, INSTITUTION_TIMEZONE);
}

export function getInstitutionDate(value = new Date()) {
  const zoned = toZonedTime(value, INSTITUTION_TIMEZONE);
  return [zoned.getFullYear(), String(zoned.getMonth() + 1).padStart(2, "0"), String(zoned.getDate()).padStart(2, "0")].join("-");
}

export function getDateRange(date: string) {
  const start = fromZonedTime(`${date}T00:00:00`, INSTITUTION_TIMEZONE);
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, end: next };
}

export function validateRequestedWindow(date: string, startTime: string, endTime: string, now = new Date()) {
  const startsAt = toInstitutionDateTime(date, startTime);
  const endsAt = toInstitutionDateTime(date, endTime);

  if (!isBefore(startsAt, endsAt)) {
    throw new SchedulingError("O horário final deve ser posterior ao horário inicial.", "INVALID_WINDOW");
  }

  if (isBefore(startsAt, now)) {
    throw new SchedulingError("Não é possível solicitar um horário no passado.", "PAST");
  }

  return { startsAt, endsAt };
}

export type BlockedInterval = { startsAt: Date; endsAt: Date };

export function intervalsConflict(candidate: BlockedInterval, existing: BlockedInterval) {
  const candidateProtectedEnd = addMinutes(candidate.endsAt, BUFFER_MINUTES);
  const existingProtectedEnd = addMinutes(existing.endsAt, BUFFER_MINUTES);
  return candidate.startsAt < existingProtectedEnd && candidateProtectedEnd > existing.startsAt;
}

export function isAvailable(candidate: BlockedInterval, blocked: BlockedInterval[]) {
  return !blocked.some((event) => intervalsConflict(candidate, event));
}

export function getSlotState(date: string, time: string, events: BlockedInterval[]) {
  const start = toInstitutionDateTime(date, time);
  const end = addMinutes(start, 15);
  return isAvailable({ startsAt: start, endsAt: end }, events) ? "available" : "blocked";
}

export function dayLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: INSTITUTION_TIMEZONE
  }).format(toZonedTime(fromZonedTime(`${date}T12:00:00`, INSTITUTION_TIMEZONE), INSTITUTION_TIMEZONE));
}

export function startOfInstitutionDay(value = new Date()) {
  return startOfDay(toZonedTime(value, INSTITUTION_TIMEZONE));
}
