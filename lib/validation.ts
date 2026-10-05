import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

const calendarDateSchema = z
  .string()
  .regex(datePattern, "Selecione uma data válida.")
  .refine(isCalendarDate, "Selecione uma data existente no calendário.");

export function sanitizeText(value: string) {
  return value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const cleanText = (min: number, max: number) =>
  z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(min).max(max));

export const appointmentSchema = z
  .object({
    requesterName: cleanText(3, 120),
    department: cleanText(2, 100),
    email: z.string().trim().email("Informe um e-mail válido.").max(160).transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .transform((value) => value.replace(/[^\d+()\-\s]/g, "").replace(/\s+/g, " ").trim())
      .pipe(z.string().min(8, "Informe um telefone válido.").max(30)),
    date: calendarDateSchema,
    startTime: z.string().regex(timePattern, "Selecione um horário inicial válido."),
    endTime: z.string().regex(timePattern, "Selecione um horário final válido."),
    purpose: cleanText(3, 180),
    notes: z
      .string()
      .optional()
      .transform((value) => {
        const clean = sanitizeText(value ?? "");
        return clean || undefined;
      })
      .pipe(z.string().max(1000).optional())
  })
  .superRefine((value, context) => {
    if (value.endTime <= value.startTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "O horário final deve ser posterior ao horário inicial."
      });
    }
  });

export const adminCodeSchema = z.object({
  code: z.string().trim().min(4, "Informe o código administrativo.").max(128)
});

export const appointmentActionSchema = adminCodeSchema.extend({
  action: z.enum(["approve", "reject", "cancel"]),
  note: z
    .string()
    .optional()
    .transform((value) => {
      const clean = sanitizeText(value ?? "");
      return clean || undefined;
    })
    .pipe(z.string().max(500).optional())
});

export const availabilityQuerySchema = z.object({
  date: calendarDateSchema
});

export const adminFilterSchema = z.object({
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  requester: z.string().transform(sanitizeText).pipe(z.string().max(120)).optional(),
  department: z.string().transform(sanitizeText).pipe(z.string().max(100)).optional(),
  purpose: z.string().transform(sanitizeText).pipe(z.string().max(180)).optional()
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "A data final deve ser igual ou posterior à data inicial." });
  }
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AdminFilters = z.infer<typeof adminFilterSchema>;
