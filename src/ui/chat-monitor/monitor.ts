import { Runtime } from "@/runtime/runtime.js";
import blessed from "neo-blessed";
import { ContainerComponent, ParentInput, ScreenInput } from "../base/monitor.js";
import { ControllableContainer } from "../controls/controls-manager.js";
import { CloseDialog } from "../shared/close-dialog.js";
import { ChatFilter } from "./filter/filter.js";
import { ChatInput } from "./input/input.js";
import { Messages } from "./messages/messages.js";
import { ChatRuntimeHandler, MessageTypeEnum } from "./runtime-handler.js";
import { HelpBar } from "../shared/help-bar.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../controls/navigation.js";
import { Logger } from "beeai-framework";
import { keyActionListenerFactory } from "../controls/key-bindings.js";

export class ChatMonitor extends ContainerComponent {
  private chatBox: ControllableContainer;
  private messages: Messages;
  private chatInput: ChatInput;
  private chatFilterBox: ControllableContainer;
  private chatFilter: ChatFilter;
  private helpBar: HelpBar;
  private closeDialog: CloseDialog;
  private abortCheckInterval: NodeJS.Timeout | null = null;
  private onAbort?: () => void;

  private runtimeHandler: ChatRuntimeHandler;
  private _isProcessing = false;
  private _isAborting = false;

  private get isProcessing() {
    return this._isProcessing;
  }

  private get isAborting() {
    return this._isAborting;
  }

  constructor(
    arg: ParentInput | ScreenInput,
    runtime: Runtime,
    logger: Logger,
  ) {
    super(arg, logger);
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
    this.chatFilter = new ChatFilter(
      {
        kind: "parent",
        parent: this.chatFilterBox,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    this.messages = new Messages(
      {
        kind: "parent",
        parent: this.chatBox,
        controlsManager: this.controlsManager,
        getChatFilters: () => this.chatFilter.values,
      },
      logger,
    );

    this.chatInput = new ChatInput(
      {
        kind: "parent",
        parent: this.chatBox,
        controlsManager: this.controlsManager,
        onValueChange: () => this.setProcessingState(false),
      },
      logger,
    );

    this.helpBar = new HelpBar(
      {
        kind: "parent",
        parent: this.chatBox,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    // this.setupEventHandlers();
    this.setProcessingState(this._isProcessing);
    this.setAbortingState(this._isAborting);

    // Initialize the close dialog
    this.closeDialog = new CloseDialog(this.controlsManager);
    this.setupControls();
  }

  private setupControls(shouldRender = true) {
    // Navigation
    this.controlsManager.updateNavigation(this.controlsManager.screen.id, {
      in: this.chatBox.id,
    });

    // Global shortcuts
    this.controlsManager.updateKeyActions(this.controlsManager.screen.id, {
      kind: "exclusive",
      actions: [
        {
          key: "C-c",
          action: {
            description: NavigationDescription.EXIT_APP,
            listener: keyActionListenerFactory(() => {
              this.closeDialog.show(this.controlsManager.focused.id);
            }),
          },
        },
        {
          key: "enter",
          action: {
            description: NavigationDescription.IN_OUT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.IN);
            }),
          },
        },
        {
          key: "escape",
          action: {
            description: NavigationDescription.IN_OUT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.OUT);
            }),
          },
        },
        {
          key: "left",
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.LEFT);
            }),
          },
        },
        {
          key: "right",
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.RIGHT);
            }),
          },
        },
        {
          key: "up",
          action: {
            description: NavigationDescription.UP_DOWN,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.UP);
            }),
          },
        },
        {
          key: "down",
          action: {
            description: NavigationDescription.UP_DOWN,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.DOWN);
            }),
          },
        },
        {
          key: "tab",
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.NEXT);
            }),
          },
        },
        {
          key: "S-tab",
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.PREVIOUS);
            }),
          },
        },
      ],
    });

    this.controlsManager.focus(this.chatBox.id, false);

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  // private setupEventHandlers() {
  //   this.chatFilter.on("filter:change", () => {
  //     this.messages.updateDisplay();
  //   });

  //   this.chatInput.inputBox.key("enter", async (ch, key) => {
  //     // Check if Shift key is pressed
  //     if (key.shift) {
  //       // Insert a newline instead of sending
  //       this.chatInput.inputBox.setValue(this.chatInput.inputBox.getValue() + "\n");
  //       this.screen.element.render();
  //       return;
  //     }

  //     this.onSendMessage();
  //   });

  //   // Send button handler
  //   this.chatInput.sendButton.on("press", this.onSendMessage.bind(this));

  //   // Abort button handler
  //   this.chatInput.abortButton.on("press", () => {
  //     this.abortOperation();
  //   });

  //   // Mouse scrolling for messages
  //   this.messages.container.on("mouse", (data) => {
  //     if (data.action === "wheelup") {
  //       this.messages.container.scroll(-1);
  //       this.screen.element.render();
  //     } else if (data.action === "wheeldown") {
  //       this.messages.container.scroll(1);
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
  //     this.messages.container.scroll(-3);
  //     this.screen.element.render();
  //   });

  //   this.screen.key(["pagedown"], () => {
  //     this.messages.container.scroll(3);
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
      this.chatInput.inputBox.element as blessed.Widgets.TextareaElement
    ).getValue();
    if (message.trim()) {
      const abortController = new AbortController();
      this.sendMessage(message, abortController.signal)
        .catch((err) => console.error(err))
        .finally(() => {
          this.setProcessingState(false);
        });
      (
        this.chatInput.inputBox.element as blessed.Widgets.TextareaElement
      ).clearValue();
      this.setProcessingState(true);
    }
  }

  private addMessage(role: string, content: string, type: MessageTypeEnum) {
    this.messages.addMessage(role, content, type);
    this.chatFilter.addRole(role);
  }

  private async sendMessage(message: string, signal: AbortSignal) {
    // Add user message to chat
    this.addMessage("You", message, MessageTypeEnum.INPUT);

    // Send message via runtime handler
    await this.runtimeHandler.sendMessage(message, signal);
  }

  private setProcessingState(isProcessing: boolean) {
    this._isProcessing = isProcessing;

    this.chatInput.setProcessing(isProcessing);
  }

  private setAbortingState(isAborting: boolean) {
    this._isAborting = isAborting;

    this.chatInput.setAborting(isAborting);
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
    this.messages.reset(false);
    this.chatFilter.reset(false);
    this.chatInput.reset(false);

    if (shouldRender) {
      this.screen.element.render();
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
    this.chatInput.startValueMonitoring();
    this.messages.updateDisplay(false);

    this.screen.element.render();
  }
}
