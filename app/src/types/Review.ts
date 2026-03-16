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
