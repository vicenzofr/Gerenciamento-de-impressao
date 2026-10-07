export type Priority = 'ALTA' | 'MEDIA' | 'AGENDADA'

export type JobStatus = 'QUEUED' | 'PRODUCING' | 'VERIFY'

export interface QueuedJob {
  id: string
  fileName: string
  filament?: string
  printer?: string
  estimatedTime: string
  scheduledSlot?: string
  weight?: string
  priority: Priority
}

export interface NewPrintInput {
  fileName: string
  printer: string
  hours: number
  minutes: number
  suggestedSlot: TimeSlot | null
}

export interface TimeSlot {
  startHour: number
  endHour: number
}

export interface ProducingJob {
  id: string
  fileName: string
  printerName: string
  progress: number
  elapsedTime: string
  nozzleTemp: number
  bedTemp: number
}

export type VerifyStatus = 'INSPECAO_PENDENTE' | 'RETIRADA_PRONTA'

export interface VerifyJob {
  id: string
  fileName: string
  printerName: string
  totalTime: string
  verifyStatus: VerifyStatus
}

export type TimelineBlockColor = 'rust' | 'navy' | 'teal' | 'green' | 'amber'

export interface TimelineBlock {
  id: string
  fileName: string
  startHour: number
  endHour: number
  autoScheduled?: boolean
  color: TimelineBlockColor
}

export interface PrinterTimeline {
  id: string
  name: string
  spec: string
  blocks: TimelineBlock[]
}

export interface DashboardData {
  printersOnline: number
  queuedJobs: QueuedJob[]
  producingJobs: ProducingJob[]
  verifyJobs: VerifyJob[]
  printerTimelines: PrinterTimeline[]
}

/** Partial update sent to PATCH /api/jobs/:id. Only set fields are changed. */
export interface JobEditInput {
  fileName?: string
  printer?: string
  hours?: number
  minutes?: number
  filament?: string | null
  weight?: number | null
  priority?: Priority
  progress?: number
  elapsedHours?: number
  elapsedMinutes?: number
  nozzleTemp?: number
  bedTemp?: number
  verifyStatus?: VerifyStatus
}
