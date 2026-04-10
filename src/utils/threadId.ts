/**
 * Stable DM thread id for two user profile UUIDs (order-independent).
 * Use everywhere Chat is opened so owner ↔ minder always share one thread.
 */
export function dmThreadId(userIdA: string, userIdB: string): string {
  return userIdA < userIdB ? `${userIdA}_${userIdB}` : `${userIdB}_${userIdA}`
}
