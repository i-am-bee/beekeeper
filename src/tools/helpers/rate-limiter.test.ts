import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimiter, RateLimiterError } from "./rate-limiter.js";

// Mock function to simulate API calls
const createMockApiCall = (delay = 10, shouldFail = false) => {
  return vi.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (shouldFail) {
      throw new Error("API call failed");
    }
    return { success: true, timestamp: Date.now() };
  });
};

// Helper to advance timers and run pending async operations
const advanceTimers = async (ms: number) => {
  vi.advanceTimersByTime(ms);
  await vi.runOnlyPendingTimersAsync();
};

// Helper to run a function and then advance timers to let it complete
const runWithAdvancedTimers = async <T>(
  fn: () => Promise<T>,
  ms = 50,
): Promise<T> => {
  const promise = fn(); // Start the async operation first
  vi.advanceTimersByTime(ms); // Then advance timers
  await vi.runOnlyPendingTimersAsync(); // Run the pending timers
  return promise; // Return the original promise
};

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Reject Strategy", () => {
    it("should allow requests within limit", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 5000,
        strategy: "reject",
      });

      const mockApi = createMockApiCall();

      // Should allow 3 requests
      const results = await runWithAdvancedTimers(
        () =>
          Promise.all(
            Array.from({ length: 3 }, () =>
              rateLimiter.executeRequest(mockApi),
            ),
          ),
        50,
      );

      expect(results).toHaveLength(3);
      expect(mockApi).toHaveBeenCalledTimes(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it("should reject requests that exceed limit", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 5000,
        strategy: "reject",
      });

      const mockApi = createMockApiCall();

      // First 2 requests should succeed
      await runWithAdvancedTimers(
        () =>
          Promise.all(
            Array.from({ length: 2 }, () =>
              rateLimiter.executeRequest(mockApi),
            ),
          ),
        50,
      );

      // Third request should be rejected
      await expect(
        runWithAdvancedTimers(() => rateLimiter.executeRequest(mockApi), 50),
      ).rejects.toThrow(RateLimiterError);

      expect(mockApi).toHaveBeenCalledTimes(2);
    });

    it("should reset after time window passes", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 5000,
        strategy: "reject",
      });

      const mockApi = createMockApiCall();

      // First 2 requests should succeed
      await runWithAdvancedTimers(
        () =>
          Promise.all(
            Array.from({ length: 2 }, () =>
              rateLimiter.executeRequest(mockApi),
            ),
          ),
        50,
      );

      // Third Should be rejected
      await expect(
        runWithAdvancedTimers(() => rateLimiter.executeRequest(mockApi)),
      ).rejects.toThrow(RateLimiterError);

      // Advance time by window duration
      vi.advanceTimersByTime(5001);

      // Should work again
      const result = await runWithAdvancedTimers(() =>
        rateLimiter.executeRequest(mockApi),
      );
      expect(result.success).toBe(true);
      expect(mockApi).toHaveBeenCalledTimes(3);
    });
  });

  describe("Delay Strategy", () => {
    it("should delay requests that exceed limit", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        strategy: "delay",
      });

      const mockApi = createMockApiCall();

      // First 2 requests should execute immediately
      await runWithAdvancedTimers(
        () =>
          Promise.all(
            Array.from({ length: 2 }, () =>
              rateLimiter.executeRequest(mockApi),
            ),
          ),
        50,
      );

      // Third request should be delayed
      const result = await runWithAdvancedTimers(
        () => rateLimiter.executeRequest(mockApi),
        1000,
      );
      expect(result.success).toBe(true);
      expect(mockApi).toHaveBeenCalledTimes(3);
    });

    it("should calculate correct delay time", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 2000,
        strategy: "delay",
      });

      const mockApi = createMockApiCall();

      // Record when requests start and complete
      const timestamps: number[] = [];

      const trackingMockApi = vi.fn(async () => {
        const result = await mockApi();
        timestamps.push(Date.now());
        return result;
      });

      // First request
      await runWithAdvancedTimers(
        () => rateLimiter.executeRequest(trackingMockApi),
        50,
      );

      // Second request should be delayed
      const delayedPromise = rateLimiter.executeRequest(trackingMockApi);

      // Advance by full window + buffer to ensure completion
      await advanceTimers(2100);

      await delayedPromise;

      // Verify both requests completed
      expect(trackingMockApi).toHaveBeenCalledTimes(2);

      // Verify there was a significant delay between requests
      expect(timestamps).toHaveLength(2);
      const timeDiff = timestamps[1] - timestamps[0];
      expect(timeDiff).toBeGreaterThanOrEqual(2000);
    });
  });

  describe("Queue Strategy", () => {
    it("should queue requests that exceed limit", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        strategy: "queue",
        maxQueueSize: 5,
      });

      const mockApi = createMockApiCall(50);
      const results: any[] = [];

      // Start 5 requests simultaneously
      const promises = Array.from({ length: 5 }, async (_, index) => {
        const result = await rateLimiter.executeRequest(mockApi);
        results.push({ ...result, order: index });
        return result;
      });

      // Check stats before processing
      let stats = rateLimiter.getStats();
      expect(stats.queueSize).toBeGreaterThan(0); // Some should be queued

      // Process the queue through multiple rate limit windows
      // We need 3 windows total: 2 + 2 + 1 = 5 requests
      for (let i = 0; i < 3; i++) {
        await advanceTimers(1000);
      }

      await Promise.all(promises);

      expect(mockApi).toHaveBeenCalledTimes(5);
      expect(results).toHaveLength(5);

      // Final stats should show empty queue
      stats = rateLimiter.getStats();
      expect(stats.queueSize).toBe(0);
    });

    it("should reject requests when queue is full", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        strategy: "queue",
        maxQueueSize: 2,
      });

      const mockApi = createMockApiCall(100);

      // First request should execute immediately
      const firstPromise = rateLimiter.executeRequest(mockApi);

      // Next 2 should be queued
      const secondPromise = rateLimiter.executeRequest(mockApi);
      const thirdPromise = rateLimiter.executeRequest(mockApi);

      // Fourth should be rejected (queue full)
      await expect(rateLimiter.executeRequest(mockApi)).rejects.toThrow(
        RateLimiterError,
      );

      // Complete the first request
      await advanceTimers(100);
      await firstPromise;

      // Process the queued requests
      await advanceTimers(1000);
      await Promise.all([secondPromise, thirdPromise]);

      expect(mockApi).toHaveBeenCalledTimes(3);
    });

    it("should process queue in order", async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 500,
        strategy: "queue",
        maxQueueSize: 10,
      });

      const results: number[] = [];
      const createOrderedApiCall = (order: number) => async () => {
        results.push(order);
        return { order };
      };

      // Queue multiple requests
      const promises = Array.from({ length: 4 }, (_, i) =>
        rateLimiter.executeRequest(createOrderedApiCall(i)),
      );

      // Process the queue by advancing through each rate limit window
      for (let i = 0; i < 4; i++) {
        await advanceTimers(500);
      }

      await Promise.all(promises);

      // Results should be in order
      expect(results).toEqual([0, 1, 2, 3]);
    });

    // // More comprehensive queue test:
    // it("should handle complex queue scenarios", async () => {
    //   const rateLimiter = new RateLimiter({
    //     maxRequests: 2,
    //     windowMs: 1000,
    //     strategy: "queue",
    //     maxQueueSize: 8,
    //   });

    //   const mockApi = createMockApiCall(50);

    //   // Start 8 requests (2 immediate, 6 queued)
    //   const promises = Array.from({ length: 8 }, () =>
    //     rateLimiter.executeRequest(mockApi),
    //   );

    //   // Should reject the 9th request (queue full)
    //   await expect(rateLimiter.executeRequest(mockApi)).rejects.toThrow(
    //     RateLimiterError,
    //   );

    //   // Process all requests - need enough time for 4 windows (8 requests ÷ 2 per window)
    //   await advanceTimers(5000); // 4 windows + buffer

    //   await Promise.all(promises);

    //   expect(mockApi).toHaveBeenCalledTimes(8);

    //   // After completion, new requests should work immediately
    //   const newResult = await runWithAdvancedTimers(
    //     () => rateLimiter.executeRequest(mockApi),
    //     100,
    //   );

    //   expect(newResult.success).toBe(true);
    //   expect(mockApi).toHaveBeenCalledTimes(9);
    // });
  });

  // describe("Error Handling", () => {
  //   it("should handle API errors in reject strategy", async () => {
  //     const rateLimiter = new RateLimiter({
  //       maxRequests: 5,
  //       windowMs: 1000,
  //       strategy: "reject",
  //     });

  //     const mockApi = createMockApiCall(10, true);

  //     await expect(rateLimiter.executeRequest(mockApi)).rejects.toThrow(
  //       "API call failed",
  //     );
  //   });

  //   it("should handle API errors in queue strategy", async () => {
  //     const rateLimiter = new RateLimiter({
  //       maxRequests: 1,
  //       windowMs: 1000,
  //       strategy: "queue",
  //     });

  //     const mockApi = createMockApiCall(10, true);

  //     await expect(rateLimiter.executeRequest(mockApi)).rejects.toThrow(
  //       "API call failed",
  //     );
  //   });
  // });

  // describe("Statistics and Monitoring", () => {
  //   it("should provide accurate statistics", async () => {
  //     const rateLimiter = new RateLimiter({
  //       maxRequests: 3,
  //       windowMs: 1000,
  //       strategy: "queue",
  //       maxQueueSize: 5,
  //     });

  //     const mockApi = createMockApiCall(100);

  //     // Initial stats
  //     let stats = rateLimiter.getStats();
  //     expect(stats.currentRequests).toBe(0);
  //     expect(stats.queueSize).toBe(0);
  //     expect(stats.canMakeRequest).toBe(true);

  //     // Make some requests
  //     rateLimiter.executeRequest(mockApi);
  //     rateLimiter.executeRequest(mockApi);
  //     rateLimiter.executeRequest(mockApi);

  //     // These should be queued
  //     rateLimiter.executeRequest(mockApi);
  //     rateLimiter.executeRequest(mockApi);

  //     stats = rateLimiter.getStats();
  //     expect(stats.maxRequests).toBe(3);
  //     expect(stats.maxQueueSize).toBe(5);
  //   });

  //   it("should reset properly", async () => {
  //     const rateLimiter = new RateLimiter({
  //       maxRequests: 1,
  //       windowMs: 1000,
  //       strategy: "queue",
  //     });

  //     const mockApi = createMockApiCall(100);

  //     // Make requests
  //     rateLimiter.executeRequest(mockApi);
  //     const queuedPromise = rateLimiter.executeRequest(mockApi);

  //     // Reset should clear everything
  //     rateLimiter.reset();

  //     // Queued request should be rejected
  //     await expect(queuedPromise).rejects.toThrow("Rate limiter was reset");

  //     // Stats should be clean
  //     const stats = rateLimiter.getStats();
  //     expect(stats.currentRequests).toBe(0);
  //     expect(stats.queueSize).toBe(0);
  //     expect(stats.canMakeRequest).toBe(true);
  //   });
  // });

  // describe("Presets", () => {
  //   it("should work with CONSERVATIVE preset", async () => {
  //     const rateLimiter = new RateLimiter(RATE_LIMITER_PRESETS.CONSERVATIVE);
  //     const mockApi = createMockApiCall();

  //     expect(rateLimiter.getStats().maxRequests).toBe(30);

  //     // Should handle requests up to limit
  //     const promises = Array.from({ length: 30 }, () =>
  //       rateLimiter.executeRequest(mockApi),
  //     );

  //     // Process the queue
  //     for (let i = 0; i < 10; i++) {
  //       vi.advanceTimersByTime(1000);
  //       await vi.runOnlyPendingTimersAsync();
  //     }

  //     await Promise.all(promises);
  //     expect(mockApi).toHaveBeenCalledTimes(30);
  //   });

  //   it("should work with STRICT preset", async () => {
  //     const rateLimiter = new RateLimiter(RATE_LIMITER_PRESETS.STRICT);
  //     const mockApi = createMockApiCall();

  //     // Should reject after limit
  //     const promises = Array.from({ length: 30 }, () =>
  //       rateLimiter.executeRequest(mockApi),
  //     );

  //     const results = await Promise.allSettled(promises);

  //     const successful = results.filter((r) => r.status === "fulfilled");
  //     const rejected = results.filter((r) => r.status === "rejected");

  //     expect(successful).toHaveLength(30);
  //     expect(rejected).toHaveLength(0);

  //     // 31st request should be rejected
  //     await expect(rateLimiter.executeRequest(mockApi)).rejects.toThrow(
  //       RateLimiterError,
  //     );
  //   });
  // });

  // describe("Real-time Behavior Simulation", () => {
  //   it("should handle burst traffic correctly", async () => {
  //     const rateLimiter = new RateLimiter({
  //       maxRequests: 5,
  //       windowMs: 1000,
  //       strategy: "delay",
  //     });

  //     const mockApi = createMockApiCall(10);

  //     // Send 10 requests in quick succession
  //     const promises = Array.from({ length: 10 }, () =>
  //       rateLimiter.executeRequest(mockApi),
  //     );

  //     // Process all requests by advancing time
  //     for (let i = 0; i < 10; i++) {
  //       vi.advanceTimersByTime(200);
  //       await vi.runOnlyPendingTimersAsync();
  //     }

  //     await Promise.all(promises);
  //     expect(mockApi).toHaveBeenCalledTimes(10);
  //   });
  // });
});
