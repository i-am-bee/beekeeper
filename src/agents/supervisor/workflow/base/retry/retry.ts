import { Fn, FnErrorResult, RetryOptions, RetryResult } from "./dto.js";

export async function retry<T, P>(
  fn: Fn<T, P>,
  options?: RetryOptions,
): Promise<RetryResult<T>> {
  const { maxRetries, delay } = Object.assign(
    { maxRetries: 3, delay: 0 },
    options,
  );

  const maxAttempts = maxRetries + 1;
  const attempts: FnErrorResult[] = [];
  let payload: P | undefined;
  for (let i = 0; i < maxAttempts; i++) {
    const attemptNo = i + 1;
    const { result, payload: p } = await fn(
      attempts.at(-1),
      attemptNo,
      payload,
    );
    if (result.type === "SUCCESS") {
      return { ...result, attempts };
    }

    if (result.type === "ERROR" && result.escalation) {
      return { ...result, attempts };
    }

    attempts.push(result);
    payload = p;

    if (i < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    type: "ERROR",
    explanation: `Failed after ${maxAttempts} attempts`,
    attempts,
  };
}
