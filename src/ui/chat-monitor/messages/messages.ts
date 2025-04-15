import { BaseMonitor, ParentInput, ScreenInput } from "@/ui/base/monitor.js";
import { ControllableContainer } from "@/ui/controls/controls-manager.js";
import blessed from "neo-blessed";
import * as chatStyles from "../config.js";
import { ChatFilterValues } from "../filter/filter.js";
import { MessageTypeEnum } from "../runtime-handler.js";
import clipboardy from "clipboardy";

export interface MessageValue {
  role: string;
  content: string;
  timestamp: Date;
  type: MessageTypeEnum;
}

export class Messages extends BaseMonitor {
  private _container: ControllableContainer;
  private _value: MessageValue[] = [];
  private _messageStartIndexes: number[] = [];
  private _currentMessageIndex = -1;
  private _userScrolled = false;
  private getChatFilters: () => ChatFilterValues;

  get container() {
    return this._container;
  }

  get value() {
    return this._value;
  }

  constructor({
    getChatFilters,
    ...rest
  }: (ParentInput | ScreenInput) & { getChatFilters: () => ChatFilterValues }) {
    super(rest);

    this.getChatFilters = getChatFilters;

    // Messages area - adjusted to make room for filter boxes
    this._container = this.controlsManager.add({
      kind: "container",
      name: "messagesBox",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: "100%-12", // Adjusted for filter boxes at top and input at bottom
        left: 0,
        top: 7, // Space for type filter box
        tags: true,
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        keys: true,
        vi: true,
        ...chatStyles.getMessagesBoxStyle(),
      }),
      parent: this.parent,
    });

    this.controlsManager.screen.element.on(
      "resize",
      this.updateDisplay.bind(this),
    );
    this._container.element.on("scroll", this.handleScroll.bind(this));

    this.setupControls();
  }

  private setupControls(shouldRender = true) {
    this.controlsManager.updateKeyActions(this._container.id, {
      kind: "override",
      actions: [
        {
          key: "down",
          action: {
            description: "Scroll down one line",
            listener: () => {
              // The scroll is done automatically, we just need to reset the highlighted message
              this.resetCurrentMessageIndex();
            },
          },
        },
        {
          key: "up",
          action: {
            description: "Scroll up one line",
            listener: () => {
              // The scroll is done automatically, we just need to reset the highlighted message
              this.resetCurrentMessageIndex();
            },
          },
        },
        {
          key: "pagedown",
          action: {
            description: "Scroll down one page",
            listener: () => {
              this.resetCurrentMessageIndex();

              const height = this.getBoxHeight();

              this._container.element.scroll(height);
            },
          },
        },
        {
          key: "pageup",
          action: {
            description: "Scroll up one page",
            listener: () => {
              this.resetCurrentMessageIndex();

              const height = this.getBoxHeight();

              this._container.element.scroll(-height);
            },
          },
        },
        {
          key: "home",
          action: {
            description: "Scroll to the top",
            listener: () => {
              this.resetCurrentMessageIndex();

              const scroll = 0;

              this._container.element.scrollTo(scroll);
            },
          },
        },
        {
          key: "end",
          action: {
            description: "Scroll to the bottom",
            listener: () => {
              this.resetCurrentMessageIndex();

              const scroll = this._container.element.getScrollHeight();

              this._container.element.scrollTo(scroll);
            },
          },
        },
        {
          key: "tab",
          action: {
            description: "Scroll to the next message",
            listener: () => {
              if (!this.checkCurrentMessageExists()) {
                const newIndex = this._currentMessageIndex + 1;
                const scroll = this._messageStartIndexes.at(newIndex);

                if (scroll != null) {
                  this._currentMessageIndex = newIndex;
                  this.updateDisplay();
                  this._container.element.scrollTo(scroll);
                }
              }
            },
          },
        },
        {
          key: "S-tab",
          action: {
            description: "Scroll to the previous message",
            listener: () => {
              if (!this.checkCurrentMessageExists()) {
                const newIndex = this._currentMessageIndex - 1;
                const scroll =
                  newIndex < 0
                    ? undefined
                    : this._messageStartIndexes.at(newIndex);

                if (scroll != null) {
                  this._currentMessageIndex = newIndex;
                  this.updateDisplay();
                  this._container.element.scrollTo(scroll);
                }
              }
            },
          },
        },
        {
          key: "S-c",
          action: {
            description: "Copy current message",
            listener: () => {
              const msg = this._value[this._currentMessageIndex];

              if (msg) {
                clipboardy.writeSync(JSON.stringify({...msg, role: blessed.stripTags(msg.role) }, null, 2));
              }
            },
          },
        },
        {
          key: "escape",
          action: {
            description: "Exit from the message",
            listener: () => {
              this.resetCurrentMessageIndex();
            },
          },
        },
      ],
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private resetCurrentMessageIndex() {
    this._currentMessageIndex = -1;
    this.updateDisplay();
  }

  private measureMessageLines(msg: string) {
    const fakeBox = blessed.box({
      width: this._container.element.width,
      height: this._container.element.height,
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true,
      vi: true,
      parent: this._container.element,
      ...chatStyles.getMessagesBoxStyle(),
    });

    fakeBox.setContent(msg);

    const lines = fakeBox.getScreenLines().length;

    fakeBox.destroy();

    return lines;
  }

  private handleScroll() {
    const scroll = this._container.element.getScroll() + 1;
    const height = this._container.element.getScrollHeight();

    this._userScrolled = scroll >= height ? false : true;
  }

  private getBoxHeight() {
    // Box height minus the border
    return (
      Number(this._container.element.height) -
      Number(this._container.element.iheight)
    );
  }

  private checkCurrentMessageExists() {
    if (this._currentMessageIndex !== -1) {
      return false;
    }

    const scroll = this._container.element.getScroll();
    const normalizedScroll =
      scroll > 0 ? scroll - this.getBoxHeight() + 1 : scroll;
    const index = this._messageStartIndexes.findIndex(
      (element) => element >= normalizedScroll,
    );

    this._currentMessageIndex = index;
    this.updateDisplay();

    return true;
  }

  public addMessage(role: string, content: string, type: MessageTypeEnum) {
    const timestamp = new Date();
    this._value.push({ role, content, timestamp, type });
    this.updateDisplay();
  }

  public updateDisplay(shouldRender = true) {
    const filter = this.getChatFilters();

    // Filter messages based on current filter settings
    const filteredMessages = this._value.filter((msg) => {
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

    this._messageStartIndexes = [];
    let currentLineIndex = 0;

    // Format and display filtered messages
    const formattedMessages = filteredMessages.map((msg, idx) => {
      const formatted = chatStyles.formatCompleteMessage(
        msg.timestamp,
        msg.role,
        msg.content,
        msg.type,
        this._currentMessageIndex === idx,
      );
      const lines = this.measureMessageLines(formatted);

      this._messageStartIndexes.push(currentLineIndex);
      currentLineIndex += lines;

      return formatted;
    });

    this._container.element.setContent(formattedMessages.join("\n"));

    if (!this._userScrolled) {
      this._container.element.scrollTo(
        this._container.element.getScrollHeight(),
      );
    }

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  reset(shouldRender = true): void {
    this._value = [];
    this.updateDisplay();

    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
