import { ClockIcon, WeightIcon } from '@/components/icons'
import { PriorityBadge } from './PriorityBadge'
import { DeleteButton } from './DeleteButton'
import { dragJobProps } from '@/lib/dnd'
import type { QueuedJob } from '@/types'

export function QueuedJobCard({
  job,
  onDelete,
}: {
  job: QueuedJob
  onDelete?: () => void
}) {
  return (
    <div
      {...dragJobProps(job.id, 'QUEUED')}
      className="relative cursor-grab rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 active:cursor-grabbing"
    >
      {onDelete ? (
        <DeleteButton onClick={onDelete} label={`Remover ${job.fileName}`} itemName={job.fileName} />
      ) : null}

      <p className="truncate pr-6 text-sm font-medium text-zinc-100">{job.fileName}</p>
      {job.filament ? (
        <p className="mt-0.5 text-xs text-zinc-500">Filamento: {job.filament}</p>
      ) : job.printer ? (
        <p className="mt-0.5 text-xs text-zinc-500">Impressora: {job.printer}</p>
      ) : null}
      {job.scheduledSlot ? (
        <p className="mt-0.5 text-xs text-zinc-500">Horário: {job.scheduledSlot}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {job.estimatedTime}
          </span>
          {job.weight ? (
            <span className="flex items-center gap-1">
              <WeightIcon className="h-3.5 w-3.5" />
              {job.weight}
            </span>
          ) : null}
        </div>
        <PriorityBadge priority={job.priority} />
      </div>
    </div>
  )
}
