export function formatHourDecimal(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hoursAndMinutesToDecimal(hours: number, minutes: number): number {
  return hours + minutes / 60
}
