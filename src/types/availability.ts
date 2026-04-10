import { DAY_CODES, type DayCode } from '../constants/weekdays'
import { snapHHmm } from '../utils/timeMinutes'

export type { DayCode }

export interface ListingAvailability {
  /** Empty = any day. */
  days: DayCode[]
  startTime: string
  endTime: string
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/

export function isValidTime(s: string): boolean {
  return TIME_RE.test(s.trim())
}

export function normalizeAvailability(raw: unknown): ListingAvailability | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const daysIn = Array.isArray(o.days) ? o.days : []
  const daySet = new Set<DayCode>()
  for (const d of daysIn) {
    if (typeof d === 'string' && DAY_CODES.includes(d as DayCode)) daySet.add(d as DayCode)
  }
  const days = DAY_CODES.filter((d) => daySet.has(d))
  const startTime = typeof o.startTime === 'string' ? o.startTime.trim() : '09:00'
  const endTime = typeof o.endTime === 'string' ? o.endTime.trim() : '17:00'
  const st = isValidTime(startTime) ? startTime : '09:00'
  const et = isValidTime(endTime) ? endTime : '17:00'
  return {
    days,
    startTime: snapHHmm(st),
    endTime: snapHHmm(et),
  }
}

export function defaultAvailability(): ListingAvailability {
  return { days: [], startTime: '09:00', endTime: '17:00' }
}

/** Human-readable line for cards and legacy `time` column. */
export function formatAvailabilitySummary(a: ListingAvailability): string {
  const dayPart = a.days.length === 0 ? 'Any day' : a.days.join(', ')
  return `${dayPart} · ${a.startTime}–${a.endTime}`
}

export function availabilityFromListing(item: {
  availability?: unknown
  time?: string | null
}): ListingAvailability {
  const n = normalizeAvailability(item.availability)
  if (n) return n
  return defaultAvailability()
}

/**
 * For search filters only: rows with no `availability` JSON are treated as flexible hours/days
 * so legacy listings are not excluded by time/day filters that assume 09:00–17:00.
 */
function availabilityForSearchMatch(item: {
  availability?: unknown
  time?: string | null
}): ListingAvailability {
  const n = normalizeAvailability(item.availability)
  if (n) return n
  return { days: [], startTime: '00:00', endTime: '23:59' }
}

export function parseTimeToMinutes(t: string): number | null {
  if (!isValidTime(t)) return null
  const m = TIME_RE.exec(t.trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/** Listing window overlaps [filterFrom, filterTo] (minutes, same day). */
function timeRangesOverlap(
  listStart: string,
  listEnd: string,
  filterFrom?: string,
  filterTo?: string
): boolean {
  const ls = parseTimeToMinutes(listStart)
  const le = parseTimeToMinutes(listEnd)
  if (ls === null || le === null) return true
  if (le <= ls) return true // overnight — don’t exclude on filter
  const ff = filterFrom && isValidTime(filterFrom) ? parseTimeToMinutes(filterFrom) : null
  const ft = filterTo && isValidTime(filterTo) ? parseTimeToMinutes(filterTo) : null
  if (ff === null && ft === null) return true
  const a = ff ?? 0
  const b = ft ?? 24 * 60
  return ls < b && a < le
}

export function listingMatchesAvailabilityFilter(
  listing: { availability?: unknown; time?: string | null },
  filter: { day?: DayCode; timeFrom?: string; timeTo?: string }
): boolean {
  const a = availabilityForSearchMatch(listing)

  if (filter.day) {
    if (a.days.length > 0 && !a.days.includes(filter.day)) return false
  }

  if (filter.timeFrom || filter.timeTo) {
    return timeRangesOverlap(a.startTime, a.endTime, filter.timeFrom, filter.timeTo)
  }

  return true
}

export function filterListingsByAvailability<
  T extends { availability?: unknown; time?: string | null },
>(
  rows: T[],
  filter: { day?: DayCode; timeFrom?: string; timeTo?: string }
): T[] {
  if (!filter.day && !filter.timeFrom && !filter.timeTo) return rows
  return rows.filter((row) => listingMatchesAvailabilityFilter(row, filter))
}

export function formatListingAvailabilityDisplay(item: {
  availability?: unknown
  time?: string | null
}): string {
  const n = normalizeAvailability(item.availability)
  if (n) return formatAvailabilitySummary(n)
  return item.time?.trim() || 'Not set'
}

/** Returns an error message or null if OK. */
export function validateAvailabilityForSave(a: ListingAvailability): string | null {
  if (!isValidTime(a.startTime) || !isValidTime(a.endTime)) {
    return 'Use 24-hour times like 09:00 and 17:00.'
  }
  const sm = parseTimeToMinutes(a.startTime)
  const em = parseTimeToMinutes(a.endTime)
  if (sm === null || em === null) return 'Invalid time format.'
  if (em <= sm) return 'End time must be after start time.'
  return null
}
