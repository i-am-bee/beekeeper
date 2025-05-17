import blessed from "neo-blessed";
import { TaskMonitor } from "./task-monitor/monitor.js";
import { AgentMonitor } from "./agent-monitor/monitor.js";
import { ContainerComponent } from "./base/monitor.js";
import { CloseDialog } from "./shared/close-dialog.js";
import { ControllableContainer } from "./controls/controls-manager.js";
import { Logger } from "beeai-framework";

export class Monitor extends ContainerComponent {
  private agentMonitorContainer: ControllableContainer;
  private agentMonitor: AgentMonitor;
  private taskMonitor: TaskMonitor;
  private taskMonitorContainer: ControllableContainer;
  private closeDialog: CloseDialog;

  constructor(title: string, logger: Logger) {
    super({ kind: "screen", title }, logger);

    this.agentMonitorContainer = this.controlsManager.add({
      kind: "container",
      name: "agentMonitorContainer",
      element: blessed.box({
        parent: this.screen.element,
        width: "50%",
        height: "100%",
        left: 0,
        top: 0,
        mouse: true,
        keys: true,
        vi: true,
        border: { type: "bg" },
        label: "■■■ AGENT MONITOR ■■■",
      }),
      parent: this.screen,
    });

    this.agentMonitor = new AgentMonitor(
      {
        kind: "parent",
        parent: this.agentMonitorContainer,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    this.taskMonitorContainer = this.controlsManager.add({
      kind: "container",
      name: "agentMonitorContainer",
      element: blessed.box({
        parent: this.screen.element,
        width: "50%",
        height: "100%",
        left: "50%",
        top: 0,
        mouse: true,
        keys: true,
        vi: true,
        border: { type: "bg" },
        label: "■■■ TASK MONITOR ■■■",
      }),
      parent: this.screen,
    });

    this.taskMonitor = new TaskMonitor(
      {
        kind: "parent",
        parent: this.taskMonitorContainer,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    this.closeDialog = new CloseDialog(this.controlsManager);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Add Ctrl+C to quit
    this.screen.element.key(["escape", "q", "C-c"], () => {
      // If the close dialog is already open, don't do anything
      if (this.closeDialog.isOpen()) {
        return;
      }
      this.closeDialog.show(this.screen.id);
    });
  }

  start(dirPath?: string) {
    this.agentMonitor.start(dirPath);
    this.taskMonitor.start(dirPath);
  }
}
