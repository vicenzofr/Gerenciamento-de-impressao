import type { TimeSlot, TimelineBlock } from '@/types'

const DAY_START = 0
const DAY_END = 24

/**
 * Returns the free gaps in a printer's day, sorted by start time.
 */
export function findFreeGaps(blocks: TimelineBlock[]): TimeSlot[] {
  const sorted = [...blocks].sort((a, b) => a.startHour - b.startHour)
  const gaps: TimeSlot[] = []
  let cursor = DAY_START

  for (const block of sorted) {
    if (block.startHour > cursor) {
      gaps.push({ startHour: cursor, endHour: block.startHour })
    }
    cursor = Math.max(cursor, block.endHour)
  }

  if (cursor < DAY_END) {
    gaps.push({ startHour: cursor, endHour: DAY_END })
  }

  return gaps
}

/**
 * Best-fit slot for a job of `durationHours`: the free gap that fits the
 * job with the least amount of leftover time (ties go to the earliest).
 * Returns null when no gap in the day is big enough.
 */
export function findBestSlot(
  blocks: TimelineBlock[],
  durationHours: number,
): TimeSlot | null {
  if (durationHours <= 0) return null

  const candidates = findFreeGaps(blocks)
    .filter((gap) => gap.endHour - gap.startHour >= durationHours)
    .sort((a, b) => {
      const leftoverA = a.endHour - a.startHour - durationHours
      const leftoverB = b.endHour - b.startHour - durationHours
      return leftoverA - leftoverB || a.startHour - b.startHour
    })

  const best = candidates[0]
  if (!best) return null

  return { startHour: best.startHour, endHour: best.startHour + durationHours }
}
