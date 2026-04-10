export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const datePart = s.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const startTime = s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const endTime = e.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${datePart}, ${startTime} – ${endTime}`
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return '0m'
  const totalMins = Math.floor((end - start) / 60_000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(isoString)
}
