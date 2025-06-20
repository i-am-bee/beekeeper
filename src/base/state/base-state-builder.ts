import { EventEmitter } from "events";
import { createReadStream, FSWatcher, watch, statSync } from "fs";
import { createInterface } from "readline";
import { z } from "zod";
import { LogInitSchema } from "./dto.js";

export interface StateUpdateEvent {
  type: string;
  ids?: string[];
}

interface StateBuilderEvents {
  "log:reset": () => void;
  "log:new_line": (line: string) => void;
  "state:updated": (update: StateUpdateEvent) => void;
  error: (error: Error) => void;
}

export abstract class BaseStateBuilder<
  TSchema extends z.ZodType,
  TState extends Record<string, any>,
> extends EventEmitter {
  protected state: TState;
  private readonly updateSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    data: TSchema;
  }>;
  private watcher: FSWatcher | null = null;
  private currentPosition = 0;
  private lastKnownSize = 0;
  private isProcessing = false;
  private processingQueue: (() => Promise<void>)[] = [];
  private isWatching = false;

  constructor(
    protected readonly dataSchema: TSchema,
    initialState: TState,
  ) {
    super();
    this.state = initialState;
    this.updateSchema = z.object({
      timestamp: z.date(),
      data: this.dataSchema,
    });
  }

  public on<K extends keyof StateBuilderEvents>(
    event: K,
    listener: StateBuilderEvents[K],
  ): this {
    return super.on(event, listener);
  }

  public emit<K extends keyof StateBuilderEvents>(
    event: K,
    ...args: Parameters<StateBuilderEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public getState(): TState {
    return this.state;
  }

  private async processNextInQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    try {
      const nextProcess = this.processingQueue.shift();
      if (nextProcess) {
        await nextProcess();
      }
    } finally {
      this.isProcessing = false;
      if (this.processingQueue.length > 0) {
        await this.processNextInQueue();
      }
    }
  }

  private queueProcess(process: () => Promise<void>): void {
    this.processingQueue.push(process);
    if (!this.isProcessing) {
      this.processNextInQueue().catch((error) => {
        this.emit(
          "error",
          new Error(`Queue processing error: ${error.message}`),
        );
      });
    }
  }

  public async watchLogFile(filePath: string): Promise<void> {
    if (this.isWatching) {
      throw new Error("Already watching a file");
    }

    try {
      this.isWatching = true;

      // Get initial file size
      const stats = statSync(filePath);
      this.lastKnownSize = stats.size;

      // Initial read of the entire file
      await this.processEntireFile(filePath);

      // Set up file watcher
      this.watcher = watch(
        filePath,
        { persistent: true },
        async (eventType) => {
          if (eventType === "change") {
            this.queueProcess(async () => {
              const currentStats = statSync(filePath);
              const currentSize = currentStats.size;

              // Check if file was truncated
              if (currentSize < this.lastKnownSize) {
                // File was truncated, reset position and process entire file
                this.currentPosition = 0;
                await this.processEntireFile(filePath);
              } else {
                // Normal append case
                await this.processFileChanges(filePath);
              }

              this.lastKnownSize = currentSize;
            });
          }
        },
      );

      this.watcher.on("error", (error) => {
        this.emit("error", new Error(`File watch error: ${error.message}`));
      });
    } catch (error) {
      this.isWatching = false;
      if (error instanceof Error) {
        this.emit(
          "error",
          new Error(`Failed to start file watching: ${error.message}`),
        );
      }
      throw error;
    }
  }

  public stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isWatching = false;
    this.processingQueue = [];
  }

  private async processEntireFile(filePath: string): Promise<void> {
    try {
      // Reset state before processing entire file
      this.reset();

      const fileStream = createReadStream(filePath);
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      this.currentPosition = 0;

      for await (const line of rl) {
        this.currentPosition += Buffer.byteLength(line) + 1; // +1 for newline
        await this.processLogLine(line);
      }

      // Emit state update after processing entire file
      this.emit("state:updated", { type: "full" });
    } catch (error) {
      if (error instanceof Error) {
        this.emit(
          "error",
          new Error(`Failed to process entire file: ${error.message}`),
        );
      }
      throw error;
    }
  }

  private async processFileChanges(filePath: string): Promise<void> {
    try {
      const fileStream = createReadStream(filePath, {
        start: this.currentPosition,
      });

      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let hasUpdates = false;
      for await (const line of rl) {
        this.currentPosition += Buffer.byteLength(line) + 1; // +1 for newline
        await this.processLogLine(line);
        hasUpdates = true;
      }

      if (hasUpdates) {
        this.emit("state:updated", { type: "full" });
      }
    } catch (error) {
      if (error instanceof Error) {
        this.emit(
          "error",
          new Error(`Failed to process file changes: ${error.message}`),
        );
      }
      throw error;
    }
  }

  private async processLogLine(line: string): Promise<void> {
    this.emit("log:new_line", line);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch (e) {
        console.error(e);
        this.emit("error", new Error(`Failed to parse JSON: ${line}`));
        return;
      }

      // Try parsing as init log first
      const initResult = LogInitSchema.safeParse(parsed);
      if (initResult.success) {
        this.reset();
        this.emit("log:reset");
        return;
      }

      // If not init log, try parsing as update
      const updateResult = this.updateSchema.safeParse(parsed);
      if (updateResult.success) {
        this.processStateUpdate(updateResult.data.data);
        return;
      }

      this.emit(
        "error",
        new Error(`Invalid log entry - neither init nor update: ${line}`),
      );
    } catch (error) {
      if (error instanceof Error) {
        this.emit(
          "error",
          new Error(`Failed to process log line: ${error.message}`),
        );
      }
    }
  }

  protected abstract processStateUpdate(data: z.infer<TSchema>): void;
  protected abstract reset(): void;
}
