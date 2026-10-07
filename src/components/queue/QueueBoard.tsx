import { PlusIcon } from '@/components/icons'
import { QueueColumn } from './QueueColumn'
import { QueuedJobCard } from './QueuedJobCard'
import { ProducingJobCard } from './ProducingJobCard'
import { VerifyJobCard } from './VerifyJobCard'
import type { ProducingJob, QueuedJob, VerifyJob } from '@/types'

interface QueueBoardProps {
  queuedJobs: QueuedJob[]
  producingJobs: ProducingJob[]
  verifyJobs: VerifyJob[]
  onNewPrint?: () => void
  onDeleteQueued?: (id: string) => void
  onDeleteProducing?: (id: string) => void
  onDeleteVerify?: (id: string) => void
}

export function QueueBoard({
  queuedJobs,
  producingJobs,
  verifyJobs,
  onNewPrint,
  onDeleteQueued,
  onDeleteProducing,
  onDeleteVerify,
}: QueueBoardProps) {
  return (
    <section>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Gerenciador de Filas</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Distribuição de trabalhos e monitoramento de estados físicos das peças
          </p>
        </div>
        <button
          type="button"
          onClick={onNewPrint}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <PlusIcon className="h-4 w-4" />
          Nova Impressão
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueColumn title="Na Fila" count={queuedJobs.length} dot="blue">
          {queuedJobs.map((job) => (
            <QueuedJobCard
              key={job.id}
              job={job}
              onDelete={onDeleteQueued ? () => onDeleteQueued(job.id) : undefined}
            />
          ))}
        </QueueColumn>

        <QueueColumn title="Em Produção" count={producingJobs.length} dot="orange">
          {producingJobs.map((job) => (
            <ProducingJobCard
              key={job.id}
              job={job}
              onDelete={onDeleteProducing ? () => onDeleteProducing(job.id) : undefined}
            />
          ))}
        </QueueColumn>

        <QueueColumn title="Verificar (Controle)" count={verifyJobs.length} dot="amber">
          {verifyJobs.map((job) => (
            <VerifyJobCard
              key={job.id}
              job={job}
              onDelete={onDeleteVerify ? () => onDeleteVerify(job.id) : undefined}
            />
          ))}
        </QueueColumn>
      </div>
    </section>
  )
}
