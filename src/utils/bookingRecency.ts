import type { Booking } from '@/src/types/Booking'

/** Milliseconds for sorting “recently finished” — actual session end when present, else scheduled end. */
export function bookingFinishedRecencyMs(b: Pick<Booking, 'gps_session_ended_at' | 'end_time'>): number {
  const iso = b.gps_session_ended_at ?? b.end_time
  return new Date(iso).getTime()
}
