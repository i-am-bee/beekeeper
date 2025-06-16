export interface FnSuccessResult<T> {
  type: "SUCCESS";
  result: T;
}

export interface FnErrorResult {
  type: "ERROR";
  escalation?: boolean;
  explanation: string;
}

export type FnResult<T> = FnSuccessResult<T> | FnErrorResult;

export interface FnResultWithPayload<T, P> {
  result: FnResult<T>;
  payload?: P;
}

export type Fn<T, P> = (
  error: FnErrorResult | undefined,
  attempt: number,
  payload: P | undefined,
) => Promise<FnResultWithPayload<T, P>>;

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
}

export interface RetrySuccessResult<T> extends FnSuccessResult<T> {
  attempts: FnErrorResult[];
}

export interface RetryErrorResult extends FnErrorResult {
  attempts: FnErrorResult[];
  explanation: string;
}

export type RetryResult<T> = RetrySuccessResult<T> | RetryErrorResult;
