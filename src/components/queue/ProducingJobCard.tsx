import { PrinterIcon } from '@/components/icons'
import { LiveBadge } from '@/components/LiveBadge'
import { DeleteButton } from './DeleteButton'
import { EditButton } from './EditButton'
import { dragJobProps } from '@/lib/dnd'
import type { ProducingJob } from '@/types'

export function ProducingJobCard({
  job,
  onDelete,
  onEdit,
}: {
  job: ProducingJob
  onDelete?: () => void
  onEdit?: () => void
}) {
  return (
    <div
      {...dragJobProps(job.id, 'PRODUCING')}
      className="animate-live-glow relative cursor-grab rounded-lg border border-orange-500/30 bg-zinc-900/60 p-3 active:cursor-grabbing"
    >
      {onEdit ? <EditButton onClick={onEdit} label={`Editar ${job.fileName}`} /> : null}
      {onDelete ? (
        <DeleteButton onClick={onDelete} label={`Remover ${job.fileName}`} itemName={job.fileName} />
      ) : null}

      <p className="truncate pr-14 text-sm font-medium text-zinc-100">{job.fileName}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-orange-400">
        <PrinterIcon className="h-3.5 w-3.5" />
        {job.printerName}
        <LiveBadge />
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <span className="font-medium text-zinc-200">{job.progress}%</span>
        <span>{job.elapsedTime}</span>
      </div>
      <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="relative h-full overflow-hidden rounded-full bg-orange-500 transition-[width] duration-700 ease-linear"
          style={{ width: `${job.progress}%` }}
        >
          <div className="animate-shimmer-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
        <span>Bico: {job.nozzleTemp}°C</span>
        <span>Mesa: {job.bedTemp}°C</span>
      </div>
    </div>
  )
}
