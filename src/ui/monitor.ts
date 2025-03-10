import blessed from "neo-blessed";
import { TaskMonitor } from "./task-monitor/monitor.js";
import { AgentMonitor } from "./agent-monitor/monitor.js";
import { BaseMonitor } from "./base/monitor.js";
import { CloseDialog } from "./shared/close-dialog.js";

export class Monitor extends BaseMonitor {
  private agentMonitor: AgentMonitor;
  private taskMonitor: TaskMonitor;
  private closeDialog: CloseDialog;

  constructor(title = "Bee Supervisor Monitor") {
    super({ title });
    this.agentMonitor = new AgentMonitor({
      screen: this.screen,
      parent: blessed.box({
        parent: this.screen,
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
    });

    this.taskMonitor = new TaskMonitor({
      screen: this.screen,
      parent: blessed.box({
        parent: this.screen,
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
    });

    this.closeDialog = new CloseDialog(this.screen);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Add Ctrl+C to quit
    this.screen.key(["escape", "q", "C-c"], () => {
      // If the close dialog is already open, don't do anything
      if (this.closeDialog.isOpen()) {
        return;
      }
      this.closeDialog.show();
    });
  }

  start(dirPath?: string) {
    this.agentMonitor.start(dirPath);
    this.taskMonitor.start(dirPath);
  }
}
