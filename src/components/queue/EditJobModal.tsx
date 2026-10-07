import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { SparklesIcon } from '@/components/icons'
import { findBestSlot } from '@/lib/scheduling'
import { formatHourDecimal, hoursAndMinutesToDecimal, parseDurationLabel, parseWeightLabel } from '@/lib/time'
import type {
  JobEditInput,
  Priority,
  PrinterTimeline,
  ProducingJob,
  QueuedJob,
  VerifyJob,
  VerifyStatus,
} from '@/types'

export type EditTarget =
  | { kind: 'QUEUED'; job: QueuedJob }
  | { kind: 'PRODUCING'; job: ProducingJob }
  | { kind: 'VERIFY'; job: VerifyJob }

interface EditJobModalProps {
  target: EditTarget | null
  printers: PrinterTimeline[]
  onClose: () => void
  onSubmit: (id: string, input: JobEditInput) => Promise<void>
  saving: boolean
}

const inputClass =
  'w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50'
const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400'

export function EditJobModal({ target, printers, onClose, onSubmit, saving }: EditJobModalProps) {
  const [fileName, setFileName] = useState('')
  const [printer, setPrinter] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [filament, setFilament] = useState('')
  const [weight, setWeight] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIA')
  const [progress, setProgress] = useState('')
  const [elapsedHours, setElapsedHours] = useState('')
  const [elapsedMinutes, setElapsedMinutes] = useState('')
  const [nozzleTemp, setNozzleTemp] = useState('')
  const [bedTemp, setBedTemp] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('INSPECAO_PENDENTE')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!target) return
    setError(null)
    setFileName(target.job.fileName)

    if (target.kind === 'QUEUED') {
      const parsed = parseDurationLabel(target.job.estimatedTime)
      setPrinter(target.job.printer ?? '')
      setHours(String(parsed.hours))
      setMinutes(String(parsed.minutes))
      setFilament(target.job.filament ?? '')
      setWeight(String(parseWeightLabel(target.job.weight)))
      setPriority(target.job.priority)
    } else if (target.kind === 'PRODUCING') {
      const parsed = parseDurationLabel(target.job.elapsedTime)
      setPrinter(target.job.printerName)
      setProgress(String(target.job.progress))
      setElapsedHours(String(parsed.hours))
      setElapsedMinutes(String(parsed.minutes))
      setNozzleTemp(String(target.job.nozzleTemp))
      setBedTemp(String(target.job.bedTemp))
    } else {
      const parsed = parseDurationLabel(target.job.totalTime)
      setPrinter(target.job.printerName)
      setHours(String(parsed.hours))
      setMinutes(String(parsed.minutes))
      setVerifyStatus(target.job.verifyStatus)
    }
  }, [target])

  useEffect(() => {
    if (!target) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [target, onClose])

  const showsDuration = target?.kind === 'QUEUED' || target?.kind === 'VERIFY'
  const durationHours = showsDuration ? hoursAndMinutesToDecimal(Number(hours) || 0, Number(minutes) || 0) : 0

  // Live preview of where this job would land if saved with the current
  // printer/duration — only meaningful for the two kinds that expose a
  // duration. Backend always recomputes for real; this is informational.
  const suggestedSlot = useMemo(() => {
    if (!target || !showsDuration || durationHours <= 0 || !printer) return null
    const originalPrinter = target.kind === 'QUEUED' ? target.job.printer : target.job.printerName
    const originalDuration =
      target.kind === 'QUEUED'
        ? parseDurationLabel(target.job.estimatedTime)
        : target.kind === 'VERIFY'
          ? parseDurationLabel(target.job.totalTime)
          : { hours: 0, minutes: 0 }
    const unchanged =
      printer === originalPrinter && durationHours === hoursAndMinutesToDecimal(originalDuration.hours, originalDuration.minutes)
    if (unchanged) return null
    const selected = printers.find((p) => p.name === printer)
    if (!selected) return null
    const blocksExcludingSelf = selected.blocks.filter((b) => b.id !== target.job.id)
    return findBestSlot(blocksExcludingSelf, durationHours)
  }, [target, printers, printer, durationHours, showsDuration])

  if (!target) return null
  const { kind, job } = target

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    setError(null)

    if (!fileName.trim()) {
      setError('Informe o nome do arquivo.')
      return
    }

    const input: JobEditInput = { fileName: fileName.trim() }
    if (printer) input.printer = printer

    if (kind === 'QUEUED') {
      const h = Number(hours) || 0
      const m = Number(minutes) || 0
      if (h === 0 && m === 0) {
        setError('Informe um tempo estimado maior que zero.')
        return
      }
      input.hours = h
      input.minutes = m
      input.filament = filament.trim() || null
      input.weight = weight === '' ? null : Number(weight)
      input.priority = priority
    } else if (kind === 'PRODUCING') {
      const p = Number(progress)
      if (!Number.isInteger(p) || p < 0 || p > 100) {
        setError('Progresso deve ser um número inteiro entre 0 e 100.')
        return
      }
      input.progress = p
      input.elapsedHours = Number(elapsedHours) || 0
      input.elapsedMinutes = Number(elapsedMinutes) || 0
      input.nozzleTemp = Number(nozzleTemp)
      input.bedTemp = Number(bedTemp)
    } else {
      const h = Number(hours) || 0
      const m = Number(minutes) || 0
      if (h === 0 && m === 0) {
        setError('Informe um tempo total maior que zero.')
        return
      }
      input.hours = h
      input.minutes = m
      input.verifyStatus = verifyStatus
    }

    try {
      await onSubmit(job.id, input)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar as alterações.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Editar Impressão</h2>
        <p className="mt-0.5 truncate text-sm text-zinc-500">{job.fileName}</p>

        <form aria-busy={saving} className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="edit-fileName" className={labelClass}>
              Nome do arquivo
            </label>
            <input
              disabled={saving}
              id="edit-fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              maxLength={255}
              autoFocus
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="edit-printer" className={labelClass}>
              Impressora
            </label>
            <select
              disabled={saving}
              id="edit-printer"
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
              className={inputClass}
            >
              {!printer ? <option value="">Selecione uma impressora</option> : null}
              {printers.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {kind === 'QUEUED' ? (
            <>
              <div>
                <span className={labelClass}>Tempo estimado</span>
                <div className="flex items-center gap-2">
                  <input
                    disabled={saving}
                    type="number"
                    min={0}
                    max={99}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    aria-label="Horas"
                    className={inputClass}
                  />
                  <span className="text-sm text-zinc-500">h</span>
                  <input
                    disabled={saving}
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    aria-label="Minutos"
                    className={inputClass}
                  />
                  <span className="text-sm text-zinc-500">min</span>
                </div>
              </div>

              <div>
                <label htmlFor="edit-filament" className={labelClass}>
                  Filamento
                </label>
                <input
                  disabled={saving}
                  id="edit-filament"
                  type="text"
                  value={filament}
                  onChange={(e) => setFilament(e.target.value)}
                  placeholder="ex: PLA Premium"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-weight" className={labelClass}>
                    Peso (g)
                  </label>
                  <input
                    disabled={saving}
                    id="edit-weight"
                    type="number"
                    min={1}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-priority" className={labelClass}>
                    Prioridade
                  </label>
                  <select
                    disabled={saving}
                    id="edit-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className={inputClass}
                  >
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Média</option>
                    <option value="AGENDADA">Agendada</option>
                  </select>
                </div>
              </div>
            </>
          ) : null}

          {kind === 'PRODUCING' ? (
            <>
              <div>
                <label htmlFor="edit-progress" className={labelClass}>
                  Progresso (%)
                </label>
                <input
                  disabled={saving}
                  id="edit-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <span className={labelClass}>Tempo decorrido</span>
                <div className="flex items-center gap-2">
                  <input
                    disabled={saving}
                    type="number"
                    min={0}
                    max={99}
                    value={elapsedHours}
                    onChange={(e) => setElapsedHours(e.target.value)}
                    aria-label="Horas decorridas"
                    className={inputClass}
                  />
                  <span className="text-sm text-zinc-500">h</span>
                  <input
                    disabled={saving}
                    type="number"
                    min={0}
                    max={59}
                    value={elapsedMinutes}
                    onChange={(e) => setElapsedMinutes(e.target.value)}
                    aria-label="Minutos decorridos"
                    className={inputClass}
                  />
                  <span className="text-sm text-zinc-500">min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-nozzle" className={labelClass}>
                    Bico (°C)
                  </label>
                  <input
                    disabled={saving}
                    id="edit-nozzle"
                    type="number"
                    min={0}
                    max={500}
                    value={nozzleTemp}
                    onChange={(e) => setNozzleTemp(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-bed" className={labelClass}>
                    Mesa (°C)
                  </label>
                  <input
                    disabled={saving}
                    id="edit-bed"
                    type="number"
                    min={0}
                    max={200}
                    value={bedTemp}
                    onChange={(e) => setBedTemp(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          ) : null}

          {kind === 'VERIFY' ? (
            <>
              <div>
                <span className={labelClass}>Tempo total</span>
                <div className="flex items-center gap-2">
                  <input
                    disabled={saving}
                    type="number"
                    min={0}
                    max={99}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    aria-label="Horas"
                    className={inputClass}
                  />
                  <span className="text-sm text-zinc-500">h</span>
                  <input
                    disabled={saving}
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    aria-label="Minutos"
                    className={inputClass}
                  />
                  <span className="text-sm text-zinc-500">min</span>
                </div>
              </div>

              <div>
                <label htmlFor="edit-verify-status" className={labelClass}>
                  Status
                </label>
                <select
                  disabled={saving}
                  id="edit-verify-status"
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as VerifyStatus)}
                  className={inputClass}
                >
                  <option value="INSPECAO_PENDENTE">Inspeção Pendente</option>
                  <option value="RETIRADA_PRONTA">Retirada Pronta</option>
                </select>
              </div>
            </>
          ) : null}

          {suggestedSlot ? (
            <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-sm">
              <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <p className="text-zinc-300">
                <span className="font-medium text-blue-400">Novo horário sugerido:</span>{' '}
                {formatHourDecimal(suggestedSlot.startHour)} – {formatHourDecimal(suggestedSlot.endHour)} em{' '}
                {printer}.
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              disabled={saving}
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              type="submit"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
