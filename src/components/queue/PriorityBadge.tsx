import type { Priority } from '@/types'

const STYLES: Record<Priority, string> = {
  ALTA: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  MEDIA: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  AGENDADA: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
}

const LABELS: Record<Priority, string> = {
  ALTA: 'ALTA',
  MEDIA: 'MÉDIA',
  AGENDADA: 'AGENDADA',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${STYLES[priority]}`}
    >
      {LABELS[priority]}
    </span>
  )
}
