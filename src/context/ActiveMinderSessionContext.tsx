import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { GPSTrackingHandle } from '@/src/hooks/useGPS'
import { startGPSTracking } from '@/src/hooks/useGPS'
import { completeBookingWithGpsSession } from '@/src/hooks/useBookings'
import { AppDispatch, RootState } from '@/src/store'

type Coords = { latitude: number; longitude: number }

type ActiveMinderSessionContextValue = {
  /** Booking whose GPS session is running (persists after leaving Session screen). */
  activeBookingId: string | null
  /** Wall-clock start time for elapsed timer (ms). */
  sessionStartedAtMs: number | null
  lastCoords: Coords | null
  /** Idempotent: starts or continues tracking for this booking; replaces any other active session. */
  beginOrContinueSession: (bookingId: string) => void
  /** Stop GPS, clear state, mark booking completed. */
  completeSession: () => Promise<{ error: Error | null }>
  /** Stop GPS without completing booking (e.g. rare cancel path — not used by default UI). */
  abortSessionWithoutComplete: () => void
}

const ActiveMinderSessionContext = createContext<ActiveMinderSessionContextValue | null>(null)

export function ActiveMinderSessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null)
  const [sessionStartedAtMs, setSessionStartedAtMs] = useState<number | null>(null)
  const [lastCoords, setLastCoords] = useState<Coords | null>(null)

  const gpsHandleRef = useRef<GPSTrackingHandle | null>(null)
  const sessionStartedAtRef = useRef<number | null>(null)
  const activeBookingIdRef = useRef<string | null>(null)

  useEffect(() => {
    activeBookingIdRef.current = activeBookingId
  }, [activeBookingId])

  const clearGpsOnly = useCallback(() => {
    gpsHandleRef.current?.stop()
    gpsHandleRef.current = null
  }, [])

  const resetState = useCallback(() => {
    clearGpsOnly()
    sessionStartedAtRef.current = null
    setActiveBookingId(null)
    setSessionStartedAtMs(null)
    setLastCoords(null)
  }, [clearGpsOnly])

  useEffect(() => {
    if (!isAuthenticated) {
      resetState()
    }
  }, [isAuthenticated, resetState])

  const beginOrContinueSession = useCallback(
    (bookingId: string) => {
      if (activeBookingIdRef.current === bookingId && gpsHandleRef.current) {
        return
      }

      clearGpsOnly()
      const started = Date.now()
      sessionStartedAtRef.current = started
      setActiveBookingId(bookingId)
      setSessionStartedAtMs(started)
      setLastCoords(null)

      gpsHandleRef.current = startGPSTracking(bookingId, {
        onLocation: (latitude, longitude) => {
          setLastCoords({ latitude, longitude })
        },
      })
    },
    [clearGpsOnly]
  )

  const completeSession = useCallback(async (): Promise<{ error: Error | null }> => {
    const id = activeBookingIdRef.current
    if (!id) return { error: null }

    const startedAt = sessionStartedAtRef.current
    const distanceM = gpsHandleRef.current?.getDistanceMeters() ?? 0
    clearGpsOnly()
    sessionStartedAtRef.current = null
    setActiveBookingId(null)
    setSessionStartedAtMs(null)
    setLastCoords(null)

    const durationSec =
      startedAt != null ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0
    const endedAt = new Date().toISOString()

    try {
      await completeBookingWithGpsSession(dispatch, id, {
        durationSec,
        distanceM,
        endedAt,
      })
      return { error: null }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to complete booking')
      return { error }
    }
  }, [clearGpsOnly, dispatch])

  const abortSessionWithoutComplete = useCallback(() => {
    resetState()
  }, [resetState])

  const value = useMemo(
    () =>
      ({
        activeBookingId,
        sessionStartedAtMs,
        lastCoords,
        beginOrContinueSession,
        completeSession,
        abortSessionWithoutComplete,
      }) satisfies ActiveMinderSessionContextValue,
    [
      activeBookingId,
      sessionStartedAtMs,
      lastCoords,
      beginOrContinueSession,
      completeSession,
      abortSessionWithoutComplete,
    ]
  )

  return (
    <ActiveMinderSessionContext.Provider value={value}>{children}</ActiveMinderSessionContext.Provider>
  )
}

export function useActiveMinderSession(): ActiveMinderSessionContextValue {
  const ctx = useContext(ActiveMinderSessionContext)
  if (!ctx) {
    throw new Error('useActiveMinderSession must be used within ActiveMinderSessionProvider')
  }
  return ctx
}

/** Optional hook for screens outside the provider (should not happen in app). */
export function useActiveMinderSessionOptional(): ActiveMinderSessionContextValue | null {
  return useContext(ActiveMinderSessionContext)
}
