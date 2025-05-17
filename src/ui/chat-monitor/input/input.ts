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
import { NavigationDescription } from "@/ui/controls/navigation.js";
import { noop } from "@/utils/noop.js";
import { Logger } from "beeai-framework";
import blessed from "neo-blessed";
import { Textarea } from "../../blessed/Textarea.js";
import * as st from "../../config.js";
import * as chatStyles from "../config.js";

type ChatInputOptions = (ParentInput | ScreenInput) & {
  onValueChange: () => void;
};

export class ChatInput extends ContainerComponent {
  private _container: ControllableContainer;
  private _inputBox: ControllableElement;
  private _sendButton: ControllableElement;
  private _abortButton: ControllableElement;

  private _onValueChange: () => void;

  private _isProcessing = false;
  private _isAborting = false;
  private lastValue = ""; // Track the last value
  private valueCheckInterval: NodeJS.Timeout | null = null;

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

  constructor({ onValueChange, ...rest }: ChatInputOptions, logger: Logger) {
    super(rest, logger);

    this._onValueChange = onValueChange;

    // Input area
    this._container = this.controlsManager.add({
      kind: "container",
      name: "chatInputContainer",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%", // Make room for abort button
        height: 5,
        left: 0,
        top: "100%-6",
        vi: false,
        mouse: false,
        keys: false,
        ...chatStyles.getInputContainerBoxStyle(),
      }),
      parent: this.parent,
    });

    // Input area
    this._inputBox = this.controlsManager.add({
      kind: "element",
      name: "inputBox",
      element: new Textarea({
        parent: this._container.element,
        width: "100%-13", // Make room for abort button
        top: "0",
        vi: false,
        mouse: true,
        keys: false,
        scrollbar: st.UIConfig.scrollbar,
        ...chatStyles.getInputBoxStyle(),
      }),
      parent: this._container,
    });

    // Send/abort button
    this._sendButton = this.controlsManager.add({
      kind: "element",
      name: "sendButton",
      element: blessed.button({
        parent: this._container.element,
        width: 10,
        height: 3,
        left: "100%-12",
        top: 0,
        ...chatStyles.getSendButtonStyle(true),
        tags: true,
        mouse: true,
      }),
      parent: this._container,
    });

    this._abortButton = this.controlsManager.add({
      kind: "element",
      name: "abortButton",
      element: blessed.button({
        parent: this._container.element,
        width: 10,
        height: 3,
        left: "50%-5",
        top: "100%-5",
        ...chatStyles.getAbortButtonStyle(),
        tags: true,
        mouse: true,
        hidden: true,
      }),
      parent: this._container,
    });

    this.setupEventHandlers();
    this.setupControls();
  }

  private setupEventHandlers() {
    this._inputBox.element.on("focus", () => {
      // Hack how to enable input. Don't use inputOnFocus! It steal focus control.
      (this._inputBox.element as any).readInput();
    });
    this._inputBox.element.on("", () => {
      this.controlsManager.focus(this._container.id);
    });
  }

  private setupControls(shouldRender = true) {
    this.controlsManager.updateKeyActions(this._inputBox.id, {
      kind: "override",
      actions: [
        {
          key: "left",
          action: {
            description: NavigationDescription.MOVE_LEFT_RIGHT,
            listener: keyActionListenerFactory(noop),
          },
        },
        {
          key: "right",
          action: {
            description: NavigationDescription.MOVE_LEFT_RIGHT,
            listener: keyActionListenerFactory(noop),
          },
        },
        {
          key: "up",
          action: {
            description: NavigationDescription.MOVE_UP_DOWN,
            listener: keyActionListenerFactory(noop),
          },
        },
        {
          key: "down",
          action: {
            description: NavigationDescription.MOVE_UP_DOWN,
            listener: keyActionListenerFactory(noop),
          },
        },
        {
          key: "S-left",
          action: {
            description: NavigationDescription.MOVE_PREV_NEXT_WORD,
            listener: keyActionListenerFactory(noop),
          },
        },
        {
          key: "S-right",
          action: {
            description: NavigationDescription.MOVE_PREV_NEXT_WORD,
            listener: keyActionListenerFactory(noop),
          },
        },
        {
          key: "home",
          action: {
            description: NavigationDescription.MOVE_START_END_LINE,
            listener: keyActionListenerFactory(noop),
          },
        },
        {
          key: "end",
          action: {
            description: NavigationDescription.MOVE_START_END_LINE,
            listener: keyActionListenerFactory(noop),
          },
        },
      ],
    });

    this.controlsManager.updateNavigation(this._container.id, {
      in: this._inputBox.id,
    });

    this.controlsManager.updateNavigation(this._inputBox.id, {
      out: this._container.id,
      outEffect: () => {
        this.logger.debug("out effect");
      },
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  focusInputBox() {
    this.controlsManager.focus(this._inputBox.id);
  }

  public setProcessing(isProcessing: boolean) {
    if (this._isProcessing !== isProcessing) {
      if (isProcessing) {
        this.stopValueMonitoring();
        this._inputBox.element.hide();
        this._sendButton.element.hide();
        this._abortButton.element.show();
        this._abortButton.element.focus();
      } else {
        this._inputBox.element.show();
        this._sendButton.element.show();
        this._abortButton.element.hide();
        if (!this.valueCheckInterval) {
          this.startValueMonitoring();
        }
        this._inputBox.element.focus();
      }
    }

    this._isProcessing = isProcessing;

    // Update send button
    const disabled =
      !isProcessing && this._inputBox.element.getContent().length === 0;
    const buttonStyle = chatStyles.getSendButtonStyle(disabled);
    this._sendButton.element.style = buttonStyle.style;
    this.screen.element.render();
  }

  public setAborting(isAborting: boolean) {
    this._isAborting = isAborting;
    const disabled = this._isAborting;
    const buttonStyle = chatStyles.getAbortButtonStyle(disabled);
    this.abortButton.element.style = buttonStyle.style;
    this.abortButton.element.options.mouse = !disabled;
    this.screen.element.render();
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
}
