import { BaseMonitor, ParentInput, ScreenInput } from "@/ui/base/monitor.js";
import { ControllableElement } from "@/ui/controls/controls-manager.js";
import blessed from "neo-blessed";
import { Textarea } from "../../blessed/Textarea.js";
import * as st from "../../config.js";
import * as chatStyles from "../config.js";

type ChatInputOptions = (ParentInput | ScreenInput) & {
  onValueChange: () => void;
};

export class ChatInput extends BaseMonitor {
  private _inputBox: ControllableElement;
  private _sendButton: ControllableElement;
  private _abortButton: ControllableElement;

  private _onValueChange: () => void;

  private _isProcessing = false;
  private _isAborting = false;
  private lastValue = ""; // Track the last value
  private valueCheckInterval: NodeJS.Timeout | null = null;

  get inputBox() {
    return this._inputBox;
  }

  get sendButton() {
    return this._sendButton;
  }

  get abortButton() {
    return this._abortButton;
  }

  constructor({ onValueChange, ...rest }: ChatInputOptions) {
    super(rest);

    this._onValueChange = onValueChange;

    // Input area
    this._inputBox = this.controlsManager.add({
      kind: "element",
      name: "inputBox",
      element: Textarea({
        parent: this.parent.element,
        width: "100%-12", // Make room for abort button
        height: 5,
        left: 0,
        top: "100%-5",
        ...chatStyles.getInputBoxStyle(),
        scrollbar: st.UIConfig.scrollbar,
      }),
      parent: this.parent,
    });

    // Send/abort button
    this._sendButton = this.controlsManager.add({
      kind: "element",
      name: "sendButton",
      element: blessed.button({
        parent: this.parent.element,
        width: 10,
        height: 3,
        left: "100%-11",
        top: "100%-4",
        ...chatStyles.getSendButtonStyle(true),
        tags: true,
        mouse: true,
      }),
      parent: this.parent,
    });

    this._abortButton = this.controlsManager.add({
      kind: "element",
      name: "abortButton",
      element: blessed.button({
        parent: this.parent.element,
        width: 10,
        height: 3,
        left: "50%-5",
        top: "100%-4",
        ...chatStyles.getAbortButtonStyle(),
        tags: true,
        mouse: true,
        hidden: true,
      }),
      parent: this.parent,
    });
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
