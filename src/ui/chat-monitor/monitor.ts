import blessed from "neo-blessed";
import { BaseMonitor, ParentInput, ScreenInput } from "../base/monitor.js";
import * as chatStyles from "./config.js";
import * as st from "../config.js";
import { Runtime } from "@/runtime/runtime.js";
import { ChatRuntimeHandler, MessageTypeEnum } from "./runtime-handler.js";
import { ChatFilter } from "./filter.js";
import { CloseDialog } from "../shared/close-dialog.js";

export class ChatMonitor extends BaseMonitor {
  private chatBox: blessed.Widgets.BoxElement;
  private inputBox: blessed.Widgets.TextareaElement;
  private messagesBox: blessed.Widgets.BoxElement;
  private sendButton: blessed.Widgets.ButtonElement;
  private abortButton: blessed.Widgets.ButtonElement;
  private chatFilterBox: blessed.Widgets.BoxElement;
  private chatFilter: ChatFilter;
  private closeDialog: CloseDialog;
  private abortCheckInterval: NodeJS.Timeout | null = null;
  private onAbort?: () => void;

  private messages: {
    role: string;
    content: string;
    timestamp: Date;
    type: MessageTypeEnum;
  }[] = [];

  private runtimeHandler: ChatRuntimeHandler;
  private _isProcessing = false;
  private _isAborting = false;
  private lastInputValue = ""; // Track the last value
  private inputValueCheckInterval: NodeJS.Timeout | null = null;

  private get isProcessing() {
    return this._isProcessing;
  }

  private get isAborting() {
    return this._isAborting;
  }

  constructor(
    arg: ParentInput | ScreenInput,
    runtime: Runtime,
    abortController?: AbortController,
  ) {
    super(arg);
    this.runtimeHandler = new ChatRuntimeHandler(
      runtime,
      {
        onMessage: (role, content, type) =>
          this.addMessage(role, content, type),
        onStatus: (status) =>
          this.addMessage("System", status, MessageTypeEnum.SYSTEM),
        onStateChange: (isProcessing) => this.setProcessingState(isProcessing),
      },
      abortController,
    );

    // Main chat container
    this.chatBox = blessed.box({
      parent: this.parent,
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      tags: true,
    });

    this.chatFilterBox = blessed.box({
      parent: this.parent,
      width: "100%",
      height: 7,
      left: 0,
      top: 0,
      tags: true,
    });

    // Create filter boxes
    this.chatFilter = new ChatFilter({
      parent: this.chatFilterBox,
      screen: this.screen,
    });

    // Messages area - adjusted to make room for filter boxes
    this.messagesBox = blessed.box({
      parent: this.chatBox,
      width: "100%",
      height: "100%-12", // Adjusted for filter boxes at top and input at bottom
      left: 0,
      top: 7, // Space for type filter box
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

    // Initialize the close dialog
    this.closeDialog = new CloseDialog(this.screen);

    this.setupEventHandlers();
    this.setProcessingState(false);
    this.inputBox.focus();
  }

  private setupEventHandlers() {
    this.chatFilter.on("filter:change", () => {
      this.updateMessagesDisplay();
    });

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
    this.screen.key(["escape", "q", "C-c"], () => {
      // If the close dialog is already open, don't do anything
      if (this.closeDialog.isOpen()) {
        return;
      }

      // If processing, ask if user wants to abort before exiting
      if (this.isProcessing) {
        this.closeDialog.show({
          title: "Operation in Progress",
          message: "Abort operation and exit?",
          onConfirm: () => this.abortOperation(() => process.exit(0)),
        });
      } else {
        this.closeDialog.show();
      }
    });

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

    // Add Ctrl+F to focus on type filters
    this.screen.key(["C-f"], () => {
      this.chatFilter.focus("types");
    });

    // Add Ctrl+R to focus on role filters and toggle if needed
    this.screen.key(["C-r"], () => {
      this.chatFilter.focus("roles");
    });
  }

  private onSendMessage() {
    const message = this.inputBox.getValue();
    if (message.trim()) {
      this.sendMessage(message)
        .catch((err) => console.error(err))
        .finally(() => {
          this.setProcessingState(false);
        });
      this.inputBox.clearValue();
      this.setProcessingState(true);
    }
  }

  private async sendMessage(message: string) {
    // Add user message to chat
    this.addMessage("You", message, MessageTypeEnum.INPUT);

    // Send message via runtime handler
    await this.runtimeHandler.sendMessage(message);
  }

  private addMessage(role: string, content: string, type: MessageTypeEnum) {
    const timestamp = new Date();
    this.messages.push({ role, content, timestamp, type });
    this.chatFilter.addRole(role);
    this.updateMessagesDisplay();
  }

  private updateMessagesDisplay(shouldRender = true) {
    const filter = this.chatFilter.values;

    // Filter messages based on current filter settings
    const filteredMessages = this.messages.filter((msg) => {
      // Check type filter
      // INPUT and FINAL are always shown
      const typeFilterPassed =
        msg.type === MessageTypeEnum.INPUT ||
        msg.type === MessageTypeEnum.FINAL ||
        filter.messageTypes.includes(msg.type);

      // Check role filter
      const roleFilterPassed = filter.roles.includes(msg.role);

      return typeFilterPassed && roleFilterPassed;
    });

    // Format and display filtered messages
    const formattedMessages = filteredMessages
      .map((msg) => {
        return chatStyles.formatCompleteMessage(
          msg.timestamp,
          msg.role,
          msg.content,
          msg.type,
        );
      })
      .join("\n");

    this.messagesBox.setContent(formattedMessages);
    this.messagesBox.scrollTo(this.messagesBox.getScrollHeight());

    if (shouldRender) {
      this.screen.render();
    }
  }

  private setProcessingState(isProcessing: boolean) {
    if (this._isProcessing !== isProcessing) {
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
        this.inputBox.focus();
      }
    }

    this._isProcessing = isProcessing;

    // Update send button
    const disabled = !isProcessing && this.inputBox.getContent().length === 0;
    const buttonStyle = chatStyles.getSendButtonStyle(disabled);
    this.sendButton.style = buttonStyle.style;
    this.screen.render();
  }

  private setAbortingState(isAborting: boolean) {
    this._isAborting = isAborting;
    const disabled = isAborting;
    const buttonStyle = chatStyles.getAbortButtonStyle(disabled);
    this.abortButton.style = buttonStyle.style;
    this.abortButton.options.mouse = !disabled;
    this.screen.render();
  }

  private abortOperation(onAbort?: () => void) {
    if (!this.isProcessing || this.isAborting) {
      return;
    }
    this.onAbort = onAbort;
    this.startAbortMonitoring();
    this.runtimeHandler.abort();
  }

  reset(shouldRender = true): void {
    this.messages = [];
    this.updateMessagesDisplay();
    this.inputBox.clearValue();
    this.chatFilter.reset(false);
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

  // Method to start monitoring the aborting process
  private startAbortMonitoring() {
    this.setAbortingState(true);
    // Clear any existing interval
    if (this.abortCheckInterval) {
      clearInterval(this.abortCheckInterval);
    }

    // Check for changes every 100ms
    this.abortCheckInterval = setInterval(() => {
      if (!this.runtimeHandler.isRunning) {
        this.stopAbortMonitoring();
        this.setAbortingState(false);
        this.onAbort?.();
      }
    }, 100);
  }

  // Method to stop monitoring the aborting process
  private stopAbortMonitoring() {
    if (this.abortCheckInterval) {
      clearInterval(this.abortCheckInterval);
      this.abortCheckInterval = null;
    }
  }

  // Method to initialize and start the chat monitor
  public async start(): Promise<void> {
    // Add welcome messages with keyboard shortcuts
    this.addMessage(
      "System",
      "Chat monitor initialized. You can communicate with the runtime/supervisor agent here.",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage("System", "Keyboard shortcuts:", MessageTypeEnum.SYSTEM);
    this.addMessage("System", "- Enter: Send message", MessageTypeEnum.SYSTEM);
    this.addMessage(
      "System",
      "- Shift+Enter: Add new line in input",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage(
      "System",
      "- Tab: Cycle through filters and input",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage(
      "System",
      "- Ctrl+F: Focus on message type filters",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage(
      "System",
      "- Ctrl+R: Toggle and focus on role filters",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage(
      "System",
      "- Ctrl+A: Abort current operation",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage(
      "System",
      "- PageUp/PageDown: Scroll through messages",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage(
      "System",
      "- Ctrl+L: Clear chat history",
      MessageTypeEnum.SYSTEM,
    );
    this.addMessage(
      "System",
      "- Ctrl+C or q: Quit application",
      MessageTypeEnum.SYSTEM,
    );

    // Start monitoring input value changes
    this.startInputValueMonitoring();
    this.updateMessagesDisplay(false);

    this.screen.render();
  }
}

// Can you generate poems on each of these topics: einstein, tiktok, telescope, oreo and cat. And base on these poems write a hip-hop song?
// Can you create poem about apple and based on it write a song? Don't start any task run
