// Post-session review form (RQ31)
//
// Props: revieweeID (minderID)
// State: rating (1–5), comment (string)
//
// Submit: supabase.from('reviews').insert({
//   reviewee_id, reviewer_id: uid, rating, comment, date: now()
// })
//
// Elements:
//   Rating input (star selector 1–5)
//   Input (comment, multiline)
//   Button ('Submit Review')
