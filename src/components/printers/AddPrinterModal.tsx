import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PRINTER_BRANDS, PRINTER_CATALOG } from '@/data/printerCatalog'
import type { NewPrinterInput } from '@/types'

interface AddPrinterModalProps {
  open: boolean
  existingNames: string[]
  onClose: () => void
  onSubmit: (input: NewPrinterInput) => Promise<void>
  saving: boolean
}

const inputClass =
  'w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50'
const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400'

export function AddPrinterModal({ open, existingNames, onClose, onSubmit, saving }: AddPrinterModalProps) {
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog')
  const [brand, setBrand] = useState(PRINTER_BRANDS[0] ?? '')
  const [modelIndex, setModelIndex] = useState(0)
  const [name, setName] = useState('')
  const [spec, setSpec] = useState('')
  const [error, setError] = useState<string | null>(null)

  const modelsForBrand = useMemo(() => PRINTER_CATALOG.filter((m) => m.brand === brand), [brand])

  useEffect(() => {
    if (!open) return
    setMode('catalog')
    setBrand(PRINTER_BRANDS[0] ?? '')
    setModelIndex(0)
    setError(null)
  }, [open])

  useEffect(() => {
    setModelIndex(0)
  }, [brand])

  useEffect(() => {
    if (mode !== 'catalog') return
    const selected = modelsForBrand[modelIndex]
    if (selected) {
      setName(`${selected.brand} ${selected.model}`)
      setSpec(selected.spec)
    }
  }, [mode, modelsForBrand, modelIndex])

  useEffect(() => {
    if (mode === 'custom') {
      setName('')
      setSpec('')
    }
  }, [mode])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    setError(null)

    const trimmedName = name.trim()
    const trimmedSpec = spec.trim()
    if (!trimmedName) {
      setError('Informe o nome da impressora.')
      return
    }
    if (!trimmedSpec) {
      setError('Informe as especificações da impressora.')
      return
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Já existe uma impressora com esse nome.')
      return
    }

    try {
      await onSubmit({ name: trimmedName, spec: trimmedSpec })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível adicionar a impressora.')
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
        <h2 className="text-lg font-semibold text-white">Adicionar Impressora</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Escolha um modelo do catálogo ou cadastre uma personalizada
        </p>

        <div className="mt-4 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-sm">
          <button
            type="button"
            disabled={saving}
            onClick={() => setMode('catalog')}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === 'catalog' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Catálogo
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => setMode('custom')}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === 'custom' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Personalizada
          </button>
        </div>

        <form aria-busy={saving} className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === 'catalog' ? (
            <>
              <div>
                <label htmlFor="brand" className={labelClass}>
                  Marca
                </label>
                <select
                  disabled={saving}
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={inputClass}
                >
                  {PRINTER_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="model" className={labelClass}>
                  Modelo
                </label>
                <select
                  disabled={saving}
                  id="model"
                  value={modelIndex}
                  onChange={(e) => setModelIndex(Number(e.target.value))}
                  className={inputClass}
                >
                  {modelsForBrand.map((m, i) => (
                    <option key={m.model} value={i}>
                      {m.model}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="printer-name" className={labelClass}>
              Nome
            </label>
            <input
              disabled={saving}
              id="printer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              placeholder="ex: Ender 3 V2 - Bancada 2"
              className={inputClass}
            />
            {mode === 'catalog' ? (
              <p className="mt-1 text-[11px] text-zinc-500">
                Pode renomear — útil se você tiver mais de uma unidade do mesmo modelo.
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="printer-spec" className={labelClass}>
              Especificações
            </label>
            <input
              disabled={saving}
              id="printer-spec"
              type="text"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              maxLength={255}
              placeholder="ex: FDM • 220x220x250mm"
              className={inputClass}
            />
          </div>

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
              {saving ? 'Salvando…' : 'Adicionar Impressora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
