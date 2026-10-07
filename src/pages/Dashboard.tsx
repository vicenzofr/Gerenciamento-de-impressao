import { useEffect, useRef, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { QueueBoard } from '@/components/queue/QueueBoard'
import { NewPrintModal } from '@/components/queue/NewPrintModal'
import { Timeline } from '@/components/timeline/Timeline'
import { addPrint, loadDashboard, moveJob, removePrint } from '@/lib/api'
import type { DashboardData, JobStatus, NewPrintInput } from '@/types'

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const mutationPending = useRef(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loadDashboard(controller.signal)
      .then((next) => { if (!controller.signal.aborted) setData(next) })
      .catch((cause: Error) => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])

  async function handleNewPrint(input: NewPrintInput) {
    if (mutationPending.current) return
    mutationPending.current = true
    setSaving(true)
    setError(null)
    try {
      setData(await addPrint(input))
      setIsModalOpen(false)
    } finally {
      mutationPending.current = false
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (mutationPending.current) return
    mutationPending.current = true
    setSaving(true)
    setError(null)
    try { setData(await removePrint(id)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível remover o trabalho.') }
    finally { mutationPending.current = false; setSaving(false) }
  }

  async function handleMove(id: string, status: JobStatus) {
    if (mutationPending.current) return
    mutationPending.current = true
    setSaving(true)
    setError(null)
    try { setData(await moveJob(id, status)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível mover o trabalho.') }
    finally { mutationPending.current = false; setSaving(false) }
  }

  return (
    <div className="min-h-svh bg-zinc-950">
      <Header printersOnline={data?.printersOnline ?? 0} />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-6">
        {loading && <p role="status" className="text-sm text-zinc-400">Carregando trabalhos…</p>}
        {error && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p>{error}</p>
            {!data && <button type="button" disabled={loading} onClick={() => setReload((value) => value + 1)} className="shrink-0 underline">Tentar novamente</button>}
          </div>
        )}
        {data && <>
          {saving && <p role="status" className="text-sm text-zinc-400">Salvando alterações…</p>}
          <QueueBoard
            queuedJobs={data.queuedJobs}
            producingJobs={data.producingJobs}
            verifyJobs={data.verifyJobs}
            onNewPrint={() => setIsModalOpen(true)}
            onDeleteQueued={handleDelete}
            onDeleteProducing={handleDelete}
            onDeleteVerify={handleDelete}
            onMove={handleMove}
            disabled={saving}
          />
          <Timeline printers={data.printerTimelines} />
        </>}
      </main>
      {data && <NewPrintModal
        open={isModalOpen}
        printers={data.printerTimelines}
        onClose={() => { if (!mutationPending.current) setIsModalOpen(false) }}
        onSubmit={handleNewPrint}
        saving={saving}
      />}
    </div>
  )
}
