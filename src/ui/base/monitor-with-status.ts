import { BaseStateBuilder } from "@/base/state/base-state-builder.js";
import { StatusBar } from "../shared/status-bar.js";
import { ContainerComponent, ParentInput, ScreenInput } from "./monitor.js";
import blessed from "neo-blessed";
import { ControllableContainer } from "../controls/controls-manager.js";
import { Logger } from "beeai-framework";

// New interfaces for StatusBar options
export interface StatusBarOptions {
  label?: string;
  updateIntervalMs?: number;
}

export abstract class MonitorWithStatus<
  TStateBuilder extends BaseStateBuilder<any, any>,
> extends ContainerComponent {
  protected contentBox: ControllableContainer;
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
    logger: Logger,
    stateBuilder?: TStateBuilder,
    statusBarOptions?: StatusBarOptions,
  ) {
    // Initialize the parent BaseMonitor
    super(arg, logger);

    // Content box
    this.contentBox = this.controlsManager.add({
      kind: "container",
      name: "contentBox",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: "100%-3",
        left: 0,
        top: 0,
        tags: true,
        mouse: true,
        keys: true,
        vi: true,
      }),
      parent: this.parent,
    });

    // Add the status bar at the bottom
    this.statusBar = new StatusBar({
      parent: this.parent,
      controlsManager: this.controlsManager,
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
  }

  // Common reset method that can be overridden by child classes
  protected reset(shouldRender = true): void {
    this.statusBar.clearLog();
    this.statusBar.log("Reading initial state from log...");

    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
