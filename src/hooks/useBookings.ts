import { bookingService, type CreateBookingInput } from '@/src/services/BookingService'

export type { CreateBookingInput }

export const fetchOwnerBookings = bookingService.fetchOwnerBookings
export const fetchMinderBookings = bookingService.fetchMinderBookings
export const createBooking = bookingService.createBooking
export const updateBookingStatus = bookingService.updateBookingStatus
export const completeBookingWithGpsSession = bookingService.completeBookingWithGpsSession
export const cancelBooking = bookingService.cancelBooking
export const fetchApplicationsForListing = bookingService.fetchApplicationsForListing
export const fetchMinderApplications = bookingService.fetchMinderApplications
export const fetchOwnerApplications = bookingService.fetchOwnerApplications
export const submitJobApplication = bookingService.submitJobApplication
export const acceptApplication = bookingService.acceptApplication
export const rejectApplication = bookingService.rejectApplication
export const withdrawApplication = bookingService.withdrawApplication
