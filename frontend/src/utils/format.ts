const DEFAULT_TIMEZONE = 'America/Bogota'
const BOGOTA_OFFSET = '-05:00'

export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || DEFAULT_TIMEZONE

function normalizeApiDate(value: string): string {
  const dateTimeMatch = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
  if (dateTimeMatch.test(value)) {
    return `${value.replace(' ', 'T')}${BOGOTA_OFFSET}`
  }

  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/
  if (dateOnlyMatch.test(value)) {
    return `${value}T00:00:00${BOGOTA_OFFSET}`
  }

  return value
}

export function parseApiDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date
  }

  return new Date(normalizeApiDate(date))
}

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = parseApiDate(date)
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  }).format(d)
}

export function formatDateOnly(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: APP_TIMEZONE,
  }).format(parseApiDate(date))
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  }).format(parseApiDate(date))
}

export function getTodayDateStringInTimezone(timeZone: string = APP_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}
