import { useEffect, useMemo, useRef, useState } from 'react'
import { Header, type DashboardTab } from '@/components/layout/Header'
import { QueueBoard } from '@/components/queue/QueueBoard'
import { NewPrintModal } from '@/components/queue/NewPrintModal'
import { EditJobModal, type EditTarget } from '@/components/queue/EditJobModal'
import { Timeline } from '@/components/timeline/Timeline'
import { NotificationStack, type PrintCompleteNotification } from '@/components/notifications/NotificationStack'
import { PrintersPage } from '@/pages/PrintersPage'
import { addPrint, editJob, loadDashboard, moveJob, removePrint } from '@/lib/api'
import type { DashboardData, JobEditInput, JobStatus, NewPrintInput } from '@/types'

// Real time: 1 printed minute takes exactly 1 real minute. If a job has
// 2h left, its bar keeps loading live for 2h until it actually completes.
const MS_PER_PRINTED_MINUTE = 60000
const TICK_MS = 1000
const NOTIFICATION_LIFETIME_MS = 20000

interface ProgressTrack {
  startElapsedMinutes: number
  startTimestampMs: number
  durationMinutes: number
  printerName: string
  fileName: string
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('QUEUE')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preselectedPrinter, setPreselectedPrinter] = useState<string | undefined>(undefined)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [saving, setSaving] = useState(false)
  const mutationPending = useRef(false)
  const [reload, setReload] = useState(0)

  const [displayProgress, setDisplayProgress] = useState<Map<string, number>>(new Map())
  const [notifications, setNotifications] = useState<PrintCompleteNotification[]>([])
  const tracksRef = useRef<Map<string, ProgressTrack>>(new Map())
  const completingRef = useRef<Set<string>>(new Set())

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

  // Re-derive the live tracks whenever fresh data comes in. Untouched jobs
  // keep the exact same starting point (only the stopwatch's "now" moves),
  // so this never causes a visible jump — it only reconciles jobs whose
  // server-side progress actually changed (e.g. our own completion write).
  useEffect(() => {
    if (!data) return
    const now = Date.now()
    const next = new Map<string, ProgressTrack>()
    for (const job of data.producingJobs) {
      next.set(job.id, {
        startElapsedMinutes: job.elapsedMinutes,
        startTimestampMs: now,
        durationMinutes: job.durationMinutes,
        printerName: job.printerName,
        fileName: job.fileName,
      })
    }
    tracksRef.current = next
    for (const id of completingRef.current) {
      if (!next.has(id)) completingRef.current.delete(id)
    }
  }, [data])

  async function completeJob(id: string, printerName: string, fileName: string) {
    try {
      const next = await editJob(id, { progress: 100, status: 'VERIFY' })
      setData(next)
      const notificationId = crypto.randomUUID()
      setNotifications((prev) => [...prev, { id: notificationId, printerName, fileName }])
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      }, NOTIFICATION_LIFETIME_MS)
    } catch {
      completingRef.current.delete(id)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const updates = new Map<string, number>()
      for (const [id, track] of tracksRef.current) {
        const elapsedMinutes =
          track.startElapsedMinutes + (now - track.startTimestampMs) / MS_PER_PRINTED_MINUTE
        const pct = Math.min(100, (elapsedMinutes / track.durationMinutes) * 100)
        updates.set(id, pct)
        if (pct >= 100 && !completingRef.current.has(id) && !mutationPending.current) {
          completingRef.current.add(id)
          completeJob(id, track.printerName, track.fileName)
        }
      }
      setDisplayProgress(updates)
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const liveProgress = useMemo(() => {
    const map = new Map<string, number>()
    for (const job of data?.producingJobs ?? []) {
      map.set(job.id, displayProgress.get(job.id) ?? job.progress)
    }
    return map
  }, [data, displayProgress])

  const producingJobsWithLiveProgress = useMemo(() => {
    if (!data) return []
    return data.producingJobs.map((job) => {
      const live = liveProgress.get(job.id)
      return live === undefined ? job : { ...job, progress: Math.round(live) }
    })
  }, [data, liveProgress])

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

  async function handleEdit(id: string, input: JobEditInput) {
    if (mutationPending.current) return
    mutationPending.current = true
    setSaving(true)
    setError(null)
    try {
      setData(await editJob(id, input))
      setEditTarget(null)
    } finally {
      mutationPending.current = false
      setSaving(false)
    }
  }

  function openNewPrintModal(printer?: string) {
    setPreselectedPrinter(printer)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-svh bg-zinc-950">
      <Header
        printersOnline={data?.printersOnline ?? 0}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-6">
        {activeTab === 'QUEUE' ? (
          <>
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
                producingJobs={producingJobsWithLiveProgress}
                verifyJobs={data.verifyJobs}
                onNewPrint={() => openNewPrintModal()}
                onDeleteQueued={handleDelete}
                onDeleteProducing={handleDelete}
                onDeleteVerify={handleDelete}
                onMove={handleMove}
                onEditQueued={(job) => setEditTarget({ kind: 'QUEUED', job })}
                onEditProducing={(job) => setEditTarget({ kind: 'PRODUCING', job })}
                onEditVerify={(job) => setEditTarget({ kind: 'VERIFY', job })}
                disabled={saving}
              />
              <Timeline printers={data.printerTimelines} liveProgress={liveProgress} />
            </>}
          </>
        ) : (
          <PrintersPage onPrinterAdded={() => setReload((value) => value + 1)} />
        )}
      </main>
      {data && <NewPrintModal
        open={isModalOpen}
        printers={data.printerTimelines}
        preselectedPrinter={preselectedPrinter}
        onClose={() => { if (!mutationPending.current) setIsModalOpen(false) }}
        onSubmit={handleNewPrint}
        saving={saving}
      />}
      {data && <EditJobModal
        target={editTarget}
        printers={data.printerTimelines}
        onClose={() => { if (!mutationPending.current) setEditTarget(null) }}
        onSubmit={handleEdit}
        saving={saving}
      />}
      <NotificationStack
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onNewPrint={(printer) => openNewPrintModal(printer)}
      />
    </div>
  )
}
