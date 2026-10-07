import { PlusIcon } from '@/components/icons'
import { QueueColumn } from './QueueColumn'
import { QueuedJobCard } from './QueuedJobCard'
import { ProducingJobCard } from './ProducingJobCard'
import { VerifyJobCard } from './VerifyJobCard'
import type { JobStatus, ProducingJob, QueuedJob, VerifyJob } from '@/types'

interface QueueBoardProps {
  disabled?: boolean
  queuedJobs: QueuedJob[]
  producingJobs: ProducingJob[]
  verifyJobs: VerifyJob[]
  onNewPrint?: () => void
  onDeleteQueued?: (id: string) => void
  onDeleteProducing?: (id: string) => void
  onDeleteVerify?: (id: string) => void
  onMove?: (id: string, status: JobStatus) => void
  onEditQueued?: (job: QueuedJob) => void
  onEditProducing?: (job: ProducingJob) => void
  onEditVerify?: (job: VerifyJob) => void
}

export function QueueBoard({
  queuedJobs,
  producingJobs,
  verifyJobs,
  onNewPrint,
  disabled = false,
  onDeleteQueued,
  onDeleteProducing,
  onDeleteVerify,
  onMove,
  onEditQueued,
  onEditProducing,
  onEditVerify,
}: QueueBoardProps) {
  return (
    <section>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Gerenciador de Filas</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Distribuição de trabalhos e monitoramento de estados físicos das peças · arraste os
            cards entre as colunas para mudar a etapa
          </p>
        </div>
        <button
          type="button"
          onClick={onNewPrint}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <PlusIcon className="h-4 w-4" />
          Nova Impressão
        </button>
      </div>

      <div inert={disabled} aria-busy={disabled} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueColumn
          title="Na Fila"
          count={queuedJobs.length}
          dot="blue"
          status="QUEUED"
          onDropJob={onMove ? (id) => onMove(id, 'QUEUED') : undefined}
        >
          {queuedJobs.map((job) => (
            <QueuedJobCard
              key={job.id}
              job={job}
              onDelete={onDeleteQueued ? () => onDeleteQueued(job.id) : undefined}
              onEdit={onEditQueued ? () => onEditQueued(job) : undefined}
            />
          ))}
        </QueueColumn>

        <QueueColumn
          title="Em Produção"
          count={producingJobs.length}
          dot="orange"
          status="PRODUCING"
          onDropJob={onMove ? (id) => onMove(id, 'PRODUCING') : undefined}
        >
          {producingJobs.map((job) => (
            <ProducingJobCard
              key={job.id}
              job={job}
              onDelete={onDeleteProducing ? () => onDeleteProducing(job.id) : undefined}
              onEdit={onEditProducing ? () => onEditProducing(job) : undefined}
            />
          ))}
        </QueueColumn>

        <QueueColumn
          title="Verificar (Controle)"
          count={verifyJobs.length}
          dot="amber"
          status="VERIFY"
          onDropJob={onMove ? (id) => onMove(id, 'VERIFY') : undefined}
        >
          {verifyJobs.map((job) => (
            <VerifyJobCard
              key={job.id}
              job={job}
              onDelete={onDeleteVerify ? () => onDeleteVerify(job.id) : undefined}
              onEdit={onEditVerify ? () => onEditVerify(job) : undefined}
            />
          ))}
        </QueueColumn>
      </div>
    </section>
  )
}
