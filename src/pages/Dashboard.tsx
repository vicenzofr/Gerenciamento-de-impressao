import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { QueueBoard } from '@/components/queue/QueueBoard'
import { NewPrintModal } from '@/components/queue/NewPrintModal'
import { Timeline } from '@/components/timeline/Timeline'
import { BLOCK_COLOR_ORDER } from '@/components/timeline/timelineColors'
import { formatHourDecimal } from '@/lib/time'
import {
  printerTimelines as initialPrinterTimelines,
  printersOnline,
  producingJobs as initialProducingJobs,
  queuedJobs as initialQueuedJobs,
  verifyJobs as initialVerifyJobs,
} from '@/data/mockData'
import type {
  NewPrintInput,
  PrinterTimeline,
  ProducingJob,
  QueuedJob,
  VerifyJob,
} from '@/types'

export function Dashboard() {
  const [queuedJobs, setQueuedJobs] = useState<QueuedJob[]>(initialQueuedJobs)
  const [producingJobs, setProducingJobs] = useState<ProducingJob[]>(initialProducingJobs)
  const [verifyJobs, setVerifyJobs] = useState<VerifyJob[]>(initialVerifyJobs)
  const [printerTimelines, setPrinterTimelines] =
    useState<PrinterTimeline[]>(initialPrinterTimelines)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleNewPrint({ fileName, printer, hours, minutes, suggestedSlot }: NewPrintInput) {
    const id = crypto.randomUUID()
    const estimatedTime = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`

    const newJob: QueuedJob = {
      id,
      fileName,
      printer,
      estimatedTime,
      scheduledSlot: suggestedSlot
        ? `${formatHourDecimal(suggestedSlot.startHour)} - ${formatHourDecimal(suggestedSlot.endHour)}`
        : undefined,
      priority: hours >= 6 ? 'AGENDADA' : 'MEDIA',
    }

    setQueuedJobs((prev) => [...prev, newJob])

    if (suggestedSlot) {
      setPrinterTimelines((prev) =>
        prev.map((p) =>
          p.name === printer
            ? {
                ...p,
                blocks: [
                  ...p.blocks,
                  {
                    id,
                    fileName,
                    startHour: suggestedSlot.startHour,
                    endHour: suggestedSlot.endHour,
                    color: BLOCK_COLOR_ORDER[p.blocks.length % BLOCK_COLOR_ORDER.length],
                  },
                ],
              }
            : p,
        ),
      )
    }

    setIsModalOpen(false)
  }

  function handleDeleteQueued(id: string) {
    setQueuedJobs((prev) => prev.filter((job) => job.id !== id))
    setPrinterTimelines((prev) =>
      prev.map((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) })),
    )
  }

  function handleDeleteProducing(id: string) {
    setProducingJobs((prev) => prev.filter((job) => job.id !== id))
  }

  function handleDeleteVerify(id: string) {
    setVerifyJobs((prev) => prev.filter((job) => job.id !== id))
  }

  return (
    <div className="min-h-svh bg-zinc-950">
      <Header printersOnline={printersOnline} />

      <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-6">
        <QueueBoard
          queuedJobs={queuedJobs}
          producingJobs={producingJobs}
          verifyJobs={verifyJobs}
          onNewPrint={() => setIsModalOpen(true)}
          onDeleteQueued={handleDeleteQueued}
          onDeleteProducing={handleDeleteProducing}
          onDeleteVerify={handleDeleteVerify}
        />
        <Timeline printers={printerTimelines} />
      </main>

      <NewPrintModal
        open={isModalOpen}
        printers={printerTimelines}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewPrint}
      />
    </div>
  )
}
