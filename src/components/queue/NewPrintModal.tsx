import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { SparklesIcon } from '@/components/icons'
import { findBestSlot } from '@/lib/scheduling'
import { formatHourDecimal, hoursAndMinutesToDecimal } from '@/lib/time'
import type { NewPrintInput, PrinterTimeline } from '@/types'

interface NewPrintModalProps {
  open: boolean
  printers: PrinterTimeline[]
  onClose: () => void
  onSubmit: (input: NewPrintInput) => void
}

export function NewPrintModal({ open, printers, onClose, onSubmit }: NewPrintModalProps) {
  const [fileName, setFileName] = useState('')
  const [printer, setPrinter] = useState(printers[0]?.name ?? '')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFileName('')
      setPrinter(printers[0]?.name ?? '')
      setHours('')
      setMinutes('')
      setError(null)
    }
  }, [open, printers])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const durationHours = hoursAndMinutesToDecimal(Number(hours) || 0, Number(minutes) || 0)

  const suggestedSlot = useMemo(() => {
    if (durationHours <= 0) return null
    const selected = printers.find((p) => p.name === printer)
    if (!selected) return null
    return findBestSlot(selected.blocks, durationHours)
  }, [printers, printer, durationHours])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const h = Number(hours) || 0
    const m = Number(minutes) || 0

    if (!fileName.trim()) {
      setError('Informe o nome do arquivo.')
      return
    }
    if (!printer) {
      setError('Selecione uma impressora.')
      return
    }
    if (h === 0 && m === 0) {
      setError('Informe o tempo estimado de impressão.')
      return
    }

    onSubmit({ fileName: fileName.trim(), printer, hours: h, minutes: m, suggestedSlot })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Nova Impressão</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Adicione um novo trabalho à fila de impressão
        </p>

        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fileName" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Nome do arquivo
            </label>
            <input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="ex: suporte_camera.gcode"
              autoFocus
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <div>
            <label htmlFor="printer" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Impressora
            </label>
            <select
              id="printer"
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {printers.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">
              Tempo estimado
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={99}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                aria-label="Horas"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <span className="text-sm text-zinc-500">h</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                aria-label="Minutos"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <span className="text-sm text-zinc-500">min</span>
            </div>
          </div>

          {durationHours > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-sm">
              <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              {suggestedSlot ? (
                <p className="text-zinc-300">
                  <span className="font-medium text-blue-400">Melhor horário encontrado:</span>{' '}
                  {formatHourDecimal(suggestedSlot.startHour)} –{' '}
                  {formatHourDecimal(suggestedSlot.endHour)} em {printer}, com base nos espaços
                  livres dessa impressora.
                </p>
              ) : (
                <p className="text-zinc-300">
                  Nenhum espaço livre suficiente hoje em <span className="font-medium">{printer}</span>.
                  O item será adicionado só à fila, sem horário na linha do tempo.
                </p>
              )}
            </div>
          ) : null}

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              Adicionar à Fila
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
