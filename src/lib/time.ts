export function formatHourDecimal(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hoursAndMinutesToDecimal(hours: number, minutes: number): number {
  return hours + minutes / 60
}

/**
 * Parses a "04h 45m" / "02h 10m decorridos" style label back into its
 * hours and minutes, for pre-filling an edit form. Returns zeros when the
 * label doesn't match (e.g. the field was never set).
 */
export function parseDurationLabel(label: string | undefined): { hours: number; minutes: number } {
  const match = label?.match(/(\d+)h\s*(\d+)m/)
  if (!match) return { hours: 0, minutes: 0 }
  return { hours: Number(match[1]), minutes: Number(match[2]) }
}

export function parseWeightLabel(label: string | undefined): number | '' {
  const match = label?.match(/(\d+)/)
  return match ? Number(match[1]) : ''
}
