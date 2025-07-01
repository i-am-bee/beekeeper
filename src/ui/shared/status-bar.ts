import { EventEmitter } from "events";
import blessed from "neo-blessed";
import { UIColors } from "../colors.js";
import * as st from "../config.js";
import {
  ControllableContainer,
  ControllableElement,
  ControllableScreen,
  ControlsManager,
} from "../controls/controls-manager.js";
import { LogFormatter, LogFormatterOptions } from "./log-line-formatter.js";

export class StatusBar extends EventEmitter {
  private controlsManager: ControlsManager;
  private screen: ControllableScreen;
  private statusBar: ControllableContainer;
  private expandButton: ControllableElement<blessed.Widgets.ButtonElement>;
  private timeDisplay: blessed.Widgets.TextElement;
  private statusText: blessed.Widgets.TextElement;
  private fullscreenLogBox: ControllableContainer;
  private closeButton: ControllableElement<blessed.Widgets.ButtonElement>;
  private logContentBox: blessed.Widgets.BoxElement;
  private logFooter: blessed.Widgets.BoxElement;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastUpdateTimestamp: Date = new Date();
  private isLogBoxVisible = false;
  private logsContent = "";
  private logFormatter: LogFormatter;

  constructor(options: {
    parent: ControllableContainer | ControllableScreen;
    controlsManager: ControlsManager;
    width?: string | number;
    height?: string | number;
    left?: string | number;
    top?: string | number;
    label?: string;
    updateIntervalMs?: number;
    logFormatterOptions?: LogFormatterOptions;
  }) {
    super();

    this.controlsManager = options.controlsManager;

    this.screen = this.controlsManager.screen;
    this.logFormatter = new LogFormatter(options.logFormatterOptions);

    // Create status bar container
    this.statusBar = this.controlsManager.add({
      kind: "container",
      name: "statusBar",
      element: blessed.box({
        parent: options.parent.element,
        width: options.width || "100%-3",
        height: options.height || 3,
        left: options.left || 0,
        top: options.top || "100%-3",
        border: { type: "line" },
        label: options.label || " Status ",
        tags: true,
      }),
      parent: options.parent,
    });

    // Create time display
    this.timeDisplay = blessed.text({
      parent: this.statusBar.element,
      width: 25,
      height: 1,
      left: 1,
      top: 0,
      content: "Last update: Just now",
      tags: true,
    });

    // Create status text
    this.statusText = blessed.text({
      parent: this.statusBar.element,
      width: "70%",
      height: 1,
      left: 27,
      top: 0,
      content: "Ready",
      tags: true,
    });

    // Create expand button
    this.expandButton = this.controlsManager.add({
      kind: "element",
      name: "expandButton",
      element: blessed.button({
        parent: this.statusBar.element,
        mouse: true,
        keys: true,
        shrink: true,
        padding: {
          left: 1,
          right: 1,
        },
        right: 1,
        top: 0,
        name: "expandLogButton",
        content: "Logs",
        style: {
          bg: "blue",
          focus: {
            bg: "cyan",
          },
          hover: {
            bg: "cyan",
          },
        },
      }),
      parent: this.statusBar,
    });

    // Create fullscreen log box container (initially hidden)
    this.fullscreenLogBox = this.controlsManager.add({
      kind: "container",
      name: "messagesBox",
      element: blessed.box({
        parent: options.parent.element,
        width: "100%-1",
        height: "100%-1",
        left: 0,
        top: 0,
        border: { type: "line" },
        label: " Log View ",
        tags: true,
        hidden: true,
      }),
      parent: options.parent,
    });

    // Create scrollable content area for logs
    this.logContentBox = blessed.box({
      parent: this.fullscreenLogBox.element,
      width: "100%-2",
      height: "100%-4", // Leave space for the footer
      left: 0,
      top: 0,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig?.scrollbar || {
        bg: "blue",
      },
      content: "",
    });

    // Create fixed footer for the close button
    this.logFooter = blessed.box({
      parent: this.fullscreenLogBox.element,
      width: "100%-4",
      // height: 3,
      left: 1,
      top: "100%-3",
      tags: true,
    });

    // Create close button inside the footer
    this.closeButton = this.controlsManager.add({
      kind: "element",
      name: "closeButton",
      element: blessed.button({
        parent: this.logFooter,
        mouse: true,
        keys: true,
        shrink: true,
        padding: {
          left: 1,
          right: 1,
        },
        left: "50%",
        top: 0,
        name: "closeLogButton",
        content: "Close",
        style: {
          bg: UIColors.red.dark_red,
          focus: {
            bg: UIColors.red.electric_red,
          },
          hover: {
            bg: UIColors.red.red,
          },
        },
      }),
      parent: this.fullscreenLogBox,
    });

    this.setupEventHandlers();
    this.startUpdateInterval(options.updateIntervalMs || 1000);
    this.screen.element.render();
  }

  private setupEventHandlers(): void {
    // Expand button shows the log box
    this.expandButton.element.on("press", () => {
      this.showLogBox();
    });

    // Close button hides the log box
    this.closeButton.element.on("press", () => {
      this.hideLogBox();
    });

    // Mouse scrolling for log content
    this.logContentBox.on("mouse", (data) => {
      if (data.action === "wheelup") {
        this.logContentBox.scroll(-3);
        this.screen.element.render();
      } else if (data.action === "wheeldown") {
        this.logContentBox.scroll(3);
        this.screen.element.render();
      }
    });

    // Add keyboard navigation for log content
    this.logContentBox.key(["up"], () => {
      this.logContentBox.scroll(-1);
      this.screen.element.render();
    });

    this.logContentBox.key(["down"], () => {
      this.logContentBox.scroll(1);
      this.screen.element.render();
    });

    this.logContentBox.key(["pageup"], () => {
      this.logContentBox.scroll(-this.logContentBox.height || -10);
      this.screen.element.render();
    });

    this.logContentBox.key(["pagedown"], () => {
      this.logContentBox.scroll(Number(this.logContentBox.height) || 10);
      this.screen.element.render();
    });
  }

  private startUpdateInterval(intervalMs: number): void {
    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Start new interval to update the time display
    this.updateInterval = setInterval(() => {
      this.updateTimeDisplay();
      this.screen.element.render();
    }, intervalMs);
  }

  private updateTimeDisplay(): void {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdateTimestamp.getTime();

    let timeAgo;
    if (diff < 1000) {
      timeAgo = "Just now";
    } else if (diff < 60000) {
      timeAgo = `${Math.floor(diff / 1000)}s ago`;
    } else if (diff < 3600000) {
      timeAgo = `${Math.floor(diff / 60000)}m ago`;
    } else {
      timeAgo = `${Math.floor(diff / 3600000)}h ago`;
    }

    this.timeDisplay.setContent(`Last update: ${timeAgo}`);
  }

  private showLogBox(): void {
    this.fullscreenLogBox.element.show();
    this.isLogBoxVisible = true;
    this.fullscreenLogBox.element.setFront();
    this.logContentBox.setContent(this.logsContent);

    // Ensure log content has focus for keyboard navigation
    this.logContentBox.focus();

    // Scroll to bottom when opening
    this.logContentBox.setScrollPerc(100);

    this.screen.element.render();
  }

  private hideLogBox(): void {
    this.fullscreenLogBox.element.hide();
    this.isLogBoxVisible = false;
    this.screen.element.render();
  }

  /**
   * Log a message both to the status text and the log box
   */
  public log(message: string): void {
    // Update timestamp
    this.lastUpdateTimestamp = new Date();

    const formattedMessage = this.logFormatter.format(message);
    const finalMessage = `${st.timestamp(this.lastUpdateTimestamp.toLocaleString())} - ${formattedMessage}\n`;
    this.logsContent += finalMessage;

    // If log box is visible, update its content directly
    if (this.isLogBoxVisible) {
      this.logContentBox.setContent(this.logsContent);
      this.logContentBox.setScrollPerc(100); // Auto-scroll to bottom
    }

    // Update status text (truncate if needed)
    let statusMessage = message;
    statusMessage =
      statusMessage.length > 60
        ? statusMessage.substring(0, 57) + "..."
        : statusMessage;
    this.statusText.setContent(statusMessage);

    // Update time display
    this.updateTimeDisplay();

    // Render screen
    this.screen.element.render();
  }

  /**
   * Clear the log box
   */
  public clearLog(): void {
    this.logsContent = "";
    this.logContentBox.setContent("");
    this.screen.element.render();
  }

  /**
   * Set custom status text without updating timestamp
   */
  public setStatus(status: string): void {
    this.statusText.setContent(status);
    this.screen.element.render();
  }

  /**
   * Stop the update interval when no longer needed
   */
  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
