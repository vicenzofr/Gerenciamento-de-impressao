-- Banco relacional SQLite. Tempos de duração e horários em minutos.
CREATE TABLE printers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  spec TEXT NOT NULL,
  online INTEGER NOT NULL DEFAULT 1 CHECK (online IN (0, 1))
) STRICT;

CREATE TABLE print_jobs (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL CHECK (length(trim(file_name)) BETWEEN 1 AND 255),
  printer_id TEXT REFERENCES printers(id),
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'PRODUCING', 'VERIFY')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 5999),
  filament TEXT,
  weight_grams INTEGER CHECK (weight_grams > 0),
  priority TEXT NOT NULL DEFAULT 'MEDIA' CHECK (priority IN ('ALTA', 'MEDIA', 'AGENDADA')),
  progress INTEGER CHECK (progress BETWEEN 0 AND 100),
  elapsed_minutes INTEGER CHECK (elapsed_minutes >= 0),
  nozzle_temp REAL CHECK (nozzle_temp >= 0),
  bed_temp REAL CHECK (bed_temp >= 0),
  verify_status TEXT CHECK (verify_status IN ('INSPECAO_PENDENTE', 'RETIRADA_PRONTA')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (status != 'PRODUCING' OR (printer_id IS NOT NULL AND progress IS NOT NULL AND elapsed_minutes IS NOT NULL AND nozzle_temp IS NOT NULL AND bed_temp IS NOT NULL)),
  CHECK (status != 'VERIFY' OR (printer_id IS NOT NULL AND verify_status IS NOT NULL))
) STRICT;

CREATE TABLE timeline_blocks (
  id TEXT PRIMARY KEY,
  printer_id TEXT NOT NULL REFERENCES printers(id),
  job_id TEXT UNIQUE REFERENCES print_jobs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_minute INTEGER NOT NULL CHECK (start_minute >= 0),
  end_minute INTEGER NOT NULL CHECK (end_minute <= 1440 AND end_minute > start_minute),
  color TEXT NOT NULL CHECK (color IN ('rust', 'navy', 'teal', 'green', 'amber')),
  auto_scheduled INTEGER NOT NULL DEFAULT 0 CHECK (auto_scheduled IN (0, 1))
) STRICT;

CREATE INDEX idx_jobs_status ON print_jobs(status);
CREATE INDEX idx_blocks_printer_time ON timeline_blocks(printer_id, start_minute);

-- Garante que nem outro cliente possa reservar um horário ocupado.
CREATE TRIGGER prevent_block_overlap_insert BEFORE INSERT ON timeline_blocks
WHEN EXISTS (SELECT 1 FROM timeline_blocks WHERE printer_id = NEW.printer_id
  AND start_minute < NEW.end_minute AND end_minute > NEW.start_minute)
BEGIN SELECT RAISE(ABORT, 'Horário já ocupado.'); END;

CREATE TRIGGER prevent_block_overlap_update BEFORE UPDATE ON timeline_blocks
WHEN EXISTS (SELECT 1 FROM timeline_blocks WHERE printer_id = NEW.printer_id
  AND id != OLD.id AND start_minute < NEW.end_minute AND end_minute > NEW.start_minute)
BEGIN SELECT RAISE(ABORT, 'Horário já ocupado.'); END;
