import { BaseStateBuilder } from "@/base/state/base-state-builder.js";
import { StatusBar } from "../shared/status-bar.js";
import { BaseMonitor, ParentInput, ScreenInput } from "./monitor.js";
import blessed from "neo-blessed";

// New interfaces for StatusBar options
export interface StatusBarOptions {
  label?: string;
  updateIntervalMs?: number;
}

export abstract class BaseMonitorWithStatus<
  TStateBuilder extends BaseStateBuilder<any, any>,
> extends BaseMonitor {
  protected contentBox: blessed.Widgets.BoxElement;
  protected statusBar: StatusBar;
  protected _stateBuilder?: TStateBuilder;

  protected get stateBuilder() {
    if (!this._stateBuilder) {
      throw new Error(`Missing state builder`);
    }
    return this._stateBuilder;
  }

  constructor(
    arg: ParentInput | ScreenInput,
    stateBuilder?: TStateBuilder,
    statusBarOptions?: StatusBarOptions,
  ) {
    // Initialize the parent BaseMonitor
    super(arg);

    // Content box
    this.contentBox = blessed.box({
      parent: this.parent,
      width: "100%",
      height: "100%-3",
      left: 0,
      top: 0,
      tags: true,
      mouse: true,
      keys: true,
      vi: true,
    });

    // Add the status bar at the bottom
    this.statusBar = new StatusBar({
      parent: this.parent,
      width: "100%-1",
      height: 3,
      left: 0,
      top: "100%-4",
      label: statusBarOptions?.label || " Status ",
      updateIntervalMs: statusBarOptions?.updateIntervalMs || 1000,
    });

    // Connect state builder events if provided
    if (stateBuilder) {
      this._stateBuilder = stateBuilder;

      stateBuilder.on("log:reset", () => {
        this.reset();
      });

      stateBuilder.on("log:new_line", (line) => {
        this.statusBar.log(line);
      });

      stateBuilder.on("error", (error: Error) => {
        this.statusBar.log(`Error: ${error.message}`);
      });
    }

    // Setup common keyboard shortcuts
    this.screen.key(["escape", "q", "C-c"], () => process.exit(0));
  }

  // Common reset method that can be overridden by child classes
  protected reset(shouldRender = true): void {
    this.statusBar.clearLog();
    this.statusBar.log("Reading initial state from log...");

    if (shouldRender) {
      this.screen.render();
    }
  }
}
