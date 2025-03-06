import { BaseStateBuilder } from "@/base/state/base-state-builder.js";
import { Runtime } from "@/runtime/runtime.js";
import blessed from "neo-blessed";
import * as chatStyles from "./config.js";
import { ChatRuntimeHandler } from "./runtime-handler.js";
import { BaseMonitorWithStatus } from "../base/monitor-with-status.js";
import { ParentInput, ScreenInput } from "../base/monitor.js";

export class ChatMonitor extends BaseMonitorWithStatus<
  BaseStateBuilder<any, any>
> {
  private chatBox: blessed.Widgets.BoxElement;
  private inputBox: blessed.Widgets.TextareaElement;
  private messagesBox: blessed.Widgets.BoxElement;
  private abortButton: blessed.Widgets.ButtonElement;
  private messages: { role: string; content: string; timestamp: Date }[] = [];
  private runtimeHandler: ChatRuntimeHandler;
  private isProcessing = false;

  constructor(
    arg: ParentInput | ScreenInput,
    runtime: Runtime,
    stateBuilder?: BaseStateBuilder<any, any>,
  ) {
    super(arg, stateBuilder, { label: " Chat Monitor " });
    this.runtimeHandler = new ChatRuntimeHandler(runtime, {
      onMessage: (role, content) => this.addMessage(role, content),
      onStatus: (status) => this.statusBar.log(status),
      onStateChange: (isProcessing) => this.setProcessingState(isProcessing),
    });

    // Main chat container
    this.chatBox = blessed.box({
      parent: this.contentBox,
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      tags: true,
    });

    // Messages area
    this.messagesBox = blessed.box({
      parent: this.chatBox,
      width: "100%",
      height: "100%-5",
      left: 0,
      top: 0,
      tags: true,
      ...chatStyles.getMessagesBoxStyle(),
    });

    // Input area
    this.inputBox = blessed.textarea({
      parent: this.chatBox,
      width: "100%-12", // Make room for abort button
      height: 3,
      left: 0,
      bottom: 0,
      ...chatStyles.getInputBoxStyle(),
    });

    // Abort button
    this.abortButton = blessed.button({
      parent: this.chatBox,
      width: 10,
      height: 3,
      right: 0,
      bottom: 0,
      ...chatStyles.getAbortButtonStyle(),
      tags: true,
      mouse: true,
    });

    this.setupEventHandlers();
    this.screen.render();
  }

  private setupEventHandlers() {
    // Focus input box by default
    this.inputBox.focus();

    // Send message on Enter, support multiline with Shift+Enter
    this.inputBox.key("enter", async (ch, key) => {
      // Check if Shift key is pressed
      if (key.shift) {
        // Insert a newline instead of sending
        this.inputBox.setValue(this.inputBox.getValue() + "\n");
        this.screen.render();
        return;
      }

      const message = this.inputBox.getValue();
      if (message.trim()) {
        await this.sendMessage(message);
        this.inputBox.clearValue();
        this.screen.render();
      }
    });

    // Abort button handler
    this.abortButton.on("press", () => {
      this.abortOperation();
    });

    // Mouse scrolling for messages
    this.messagesBox.on("mouse", (data) => {
      if (data.action === "wheelup") {
        this.messagesBox.scroll(-3);
        this.screen.render();
      } else if (data.action === "wheeldown") {
        this.messagesBox.scroll(3);
        this.screen.render();
      }
    });

    // Add Ctrl+C to quit
    this.screen.key(["escape", "q", "C-c"], () => process.exit(0));

    // Add Ctrl+A as shortcut for abort
    this.screen.key(["C-a"], () => {
      this.abortOperation();
    });

    // Add page up/down for message scrolling
    this.screen.key(["pageup"], () => {
      this.messagesBox.scroll(-this.messagesBox.height);
      this.screen.render();
    });

    this.screen.key(["pagedown"], () => {
      this.messagesBox.scroll(Number(this.messagesBox.height));
      this.screen.render();
    });

    // Add Ctrl+L to clear the chat
    this.screen.key(["C-l"], () => {
      this.reset();
    });
  }

  private async sendMessage(message: string) {
    // Add user message to chat
    this.addMessage("You", message);

    // Send message via runtime handler
    await this.runtimeHandler.sendMessage(message);
  }

  private addMessage(role: string, content: string) {
    const timestamp = new Date();
    this.messages.push({ role, content, timestamp });
    this.updateMessagesDisplay();
  }

  private updateMessagesDisplay() {
    // Format and display all messages
    const formattedMessages = this.messages
      .map((msg) => {
        return (
          chatStyles.formatCompleteMessage(
            msg.timestamp,
            msg.role,
            msg.content,
          ) + "\n"
        );
      })
      .join("\n");

    this.messagesBox.setContent(formattedMessages);
    this.messagesBox.scrollTo(this.messagesBox.getScrollHeight());
    this.screen.render();
  }

  private setProcessingState(isProcessing: boolean) {
    this.isProcessing = isProcessing;

    // Update UI to reflect processing state
    this.inputBox.enableInput();

    // Update abort button
    const buttonStyle = chatStyles.getAbortButtonStyle(isProcessing);
    this.abortButton.style = buttonStyle.style;
    this.abortButton.setContent(buttonStyle.content);

    if (!isProcessing) {
      this.inputBox.focus();
    }

    this.screen.render();
  }

  private abortOperation() {
    if (!this.isProcessing) {
      return;
    }

    this.runtimeHandler.abort();
  }

  // Method to handle external runtime events
  public handleRuntimeEvent(event: {
    type: string;
    message: string;
    source?: string;
  }) {
    const { type, message, source } = event;

    switch (type) {
      case "error":
        this.statusBar.log(`Error: ${message}`);
        this.addMessage(source || "System", `Error: ${message}`);
        break;
      case "info":
        this.statusBar.log(message);
        this.addMessage(source || "System", message);
        break;
      case "warning":
        this.statusBar.log(`Warning: ${message}`);
        this.addMessage(source || "System", `Warning: ${message}`);
        break;
      default:
        this.addMessage(source || "System", message);
        break;
    }

    this.screen.render();
  }

  reset(shouldRender = true): void {
    super.reset(false);
    this.messages = [];
    this.updateMessagesDisplay();
    this.inputBox.clearValue();

    if (shouldRender) {
      this.screen.render();
    }
  }

  // Method to initialize and start the chat monitor
  public async start(): Promise<void> {
    this.statusBar.log(
      "Chat monitor started. Type your message and press Enter to send.",
    );

    // Add welcome messages with keyboard shortcuts
    this.addMessage(
      "System",
      "Chat monitor initialized. You can communicate with the runtime/supervisor agent here.",
    );
    this.addMessage("System", "Keyboard shortcuts:");
    this.addMessage("System", "- Enter: Send message");
    this.addMessage("System", "- Shift+Enter: Add new line in input");
    this.addMessage("System", "- Tab: Switch between input and abort button");
    this.addMessage("System", "- Ctrl+A: Abort current operation");
    this.addMessage("System", "- PageUp/PageDown: Scroll through messages");
    this.addMessage("System", "- Ctrl+L: Clear chat history");
    this.addMessage("System", "- Ctrl+C or q: Quit application");

    this.inputBox.focus();
    this.screen.render();
  }
}
