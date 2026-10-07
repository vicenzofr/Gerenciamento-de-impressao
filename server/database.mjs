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

const statuses = ['QUEUED', 'PRODUCING', 'VERIFY']
const priorities = ['ALTA', 'MEDIA', 'AGENDADA']
const verifyStatuses = ['INSPECAO_PENDENTE', 'RETIRADA_PRONTA']
const defaultNozzleTemp = 200
const defaultBedTemp = 60

function validDuration(hours, minutes) {
  return Number.isInteger(hours) && hours >= 0 && hours <= 99 &&
    Number.isInteger(minutes) && minutes >= 0 && minutes <= 59
}

/**
 * Updates any subset of a job's fields (name, printer, duration, filament,
 * weight, priority, production progress/temps, verify status) and/or moves
 * it between stages. Only the fields present in `input` are touched; a
 * printer or duration change on a job with a timeline slot always triggers
 * a fresh server-side reschedule, same rule as createJob.
 */
export function updateJob(db, id, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400, 'Dados inválidos.')

  db.exec('BEGIN IMMEDIATE')
  try {
    const job = db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(id)
    if (!job) throw new ApiError(404, 'Trabalho não encontrado. Atualize a página.')

    const status = input.status === undefined ? job.status : input.status
    if (!statuses.includes(status)) throw new ApiError(400, 'Status inválido.')

    let fileName = job.file_name
    if (input.fileName !== undefined) {
      if (typeof input.fileName !== 'string' || !input.fileName.trim() || input.fileName.trim().length > 255)
        throw new ApiError(400, 'Informe um nome de arquivo de até 255 caracteres.')
      fileName = input.fileName.trim()
    }

    let printerId = job.printer_id
    let reschedule = false
    if (input.printer !== undefined) {
      const selected = db.prepare('SELECT id FROM printers WHERE name = ?').get(input.printer)
      if (!selected) throw new ApiError(400, 'Impressora não encontrada.')
      if (selected.id !== printerId) { printerId = selected.id; reschedule = true }
    }
    if (printerId == null && status !== 'QUEUED')
      throw new ApiError(400, 'Defina uma impressora antes de mover para produção ou verificação.')

    let durationMinutes = job.duration_minutes
    if (input.hours !== undefined || input.minutes !== undefined) {
      const hours = input.hours ?? Math.floor(job.duration_minutes / 60)
      const minutes = input.minutes ?? job.duration_minutes % 60
      if (!validDuration(hours, minutes) || hours * 60 + minutes === 0)
        throw new ApiError(400, 'Informe um tempo válido: 0 a 99 horas e 0 a 59 minutos, maior que zero.')
      const next = hours * 60 + minutes
      if (next !== durationMinutes) { durationMinutes = next; reschedule = true }
    }

    let filament = job.filament
    if (input.filament !== undefined) {
      filament = input.filament === null || input.filament === '' ? null : String(input.filament).trim().slice(0, 255)
    }

    let weight = job.weight_grams
    if (input.weight !== undefined) {
      if (input.weight === null || input.weight === '') weight = null
      else {
        if (!Number.isInteger(input.weight) || input.weight <= 0) throw new ApiError(400, 'Peso inválido.')
        weight = input.weight
      }
    }

    let priority = job.priority
    if (input.priority !== undefined) {
      if (!priorities.includes(input.priority)) throw new ApiError(400, 'Prioridade inválida.')
      priority = input.priority
    }

    let progress = job.progress
    if (input.progress !== undefined) {
      if (!Number.isInteger(input.progress) || input.progress < 0 || input.progress > 100)
        throw new ApiError(400, 'Progresso inválido: use um número entre 0 e 100.')
      progress = input.progress
    }

    let elapsedMinutes = job.elapsed_minutes
    if (input.elapsedHours !== undefined || input.elapsedMinutes !== undefined) {
      const eh = input.elapsedHours ?? Math.floor((job.elapsed_minutes ?? 0) / 60)
      const em = input.elapsedMinutes ?? (job.elapsed_minutes ?? 0) % 60
      if (!validDuration(eh, em)) throw new ApiError(400, 'Tempo decorrido inválido.')
      elapsedMinutes = eh * 60 + em
    }

    let nozzleTemp = job.nozzle_temp
    if (input.nozzleTemp !== undefined) {
      if (typeof input.nozzleTemp !== 'number' || !Number.isFinite(input.nozzleTemp) || input.nozzleTemp < 0 || input.nozzleTemp > 500)
        throw new ApiError(400, 'Temperatura do bico inválida.')
      nozzleTemp = input.nozzleTemp
    }

    let bedTemp = job.bed_temp
    if (input.bedTemp !== undefined) {
      if (typeof input.bedTemp !== 'number' || !Number.isFinite(input.bedTemp) || input.bedTemp < 0 || input.bedTemp > 200)
        throw new ApiError(400, 'Temperatura da mesa inválida.')
      bedTemp = input.bedTemp
    }

    let verifyStatus = job.verify_status
    if (input.verifyStatus !== undefined) {
      if (!verifyStatuses.includes(input.verifyStatus)) throw new ApiError(400, 'Status de verificação inválido.')
      verifyStatus = input.verifyStatus
    }

    // Status-driven defaults, same ones createJob/moveJob rely on, only
    // filled when the field is still empty.
    if (status === 'PRODUCING') {
      if (progress == null) progress = 0
      if (elapsedMinutes == null) elapsedMinutes = 0
      if (nozzleTemp == null) nozzleTemp = defaultNozzleTemp
      if (bedTemp == null) bedTemp = defaultBedTemp
    }
    if (status === 'VERIFY' && verifyStatus == null) verifyStatus = 'INSPECAO_PENDENTE'

    db.prepare(
      'UPDATE print_jobs SET file_name = ?, printer_id = ?, status = ?, duration_minutes = ?, filament = ?, weight_grams = ?, ' +
      'priority = ?, progress = ?, elapsed_minutes = ?, nozzle_temp = ?, bed_temp = ?, verify_status = ? WHERE id = ?'
    ).run(fileName, printerId, status, durationMinutes, filament, weight, priority, progress, elapsedMinutes, nozzleTemp, bedTemp, verifyStatus, id)

    if (reschedule) {
      // Impressora ou duração mudou: descarta a reserva antiga e recalcula
      // com o estado atual do banco, nunca confiando em sugestão do navegador.
      db.prepare('DELETE FROM timeline_blocks WHERE job_id = ?').run(id)
      if (printerId != null) {
        const blocks = db.prepare('SELECT * FROM timeline_blocks WHERE printer_id = ? ORDER BY start_minute').all(printerId)
        const slot = bestSlot(blocks, durationMinutes)
        if (slot) db.prepare('INSERT INTO timeline_blocks (id, printer_id, job_id, label, start_minute, end_minute, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(randomUUID(), printerId, id, fileName, slot.start, slot.end, colors[blocks.length % colors.length])
      }
    } else if (input.fileName !== undefined) {
      // Mantém o rótulo da reserva existente sincronizado com o novo nome.
      db.prepare('UPDATE timeline_blocks SET label = ? WHERE job_id = ?').run(fileName, id)
    }

    const dashboard = getDashboard(db)
    db.exec('COMMIT')
    return dashboard
  } catch (error) { db.exec('ROLLBACK'); throw error }
}

export function moveJob(db, id, status) {
  return updateJob(db, id, { status })
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
