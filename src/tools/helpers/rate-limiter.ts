/**
 * Rate Limiter Implementation
 * This module provides a rate limiting mechanism to control the number of requests
 * made to a resource within a specified time window.
 *
 * @module RateLimiter
 */

export class RateLimiterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimiterError";
  }
}

// Rate Limiter Implementation
export interface RateLimiterConfig {
  /** Maximum number of requests per time window */
  maxRequests: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs: number;
  /** Strategy for handling rate limit exceeded */
  strategy: "queue" | "reject" | "delay";
  /** Maximum queue size when using 'queue' strategy (default: 100) */
  maxQueueSize?: number;
}

export interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  requestFn: () => Promise<any>;
  timestamp: number;
}

export class RateLimiter {
  private requests: number[] = [];
  private queue: QueuedRequest[] = [];
  private isProcessingQueue = false;

  constructor(private config: RateLimiterConfig) {
    this.config.maxQueueSize = config.maxQueueSize ?? 100;
  }

  /**
   * Clean up old requests outside the current time window
   */
  private cleanupOldRequests(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    this.requests = this.requests.filter(
      (timestamp) => timestamp > windowStart,
    );
  }

  /**
   * Check if we can make a request right now
   */
  private canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.config.maxRequests;
  }

  /**
   * Get time to wait before next request can be made
   */
  private getTimeToWait(): number {
    if (this.canMakeRequest()) {
      return 0;
    }

    this.cleanupOldRequests();
    if (this.requests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...this.requests);
    const timeToWait = oldestRequest + this.config.windowMs - Date.now();
    return Math.max(0, timeToWait);
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      if (!this.canMakeRequest()) {
        const timeToWait = this.getTimeToWait();
        if (timeToWait > 0) {
          await new Promise((resolve) => setTimeout(resolve, timeToWait));
        }
      }

      if (this.canMakeRequest() && this.queue.length > 0) {
        const queuedRequest = this.queue.shift()!;
        this.requests.push(Date.now());

        try {
          const result = await queuedRequest.requestFn();
          queuedRequest.resolve(result);
        } catch (error) {
          queuedRequest.reject(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute a request with rate limiting
   */
  async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    switch (this.config.strategy) {
      case "reject":
        if (!this.canMakeRequest()) {
          throw new RateLimiterError(
            `Rate limit exceeded. Maximum ${this.config.maxRequests} requests per ${this.config.windowMs}ms`,
          );
        }
        this.requests.push(Date.now());
        return requestFn();

      case "delay": {
        const timeToWait = this.getTimeToWait();
        if (timeToWait > 0) {
          await new Promise((resolve) => setTimeout(resolve, timeToWait));
        }
        this.requests.push(Date.now());
        return requestFn();
      }

      case "queue":
        return new Promise<T>((resolve, reject) => {
          if (this.queue.length >= this.config.maxQueueSize!) {
            reject(
              new RateLimiterError(
                `Rate limiter queue is full. Maximum queue size: ${this.config.maxQueueSize}`,
              ),
            );
            return;
          }

          if (this.canMakeRequest() && this.queue.length === 0) {
            // Can execute immediately
            this.requests.push(Date.now());
            requestFn().then(resolve).catch(reject);
          } else {
            // Add to queue
            this.queue.push({
              resolve,
              reject,
              requestFn,
              timestamp: Date.now(),
            });
            this.processQueue().catch(console.error);
          }
        });

      default:
        throw new Error(
          `Unknown rate limiting strategy: ${this.config.strategy}`,
        );
    }
  }

  /**
   * Get current rate limiter statistics
   */
  getStats() {
    this.cleanupOldRequests();
    return {
      currentRequests: this.requests.length,
      maxRequests: this.config.maxRequests,
      queueSize: this.queue.length,
      maxQueueSize: this.config.maxQueueSize,
      canMakeRequest: this.canMakeRequest(),
      timeToNextSlot: this.getTimeToWait(),
    };
  }

  /**
   * Clear all queued requests and reset counters
   */
  reset(): void {
    this.requests = [];
    this.queue.forEach((req) =>
      req.reject(new RateLimiterError("Rate limiter was reset")),
    );
    this.queue = [];
    this.isProcessingQueue = false;
  }
}

// Predefined rate limiter configurations
export const RATE_LIMITER_PRESETS = {
  CONSERVATIVE: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    strategy: "queue" as const,
    maxQueueSize: 50,
  },
  MODERATE: {
    maxRequests: 50,
    windowMs: 60000, // 1 minute
    strategy: "queue" as const,
    maxQueueSize: 1000,
  },
  AGGRESSIVE: {
    maxRequests: 120,
    windowMs: 60000, // 1 minute
    strategy: "delay" as const,
  },
  STRICT: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    strategy: "reject" as const,
  },
};
