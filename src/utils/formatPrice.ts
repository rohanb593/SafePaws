// Price formatting utility functions
//
// formatPrice(amount: number): string
//   → "£12.50"
//
// formatHourlyRate(amount: number): string
//   → "£12.50/hr"
export function formatPrice(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPricePerHour(amount: number): string {
  return `${formatPrice(amount)} / hr`
}
