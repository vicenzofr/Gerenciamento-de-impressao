import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

const colors = ['rust', 'navy', 'teal', 'green', 'amber']
const pad = (n) => String(n).padStart(2, '0')
const duration = (n) => pad(Math.floor(n / 60)) + 'h ' + pad(n % 60) + 'm'
const clock = (n) => pad(Math.floor(n / 60)) + ':' + pad(n % 60)

export function openDatabase(filePath = resolve('data', 'printing.sqlite')) {
  if (filePath !== ':memory:') mkdirSync(dirname(resolve(filePath)), { recursive: true })
  const db = new DatabaseSync(filePath)
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;')
  try {
    // A versão e a carga inicial são gravadas na mesma transação.
    db.exec('BEGIN IMMEDIATE')
    const version = db.prepare('PRAGMA user_version').get().user_version
    if (version === 0) {
      db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))
      db.exec(readFileSync(new URL('./seed.sql', import.meta.url), 'utf8'))
      db.exec('PRAGMA user_version = 1')
    } else if (version !== 1) {
      throw new Error('Versão do banco não suportada: ' + version)
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK'); db.close(); throw error
  }
  return db
}

export function getDashboard(db) {
  const printers = db.prepare('SELECT * FROM printers ORDER BY rowid').all()
  const blocks = db.prepare('SELECT * FROM timeline_blocks ORDER BY start_minute, id').all()
  const jobs = db.prepare(
    'SELECT j.*, p.name AS printer_name, b.start_minute, b.end_minute FROM print_jobs j ' +
    'LEFT JOIN printers p ON p.id = j.printer_id LEFT JOIN timeline_blocks b ON b.job_id = j.id ORDER BY j.rowid'
  ).all()
  return {
    printersOnline: printers.filter((p) => p.online === 1).length,
    queuedJobs: jobs.filter((j) => j.status === 'QUEUED').map((j) => ({
      id: j.id, fileName: j.file_name, printer: j.printer_name ?? undefined,
      estimatedTime: duration(j.duration_minutes), filament: j.filament ?? undefined,
      weight: j.weight_grams == null ? undefined : j.weight_grams + 'g', priority: j.priority,
      scheduledSlot: j.start_minute == null ? undefined : clock(j.start_minute) + ' - ' + clock(j.end_minute),
    })),
    producingJobs: jobs.filter((j) => j.status === 'PRODUCING').map((j) => ({
      id: j.id, fileName: j.file_name, printerName: j.printer_name, progress: j.progress,
      elapsedTime: duration(j.elapsed_minutes) + ' decorridos', nozzleTemp: j.nozzle_temp, bedTemp: j.bed_temp,
    })),
    verifyJobs: jobs.filter((j) => j.status === 'VERIFY').map((j) => ({
      id: j.id, fileName: j.file_name, printerName: j.printer_name,
      totalTime: duration(j.duration_minutes), verifyStatus: j.verify_status,
    })),
    printerTimelines: printers.map((p) => ({
      id: p.id, name: p.name, spec: p.spec,
      blocks: blocks.filter((b) => b.printer_id === p.id).map((b) => ({
        id: b.job_id ?? b.id, fileName: b.label, startHour: b.start_minute / 60,
        endHour: b.end_minute / 60, color: b.color, autoScheduled: b.auto_scheduled === 1,
      })),
    })),
  }
}

function bestSlot(blocks, minutes) {
  const gaps = []
  let cursor = 0
  for (const block of blocks) {
    if (block.start_minute > cursor) gaps.push({ start: cursor, end: block.start_minute })
    cursor = Math.max(cursor, block.end_minute)
  }
  if (cursor < 1440) gaps.push({ start: cursor, end: 1440 })
  const best = gaps.filter((g) => g.end - g.start >= minutes)
    .sort((a, b) => (a.end - a.start) - (b.end - b.start) || a.start - b.start)[0]
  return best ? { start: best.start, end: best.start + minutes } : null
}

export function createJob(db, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400, 'Dados inválidos.')
  const { fileName, printer, hours, minutes } = input
  if (typeof fileName !== 'string' || !fileName.trim() || fileName.trim().length > 255)
    throw new ApiError(400, 'Informe um nome de arquivo de até 255 caracteres.')
  if (typeof printer !== 'string') throw new ApiError(400, 'Selecione uma impressora válida.')
  if (!Number.isInteger(hours) || hours < 0 || hours > 99 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59 || hours * 60 + minutes === 0)
    throw new ApiError(400, 'Informe um tempo válido: 0 a 99 horas e 0 a 59 minutos, maior que zero.')

  db.exec('BEGIN IMMEDIATE')
  try {
    const selected = db.prepare('SELECT id FROM printers WHERE name = ?').get(printer)
    if (!selected) throw new ApiError(400, 'Impressora não encontrada.')
    const blocks = db.prepare('SELECT * FROM timeline_blocks WHERE printer_id = ? ORDER BY start_minute').all(selected.id)
    // Recalcula com o estado atual do banco: não confia na sugestão do navegador.
    const slot = bestSlot(blocks, hours * 60 + minutes)
    const id = randomUUID()
    db.prepare('INSERT INTO print_jobs (id, file_name, printer_id, status, duration_minutes, priority) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, fileName.trim(), selected.id, 'QUEUED', hours * 60 + minutes, hours >= 6 ? 'AGENDADA' : 'MEDIA')
    if (slot) db.prepare('INSERT INTO timeline_blocks (id, printer_id, job_id, label, start_minute, end_minute, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), selected.id, id, fileName.trim(), slot.start, slot.end, colors[blocks.length % colors.length])
    const dashboard = getDashboard(db)
    db.exec('COMMIT')
    return { id, dashboard }
  } catch (error) { db.exec('ROLLBACK'); throw error }
}

export function deleteJob(db, id) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = db.prepare('DELETE FROM print_jobs WHERE id = ?').run(id)
    if (result.changes === 0) throw new ApiError(404, 'Trabalho não encontrado. Atualize a página.')
    // ON DELETE CASCADE também libera a reserva da linha do tempo.
    const dashboard = getDashboard(db)
    db.exec('COMMIT')
    return dashboard
  } catch (error) { db.exec('ROLLBACK'); throw error }
}
