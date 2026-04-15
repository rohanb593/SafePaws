# SafePaws2

Mobile app built with [Expo](https://expo.dev/) (React Native), [expo-router](https://docs.expo.dev/router/introduction/), Redux, and [Supabase](https://supabase.com/) for auth and data.

## Prerequisites

- **Node.js** (LTS recommended, e.g. 20+)
- **npm** (comes with Node)
- For physical devices: **Expo Go** from the App Store or Play Store, or a dev build from `expo run:ios` / `expo run:android`
- For iOS simulators: **Xcode** (macOS only)
- For Android emulators: **Android Studio** and an AVD

## 1. Install dependencies

From the project root:

```bash
npm install
```

## 2. Environment variables

The app reads Supabase settings from Expo public env vars (see `src/lib/supabase.ts`). Create a file named `.env` in the project root (this file is gitignored).

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get `URL` and **anon** `key` from the Supabase dashboard: **Project Settings → API**.

Restart the dev server after changing `.env`.

## 3. Run the app

Start the Metro bundler and QR / dev menu:

```bash
npx expo start
```

(`npm start` is equivalent — it runs `expo start` as defined in `package.json`.)

Then:

- Press **i** for iOS simulator, **a** for Android emulator, or **w** for web (if supported by your setup)
- Or scan the QR code with **Expo Go** on a phone (same network as your machine)

Other useful scripts:

| Command | Purpose |
|--------|---------|
| `npm run ios` | Build and run on iOS (native project generated as needed) |
| `npm run android` | Build and run on Android |
| `npm run web` | Start with web target |

## 4. Supabase backend

The `supabase/` folder holds migrations and Edge Functions for this project. To run Supabase locally or link a remote project, use the [Supabase CLI](https://supabase.com/docs/guides/cli); the app itself only needs the URL and anon key in `.env` to talk to your hosted (or local) instance.

## Troubleshooting

- **Blank Supabase errors or failed requests:** Confirm `.env` exists, variables are spelled exactly as above, and you restarted `npx expo start`.
- **Session not persisting:** `src/lib/supabase.ts` currently uses in-memory auth storage for minimal native setup. For persistent login across restarts, wire in `AsyncStorage` (or SecureStore) in the `createClient` `auth.storage` option.

## License

Private project (`package.json` marks the repo as private).

---

---

# Group Work Allocation — SafePaws2

> **Already completed by Rohan:** Authentication flow — `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`, `VerifyOtpScreen`, `NewPasswordScreen`, `useAuth.ts`, `AuthNavigator.tsx`, `AppNavigator.tsx`, `authSlice.ts`, `supabase.ts`, `Button.tsx`, `Input.tsx`, `validators.ts`.

The remaining work is divided into **7 workstreams** below. Each person should work on their own Git branch and open a PR when done. Read every stub file before implementing — each one contains documentation comments describing exactly what it should do.

---

## Aradhya — Foundation: TypeScript Types, Redux State & Shared UI Components

**Branch name:** `feature/foundation`

This person builds the shared infrastructure that everyone else imports. Do this first — all other workstreams depend on it. No screens, no navigation.

---

### `src/types/User.ts`
Define and export the following TypeScript interfaces:

```
interface User
```
Fields: `id: string`, `username: string`, `display_name: string`, `email: string`, `phone: string | null`, `location: string`, `preferences: string`, `preferred_communication: 'in-app' | 'email' | 'phone'`, `role: 'user' | 'minder' | 'admin' | 'customer_support'`, `account_status: 'active' | 'suspended' | 'banned'`, `ratings: number`, `created_at: string`.

---

### `src/types/PetOwner.ts`
Define and export:

```
interface PetOwner extends User
```
Additional fields: `pet_info: string`, `pets?: Pet[]`.

---

### `src/types/PetMinder.ts`
Define and export:

```
interface PetMinder extends User
```
Additional fields: `experience: string`, `vet_clinic_name: string | null`, `vet_clinic_phone: string | null`, `vet_clinic_address: string | null`, `listings?: Listing[]`.

---

### `src/types/Pet.ts`
Define and export:

```
interface Pet
```
Fields: `id: string`, `owner_id: string`, `pet_type: string`, `breed: string`, `name: string`, `created_at: string`.

---

### `src/types/MedicalRecord.ts`
Define and export:

```
interface VaccineEntry { name: string; date: string; next_due: string }
interface MedicalRecord
```
`MedicalRecord` fields: `id: string`, `pet_id: string`, `vet_name: string`, `vet_clinic: string`, `vet_phone: string`, `vaccine_info: VaccineEntry[]`, `medical_history: string`, `allergies: string[]`, `updated_at: string`.

---

### `src/types/Booking.ts`
Define and export:

```
type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
interface Booking
```
Fields: `id: string`, `pet_id: string`, `requester_id: string`, `minder_id: string`, `location: string`, `status: BookingStatus`, `start_time: string`, `end_time: string`, `created_at: string`.
Also export `interface BookingWithDetails extends Booking` that includes `pet?: Pet`, `minder?: User`, `requester?: User`.

---

### `src/types/Listing.ts`
Define and export:

```
type ListingType = 'owner' | 'minder'
interface Listing
```
Fields: `id: string`, `user_id: string`, `location: string`, `description: string`, `listing_type: ListingType`, `animal: string | null`, `time: string | null`, `price: number | null`, `rating: number | null`, `created_at: string`.

---

### `src/types/Chat.ts`
Define and export:

```
interface ChatMessage
```
Fields: `id: string`, `sender_id: string`, `receiver_id: string`, `message: string`, `read_status: boolean`, `thread_id: string`, `created_at: string`.

Also export `interface ChatThread { thread_id: string; other_user: User; last_message: ChatMessage; unread_count: number }`.

---

### `src/types/Review.ts`
Define and export:

```
interface Review
```
Fields: `id: string`, `reviewer_id: string`, `reviewee_id: string`, `booking_id: string | null`, `rating: 1 | 2 | 3 | 4 | 5`, `comment: string`, `date: string`.

---

### `src/types/Ticket.ts`
Define and export:

```
type TicketStatus = 'pending' | 'opened' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high'
type TicketCategory = 'general' | 'booking' | 'payment' | 'account' | 'safety'
interface Ticket
```
Fields: `id: string`, `query_type: string`, `status: TicketStatus`, `priority: TicketPriority`, `by_user: string`, `category: TicketCategory`, `issue_description: string`, `created_at: string`, `updated_at: string`.

---

### `src/types/Calendar.ts`
Define and export:

```
interface TimeSlot { day: string; start: string; end: string }
interface Calendar
```
Fields: `id: string`, `user_id: string`, `available_timing: TimeSlot[]`, `booked_timing: TimeSlot[]`, `updated_at: string`.

---

### `src/utils/formatDate.ts`
Implement and export the following functions:

```
formatDate(isoString: string): string
```
Returns a human-readable date string, e.g. `"28 Mar 2026"`.

```
formatDateTime(isoString: string): string
```
Returns date + time, e.g. `"28 Mar 2026, 14:30"`.

```
formatRelativeTime(isoString: string): string
```
Returns relative time like `"2 hours ago"`, `"3 days ago"`, `"just now"`.

```
formatDuration(startIso: string, endIso: string): string
```
Returns a human-readable duration like `"2h 30m"`.

---

### `src/utils/formatPrice.ts`
Implement and export:

```
formatPrice(amount: number, currency?: string): string
```
Defaults to GBP. Returns `"£12.50"`, `"£100.00"` etc.

```
formatPricePerHour(amount: number): string
```
Returns `"£12.50 / hr"`.

---

### `src/store/bookingSlice.ts`
Implement the full Redux slice using `createSlice` from `@reduxjs/toolkit`.

State shape:
```
{ bookings: Booking[]; selectedBooking: Booking | null; loading: boolean; error: string | null }
```

Actions to export:
- `setBookings(state, action: PayloadAction<Booking[]>)` — replace the full list
- `addBooking(state, action: PayloadAction<Booking>)` — prepend a new booking
- `updateBookingStatus(state, action: PayloadAction<{ id: string; status: BookingStatus }>)` — find by id and update status
- `setSelectedBooking(state, action: PayloadAction<Booking | null>)` — set the viewed booking
- `setBookingLoading(state, action: PayloadAction<boolean>)`
- `setBookingError(state, action: PayloadAction<string | null>)`

Export `bookingReducer` as default and all actions as named exports.

---

### `src/store/chatSlice.ts`
State shape:
```
{ threads: Record<string, ChatMessage[]>; loading: boolean; error: string | null }
```

Actions:
- `setThreadMessages(state, action: PayloadAction<{ threadId: string; messages: ChatMessage[] }>)` — replace messages for a thread
- `appendMessage(state, action: PayloadAction<ChatMessage>)` — push a new message to its thread (use `thread_id` as key)
- `markThreadRead(state, action: PayloadAction<string>)` — set `read_status = true` for all messages in a thread
- `setChatLoading(state, action: PayloadAction<boolean>)`
- `setChatError(state, action: PayloadAction<string | null>)`

---

### `src/store/listingsSlice.ts`
State shape:
```
{ listings: Listing[]; activeFilters: { animal?: string; location?: string; maxPrice?: number }; loading: boolean; error: string | null }
```

Actions:
- `setListings(state, action: PayloadAction<Listing[]>)`
- `setFilters(state, action: PayloadAction<Partial<...activeFilters>>)`
- `clearFilters(state)`
- `setListingsLoading(state, action: PayloadAction<boolean>)`
- `setListingsError(state, action: PayloadAction<string | null>)`

---

### `src/store/ticketSlice.ts`
State shape:
```
{ tickets: Ticket[]; selectedTicket: Ticket | null; loading: boolean; error: string | null }
```

Actions:
- `setTickets(state, action: PayloadAction<Ticket[]>)`
- `addTicket(state, action: PayloadAction<Ticket>)`
- `updateTicketStatus(state, action: PayloadAction<{ id: string; status: TicketStatus }>)`
- `setSelectedTicket(state, action: PayloadAction<Ticket | null>)`
- `setTicketLoading(state, action: PayloadAction<boolean>)`
- `setTicketError(state, action: PayloadAction<string | null>)`

---

### `src/store/index.ts` — Update existing file
Wire all four new reducers into the store alongside the existing `authReducer`:
```
reducer: { auth: authReducer, bookings: bookingReducer, chat: chatReducer, listings: listingsReducer, tickets: ticketReducer }
```
Export `type RootState = ReturnType<typeof store.getState>` and `type AppDispatch = typeof store.dispatch`.

---

### `src/components/common/Card.tsx`
A wrapper component. Props: `children: React.ReactNode`, `style?: ViewStyle`. Renders a `View` with a white background, `borderRadius: 12`, subtle `shadowColor`/`elevation` shadow, and `padding: 16`. Pass `style` through for overrides.

---

### `src/components/common/Avatar.tsx`
Props: `uri?: string | null`, `name: string`, `size?: number` (default `44`). If `uri` is provided render an `Image` in a circle of diameter `size`. Otherwise render a `View` of the same size with a coloured background and the first initial of `name` in white centred text. Choose background colour deterministically from the name (e.g. hash the first char to one of 6 preset colours).

---

### `src/components/common/Badge.tsx`
Props: `label: string`, `variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'` (default `'neutral'`). Renders a small pill with coloured background and white text. Colour map: success=green, warning=amber, danger=red, info=blue, neutral=grey.

---

### `src/components/common/Rating.tsx`
Props: `value: number` (0–5), `maxStars?: number` (default `5`), `size?: number` (default `18`), `readonly?: boolean` (default `true`), `onRate?: (rating: number) => void`. Renders star icons (use `★`/`☆` Unicode or an icon library already in the project). When `readonly` is false, each star is pressable and calls `onRate`.

---

### `src/components/common/LoadingSpinner.tsx`
Props: `size?: 'small' | 'large'` (default `'large'`), `color?: string`, `fullScreen?: boolean`. When `fullScreen` is true, wrap in a flex-1 centred View that fills the screen. Otherwise render `ActivityIndicator` inline.

---

### `supabase/migrations/` — All SQL migration files
Write the actual SQL for all 9 stub migration files. The schema is already defined in the project `README` (Supabase schema section). Each file should contain:

- `001_create_users.sql` — `profiles` table + RLS: users can read all profiles, only update their own.
- `002_create_pets.sql` — `pets` table + RLS: owners can CRUD their own pets; minders can read pets of booked owners.
- `003_create_medical_records.sql` — `medical_records` table + RLS: same owner-only write, minders with active booking can read.
- `004_create_bookings.sql` — `bookings` table + enum type `booking_status ('pending','confirmed','cancelled','completed')` + RLS.
- `005_create_listings.sql` — `listings` table + enum `listing_type ('owner','minder')` + RLS: anyone can read; only owner can write their own.
- `006_create_chat_messages.sql` — `chat_messages` table + RLS: only sender/receiver can read or insert.
- `007_create_reviews.sql` — `reviews` table + RLS: authenticated users can insert; anyone can read.
- `008_create_tickets.sql` — `tickets` table + enums + RLS: users can read/create their own; admins can read all.
- `009_create_calendars.sql` — `calendars`, `favourites`, `gps_locations` tables + RLS.
- `seed.sql` — Insert 3 test profiles (1 owner, 1 minder, 1 admin), 2 pets, 1 booking, 2 listings, sample chat messages.

---

---

## Alaur — Navigation & User Profile

**Branch name:** `feature/navigation-profile`

Builds the three role-based navigators and the shared Profile screen that all user types access.

**Dependency:** Needs Aradhya's types and Redux slices exported before wiring navigation.

---

### `src/navigation/OwnerNavigator.tsx`
Implement a React Navigation **Bottom Tab Navigator** with four tabs:

1. **Dashboard** (icon: `home`) → `OwnerDashboardScreen`
2. **Search** (icon: `search`) → `SearchMinderScreen`
3. **Listings** (icon: `list`) → `ListingsScreen`
4. **Profile** (icon: `person`) → `ProfileScreen`

Additionally define a nested **Stack Navigator** (not shown as tabs) for screens that are pushed modally from the tabs:
- `MinderProfile` → `MinderProfileScreen` (params: `{ minderId: string }`)
- `BookingRequest` → `BookingRequestScreen` (params: `{ minderId: string }`)
- `BookingDetails` → `BookingDetailsScreen` (params: `{ bookingId: string }`)
- `PetProfile` → `PetProfileScreen` (params: `{ petId: string }`)
- `AddPet` → `AddPetScreen`
- `GPSTracking` → `GPSTrackingScreen` (params: `{ bookingId: string }`)
- `Favourites` → `FavouritesScreen`
- `LeaveReview` → `LeaveReviewScreen` (params: `{ bookingId: string; revieweeId: string }`)
- `Chat` → `ChatScreen` (params: `{ threadId: string; otherUserId: string }`)
- `CreateTicket` → `CreateTicketScreen`

Export `OwnerNavigator` as default.

---

### `src/navigation/MinderNavigator.tsx`
Implement a **Bottom Tab Navigator** with four tabs:

1. **Dashboard** (icon: `home`) → `MinderDashboardScreen`
2. **Jobs** (icon: `briefcase`) → `JobRequestsScreen`
3. **Availability** (icon: `calendar`) → `AvailabilityScreen`
4. **Profile** (icon: `person`) → `ProfileScreen`

Nested stack screens:
- `JobDetails` → `JobDetailsScreen` (params: `{ bookingId: string }`)
- `Session` → `SessionScreen` (params: `{ bookingId: string }`)
- `MinderProfileEdit` → `MinderProfileEditScreen`
- `Chat` → `ChatScreen` (params: `{ threadId: string; otherUserId: string }`)
- `CreateTicket` → `CreateTicketScreen`

Export `MinderNavigator` as default.

---

### `src/navigation/AdminNavigator.tsx`
Implement a **Stack Navigator**:

- Initial route: `AdminDashboard` → `AdminDashboardScreen`
- `TicketQueue` → `TicketQueueScreen`
- `TicketDetail` → `TicketDetailScreen` (params: `{ ticketId: string }`)
- `UserManagement` → `UserManagementScreen`

Export `AdminNavigator` as default.

---

### `src/navigation/AppNavigator.tsx` — Update existing file
The current implementation shows a placeholder home after login. Update the authenticated branch to switch on `role` from Redux state:
- `role === 'user'` or `role === 'minder'` with `listing_type === 'owner'` → `<OwnerNavigator />`
- `role === 'minder'` → `<MinderNavigator />`
- `role === 'admin'` or `role === 'customer_support'` → `<AdminNavigator />`

Import all three navigators and the `RootState` type.

---

### `src/screens/shared/ProfileScreen.tsx`
This screen is used by both owners and minders to view and edit their own profile.

```
ProfileScreen()
```
- On mount, fetch the current user's profile from `profiles` table using `supabase.from('profiles').select('*').eq('id', currentUserId).single()`.
- Display: `Avatar` component (initials fallback), `display_name`, `username`, `email`, `phone`, `location`, `preferred_communication`, `experience` (minder only), `ratings` as a `Rating` component.
- Show an **Edit** button that toggles the form into edit mode.
- In edit mode, show `Input` fields for `display_name`, `phone`, `location`, `preferences`, `experience` (if minder).
- On save, call `supabase.from('profiles').update({ ... }).eq('id', currentUserId)` and refresh local state.
- Show a `LoadingSpinner` while fetching. Show an error message on failure.

---

### `src/screens/owner/FavouritesScreen.tsx`
```
FavouritesScreen()
```
- Fetch favourites: `supabase.from('favourites').select('*, minder:minder_id(*)').eq('owner_id', currentUserId)`.
- Render a `FlatList` of `MinderCard` components, each showing the minder's name, rating, and location.
- Pressing a card navigates to `MinderProfile` screen with the `minderId`.
- Empty state: show "No saved minders yet" message.
- Swipe-to-delete or a remove button calls `supabase.from('favourites').delete().eq('id', favId)` and removes from local list.

---

### `src/screens/owner/LeaveReviewScreen.tsx`
Props received via navigation: `bookingId: string`, `revieweeId: string`.

```
LeaveReviewScreen()
```
- Show the minder's name and `Avatar` at the top.
- A `Rating` component in interactive mode (`readonly={false}`) to pick 1–5 stars.
- A multi-line `Input` for the comment (max 500 chars, show character count).
- A submit `Button` that calls `supabase.from('reviews').insert({ reviewer_id: currentUserId, reviewee_id, booking_id: bookingId, rating, comment })`.
- After successful insert, also update the minder's average rating in `profiles`: fetch all their reviews, calculate average, update `ratings` field.
- On success, navigate back and show a success toast/alert.

---

---

## Tahrima — Pet Management

**Branch name:** `feature/pet-management`

Handles everything to do with pets and medical records, plus the Owner's main dashboard screen.

**Dependency:** Needs Aradhya's types (`Pet`, `MedicalRecord`, `Booking`) and common components (`Card`, `Avatar`, `LoadingSpinner`).

---

### `src/components/pet/PetCard.tsx`
Props: `pet: Pet`, `onPress: () => void`.

```
PetCard({ pet, onPress })
```
Renders a pressable `Card` showing the pet's name, type, and breed. Use an emoji icon based on pet type (`🐶` dog, `🐱` cat, `🐦` bird, `🐠` fish, `🐾` default). Tapping calls `onPress`.

---

### `src/components/pet/MedicalRecordCard.tsx`
Props: `record: MedicalRecord`.

```
MedicalRecordCard({ record })
```
Renders a `Card` with sections: vet contact info (name, clinic, phone), a list of vaccines with dates, allergies as `Badge` components (variant `'warning'`), and a medical history text block. If any field is empty show a grey placeholder like `"Not recorded"`.

---

### `src/screens/owner/OwnerDashboardScreen.tsx`
```
OwnerDashboardScreen()
```
- On mount, fetch the owner's upcoming/active bookings: `supabase.from('bookings').select('*, pet:pet_id(*), minder:minder_id(*)').eq('requester_id', currentUserId).in('status', ['pending', 'confirmed']).order('start_time')`.
- Fetch their pets: `supabase.from('pets').select('*').eq('owner_id', currentUserId)`.
- Dispatch both to Redux (`setBookings`, but pets can be local state for now).
- Layout:
  - Greeting header: `"Hello, {display_name}"`.
  - **Upcoming Bookings** horizontal scroll: `FlatList` of `BookingCard` components. Tapping navigates to `BookingDetails`.
  - **My Pets** section: `FlatList` of `PetCard` components. Tapping navigates to `PetProfile`.
  - **Add Pet** button at the bottom of pets section — navigates to `AddPet`.
  - Empty states for both sections.
- Show `LoadingSpinner` while fetching.

---

### `src/screens/owner/AddPetScreen.tsx`
```
AddPetScreen()
```
- Form fields using `Input` component: `name` (required), `pet_type` (required — show a picker or preset buttons: Dog, Cat, Bird, Fish, Other), `breed` (optional).
- Validation: name must not be empty, pet_type must be selected.
- On submit, call `supabase.from('pets').insert({ owner_id: currentUserId, name, pet_type, breed })`.
- After insert, optionally navigate to the `PetProfile` screen for the new pet (so the owner can fill medical records).
- Show loading state on the submit button during the request.

---

### `src/screens/owner/PetProfileScreen.tsx`
Props received via navigation: `petId: string`.

```
PetProfileScreen()
```
- Fetch pet: `supabase.from('pets').select('*').eq('id', petId).single()`.
- Fetch medical record: `supabase.from('medical_records').select('*').eq('pet_id', petId).maybeSingle()`.
- Display pet details at the top (name, type, breed, `PetCard`-style header).
- Below, render `MedicalRecordCard` if a record exists, or a "No medical record yet" placeholder with an **Add Medical Info** button.
- **Edit Pet** button: inline form to update `name`, `breed`, `pet_type` via `supabase.from('pets').update(...)`.
- **Add / Edit Medical Info** opens a form with:
  - `vet_name`, `vet_clinic`, `vet_phone` as `Input` fields.
  - `medical_history` as a multiline `Input`.
  - `allergies` — a tag-style input: type an allergy and press enter to add it to an array; show each as a deletable `Badge`.
  - `vaccine_info` — allow adding vaccine entries (name, date, next_due) with an Add button.
  - On save: upsert `supabase.from('medical_records').upsert({ pet_id: petId, ... })`.
- **Delete Pet** button with confirmation alert. Calls `supabase.from('pets').delete().eq('id', petId)` then navigates back.

---

---

## Xinzhu — Listings & Minder Discovery

**Branch name:** `feature/listings-search`

Implements the search and listings features for pet owners to discover minders, and for users to manage their own listings.

**Dependency:** Needs Aradhya's types (`Listing`, `User`), `listingsSlice`, `useListings` hook structure, and `Card`, `Badge`, `Rating`, `LoadingSpinner` components.

---

### `src/components/listings/ListingCard.tsx`
Props: `listing: Listing`, `onPress: () => void`.

```
ListingCard({ listing, onPress })
```
Pressable `Card` showing: listing type badge (`Badge` with `'info'` for minder, `'success'` for owner), location, animal type, price per hour (`formatPricePerHour`), and `Rating` component for `rating`. Tapping calls `onPress`.

---

### `src/components/listings/MinderCard.tsx`
Props: `minder: User & { listing?: Listing }`, `onPress: () => void`, `isFavourited?: boolean`, `onToggleFavourite?: () => void`.

```
MinderCard({ minder, onPress, isFavourited, onToggleFavourite })
```
`Card` with `Avatar` (left), minder's `display_name`, location, rating stars, price/hr. A heart icon (♡/♥) button in top-right corner to toggle favourite. Tapping the card calls `onPress`.

---

### `src/components/listings/FilterBar.tsx`
Props: `filters: { animal?: string; location?: string; maxPrice?: number }`, `onChange: (filters) => void`.

```
FilterBar({ filters, onChange })
```
A horizontal row of filter inputs. Animal type: pill buttons (All, Dog, Cat, Bird, Fish). Location: small `Input` text field. Max price: a simple `Input` with numeric keyboard. Changing any value calls `onChange` with the updated filters. Dispatch to `listingsSlice.setFilters` in the parent.

---

### `src/hooks/useListings.ts`
Implement and export the following functions (not a React hook class — just named async functions that interact with Supabase and dispatch to Redux):

```
fetchListings(dispatch, filters?: { animal?: string; location?: string; maxPrice?: number }): Promise<void>
```
Query `supabase.from('listings').select('*, user:user_id(*)').eq('listing_type', 'minder')`. Apply filters: `ilike('animal', ...)`, `ilike('location', ...)`, `lte('price', ...)` if provided. Dispatch `setListingsLoading(true)`, then `setListings(data)`, then `setListingsLoading(false)`. On error dispatch `setListingsError`.

```
fetchMyListings(dispatch, userId: string): Promise<Listing[]>
```
Fetch all listings where `user_id = userId`. Return the array.

```
createListing(dispatch, listing: Omit<Listing, 'id' | 'created_at' | 'rating'>): Promise<Listing | null>
```
Insert into `listings` table. Return the created listing.

```
updateListing(dispatch, id: string, updates: Partial<Listing>): Promise<void>
```
Update listing by id.

```
deleteListing(dispatch, id: string): Promise<void>
```
Delete listing by id.

---

### `src/screens/owner/SearchMinderScreen.tsx`
```
SearchMinderScreen()
```
- On mount, call `fetchListings(dispatch)` to load all minder listings.
- Render `FilterBar` at the top. When filters change, re-call `fetchListings(dispatch, filters)`.
- Render a `FlatList` of `MinderCard` components.
- For each card, check if `minderId` is in user's favourites (fetch once on mount from `supabase.from('favourites').select('minder_id').eq('owner_id', currentUserId)`).
- `onToggleFavourite`: if favourited, delete from `favourites`; if not, insert. Update local state.
- Tapping a card navigates to `MinderProfile` with `{ minderId: listing.user_id }`.
- Show `LoadingSpinner` while fetching. Show error message on failure.
- Empty state: "No minders found. Try adjusting your filters."

---

### `src/screens/owner/MinderProfileScreen.tsx`
Props received via navigation: `minderId: string`.

```
MinderProfileScreen()
```
- Fetch minder profile: `supabase.from('profiles').select('*').eq('id', minderId).single()`.
- Fetch minder's active listing: `supabase.from('listings').select('*').eq('user_id', minderId).eq('listing_type', 'minder').maybeSingle()`.
- Fetch reviews for this minder: `supabase.from('reviews').select('*, reviewer:reviewer_id(display_name, username)').eq('reviewee_id', minderId).order('date', { ascending: false })`.
- Display: `Avatar`, name, location, rating (`Rating` component), experience text, listing details (animal types, price, available times).
- Reviews section: scrollable list of review cards showing star rating, comment, reviewer name, date.
- Bottom CTA buttons: **Book Now** (navigates to `BookingRequest` with `{ minderId }`) and **Message** (navigates to `Chat` with the thread id `{currentUserId}_{minderId}`).
- Heart button in header to favourite/unfavourite.

---

### `src/screens/shared/ListingsScreen.tsx`
```
ListingsScreen()
```
This screen serves both owners (to post "I need a minder" listings) and minders (to manage their own "I'm available" listings). Detect role from Redux state.

- On mount, call `fetchMyListings(dispatch, currentUserId)` to show the user's own listings.
- Display each listing in a `ListingCard`.
- **Create Listing** button opens a modal form with fields: `description` (multiline), `location`, `animal`, `time`, `price`. On submit call `createListing(dispatch, { ...formData, user_id, listing_type })`.
- Each existing listing card has an **Edit** button (pre-fills form) and a **Delete** button with confirmation alert.
- Edit calls `updateListing`; Delete calls `deleteListing`.

---

---

## Ulina — Bookings Flow

**Branch name:** `feature/bookings`

Implements the complete booking flow from request to completion for the pet owner side.

**Dependency:** Needs Aradhya's types (`Booking`, `Pet`), `bookingSlice`, common components, and `CalendarPicker` outlined below.

---

### `src/components/booking/BookingCard.tsx`
Props: `booking: BookingWithDetails`, `onPress: () => void`.

```
BookingCard({ booking, onPress })
```
Pressable `Card` showing: pet name + type emoji, minder's `Avatar` and name, booking start/end times (`formatDateTime`), duration (`formatDuration`), `BookingStatusBadge`, and location. Tapping calls `onPress`.

---

### `src/components/booking/BookingStatusBadge.tsx`
Props: `status: BookingStatus`.

```
BookingStatusBadge({ status })
```
Renders a `Badge` with label = status (capitalised) and variant:
- `pending` → `'warning'`
- `confirmed` → `'success'`
- `cancelled` → `'danger'`
- `completed` → `'info'`

---

### `src/components/booking/CalendarPicker.tsx`
Props: `availableSlots: TimeSlot[]`, `selectedStart: Date | null`, `selectedEnd: Date | null`, `onRangeChange: (start: Date, end: Date) => void`.

```
CalendarPicker({ availableSlots, selectedStart, selectedEnd, onRangeChange })
```
Render a simple calendar view showing the current month. Days that have available slots are highlighted in green. First tap selects a day (start and end both that day). A second tap on another day sets an inclusive range; every day between must be available. A tap when a multi-day range is already selected starts a new single-day selection. Use React Native's built-in date/time capabilities — do not add new dependencies.

---

### `src/hooks/useBookings.ts`
Implement and export:

```
fetchOwnerBookings(dispatch, ownerId: string): Promise<void>
```
Query `supabase.from('bookings').select('*, pet:pet_id(*), minder:minder_id(display_name, ratings, location)').eq('requester_id', ownerId).order('start_time')`. Dispatch `setBookings`.

```
fetchMinderBookings(dispatch, minderId: string): Promise<void>
```
Same query but `.eq('minder_id', minderId)`. Dispatch `setBookings`.

```
createBooking(dispatch, booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking | null>
```
Insert into `bookings` table with `status: 'pending'`. Dispatch `addBooking`. Return created booking.

```
updateBookingStatus(dispatch, bookingId: string, status: BookingStatus): Promise<void>
```
Update `status` field. Dispatch `updateBookingStatus` action.

```
cancelBooking(dispatch, bookingId: string): Promise<void>
```
Calls `updateBookingStatus(dispatch, bookingId, 'cancelled')`.

---

### `src/screens/owner/BookingRequestScreen.tsx`
Props received via navigation: `minderId: string`.

```
BookingRequestScreen()
```
- Fetch the minder's calendar availability: `supabase.from('calendars').select('*').eq('minder_id', minderId).maybeSingle()`.
- Fetch the owner's pets: `supabase.from('pets').select('*').eq('owner_id', currentUserId)`.
- Form:
  1. **Select Pet** — a horizontal scrollable list of `PetCard` components (single selection).
  2. **Choose dates** — `CalendarPicker` with `availableSlots` from minder's calendar (one day or a consecutive range).
  3. **Start and end time** — start time on the first day and end time on the last day (end must be after start overall).
  4. **Location** — `Input` field pre-filled with minder's location, editable.
- Summary section showing price estimate: `formatPricePerHour(listing.price)` × estimated hours.
- **Send Request** button: validate all fields, call `createBooking(dispatch, { pet_id, requester_id: currentUserId, minder_id: minderId, location, start_time, end_time })` with ISO datetimes from the chosen day and times.
- On success, show alert and navigate back to dashboard.

---

### `src/screens/owner/BookingDetailsScreen.tsx`
Props received via navigation: `bookingId: string`.

```
BookingDetailsScreen()
```
- Fetch booking: `supabase.from('bookings').select('*, pet:pet_id(*), minder:minder_id(*), requester:requester_id(*)').eq('id', bookingId).single()`.
- Display full booking information: `BookingCard` style layout but expanded with all details.
- Show `BookingStatusBadge` prominently.
- Action buttons depending on status:
  - `pending`: **Cancel Request** button → calls `cancelBooking`.
  - `confirmed`: **Track Pet** button → navigates to `GPSTracking` with `{ bookingId }`. **Message Minder** → navigates to `Chat`.
  - `completed`: **Leave Review** button → navigates to `LeaveReview` with `{ bookingId, revieweeId: minder_id }`.
  - `cancelled`: show cancelled message with date.
- Show loading spinner while fetching.

---

---

## William — Pet Minder Features

**Branch name:** `feature/minder`

Builds all screens for the Pet Minder role: their dashboard, incoming job management, availability calendar, profile editing, and active session tracking.

**Dependency:** Needs Aradhya's types and slices, `useBookings` hook from Ulina, `BookingCard` and `BookingStatusBadge` components from Ulina.

---

### `src/screens/minder/MinderDashboardScreen.tsx`
```
MinderDashboardScreen()
```
- On mount, call `fetchMinderBookings(dispatch, currentUserId)`.
- Layout:
  - Header: greeting + the minder's average rating displayed as `Rating` component.
  - **Active / Upcoming Jobs** section: `FlatList` of `BookingCard` (status `confirmed`) sorted by `start_time`. Tapping navigates to `JobDetails`.
  - **Pending Requests** section: `FlatList` of `BookingCard` (status `pending`). Tapping navigates to `JobDetails`.
  - **Earnings Summary** (read-only): count of completed bookings this month + total estimated earnings (sum of `price × duration` from confirmed/completed listings).
- Pull-to-refresh to re-fetch bookings.

---

### `src/screens/minder/JobRequestsScreen.tsx`
```
JobRequestsScreen()
```
- Display all bookings for the minder sorted by `created_at` descending.
- Filter tabs at the top: **All**, **Pending**, **Confirmed**, **Completed**, **Cancelled**. Selecting a tab filters the list.
- Render `BookingCard` for each. Tapping navigates to `JobDetails`.
- Pull-to-refresh. Loading spinner. Empty state per tab.

---

### `src/screens/minder/JobDetailsScreen.tsx`
Props received via navigation: `bookingId: string`.

```
JobDetailsScreen()
```
- Fetch full booking with related data: pet info, owner profile, location.
- Display all booking details: pet name/type/breed, owner name + contact, dates/times, location, `BookingStatusBadge`.
- Also fetch the pet's medical record: `supabase.from('medical_records').select('*').eq('pet_id', booking.pet_id).maybeSingle()`. If it exists, show a **View Medical Record** expandable section using `MedicalRecordCard`.
- Action buttons:
  - If `pending`: **Accept** → calls `updateBookingStatus(dispatch, bookingId, 'confirmed')`. **Decline** → calls `cancelBooking`.
  - If `confirmed`: **Start Session** → navigates to `Session` with `{ bookingId }`. **Message Owner** → navigates to `Chat`.
  - If `completed`: show completion date and a prompt to respond to any review left.

---

### `src/screens/minder/AvailabilityScreen.tsx`
```
AvailabilityScreen()
```
- Fetch the minder's calendar: `supabase.from('calendars').select('*').eq('user_id', currentUserId).maybeSingle()`.
- Display a weekly calendar grid (Monday–Sunday). Each day shows existing available time slots as coloured blocks.
- **Add Availability** button: opens a bottom sheet form with fields: `day` (day of week picker), `start` time, `end` time. On submit, appends to `available_timing` array and calls `supabase.from('calendars').upsert({ user_id: currentUserId, available_timing: updatedArray, updated_at: now() })`.
- Each existing slot has a delete button (remove from array and upsert).
- `booked_timing` slots are shown in a different colour (read-only — they are populated when bookings are confirmed).

---

### `src/screens/minder/MinderProfileEditScreen.tsx`
```
MinderProfileEditScreen()
```
- Pre-load current profile data from Redux state or re-fetch from Supabase.
- Editable fields: `display_name`, `phone`, `location`, `experience` (multiline), `preferences`, `preferred_communication` (picker: In-App / Email / Phone), vet clinic fields (`vet_clinic_name`, `vet_clinic_phone`, `vet_clinic_address`).
- On save, call `supabase.from('profiles').update({ ... }).eq('id', currentUserId)`. Dispatch `setUser` action to update Redux store.
- Validation: `display_name` not empty, `phone` valid UK format (reuse `validatePhone` from `validators.ts`).
- Cancel button discards changes.

---

### `src/screens/minder/SessionScreen.tsx`
Props received via navigation: `bookingId: string`.

```
SessionScreen()
```
- Fetch booking details to display context (pet name, owner name, location).
- On mount, call `startGPSTracking(bookingId)` (see Rohan's `useGPS`). This starts sending location updates to Supabase every 30 seconds.
- Display a map-style placeholder (a `View` with the current GPS coordinates shown as text if expo-maps is unavailable) or use `expo-location` to show `latitude` and `longitude`.
- Show session timer (elapsed time since mount).
- **End Session** button: stops GPS tracking, calls `updateBookingStatus(dispatch, bookingId, 'completed')`, navigates back to `MinderDashboard`.
- Show a pulsing indicator while tracking is active.

---

---

## Rohan — Chat, GPS Tracking & Admin/Support

**Branch name:** `feature/chat-gps-admin`

The most diverse workstream: real-time messaging, live pet GPS tracking for owners, and the full admin/support panel.

**Dependency:** Needs Aradhya's types (`ChatMessage`, `Ticket`), `chatSlice`, `ticketSlice`, and common components.

---

### `src/components/chat/MessageBubble.tsx`
Props: `message: ChatMessage`, `isOwn: boolean`.

```
MessageBubble({ message, isOwn })
```
Render a chat bubble: `isOwn` messages are right-aligned with a blue/teal background; received messages are left-aligned with a light grey background. Show message text, and time below in small grey text (`formatRelativeTime`). Implement a simple `read_status` indicator (double tick ✓✓ in blue when read, grey when unread) for own messages only.

---

### `src/components/chat/ChatInput.tsx`
Props: `onSend: (message: string) => void`, `disabled?: boolean`.

```
ChatInput({ onSend, disabled })
```
A bottom-docked row with a text `Input` (multiline, expands up to 4 lines) and a **Send** `Button`. Pressing Send or the return key calls `onSend(text)` and clears the input. Disable send button when input is empty or `disabled` is true.

---

### `src/hooks/useChat.ts`
Implement and export:

```
fetchThread(dispatch, threadId: string): Promise<void>
```
Query `supabase.from('chat_messages').select('*').eq('thread_id', threadId).order('created_at')`. Dispatch `setThreadMessages({ threadId, messages: data })`.

```
sendMessage(dispatch, msg: Omit<ChatMessage, 'id' | 'created_at' | 'read_status'>): Promise<void>
```
Insert into `chat_messages`. Dispatch `appendMessage`.

```
subscribeToThread(threadId: string, onNewMessage: (msg: ChatMessage) => void): RealtimeChannel
```
Use Supabase Realtime: `supabase.channel('thread-{threadId}').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'thread_id=eq.{threadId}' }, callback).subscribe()`. Return the channel so the component can unsubscribe on unmount.

```
markMessagesRead(threadId: string, receiverId: string): Promise<void>
```
`supabase.from('chat_messages').update({ read_status: true }).eq('thread_id', threadId).eq('receiver_id', receiverId).eq('read_status', false)`.

---

### `src/screens/shared/ChatScreen.tsx`
Props received via navigation: `threadId: string`, `otherUserId: string`.

```
ChatScreen()
```
- On mount, fetch the other user's display name and `Avatar` for the header.
- Call `fetchThread(dispatch, threadId)` to load history.
- Subscribe with `subscribeToThread(threadId, (msg) => dispatch(appendMessage(msg)))`. On unmount, call `channel.unsubscribe()`.
- Call `markMessagesRead(threadId, currentUserId)` on mount and when new messages arrive.
- Render a `FlatList` (inverted) of `MessageBubble` components sourced from Redux `state.chat.threads[threadId]`.
- `ChatInput` at the bottom. On send, call `sendMessage(dispatch, { sender_id: currentUserId, receiver_id: otherUserId, message: text, thread_id: threadId })`.
- Auto-scroll to latest message on new message.

---

### `src/hooks/useGPS.ts`
Implement and export:

```
startGPSTracking(bookingId: string): () => void
```
Request `Location.requestForegroundPermissionsAsync()`. If denied, alert the user. If granted, start a `Location.watchPositionAsync` watcher with accuracy `Balanced` and interval 30 000 ms. On each update, call `updateGPSLocation(bookingId, coords.latitude, coords.longitude)`. Return a cleanup function that removes the watcher.

```
updateGPSLocation(bookingId: string, latitude: number, longitude: number): Promise<void>
```
`supabase.from('gps_locations').upsert({ booking_id: bookingId, latitude, longitude, updated_at: new Date().toISOString() })`.

```
subscribeToGPS(bookingId: string, onUpdate: (lat: number, lon: number) => void): RealtimeChannel
```
Subscribe to `postgres_changes` on `gps_locations` filtered by `booking_id`. Call `onUpdate` with new coords. Return the channel.

```
fetchLastLocation(bookingId: string): Promise<{ latitude: number; longitude: number } | null>
```
`supabase.from('gps_locations').select('latitude, longitude').eq('booking_id', bookingId).maybeSingle()`.

---

### `src/screens/owner/GPSTrackingScreen.tsx`
Props received via navigation: `bookingId: string`.

```
GPSTrackingScreen()
```
- On mount, call `fetchLastLocation(bookingId)` and display the initial coordinates.
- Subscribe with `subscribeToGPS(bookingId, (lat, lon) => setLocation({ lat, lon }))`. Unsubscribe on unmount.
- Display: a placeholder map area (large `View` with a grey background labelled "Map View") showing the raw `latitude` and `longitude` with `formatDateTime(updatedAt)`.
- Show a pulsing "Live" indicator while connected.
- If `expo-location` map view is feasible, render a `MapView` using `react-native-maps` if it's available in `package.json`; otherwise the coordinate display is sufficient.
- Back button returns to `BookingDetails`.

---

### `src/hooks/useTickets.ts`
Implement and export:

```
fetchUserTickets(dispatch, userId: string): Promise<void>
```
`supabase.from('tickets').select('*').eq('by_user', userId).order('created_at', { ascending: false })`. Dispatch `setTickets`.

```
fetchAllTickets(dispatch): Promise<void>
```
(Admin only) `supabase.from('tickets').select('*, user:by_user(display_name, email)').order('created_at', { ascending: false })`. Dispatch `setTickets`.

```
createTicket(dispatch, ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Ticket | null>
```
Insert into `tickets`. Dispatch `addTicket`. Return the created ticket.

```
updateTicketStatus(dispatch, ticketId: string, status: TicketStatus): Promise<void>
```
Update `status` and `updated_at`. Dispatch `updateTicketStatus`.

---

### `src/screens/shared/CreateTicketScreen.tsx`
```
CreateTicketScreen()
```
- Form fields:
  - `query_type` — text `Input` (short summary).
  - `category` — picker: General / Booking / Payment / Account / Safety.
  - `issue_description` — multiline `Input` (required, min 20 chars).
- On submit, call `createTicket(dispatch, { query_type, category, issue_description, by_user: currentUserId, priority: 'medium' })`.
- On success, show confirmation alert and navigate back.
- Validation: `issue_description` at least 20 characters.

---

### `src/screens/admin/AdminDashboardScreen.tsx`
```
AdminDashboardScreen()
```
- On mount, fetch summary stats:
  - Total users: `supabase.from('profiles').select('id', { count: 'exact' })`.
  - Open tickets: `supabase.from('tickets').select('id', { count: 'exact' }).neq('status', 'closed')`.
  - Active bookings: `supabase.from('bookings').select('id', { count: 'exact' }).eq('status', 'confirmed')`.
  - New users this week: filter `profiles.created_at > 7 days ago`.
- Display each stat in a `Card` as a large number with a label.
- Buttons: **View Ticket Queue** → `TicketQueue`, **Manage Users** → `UserManagement`.

---

### `src/screens/admin/TicketQueueScreen.tsx`
```
TicketQueueScreen()
```
- Call `fetchAllTickets(dispatch)` on mount.
- Filter tabs: **All**, **Pending**, **Opened**, **Closed**.
- Priority sort: high → medium → low within each tab.
- Each ticket row shows: category `Badge`, query_type, submitter name, priority (coloured), `created_at` relative time, status.
- Tapping a row navigates to `TicketDetail` with `{ ticketId }`.
- Pull-to-refresh.

---

### `src/screens/admin/TicketDetailScreen.tsx`
Props received via navigation: `ticketId: string`.

```
TicketDetailScreen()
```
- Fetch: `supabase.from('tickets').select('*, user:by_user(display_name, email, username)').eq('id', ticketId).single()`.
- Display all ticket fields: submitter info, category, issue description, timestamps.
- **Status Controls**: three buttons — **Open** / **Close** / **Escalate (High Priority)**. Each calls `updateTicketStatus(dispatch, ticketId, newStatus)` or updates `priority`.
- **Message User** button: navigates to `Chat` with thread id `support_{ticketId}` so the admin can reply directly.

---

### `src/screens/admin/UserManagementScreen.tsx`
```
UserManagementScreen()
```
- Fetch all profiles: `supabase.from('profiles').select('*').order('created_at', { ascending: false })`.
- Search bar at top that filters by `username` or `email` client-side.
- Role filter tabs: **All**, **Users**, **Minders**, **Admins**.
- Each row: `Avatar`, username, email, role `Badge`, account_status `Badge`, `created_at`.
- Tapping a user opens an action sheet (bottom modal) with:
  - **Suspend Account** → `supabase.from('profiles').update({ account_status: 'suspended' }).eq('id', userId)`.
  - **Ban Account** → updates `account_status: 'banned'`.
  - **Reactivate** → updates `account_status: 'active'`.
  - **Change Role** → picker to reassign role, updates `role` field.
- Pull-to-refresh.

---

---

## Summary Table

| Person | Branch | Key Files |
|--------|--------|-----------|
| **Aradhya — Foundation** | `feature/foundation` | All `src/types/*.ts`, `src/store/*Slice.ts`, `src/utils/formatDate.ts`, `src/utils/formatPrice.ts`, `src/components/common/Card.tsx`, `Avatar.tsx`, `Badge.tsx`, `Rating.tsx`, `LoadingSpinner.tsx`, all `supabase/migrations/*.sql` |
| **Alaur — Navigation & Profile** | `feature/navigation-profile` | `OwnerNavigator.tsx`, `MinderNavigator.tsx`, `AdminNavigator.tsx`, `AppNavigator.tsx` (update), `ProfileScreen.tsx`, `FavouritesScreen.tsx`, `LeaveReviewScreen.tsx` |
| **Tahrima — Pet Management** | `feature/pet-management` | `PetCard.tsx`, `MedicalRecordCard.tsx`, `OwnerDashboardScreen.tsx`, `AddPetScreen.tsx`, `PetProfileScreen.tsx` |
| **Xinzhu — Listings & Search** | `feature/listings-search` | `ListingCard.tsx`, `MinderCard.tsx`, `FilterBar.tsx`, `useListings.ts`, `SearchMinderScreen.tsx`, `MinderProfileScreen.tsx`, `ListingsScreen.tsx` |
| **Ulina — Bookings** | `feature/bookings` | `BookingCard.tsx`, `BookingStatusBadge.tsx`, `CalendarPicker.tsx`, `useBookings.ts`, `BookingRequestScreen.tsx`, `BookingDetailsScreen.tsx` |
| **William — Minder Features** | `feature/minder` | `MinderDashboardScreen.tsx`, `JobRequestsScreen.tsx`, `JobDetailsScreen.tsx`, `AvailabilityScreen.tsx`, `MinderProfileEditScreen.tsx`, `SessionScreen.tsx` |
| **Rohan — Chat, GPS & Admin** | `feature/chat-gps-admin` | `MessageBubble.tsx`, `ChatInput.tsx`, `useChat.ts`, `ChatScreen.tsx`, `useGPS.ts`, `GPSTrackingScreen.tsx`, `useTickets.ts`, `CreateTicketScreen.tsx`, `AdminDashboardScreen.tsx`, `TicketQueueScreen.tsx`, `TicketDetailScreen.tsx`, `UserManagementScreen.tsx` |

## Dependency Order

```
Aradhya (Foundation)
    └─► Alaur (Navigation) ─────────────────────────────────────────────────────┐
    └─► Tahrima (Pet Management) ───────────────────────────────────────────────┤
    └─► Xinzhu (Listings) ───────────────────────────────────────────────────── ┤
    └─► Ulina (Bookings) ────────────────────────────────────────────────────── ┤
            └─► William (Minder) — needs BookingCard, useBookings from Ulina     ┤
    └─► Rohan (Chat/GPS/Admin)                                                   ┘
                                      └─► All merge into main
```

> **Tip:** Alaur, Tahrima, Xinzhu, Ulina, and Rohan can all start once Aradhya has pushed the types and Redux slices. William should wait for Ulina's `BookingCard` and `useBookings` to be merged, or stub them temporarily.
