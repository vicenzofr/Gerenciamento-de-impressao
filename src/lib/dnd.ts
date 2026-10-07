import type { DragEvent } from 'react'
import type { JobStatus } from '@/types'

const JOB_DRAG_TYPE = 'application/x-print-job'

interface DragPayload {
  id: string
  from: JobStatus
}

/**
 * Props to spread onto a draggable job card. Carries both the job id and
 * its current status so a drop target can skip the move when a card is
 * dropped back into the column it came from.
 */
export function dragJobProps(id: string, from: JobStatus) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      const payload: DragPayload = { id, from }
      e.dataTransfer.setData(JOB_DRAG_TYPE, JSON.stringify(payload))
      e.dataTransfer.effectAllowed = 'move'
      e.currentTarget.style.opacity = '0.5'
    },
    onDragEnd: (e: DragEvent<HTMLElement>) => {
      e.currentTarget.style.opacity = '1'
    },
  }
}

export function isJobDrag(e: DragEvent): boolean {
  return e.dataTransfer.types.includes(JOB_DRAG_TYPE)
}

export function readJobDrag(e: DragEvent): DragPayload | null {
  const raw = e.dataTransfer.getData(JOB_DRAG_TYPE)
  if (!raw) return null
  try {
    const payload = JSON.parse(raw) as DragPayload
    return payload.id ? payload : null
  } catch {
    return null
  }
}
