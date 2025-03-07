import blessed from "neo-blessed";
import { BaseMonitor, ParentInput, ScreenInput } from "../base/monitor.js";
import * as chatStyles from "./config.js";
import * as st from "../config.js";
import { Runtime } from "@/runtime/runtime.js";
import { ChatRuntimeHandler } from "./runtime-handler.js";

export class ChatMonitor extends BaseMonitor {
  private chatBox: blessed.Widgets.BoxElement;
  private inputBox: blessed.Widgets.TextareaElement;
  private messagesBox: blessed.Widgets.BoxElement;
  private sendButton: blessed.Widgets.ButtonElement;
  private abortButton: blessed.Widgets.ButtonElement;
  private messages: { role: string; content: string; timestamp: Date }[] = [];
  private runtimeHandler: ChatRuntimeHandler;
  private isProcessing = false;
  private lastInputValue = ""; // Track the last value
  private inputValueCheckInterval: NodeJS.Timeout | null = null;

  constructor(arg: ParentInput | ScreenInput, runtime: Runtime) {
    super(arg);
    this.runtimeHandler = new ChatRuntimeHandler(runtime, {
      onMessage: (role, content) => this.addMessage(role, content),
      onStatus: (status) => this.addMessage("System", status),
      onStateChange: (isProcessing) => this.setProcessingState(isProcessing),
    });

    // Main chat container
    this.chatBox = blessed.box({
      parent: this.parent,
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
      height: 5,
      left: 0,
      top: "100%-5",
      ...chatStyles.getInputBoxStyle(),
      scrollbar: st.UIConfig.scrollbar,
    });

    // Send/abort button
    this.sendButton = blessed.button({
      parent: this.chatBox,
      width: 10,
      height: 3,
      left: "100%-11",
      top: "100%-4",
      ...chatStyles.getSendButtonStyle(true),
      tags: true,
      mouse: true,
    });

    this.abortButton = blessed.button({
      parent: this.chatBox,
      width: 10,
      height: 3,
      left: "50%-5",
      top: "100%-4",
      ...chatStyles.getAbortButtonStyle(),
      tags: true,
      mouse: true,
      hidden: true,
    });

    this.setupEventHandlers();
    this.setProcessingState(false);
  }

  private setupEventHandlers() {
    this.inputBox.key("enter", async (ch, key) => {
      // Check if Shift key is pressed
      if (key.shift) {
        // Insert a newline instead of sending
        this.inputBox.setValue(this.inputBox.getValue() + "\n");
        this.screen.render();
        return;
      }

      this.onSendMessage();
    });

    // Send button handler
    this.sendButton.on("press", this.onSendMessage.bind(this));

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

  private onSendMessage() {
    const message = this.inputBox.getValue();
    if (message.trim()) {
      this.sendMessage(message).finally(() => {
        this.setProcessingState(false);
      });
      this.inputBox.clearValue();
      this.setProcessingState(true);
    }
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
        return chatStyles.formatCompleteMessage(
          msg.timestamp,
          msg.role,
          msg.content
        );
      })
      .join("\n");

    this.messagesBox.setContent(formattedMessages);
    this.messagesBox.scrollTo(this.messagesBox.getScrollHeight());
    this.screen.render();
  }

  private setProcessingState(isProcessing: boolean) {
    if (this.isProcessing !== isProcessing) {
      if (isProcessing) {
        this.stopInputValueMonitoring();
        this.inputBox.hide();
        this.sendButton.hide();
        this.abortButton.show();
        this.abortButton.focus();
      } else {
        this.inputBox.show();
        this.sendButton.show();
        this.abortButton.hide();
        if (!this.inputValueCheckInterval) {
          this.startInputValueMonitoring();
        }
      }
    }

    this.isProcessing = isProcessing;

    // Update send button
    const disabled = !isProcessing && this.inputBox.getContent().length === 0;
    const buttonStyle = chatStyles.getSendButtonStyle(disabled);
    this.sendButton.style = buttonStyle.style;

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
        this.addMessage(source || "System", `Error: ${message}`);
        break;
      case "info":
        this.addMessage(source || "System", message);
        break;
      case "warning":
        this.addMessage(source || "System", `Warning: ${message}`);
        break;
      default:
        this.addMessage(source || "System", message);
        break;
    }

    this.screen.render();
  }

  reset(shouldRender = true): void {
    // super.reset(false);
    this.messages = [];
    this.updateMessagesDisplay();
    this.inputBox.clearValue();

    // Restart input value monitoring
    this.stopInputValueMonitoring();
    this.startInputValueMonitoring();

    if (shouldRender) {
      this.screen.render();
    }
  }

  // Method to start monitoring the input value for changes
  private startInputValueMonitoring() {
    // Clear any existing interval
    if (this.inputValueCheckInterval) {
      clearInterval(this.inputValueCheckInterval);
    }

    // Set initial value
    this.lastInputValue = this.inputBox.getValue();

    // Check for changes every 100ms
    this.inputValueCheckInterval = setInterval(() => {
      const currentValue = this.inputBox.getValue();
      if (currentValue !== this.lastInputValue) {
        this.lastInputValue = currentValue;
        this.setProcessingState(false);
      }
    }, 100);
  }

  // Method to stop monitoring the input value
  private stopInputValueMonitoring() {
    if (this.inputValueCheckInterval) {
      clearInterval(this.inputValueCheckInterval);
      this.inputValueCheckInterval = null;
    }
  }

  // Method to initialize and start the chat monitor
  public async start(): Promise<void> {
    // Add welcome messages with keyboard shortcuts
    this.addMessage(
      "System",
      "Chat monitor initialized. You can communicate with the runtime/supervisor agent here."
    );
    this.addMessage("System", "Keyboard shortcuts:");
    this.addMessage("System", "- Enter: Send message");
    this.addMessage("System", "- Shift+Enter: Add new line in input");
    this.addMessage("System", "- Tab: Switch between input and abort button");
    this.addMessage("System", "- Ctrl+A: Abort current operation");
    this.addMessage("System", "- PageUp/PageDown: Scroll through messages");
    this.addMessage("System", "- Ctrl+L: Clear chat history");
    this.addMessage("System", "- Ctrl+C or q: Quit application");

    // Start monitoring input value changes
    this.startInputValueMonitoring();

    this.screen.render();
  }
}
