import blessed from "neo-blessed";
import { BaseMonitor, ParentInput, ScreenInput } from "../base/monitor.js";
import * as chatStyles from "./config.js";
import * as st from "../config.js";
import { Runtime } from "@/runtime/runtime.js";
import { ChatRuntimeHandler, MessageTypeEnum } from "./runtime-handler.js";
import { ChatFilter } from "./filter/filter.js";
import { CloseDialog } from "../shared/close-dialog.js";
import {
  ControllableContainer,
  ControllableElement,
} from "../controls/controls-manager.js";
import { Messages } from "./messages/messages.js";

export class ChatMonitor extends BaseMonitor {
  private chatBox: ControllableContainer;
  private inputBox: ControllableElement;
  private messages: Messages;
  private sendButton: ControllableElement;
  private abortButton: ControllableElement;
  private chatFilterBox: ControllableContainer;
  private chatFilter: ChatFilter;
  private closeDialog: CloseDialog;
  private abortCheckInterval: NodeJS.Timeout | null = null;
  private onAbort?: () => void;

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

  constructor(arg: ParentInput | ScreenInput, runtime: Runtime) {
    super(arg);
    this.runtimeHandler = new ChatRuntimeHandler(runtime, {
      onMessage: (role, content, type) => this.addMessage(role, content, type),
      onStatus: (status) =>
        this.addMessage("System", status, MessageTypeEnum.SYSTEM),
      onStateChange: (isProcessing) => this.setProcessingState(isProcessing),
    });

    // Main chat container
    this.chatBox = this.controlsManager.add({
      kind: "container",
      name: "chatBox",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: "100%",
        left: 0,
        top: 0,
        tags: true,
        keys: true,
      }),
      parent: this.controlsManager.screen,
    });

    this.chatFilterBox = this.controlsManager.add({
      kind: "container",
      name: "chatFilterBox",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: 7,
        left: 0,
        top: 0,
        tags: true,
        keys: true,
      }),
      parent: this.controlsManager.screen,
    });

    // Create filter boxes
    this.chatFilter = new ChatFilter({
      parent: this.chatFilterBox,
      controlsManager: this.controlsManager,
    });

    this.messages = new Messages({
      parent: this.chatBox,
      controlsManager: this.controlsManager,
      getChatFilters: () => this.chatFilter.values,
    });

    // Input area
    this.inputBox = this.controlsManager.add({
      kind: "element",
      name: "inputBox",
      element: blessed.textarea({
        parent: this.chatBox.element,
        width: "100%-12", // Make room for abort button
        height: 5,
        left: 0,
        top: "100%-5",
        ...chatStyles.getInputBoxStyle(),
        scrollbar: st.UIConfig.scrollbar,
      }),
      parent: this.chatBox,
    });

    // Send/abort button
    this.sendButton = this.controlsManager.add({
      kind: "element",
      name: "sendButton",
      element: blessed.button({
        parent: this.chatBox.element,
        width: 10,
        height: 3,
        left: "100%-11",
        top: "100%-4",
        ...chatStyles.getSendButtonStyle(true),
        tags: true,
        mouse: true,
      }),
      parent: this.chatBox,
    });

    this.abortButton = this.controlsManager.add({
      kind: "element",
      name: "sendButton",
      element: blessed.button({
        parent: this.chatBox.element,
        width: 10,
        height: 3,
        left: "50%-5",
        top: "100%-4",
        ...chatStyles.getAbortButtonStyle(),
        tags: true,
        mouse: true,
        hidden: true,
      }),
      parent: this.chatBox,
    });

    // Initialize the close dialog
    this.closeDialog = new CloseDialog(this.controlsManager);

    // this.setupEventHandlers();
    this.setProcessingState(false);
    this.controlsManager.focus(this.inputBox.id);
  }

  // private setupEventHandlers() {
  //   this.chatFilter.on("filter:change", () => {
  //     this.updateMessagesDisplay();
  //   });

  //   this.inputBox.key("enter", async (ch, key) => {
  //     // Check if Shift key is pressed
  //     if (key.shift) {
  //       // Insert a newline instead of sending
  //       this.inputBox.setValue(this.inputBox.getValue() + "\n");
  //       this.screen.element.render();
  //       return;
  //     }

  //     this.onSendMessage();
  //   });

  //   // Send button handler
  //   this.sendButton.on("press", this.onSendMessage.bind(this));

  //   // Abort button handler
  //   this.abortButton.on("press", () => {
  //     this.abortOperation();
  //   });

  //   // Mouse scrolling for messages
  //   this.messagesBox.on("mouse", (data) => {
  //     if (data.action === "wheelup") {
  //       this.messagesBox.scroll(-1);
  //       this.screen.element.render();
  //     } else if (data.action === "wheeldown") {
  //       this.messagesBox.scroll(1);
  //       this.screen.element.render();
  //     }
  //   });

  //   // Add Ctrl+C to quit
  //   this.screen.key(["escape", "q", "C-c"], () => {
  //     // If the close dialog is already open, don't do anything
  //     if (this.closeDialog.isOpen()) {
  //       return;
  //     }

  //     this.screen.saveFocus();

  //     const onCancel = () => {
  //       this.screen.restoreFocus(); // Return focus to textbox
  //       this.screen.element.render();
  //     };

  //     // If processing, ask if user wants to abort before exiting
  //     if (this.isProcessing) {
  //       this.closeDialog.show({
  //         title: "Operation in Progress",
  //         message: "Abort operation and exit?",
  //         onConfirm: () => this.abortOperation(() => process.exit(0)),
  //         onCancel,
  //       });
  //     } else {
  //       this.closeDialog.show({
  //         onCancel,
  //       });
  //     }

  //     this.screen.element.render();
  //   });

  //   // Add Ctrl+A as shortcut for abort
  //   this.screen.key(["C-a"], () => {
  //     this.abortOperation();
  //   });

  //   // Add page up/down for message scrolling
  //   this.screen.key(["pageup"], () => {
  //     this.messagesBox.scroll(-3);
  //     this.screen.element.render();
  //   });

  //   this.screen.key(["pagedown"], () => {
  //     this.messagesBox.scroll(3);
  //     this.screen.element.render();
  //   });

  //   // Add Ctrl+L to clear the chat
  //   this.screen.key(["C-l"], () => {
  //     this.reset();
  //   });

  //   // Add Ctrl+F to focus on type filters
  //   this.screen.key(["C-f"], () => {
  //     this.chatFilter.focus("types");
  //   });

  //   // Add Ctrl+R to focus on role filters and toggle if needed
  //   this.screen.key(["C-r"], () => {
  //     this.chatFilter.focus("roles");
  //   });
  // }

  private onSendMessage() {
    const message = (
      this.inputBox.element as blessed.Widgets.TextareaElement
    ).getValue();
    if (message.trim()) {
      const abortController = new AbortController();
      this.sendMessage(message, abortController.signal)
        .catch((err) => console.error(err))
        .finally(() => {
          this.setProcessingState(false);
        });
      (this.inputBox.element as blessed.Widgets.TextareaElement).clearValue();
      this.setProcessingState(true);
    }
  }

  private addMessage(role: string, content: string, type: MessageTypeEnum) {
    this.addMessage(role, content, type);
    this.chatFilter.addRole(role);
  }

  private async sendMessage(message: string, signal: AbortSignal) {
    // Add user message to chat
    this.addMessage("You", message, MessageTypeEnum.INPUT);

    // Send message via runtime handler
    await this.runtimeHandler.sendMessage(message, signal);
  }

  private setProcessingState(isProcessing: boolean) {
    if (this._isProcessing !== isProcessing) {
      if (isProcessing) {
        this.stopInputValueMonitoring();
        this.inputBox.element.hide();
        this.sendButton.element.hide();
        this.abortButton.element.show();
        this.abortButton.element.focus();
      } else {
        this.inputBox.element.show();
        this.sendButton.element.show();
        this.abortButton.element.hide();
        if (!this.inputValueCheckInterval) {
          this.startInputValueMonitoring();
        }
        this.inputBox.element.focus();
      }
    }

    this._isProcessing = isProcessing;

    // Update send button
    const disabled =
      !isProcessing && this.inputBox.element.getContent().length === 0;
    const buttonStyle = chatStyles.getSendButtonStyle(disabled);
    this.sendButton.element.style = buttonStyle.style;
    this.screen.element.render();
  }

  private setAbortingState(isAborting: boolean) {
    this._isAborting = isAborting;
    const disabled = isAborting;
    const buttonStyle = chatStyles.getAbortButtonStyle(disabled);
    this.abortButton.element.style = buttonStyle.style;
    this.abortButton.element.options.mouse = !disabled;
    this.screen.element.render();
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
    this.messages.reset(shouldRender);
    (this.inputBox.element as blessed.Widgets.TextareaElement).clearValue();
    this.chatFilter.reset(false);
    // Restart input value monitoring
    this.stopInputValueMonitoring();
    this.startInputValueMonitoring();

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  // Method to start monitoring the input value for changes
  private startInputValueMonitoring() {
    // Clear any existing interval
    if (this.inputValueCheckInterval) {
      clearInterval(this.inputValueCheckInterval);
    }

    // Set initial value
    this.lastInputValue = (
      this.inputBox.element as blessed.Widgets.TextareaElement
    ).getValue();

    // Check for changes every 100ms
    this.inputValueCheckInterval = setInterval(() => {
      const currentValue = (
        this.inputBox.element as blessed.Widgets.TextareaElement
      ).getValue();
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
    this.messages.updateDisplay(false);

    this.screen.element.render();
  }
}
