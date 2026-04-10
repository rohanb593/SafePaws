/** Short codes stored in listings.availability.days (stable order Mon→Sun). */
export const DAY_CODES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type DayCode = (typeof DAY_CODES)[number]
