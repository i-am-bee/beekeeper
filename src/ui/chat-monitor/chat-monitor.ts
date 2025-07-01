import { Logger } from "beeai-framework";
import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "../base/monitor.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../controls/navigation.js";
import { CloseDialog } from "../shared/close-dialog.js";
import { keyActionListenerFactory } from "../controls/key-bindings.js";
import { ChatFilter } from "./filter/filter.js";
import { Messages } from "./messages/messages.js";
import { HelpBar } from "../shared/help-bar.js";
import { ChatInput } from "./input/input.js";
import { ChatRuntimeHandler, MessageTypeEnum } from "./runtime-handler.js";
import { Runtime } from "@/runtime/index.js";
import { isNonNullish } from "remeda";

export class ChatMonitor extends ContainerComponent {
  private closeDialog: CloseDialog;
  private filter: ChatFilter;
  private messages: Messages;
  private helpBar: HelpBar;
  private chatInput: ChatInput;

  private runtimeHandler: ChatRuntimeHandler;
  private _isProcessing = false;
  private _isAborting = false;

  private abortCheckInterval: NodeJS.Timeout | null = null;
  private onAbort?: () => void;

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

    this.helpBar = new HelpBar(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    this.chatInput = new ChatInput(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
        onValueChange() {
          return {} as any;
        },
      },
      logger,
    );

    this.messages = new Messages(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
        getChatFilters: () => this.filter.values,
      },
      logger,
    );

    // Keep filter on top due to pop-up role filter
    this.filter = new ChatFilter(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    // Should be last to appear on top
    this.closeDialog = new CloseDialog(this.controlsManager);
    this.setupEventHandlers();
    this.setupControls();

    this.setProcessingState(false);
  }

  private setupControls(shouldRender = true) {
    // Global shortcuts
    this.controlsManager.updateKeyActions(this.controlsManager.screen.id, {
      kind: "exclusive",
      actions: [
        {
          key: "C-c",
          action: {
            description: NavigationDescription.EXIT_APP,
            listener: keyActionListenerFactory(() => {
              this.openCloseDialog();
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
        {
          key: "C-r",
          action: {
            description: NavigationDescription.ROLE_FILTER,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.filter.focusRoleFilters();
            }),
          },
        },
        {
          key: "C-f",
          action: {
            description: NavigationDescription.MESSAGES_FILTER,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.filter.focusMessageFilters();
            }),
          },
        },
        {
          key: "C-s",
          action: {
            description: NavigationDescription.MESSAGES,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.messages.focusMessagesBox();
            }),
          },
        },
        {
          key: "space",
          action: {
            description: NavigationDescription.CHAT,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.chatInput.focusInputBox();
            }),
          },
        },
      ].filter(isNonNullish),
    });

    // Navigation
    this.controlsManager.updateNavigation(this.filter.container.id, {
      next: this.messages.container.id,
      down: this.messages.container.id,
      outEffect: this.openCloseDialog.bind(this),
    });

    this.controlsManager.updateNavigation(this.messages.container.id, {
      previous: this.filter.container.id,
      up: this.filter.container.id,
      next: this.chatInput.container.id,
      down: this.chatInput.container.id,
      outEffect: this.openCloseDialog.bind(this),
    });

    this.controlsManager.updateNavigation(this.chatInput.container.id, {
      previous: this.messages.container.id,
      up: this.messages.container.id,
      outEffect: this.openCloseDialog.bind(this),
    });

    this.chatInput.focusInputBox();
    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private collapse() {
    this.filter.collapse();
    this.closeDialog.hide();
  }

  private setupEventHandlers() {
    this.filter.on("filter:change", () => {
      this.messages.updateDisplay();
    });

    this.chatInput.on("send:click", this.onSendMessageClick.bind(this));
    this.chatInput.on("abort:click", this.onAbortClick.bind(this));
  }

  private setProcessingState(isProcessing: boolean) {
    this._isProcessing = isProcessing;
    this.chatInput.setProcessing(isProcessing);
  }

  private setAbortingState(isAborting: boolean) {
    this._isAborting = isAborting;
    this.chatInput.setAborting(isAborting);
  }

  private openCloseDialog() {
    if (this._isProcessing) {
      this.closeDialog.show(this.controlsManager.focused.id, {
        title: "Operation in Progress",
        message: "Abort operation and exit?",
        onConfirm: () => this.abortOperation(() => process.exit(0)),
      });
    } else {
      this.closeDialog.show(this.controlsManager.focused.id);
    }
  }

  private addMessage(role: string, content: string, type: MessageTypeEnum) {
    this.messages.addMessage(role, content, type);
    this.filter.addRole(role);
  }

  private onSendMessageClick(message: string): void {
    const abortController = new AbortController();
    this.sendMessage(message, abortController.signal)
      .catch((err) => console.error(err))
      .finally(() => {
        this.setProcessingState(false);
      });
    this.setProcessingState(true);
  }

  private async sendMessage(message: string, signal: AbortSignal) {
    // Add user message to chat
    this.addMessage("You", message, MessageTypeEnum.INPUT);

    // Send message via runtime handler
    await this.runtimeHandler.sendMessage(message, signal);
    this.chatInput.reset();
  }

  private onAbortClick(): void {
    this.abortOperation();
  }

  private abortOperation(onAbort?: () => void) {
    if (!this._isProcessing || this._isAborting) {
      return;
    }
    this.onAbort = onAbort;
    this.startAbortMonitoring();
    this.runtimeHandler.abort();
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

  public async start(): Promise<void> {
    // Add welcome messages with keyboard shortcuts
    this.addMessage(
      "System",
      "Chat monitor initialized. You can communicate with the runtime/supervisor agent here.",
      MessageTypeEnum.SYSTEM,
    );

    // Start monitoring input value changes
    this.chatInput.startValueMonitoring();
    this.messages.updateDisplay(false);
    this.screen.element.render();
  }
}
