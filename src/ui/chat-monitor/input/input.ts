import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "@/ui/base/monitor.js";
import {
  ControllableContainer,
  ControllableElement,
} from "@/ui/controls/controls-manager.js";
import { keyActionListenerFactory } from "@/ui/controls/key-bindings.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "@/ui/controls/navigation.js";
import { Logger } from "beeai-framework";
import EventEmitter from "events";
import blessed from "neo-blessed";
import { Textarea } from "../../blessed/Textarea.js";
import { isNonNullish } from "remeda";
import {
  getAbortButtonStyle,
  getInputBoxStyle,
  getInputContainerBoxStyle,
  getSendButtonStyle,
} from "../config.js";

interface ChatInputEvents {
  "send:click": (message: string) => void;
  "abort:click": () => void;
  "send:enabled": (enabled: boolean) => void;
}

type ChatInputOptions = (ParentInput | ScreenInput) & {
  onValueChange: () => void;
};

export class ChatInput extends ContainerComponent {
  private _container: ControllableContainer;
  private _inputBox: ControllableElement<Textarea>;
  private _sendButton: ControllableElement<blessed.Widgets.ButtonElement>;
  private _abortButton: ControllableElement<blessed.Widgets.ButtonElement>;
  private emitter = new EventEmitter();

  private _onValueChange: () => void;

  private _isSendEnabled = false;
  private _isProcessing = false;
  private _isAborting = false;
  private lastValue = ""; // Track the last value
  private valueCheckInterval: NodeJS.Timeout | null = null;

  public on<K extends keyof ChatInputEvents>(
    event: K,
    listener: ChatInputEvents[K],
  ): typeof this.emitter {
    return this.emitter.on(event, listener);
  }

  public off<K extends keyof ChatInputEvents>(
    event: K,
    listener: ChatInputEvents[K],
  ): typeof this.emitter {
    return this.emitter.off(event, listener);
  }

  public emit<K extends keyof ChatInputEvents>(
    event: K,
    ...args: Parameters<ChatInputEvents[K]>
  ): boolean {
    return this.emitter.emit(event, ...args);
  }

  get container() {
    return this._container;
  }

  get inputBox() {
    return this._inputBox;
  }

  get sendButton() {
    return this._sendButton;
  }

  get abortButton() {
    return this._abortButton;
  }

  get isSendEnabled() {
    return this._isSendEnabled;
  }

  constructor({ onValueChange, ...rest }: ChatInputOptions, logger: Logger) {
    super(rest, logger);

    this._onValueChange = onValueChange;

    // Input area
    this._container = this.controlsManager.add({
      kind: "container",
      name: "chat_input_container",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%", // Make room for abort button
        height: 5,
        left: 0,
        top: "100%-6",
        vi: false,
        mouse: false,
        keys: false,
        ...getInputContainerBoxStyle(),
      }),
      parent: this.parent,
    });

    // Input area
    this._inputBox = this.controlsManager.add({
      kind: "element",
      name: "input_box",
      element: new Textarea({
        parent: this._container.element,
        width: "100%-17", // Make room for abort button
        top: "0",
        vi: false,
        mouse: false,
        keys: false,
        ...getInputBoxStyle(),
      }),
      parent: this._container,
    });

    // Send/abort button
    this._sendButton = this.controlsManager.add({
      kind: "element",
      name: "send_button",
      element: blessed.button({
        parent: this._container.element,
        width: 10,
        height: 3,
        left: "100%-14",
        top: 0,
        ...getSendButtonStyle(true),
        tags: true,
        mouse: false,
      }),
      parent: this._container,
    });

    this._abortButton = this.controlsManager.add({
      kind: "element",
      name: "abort_button",
      element: blessed.button({
        parent: this._container.element,
        width: 10,
        height: 3,
        left: "50%-5",
        top: "0",
        ...getAbortButtonStyle(),
        tags: true,
        mouse: false,
        hidden: true,
      }),
      parent: this._container,
    });

    this.setupEventHandlers();
    this.setupControls("ready");
  }

  private setupEventHandlers() {
    this._inputBox.element.on("keypress", (ch, key) => {
      if (key.name === "escape") {
        this.controlsManager.navigate(NavigationDirection.OUT);
      }
      if (key.name === "enter") {
        this.controlsManager.navigate(NavigationDirection.IN);
      }
    });

    this._inputBox.element.on("focus", () => {
      // Hack how to enable input. Don't use inputOnFocus! It steal focus control.
      (this._inputBox.element as any).readInput();
    });
  }

  private setupControls(
    state: "ready" | "ready_to_send" | "processing",
    shouldRender = true,
  ) {
    this.controlsManager.updateKeyActions(this._inputBox.id, {
      kind: "exclusive",
      actions: [
        {
          key: "escape",
          action: {
            description: NavigationDescription.OUT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.OUT);
            }),
          },
        },
        state === "ready_to_send"
          ? {
              key: "enter",
              action: {
                description: NavigationDescription.SEND_MESSAGE,
                listener: keyActionListenerFactory(() => {
                  this.clickSendButton();
                }),
              },
            }
          : undefined,
      ].filter(isNonNullish),
    });
    this.controlsManager.refreshKeyBindings();

    switch (state) {
      case "ready": {
        this.controlsManager.updateNavigation(this._container.id, {
          inEffect: this.focusInputBox.bind(this),
          out: this.parent.id,
        });
        this.controlsManager.updateNavigation(this._inputBox.id, {
          out: this.container.id,
        });
        this.updateSendButtonStyle(false);
        break;
      }
      case "ready_to_send": {
        this.controlsManager.updateNavigation(this._container.id, {
          inEffect: this.focusInputBox.bind(this),
          out: this.parent.id,
        });
        this.controlsManager.updateNavigation(this._inputBox.id, {
          out: this._sendButton.id,
          inEffect: () => {
            this.clickSendButton();
          },
        });
        this.controlsManager.updateNavigation(this._sendButton.id, {
          previousEffect: this.focusInputBox.bind(this),
          leftEffect: this.focusInputBox.bind(this),
          out: this._container.id,
          inEffect: () => {
            this.clickSendButton();
          },
        });
        this.updateSendButtonStyle(false);
        break;
      }
      case "processing": {
        this.controlsManager.updateNavigation(this._container.id, {
          in: this._abortButton.id,
          out: this.parent.id,
        });
        this.controlsManager.updateNavigation(this._abortButton.id, {
          in: this._abortButton.id,
          out: this._container.id,
          inEffect: () => {
            this.clickAbortButton();
          },
        });
        break;
      }
    }

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  focusInputBox() {
    this.controlsManager.focus(this._inputBox.id, () => {
      this.container.element.style = getInputContainerBoxStyle(false);
      this.screen.element.render();
    });
    this.container.element.style = getInputContainerBoxStyle(true);
    this.screen.element.render();
  }

  public setProcessing(isProcessing: boolean) {
    if (this._isProcessing !== isProcessing) {
      if (isProcessing) {
        this.stopValueMonitoring();
        this.controlsManager.focus(this._abortButton.id);
        this._sendButton.element.hide();
        this._inputBox.element.hide();
        this._abortButton.element.show();
        this.setupControls("processing");
      } else {
        this._sendButton.element.show();
        this._inputBox.element.show();
        this.focusInputBox();
        this._abortButton.element.hide();
        if (!this.valueCheckInterval) {
          this.startValueMonitoring();
        }
        this.setupControls(this._isSendEnabled ? "ready_to_send" : "ready");
      }
    }

    this._isProcessing = isProcessing;
    this.updateSendButtonStyle();
  }

  private updateSendButtonStyle(shouldRender = true) {
    // Update send button
    const disabled =
      !this._isProcessing && this._inputBox.element.getContent().length === 0;
    const buttonStyle = getSendButtonStyle(disabled);
    this._sendButton.element.style = buttonStyle.style;

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  public setAborting(isAborting: boolean) {
    this._isAborting = isAborting;
    const disabled = this._isAborting;
    const buttonStyle = getAbortButtonStyle(disabled);
    this.abortButton.element.style = buttonStyle.style;
  }

  // Method to start monitoring the input value for changes
  public startValueMonitoring() {
    // Clear any existing interval
    if (this.valueCheckInterval) {
      clearInterval(this.valueCheckInterval);
    }

    // Set initial value
    this.lastValue = (
      this._inputBox.element as blessed.Widgets.TextareaElement
    ).getValue();

    // Check for changes every 100ms
    this.valueCheckInterval = setInterval(() => {
      const currentValue = (
        this._inputBox.element as blessed.Widgets.TextareaElement
      ).getValue();

      if (currentValue !== this.lastValue) {
        this.lastValue = currentValue;
        this._onValueChange();
      }

      if (currentValue.trim() !== "" && !this._isSendEnabled) {
        this._isSendEnabled = true;
        this.setupControls("ready_to_send");
        this.emit("send:enabled", true);
      } else if (currentValue.trim() === "" && this._isSendEnabled) {
        this._isSendEnabled = false;
        this.setupControls("ready");
        this.emit("send:enabled", false);
      }
    }, 100);
  }

  // Method to stop monitoring the input value
  public stopValueMonitoring() {
    if (this.valueCheckInterval) {
      clearInterval(this.valueCheckInterval);
      this.valueCheckInterval = null;
    }
  }

  reset(shouldRender = true): void {
    (this.inputBox.element as blessed.Widgets.TextareaElement).clearValue();

    // Restart input value monitoring
    this.stopValueMonitoring();
    this.startValueMonitoring();

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  clickSendButton() {
    if (this._isProcessing || this._isAborting || !this._isSendEnabled) {
      return;
    }
    const value = (
      this._inputBox.element as blessed.Widgets.TextareaElement
    ).getValue();
    if (value.trim() === "") {
      return;
    }

    this.controlsManager.focus(this._sendButton.id);
    this.emit("send:click", value);
  }

  clickAbortButton() {
    if (!this._isProcessing) {
      return;
    }

    this.controlsManager.focus(this._abortButton.id);
    this.emit("abort:click");
  }
}
