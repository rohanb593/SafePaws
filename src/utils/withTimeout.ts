/**
 * Rejects after `ms` if `promise` does not settle — prevents infinite spinners on hung fetches.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, timedOutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(timedOutMessage)), ms)
    promise.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (e) => {
        clearTimeout(id)
        reject(e)
      }
    )
  })
}
