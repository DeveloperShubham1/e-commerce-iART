/**
 * Retries an async function with exponential backoff.
 * @param {Function} fn - async function to run
 * @param {Object} opts
 * @param {number} opts.retries - max attempts
 * @param {number} opts.baseDelayMs - initial delay
 * @param {Function} [opts.shouldRetry] - (err) => boolean, decide if retry makes sense
 */
export async function withRetry(fn, opts = {}) {
  const { retries = 3, baseDelayMs = 500, shouldRetry = () => true } = opts;

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      const status = err?.response?.status;
      // Don't retry on permanent client errors (bad token, invalid params, etc.)
      const isClientError = status >= 400 && status < 500 && status !== 429;

      if (isClientError || !shouldRetry(err) || attempt === retries) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw lastErr;
}
