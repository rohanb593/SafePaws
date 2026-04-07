// Review — written after session completion (RQ31)
//
// Table: reviews
// Columns:
//   id: string (uuid, primary key)
//   reviewer_id: string (uuid, FK → profiles.id)
//   reviewee_id: string (uuid, FK → profiles.id)
//   rating: number (1–5, CHECK constraint)
//   comment: string
//   date: string (ISO 8601)
//
// RLS: any authenticated user can read; only reviewer can insert their own
//
// Exports: Review interface, ReviewInput interface
export interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  booking_id: string | null
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  date: string
}

export interface ReviewInput {
  reviewer_id: string
  reviewee_id: string
  booking_id: string | null
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
}

