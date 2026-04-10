# Booking Flow README

This document explains what was implemented for the booking flow and how to troubleshoot common issues.

## Scope Implemented

Two booking paths are supported:

1. **Owner-initiated booking**
   - Owner selects minder, pet, dates, location, recurring options.
   - Booking is created in `bookings` with `status='pending'`.

2. **Minder-initiated job application**
   - Minder applies to owner listings through `booking_applications`.
   - Owner accepts/rejects applications.
   - On accept, a booking is created in `bookings` with `status='confirmed'`.

## Files Added/Updated

### Components (`src/components/booking`)
- `BookingCard.tsx`
- `BookingStatusBadge.tsx`
- `CalendarPicker.tsx`

### Types
- `src/types/Booking.ts`
  - Added:
    - `BookingApplicationStatus`
    - `BookingApplication`

### Redux
- `src/store/bookingSlice.ts`
  - Added state: `applications`
  - Added actions:
    - `setApplications`
    - `addApplication`
    - `updateApplicationStatus`

### Hooks
- `src/hooks/useBookings.ts`
  - Owner/minder booking:
    - `fetchOwnerBookings`
    - `fetchMinderBookings`
    - `createBooking`
    - `updateBookingStatus`
    - `cancelBooking`
  - Application flow:
    - `fetchApplicationsForListing`
    - `fetchMinderApplications`
    - `fetchOwnerApplications`
    - `submitJobApplication`
    - `acceptApplication`
    - `rejectApplication`
    - `withdrawApplication`

### Screens
- Owner:
  - `src/screens/owner/BookingRequestScreen.tsx`
  - `src/screens/owner/BookingDetailsScreen.tsx`
  - `src/screens/owner/JobApplicationsScreen.tsx` (new)
- Minder:
  - `src/screens/minder/JobApplicationScreen.tsx` (new)
  - `src/screens/minder/MyApplicationsScreen.tsx` (new)

## Data Model Notes

### `bookings`
Used for actual booking sessions.

### `booking_applications`
Used for minder job applications before booking creation.

Expected columns:
- `id`
- `owner_listing_id`
- `minder_id`
- `minder_listing_id`
- `proposed_price`
- `proposed_start_time`
- `proposed_end_time`
- `proposed_notes`
- `status` (`pending` | `accepted` | `rejected` | `withdrawn`)
- `created_at`
- `updated_at`

## Flow Summary

### Owner -> Minder direct booking
1. Open `BookingRequestScreen`.
2. Submit booking.
3. Booking row created in `bookings` (`pending`).

### Minder application flow
1. Minder opens `JobApplicationScreen` with `{ listingId }`.
2. Minder submits proposal -> row in `booking_applications` (`pending`).
3. Owner views in `JobApplicationsScreen`.
4. Owner accepts:
   - `booking_applications.status='accepted'`
   - booking created in `bookings` (`confirmed`)
5. Owner rejects:
   - `booking_applications.status='rejected'`
6. Minder withdraws:
   - `booking_applications.status='withdrawn'`

## Required Navigation Wiring (still needed externally)

Register these routes in navigators:

- Owner navigator:
  - `JobApplications`
- Minder navigator:
  - `JobApplication`
  - `MyApplications`

Already used by this flow:
- `BookingDetails`
- `Chat`

## Troubleshooting

### 1) `booking_applications` queries fail
Symptoms:
- errors like relation not found / permission denied.

Check:
- Migration for `booking_applications` exists and is applied.
- RLS policies allow:
  - Minder insert/read/update own applications.
  - Owner read/update applications for own listings.

### 2) Accepting application does not create booking
Check:
- `acceptApplication()` in `src/hooks/useBookings.ts`.
- Owner has at least one pet; fallback pet creation path should run if not.
- `bookings` RLS allows owner insert (`requester_id=auth.uid()`).

### 3) Booking details screen navigation fails after accept
Check:
- Owner navigator includes `BookingDetails`.
- `navigation.navigate('BookingDetails', { bookingId })` route name matches navigator.

### 4) Chat button does nothing
Check:
- Route name `Chat` exists in navigator.
- Params expected by chat screen align with:
  - `threadId`
  - `otherUserId`

### 5) Calendar availability mismatch
Check:
- `calendars` table key is `minder_id` (not `user_id`).
- `Calendar` type and Supabase queries use the same key.

### 6) Status badge color not matching
Check:
- `BookingStatusBadge.tsx` mapping:
  - pending -> warning
  - confirmed -> success
  - cancelled -> danger
  - completed -> info

## Quick Verification Checklist

- Owner can submit booking request.
- Minder can submit application.
- Owner can accept/reject application.
- Accept creates booking and opens booking details.
- Minder can view and withdraw pending applications.
- Redux application state updates in real time after actions.

