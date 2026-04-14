/**
 * Stable DM thread id for two user profile UUIDs (order-independent).
 * Use everywhere Chat is opened so owner ↔ minder always share one thread.
 */
export function dmThreadId(userIdA: string, userIdB: string): string {
  return userIdA < userIdB ? `${userIdA}_${userIdB}` : `${userIdB}_${userIdA}`
}

const SUPPORT_THREAD_PREFIX = 'support_'
/** One support chat per customer: `support_user_<profileId>` (not per ticket). */
const SUPPORT_USER_PREFIX = 'support_user_'

/** Unified support thread for a member — all tickets post into this chat. */
export function getSupportThreadIdForCustomer(customerUserId: string): string {
  return `${SUPPORT_USER_PREFIX}${customerUserId}`
}

/** Returns the customer profile id for unified support threads. */
export function parseSupportCustomerIdFromThread(threadId: string): string | null {
  if (!threadId.startsWith(SUPPORT_USER_PREFIX)) return null
  const id = threadId.slice(SUPPORT_USER_PREFIX.length)
  return id.length > 0 ? id : null
}

/**
 * Legacy: per-ticket thread `support_<ticketUuid>` (before unified support chat).
 * Returns `null` for `support_user_*` threads.
 */
export function parseSupportTicketIdFromThread(threadId: string): string | null {
  if (!threadId.startsWith(SUPPORT_THREAD_PREFIX)) return null
  if (threadId.startsWith(SUPPORT_USER_PREFIX)) return null
  const id = threadId.slice(SUPPORT_THREAD_PREFIX.length)
  return id.length > 0 ? id : null
}
