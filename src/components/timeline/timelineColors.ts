import type { TimelineBlockColor } from '@/types'

export const BLOCK_COLORS: Record<
  TimelineBlockColor,
  { bg: string; border: string; text: string }
> = {
  rust: { bg: 'bg-orange-950/80', border: 'border-orange-700/70', text: 'text-orange-400' },
  navy: { bg: 'bg-blue-950/80', border: 'border-blue-700/70', text: 'text-blue-400' },
  teal: { bg: 'bg-teal-950/80', border: 'border-teal-700/70', text: 'text-teal-400' },
  green: { bg: 'bg-emerald-950/80', border: 'border-emerald-700/70', text: 'text-emerald-400' },
  amber: { bg: 'bg-amber-950/80', border: 'border-amber-600/70', text: 'text-amber-400' },
}

export const BLOCK_COLOR_ORDER: TimelineBlockColor[] = [
  'navy',
  'teal',
  'rust',
  'green',
  'amber',
]

export { formatHourDecimal } from '@/lib/time'
