import { useState, type DragEvent, type ReactNode } from 'react'
import { isJobDrag, readJobDrag } from '@/lib/dnd'
import type { JobStatus } from '@/types'

const DOT_COLOR = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-400',
} as const

interface QueueColumnProps {
  title: string
  count: number
  dot: keyof typeof DOT_COLOR
  status: JobStatus
  onDropJob?: (jobId: string) => void
  children: ReactNode
}

export function QueueColumn({ title, count, dot, status, onDropJob, children }: QueueColumnProps) {
  const [isOver, setIsOver] = useState(false)

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (!onDropJob || !isJobDrag(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    if (!onDropJob || !isJobDrag(e)) return
    setIsOver(true)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    setIsOver(false)
    if (!onDropJob) return
    const payload = readJobDrag(e)
    if (!payload || payload.from === status) return
    e.preventDefault()
    onDropJob(payload.id)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={`rounded-xl border p-4 transition-colors ${
        isOver ? 'border-orange-500/70 bg-orange-500/5' : 'border-zinc-800 bg-zinc-900/40'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${DOT_COLOR[dot]}`} />
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-800 px-1.5 text-[11px] font-medium text-zinc-300">
          {count}
        </span>
      </div>
      <div className="flex min-h-16 flex-col gap-2">{children}</div>
    </div>
  )
}
