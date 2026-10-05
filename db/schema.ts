import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const appointmentStatus = pgEnum("appointment_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED"
]);

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  resourceId: text("resource_id").notNull().default("studio-ieptec"),
  requesterName: text("requester_name").notNull(),
  department: text("department").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  purpose: text("purpose").notNull(),
  notes: text("notes"),
  status: appointmentStatus("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  approvedBy: text("approved_by")
});

export const appointmentHistory = pgTable("appointment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
