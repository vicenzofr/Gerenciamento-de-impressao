import { BLOCK_COLORS, formatHourDecimal } from './timelineColors'
import type { TimelineBlock } from '@/types'

const HOUR_WIDTH = 72

export function TimelineJobBlock({ block }: { block: TimelineBlock }) {
  const colors = BLOCK_COLORS[block.color]
  const left = block.startHour * HOUR_WIDTH
  const width = (block.endHour - block.startHour) * HOUR_WIDTH

  return (
    <div
      className={`absolute top-2 bottom-2 z-10 overflow-hidden rounded-md border px-2 py-1.5 ${colors.bg} ${colors.border}`}
      style={{ left, width: Math.max(width, 48) }}
      title={block.fileName}
    >
      <p className="truncate text-[11px] font-medium text-zinc-100">{block.fileName}</p>
      <p className={`truncate text-[10px] font-medium ${colors.text}`}>
        {formatHourDecimal(block.startHour)} - {formatHourDecimal(block.endHour)}
        {block.autoScheduled ? ' (Agendamento Automático > 6h)' : ''}
      </p>
    </div>
  )
}

export { HOUR_WIDTH }
