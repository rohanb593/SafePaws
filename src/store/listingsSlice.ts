import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { DayCode } from '../constants/weekdays'
import { Listing } from '../types/Listing'

/** Find a Pet Minder search filters (also stored in Redux for refetch on tab focus). */
export interface SearchFilters {
  postcode?: string
  animal?: string
  maxPrice?: number
  day?: DayCode
  timeFrom?: string
  timeTo?: string
}

interface ListingsState {
  /** Minders search results (Find a Pet Minder) — do not use for "My Listings". */
  listings: Listing[]
  /** Current user's listings only — separate from search so tabs do not overwrite each other. */
  myListings: Listing[]
  activeFilters: SearchFilters
  loading: boolean
  myListingsLoading: boolean
  error: string | null
}

const initialState: ListingsState = {
  listings: [],
  myListings: [],
  activeFilters: {},
  loading: false,
  myListingsLoading: false,
  error: null,
}

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListings(state, action: PayloadAction<Listing[]>) {
      state.listings = action.payload
      state.loading = false
    },
    setMyListings(state, action: PayloadAction<Listing[]>) {
      state.myListings = action.payload
      state.myListingsLoading = false
    },
    setFilters(state, action: PayloadAction<SearchFilters>) {
      state.activeFilters = action.payload
    },
    clearFilters(state) {
      state.activeFilters = {}
    },
    addListing(state, action: PayloadAction<Listing>) {
      state.listings.unshift(action.payload)
    },
    removeListing(state, action: PayloadAction<string>) {
      state.listings = state.listings.filter((l) => l.id !== action.payload)
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setMyListingsLoading(state, action: PayloadAction<boolean>) {
      state.myListingsLoading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const {
  setListings,
  setMyListings,
  setFilters,
  clearFilters,
  addListing,
  removeListing,
  setLoading,
  setMyListingsLoading,
  setError,
} = listingsSlice.actions
export default listingsSlice.reducer
