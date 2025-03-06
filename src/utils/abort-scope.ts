import { Logger } from "beeai-framework";

export class AbortError extends Error {
  constructor(message = "Operation aborted") {
    super(message);
    this.name = "AbortError";

    // This allows proper instanceof checking in TypeScript
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}

export class AbortScope {
  private intervals = new Set<NodeJS.Timeout>();
  private timeouts = new Set<NodeJS.Timeout>();
  private childControllers = new Set<AbortController>();
  private aborted = false;
  private parentSignalHandler?: () => void;

  constructor(private parentSignal?: AbortSignal) {
    if (parentSignal?.aborted) {
      this.aborted = true;
    } else if (parentSignal) {
      this.parentSignalHandler = () => this.abort();
      parentSignal.addEventListener("abort", this.parentSignalHandler, {
        once: true,
      });
    }
  }

  getSignal(): AbortSignal {
    const controller = this.createChildController();
    return controller.signal;
  }

  setInterval(
    callback: (...args: any[]) => void,
    ms: number,
    ...args: any[]
  ): NodeJS.Timeout {
    if (this.aborted) {
      return null as unknown as NodeJS.Timeout;
    }

    const id = setInterval(callback, ms, ...args);
    this.intervals.add(id);
    return id;
  }

  setTimeout(
    callback: (...args: any[]) => void,
    ms: number,
    ...args: any[]
  ): NodeJS.Timeout {
    if (this.aborted) {
      return null as unknown as NodeJS.Timeout;
    }

    const id = setTimeout(
      (...callbackArgs) => {
        this.timeouts.delete(id);
        callback(...callbackArgs);
      },
      ms,
      ...args,
    );

    this.timeouts.add(id);
    return id;
  }

  clearInterval(id: NodeJS.Timeout): void {
    if (id) {
      clearInterval(id);
      this.intervals.delete(id);
    }
  }

  clearTimeout(id: NodeJS.Timeout): void {
    if (id) {
      clearTimeout(id);
      this.timeouts.delete(id);
    }
  }

  createChildController(): AbortController {
    if (this.aborted) {
      const controller = new AbortController();
      controller.abort();
      return controller;
    }

    const controller = new AbortController();
    this.childControllers.add(controller);
    return controller;
  }

  abort(): void {
    if (this.aborted) {
      return;
    }

    this.aborted = true;

    // Clear all intervals
    for (const id of this.intervals) {
      clearInterval(id);
    }
    this.intervals.clear();

    // Clear all timeouts
    for (const id of this.timeouts) {
      clearTimeout(id);
    }
    this.timeouts.clear();

    // Abort all child controllers
    for (const controller of this.childControllers) {
      controller.abort();
    }
    this.childControllers.clear();
  }

  isAborted(): boolean {
    return this.aborted;
  }

  checkIsAborted(): void {
    if (this.isAborted()) {
      throw new AbortError();
    }
  }

  async withAbortChecking<T>(
    operation: () => Promise<T>,
    options?: {
      operationName?: string;
      logger?: Logger;
    },
  ): Promise<T> {
    const logger = options?.logger;
    const opName = options?.operationName || "operation";

    logger?.debug(`Starting ${opName}`);
    this.checkIsAborted();

    try {
      const result = await (this.parentSignal
        ? Promise.race([
            operation(),
            new Promise<never>((_, reject) => {
              const abortHandler = () => {
                logger?.info(`${opName} was aborted via parent signal`);
                reject(new AbortError());
              };
              this.parentSignal!.addEventListener("abort", abortHandler, {
                once: true,
              });
            }),
          ])
        : operation());

      logger?.debug(`Successfully completed ${opName}`);
      return result;
    } catch (error) {
      if (error instanceof AbortError) {
        logger?.info(`${opName} was aborted`);
      } else {
        logger?.error(error, `Error occurred during ${opName}`);
      }
      throw error;
    }
  }

  async sleep(ms: number): Promise<void> {
    this.checkIsAborted();

    return new Promise((resolve, reject) => {
      const timeoutId = this.setTimeout(() => {
        resolve();
      }, ms);

      if (this.parentSignal) {
        const abortHandler = () => {
          this.clearTimeout(timeoutId);
          reject(new AbortError());
        };

        this.parentSignal.addEventListener("abort", abortHandler, {
          once: true,
        });
      }
    });
  }

  dispose(): void {
    if (this.parentSignal && this.parentSignalHandler) {
      this.parentSignal.removeEventListener("abort", this.parentSignalHandler);
      this.parentSignalHandler = undefined;
    }

    this.abort(); // Clean up all resources
  }
}
