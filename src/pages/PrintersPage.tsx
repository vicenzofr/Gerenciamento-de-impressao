import { useEffect, useState } from 'react'
import { PlusIcon } from '@/components/icons'
import { AddPrinterModal } from '@/components/printers/AddPrinterModal'
import { PrinterCard } from '@/components/printers/PrinterCard'
import { addPrinter, listPrinters } from '@/lib/api'
import type { NewPrinterInput, Printer } from '@/types'

export function PrintersPage({ onPrinterAdded }: { onPrinterAdded?: () => void }) {
  const [printers, setPrinters] = useState<Printer[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listPrinters()
      .then((next) => {
        if (!cancelled) setPrinters(next)
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAdd(input: NewPrinterInput) {
    setSaving(true)
    try {
      const created = await addPrinter(input)
      setPrinters((prev) => (prev ? [...prev, created] : [created]))
      setIsModalOpen(false)
      onPrinterAdded?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Impressoras</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Cadastre as impressoras físicas disponíveis para agendamento
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <PlusIcon className="h-4 w-4" />
          Adicionar Impressora
        </button>
      </div>

      {loading ? <p role="status" className="text-sm text-zinc-400">Carregando impressoras…</p> : null}
      {error ? (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {printers ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {printers.map((p) => (
            <PrinterCard key={p.id} printer={p} />
          ))}
        </div>
      ) : null}

      <AddPrinterModal
        open={isModalOpen}
        existingNames={printers?.map((p) => p.name) ?? []}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAdd}
        saving={saving}
      />
    </section>
  )
}
