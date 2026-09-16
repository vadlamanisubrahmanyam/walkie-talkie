// Races a promise against a timeout so a hung network call (e.g. a
// misconfigured transport, a dead connection with no error/close event)
// surfaces as a clear error after N seconds instead of spinning forever.
export function withTimeout(promise, ms, timeoutMessage) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
