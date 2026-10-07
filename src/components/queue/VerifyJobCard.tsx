import { CheckCircleIcon } from '@/components/icons'
import { VerifyStatusBadge } from './VerifyStatusBadge'
import { DeleteButton } from './DeleteButton'
import { dragJobProps } from '@/lib/dnd'
import type { VerifyJob } from '@/types'

export function VerifyJobCard({
  job,
  onDelete,
}: {
  job: VerifyJob
  onDelete?: () => void
}) {
  return (
    <div
      {...dragJobProps(job.id, 'VERIFY')}
      className="relative cursor-grab rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 active:cursor-grabbing"
    >
      {onDelete ? (
        <DeleteButton onClick={onDelete} label={`Remover ${job.fileName}`} itemName={job.fileName} />
      ) : null}

      <p className="truncate pr-6 text-sm font-medium text-zinc-100">{job.fileName}</p>
      <p className="mt-0.5 text-xs text-zinc-500">Impressora: {job.printerName}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-zinc-400">
          <CheckCircleIcon className="h-3.5 w-3.5" />
          Tempo: {job.totalTime}
        </span>
        <VerifyStatusBadge status={job.verifyStatus} />
      </div>
    </div>
  )
}
