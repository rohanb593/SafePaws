import { TimeSlot } from '@/src/types/Calendar'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useEffect, useMemo, useState } from 'react'

interface CalendarPickerProps {
  availableSlots: TimeSlot[]
  selectedStart: Date | null
  selectedEnd: Date | null
  onChange: (start: Date, end: Date) => void
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isDayAvailable(year: number, month: number, day: number, slots: TimeSlot[]): boolean {
  const d = new Date(year, month, day)
  const weekday = WEEKDAY_NAMES[d.getDay()]
  return slots.some(slot => {
    const raw = slot.day.trim()
    if (!raw) return false
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const parsed = new Date(raw)
      if (Number.isNaN(parsed.getTime())) return false
      return (
        parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day
      )
    }
    return raw.toLowerCase() === weekday.toLowerCase()
  })
}

function mondayIndexFromSunday(dayIndex: number): number {
  return (dayIndex + 6) % 7
}

export default function CalendarPicker({
  availableSlots,
  selectedStart,
  selectedEnd,
  onChange,
}: CalendarPickerProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [tempStart, setTempStart] = useState<Date | null>(selectedStart)
  const [tempEnd, setTempEnd] = useState<Date | null>(selectedEnd)

  useEffect(() => {
    setTempStart(selectedStart)
    setTempEnd(selectedEnd)
  }, [selectedStart, selectedEnd])

  const { daysInMonth, leadingBlanks, monthLabel } = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const dim = new Date(viewYear, viewMonth + 1, 0).getDate()
    const lead = mondayIndexFromSunday(first.getDay())
    const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    return { daysInMonth: dim, leadingBlanks: lead, monthLabel: label }
  }, [viewYear, viewMonth])

  const cells = useMemo(() => {
    const total = leadingBlanks + daysInMonth
    const rows = Math.ceil(total / 7)
    const out: ({ type: 'blank' } | { type: 'day'; day: number })[] = []
    for (let i = 0; i < leadingBlanks; i++) out.push({ type: 'blank' })
    for (let d = 1; d <= daysInMonth; d++) out.push({ type: 'day', day: d })
    while (out.length < rows * 7) out.push({ type: 'blank' })
    return out
  }, [leadingBlanks, daysInMonth])

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const onPressDay = (day: number) => {
    const cellDate = startOfLocalDay(new Date(viewYear, viewMonth, day))
    if (!isDayAvailable(viewYear, viewMonth, day, availableSlots)) return

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(cellDate)
      setTempEnd(null)
      return
    }

    let rangeStart = tempStart
    let rangeEnd = cellDate
    if (rangeEnd.getTime() < rangeStart.getTime()) {
      const swap = rangeStart
      rangeStart = rangeEnd
      rangeEnd = swap
    }
    if (sameLocalDay(rangeStart, rangeEnd)) {
      setTempStart(cellDate)
      setTempEnd(null)
      return
    }

    setTempStart(rangeStart)
    setTempEnd(rangeEnd)
    onChange(startOfLocalDay(rangeStart), endOfLocalDay(rangeEnd))
  }

  const renderCell = (cell: { type: 'blank' } | { type: 'day'; day: number }, index: number) => {
    if (cell.type === 'blank') {
      return <View key={`b-${index}`} style={styles.cell} />
    }

    const { day } = cell
    const available = isDayAvailable(viewYear, viewMonth, day, availableSlots)
    const cellDate = startOfLocalDay(new Date(viewYear, viewMonth, day))
    const isStart = tempStart && sameLocalDay(cellDate, tempStart)
    const isEnd = tempEnd && sameLocalDay(cellDate, tempEnd)
    const inRange =
      tempStart &&
      tempEnd &&
      cellDate.getTime() > tempStart.getTime() &&
      cellDate.getTime() < tempEnd.getTime()

    const cellStyle = [
      styles.dayCell,
      available && styles.dayAvailable,
      inRange && styles.dayInRange,
      isStart && styles.dayRangeEnd,
      isEnd && styles.dayRangeEnd,
    ]

    return (
      <Pressable
        key={`d-${day}`}
        onPress={() => onPressDay(day)}
        disabled={!available}
        style={({ pressed }) => [cellStyle, pressed && available && styles.dayPressed]}
      >
        <Text style={[styles.dayNum, !available && styles.dayMuted]}>{day}</Text>
        {isStart ? <Text style={styles.tag}>Start</Text> : null}
        {isEnd && !isStart ? <Text style={styles.tag}>End</Text> : null}
      </Pressable>
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={goPrevMonth} style={styles.navBtn} hitSlop={8}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <Pressable onPress={goNextMonth} style={styles.navBtn} hitSlop={8}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map(w => (
          <Text key={w} style={styles.weekLabel}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>{cells.map((c, i) => renderCell(c, i))}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  navBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  navText: { fontSize: 22, color: '#2E7D32', fontWeight: '600' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, maxHeight: 52 },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    maxHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayAvailable: { backgroundColor: '#E8F5E9' },
  dayInRange: { backgroundColor: '#E3F2FD' },
  dayRangeEnd: { backgroundColor: '#C8E6C9' },
  dayPressed: { opacity: 0.85 },
  dayNum: { fontSize: 15, fontWeight: '600', color: '#222' },
  dayMuted: { color: '#bbb', fontWeight: '400' },
  tag: { fontSize: 9, fontWeight: '700', color: '#1B5E20', marginTop: 2 },
})
