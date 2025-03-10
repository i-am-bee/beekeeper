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
  private parentSignal?: AbortSignal;
  private onAbort?: () => void;

  constructor(options?: { parentSignal?: AbortSignal; onAbort?: () => void }) {
    if (options?.parentSignal?.aborted) {
      this.aborted = true;
    } else if (options?.parentSignal) {
      this.parentSignalHandler = () => this.abort();
      options?.parentSignal.addEventListener(
        "abort",
        this.parentSignalHandler,
        {
          once: true,
        },
      );
    }

    this.onAbort = options?.onAbort;
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
      throw new Error(`Set interval on aborted scope attempt`);
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
      throw new Error(`Set timeout on aborted scope attempt`);
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

  clean(): void {
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

  abort(manualAbort = false): void {
    if (this.aborted) {
      throw new Error(`Abort on already aborted scope attempt`);
    }

    this.aborted = true;
    this.clean();

    if (!manualAbort) {
      this.onAbort?.();
    }
  }

  isAborted(): boolean {
    return this.aborted;
  }

  checkIsAborted(onAborted?: () => void): void {
    if (this.isAborted()) {
      onAborted?.();
      throw new AbortError();
    }
  }

  async withAbortChecking<T>(
    operation: () => Promise<T>,
    options?: {
      operationName?: string;
      logger: Logger;
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
    this.onAbort = undefined;
  }

  reset(): void {
    this.clean();
    this.aborted = false;
  }
}
