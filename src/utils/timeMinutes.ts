/** Shared 24h time helpers for listing availability (15-minute grid). */

export const TIME_STEP_MINUTES = 15
const DAY_MINUTES = 24 * 60

export function hhmmToMinutes(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return 0
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return h * 60 + min
}

export function minutesToHHmm(total: number): string {
  const t = ((total % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
  const h = Math.floor(t / 60)
  const m = t % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function snapMinutesToStep(total: number, step: number = TIME_STEP_MINUTES): number {
  const s = Math.round(total / step) * step
  return ((s % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
}

export function snapHHmm(hhmm: string, step: number = TIME_STEP_MINUTES): string {
  return minutesToHHmm(snapMinutesToStep(hhmmToMinutes(hhmm), step))
}
