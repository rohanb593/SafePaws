import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Listing } from '../types/Listing'

interface SearchFilters {
  location?: string
  animal?: string
  listing_type?: 'owner_listing' | 'minder_listing'
  maxPrice?: number
}

interface ListingsState {
  listings: Listing[]
  activeFilters: SearchFilters
  loading: boolean
  error: string | null
}

const initialState: ListingsState = {
  listings: [],
  activeFilters: {},
  loading: false,
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
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const { setListings, setFilters, clearFilters, addListing, removeListing, setLoading, setError } =
  listingsSlice.actions
export default listingsSlice.reducer
