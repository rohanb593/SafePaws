// Input validation utility functions

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Min 8 chars, 1 uppercase, 1 number (NF1)
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
}

export function isValidPhone(phone: string): boolean {
  return /^(\+44|0)[0-9]{10}$/.test(phone.replace(/\s/g, ''))
}

export function isRequired(value: string): boolean {
  return value.trim().length > 0
}

export function validateBookingDates(start: string, end: string): boolean {
  return new Date(end) > new Date(start)
}
