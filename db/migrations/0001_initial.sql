CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  CREATE TYPE appointment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL DEFAULT 'studio-ieptec',
  requester_name TEXT NOT NULL CHECK (char_length(requester_name) BETWEEN 3 AND 120),
  department TEXT NOT NULL CHECK (char_length(department) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) <= 160),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 30),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL CHECK (char_length(purpose) BETWEEN 3 AND 180),
  notes TEXT,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  approved_by TEXT,
  reservation_window TSTZRANGE,
  CONSTRAINT appointment_end_after_start CHECK (ends_at > starts_at)
);

-- Older revisions attempted to use a generated TSTZRANGE. PostgreSQL rejects that
-- expression because timestamptz + interval is not immutable. Convert it to a
-- regular column so a trigger can maintain it safely at write time.
DO $$
DECLARE
  generated_flag "char";
BEGIN
  IF to_regclass('public.appointments') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'reservation_window'
      AND NOT attisdropped
  ) THEN
    SELECT attgenerated
      INTO generated_flag
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'reservation_window'
      AND NOT attisdropped;

    IF generated_flag <> '' THEN
      ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_no_conflict_with_buffer;
      ALTER TABLE appointments DROP COLUMN reservation_window;
      ALTER TABLE appointments ADD COLUMN reservation_window TSTZRANGE;
    END IF;
  ELSE
    ALTER TABLE appointments ADD COLUMN reservation_window TSTZRANGE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION sync_appointment_reservation_window()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.reservation_window := tstzrange(
    NEW.starts_at,
    NEW.ends_at + INTERVAL '15 minutes',
    '[)'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_reservation_window_sync ON appointments;
CREATE TRIGGER appointments_reservation_window_sync
BEFORE INSERT OR UPDATE OF starts_at, ends_at ON appointments
FOR EACH ROW
EXECUTE FUNCTION sync_appointment_reservation_window();

UPDATE appointments
SET reservation_window = tstzrange(starts_at, ends_at + INTERVAL '15 minutes', '[)');

ALTER TABLE appointments
  ALTER COLUMN reservation_window SET NOT NULL;

CREATE INDEX IF NOT EXISTS appointments_starts_at_idx ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments (status);
CREATE INDEX IF NOT EXISTS appointments_department_idx ON appointments (department);

DO $$
BEGIN
  ALTER TABLE appointments
    ADD CONSTRAINT appointments_no_conflict_with_buffer
    EXCLUDE USING gist (
      resource_id WITH =,
      reservation_window WITH &&
    )
    WHERE (status IN ('PENDING', 'APPROVED'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS appointment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointment_history_appointment_idx
  ON appointment_history (appointment_id, created_at DESC);
