import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "@/ui/base/monitor.js";
import { ControllableContainer } from "@/ui/controls/controls-manager.js";
import { keyActionListenerFactory } from "@/ui/controls/key-bindings.js";
import { NavigationDescription, NavigationDirection } from "@/ui/controls/navigation.js";
import { Logger } from "beeai-framework";
import clipboardy from "clipboardy";
import blessed from "neo-blessed";
import * as chatStyles from "../config.js";
import { ChatFilterValues } from "../filter/filter.js";
import { MessageTypeEnum } from "../runtime-handler.js";

export interface MessageValue {
  role: string;
  content: string;
  timestamp: Date | string;
  type: MessageTypeEnum;
}

type MessagesOptions = (ParentInput | ScreenInput) & {
  getChatFilters: () => ChatFilterValues;
};

export class Messages extends ContainerComponent {
  private _container: ControllableContainer;
  private _messagesBox: ControllableContainer;
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

  constructor({ getChatFilters, ...rest }: MessagesOptions, logger: Logger) {
    super(rest, logger);

    this.getChatFilters = getChatFilters;

    // Container
    this._container = this.controlsManager.add({
      kind: "container",
      name: "messagesContainer",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: "100%-13", // Adjusted for filter boxes at top and input and help at bottom
        left: 0,
        top: 7, // Space for type filter box
        scrollable: false,
        alwaysScroll: false,
        mouse: false,
        keys: true,
        ...chatStyles.getMessagesContainerStyle(),
      }),
      parent: this.parent,
    });

    // Messages area - adjusted to make room for filter boxes
    this._messagesBox = this.controlsManager.add({
      kind: "container",
      name: "messagesBox",
      element: blessed.box({
        parent: this._container.element,
        width: "100%-2",
        height: "100%-2", // Adjusted for filter boxes at top and input and help at bottom
        tags: true,
        scrollable: true,
        alwaysScroll: true,
        mouse: false,
        keys: true,
        ...chatStyles.getMessagesBoxStyle(),
      }),
      parent: this._container,
    });

    this.controlsManager.screen.element.on(
      "resize",
      this.updateDisplay.bind(this),
    );
    this._messagesBox.element.on("scroll", this.handleScroll.bind(this));

    this.setupControls();
  }

  private setupControls(shouldRender = true) {
    this.controlsManager.updateKeyActions(this._messagesBox.id, {
      kind: "exclusive",
      actions: [
        {
          key: "escape",
          action: {
            description: NavigationDescription.OUT,
            listener: keyActionListenerFactory(() => {
              // The scroll is done automatically, we just need to reset the highlighted message
              this.controlsManager.navigate(NavigationDirection.OUT);
            }),
          },
        },
        {
          key: "up",
          action: {
            description: NavigationDescription.MOVE_UP_DOWN,
            listener: keyActionListenerFactory(() => {
              // The scroll is done automatically, we just need to reset the highlighted message
              this.resetCurrentMessageIndex();
            }),
          },
        },
        {
          key: "down",
          action: {
            description: NavigationDescription.MOVE_UP_DOWN,
            listener: keyActionListenerFactory(() => {
              // The scroll is done automatically, we just need to reset the highlighted message
              this.resetCurrentMessageIndex();
            }),
          },
        },
        {
          key: "pageup",
          action: {
            description: NavigationDescription.MOVE_UP_DOWN_PAGE,
            listener: keyActionListenerFactory(() => {
              this.resetCurrentMessageIndex();

              const height = this.getBoxHeight();

              this._messagesBox.element.scroll(-height);
            }),
          },
        },
        {
          key: "pagedown",
          action: {
            description: NavigationDescription.MOVE_UP_DOWN_PAGE,
            listener: keyActionListenerFactory(() => {
              this.resetCurrentMessageIndex();

              const height = this.getBoxHeight();

              this._messagesBox.element.scroll(height);
            }),
          },
        },
        {
          key: "home",
          action: {
            description: NavigationDescription.MOVE_START_END,
            listener: keyActionListenerFactory(() => {
              this.resetCurrentMessageIndex();

              const scroll = 0;

              this._messagesBox.element.scrollTo(scroll);
            }),
          },
        },
        {
          key: "end",
          action: {
            description: NavigationDescription.MOVE_START_END,
            listener: keyActionListenerFactory(() => {
              this.resetCurrentMessageIndex();

              const scroll = this._messagesBox.element.getScrollHeight();

              this._messagesBox.element.scrollTo(scroll);
            }),
          },
        },
        {
          key: "tab",
          action: {
            description: NavigationDescription.HIGHLIGHT_NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              if (!this.checkCurrentMessageExists()) {
                const newIndex = this._currentMessageIndex + 1;
                const scroll = this._messageStartIndexes.at(newIndex);

                if (scroll != null) {
                  this._currentMessageIndex = newIndex;
                  this.updateDisplay();
                  this._messagesBox.element.scrollTo(scroll);
                }
              }
            }),
          },
        },
        {
          key: "S-tab",
          action: {
            description: NavigationDescription.HIGHLIGHT_NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              if (!this.checkCurrentMessageExists()) {
                const newIndex = this._currentMessageIndex - 1;
                const scroll =
                  newIndex < 0
                    ? undefined
                    : this._messageStartIndexes.at(newIndex);

                if (scroll != null) {
                  this._currentMessageIndex = newIndex;
                  this.updateDisplay();
                  this._messagesBox.element.scrollTo(scroll);
                }
              }
            }),
          },
        },
        {
          key: "C-c",
          action: {
            description: NavigationDescription.COPY_MESSAGE,
            listener: keyActionListenerFactory(() => {
              const msg = this._value[this._currentMessageIndex];

              if (msg) {
                clipboardy.writeSync(
                  JSON.stringify(
                    { ...msg, role: blessed.stripTags(msg.role) },
                    null,
                    2,
                  ),
                );
              }
            }),
          },
        },
      ],
    });

    this.controlsManager.updateNavigation(this._container.id, {
      in: this._messagesBox.id,
      inEffect: () => {
        // TODO Change color of container to indicate edit mode
      },
    });

    this.controlsManager.updateNavigation(this._messagesBox.id, {
      out: this._container.id,
      outEffect: () => {
        // TODO Change color of container back
        this.resetCurrentMessageIndex(true);
      },
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  focusContainer() {
    this.controlsManager.focus(this.container.id);
  }

  focusMessagesBox() {
    this.controlsManager.focus(this._messagesBox.id);
  }

  private resetCurrentMessageIndex(resetPosition = false) {
    this._currentMessageIndex = -1;
    if (resetPosition) {
      this._userScrolled = false;
    }
    this.updateDisplay();
  }

  private measureMessageLines(msg: string) {
    const fakeBox = blessed.box({
      width: this._messagesBox.element.width,
      height: this._messagesBox.element.height,
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true,
      vi: true,
      parent: this._messagesBox.element,
      ...chatStyles.getMessagesContainerStyle(),
    });

    fakeBox.setContent(msg);

    const lines = fakeBox.getScreenLines().length;

    fakeBox.destroy();

    return lines;
  }

  private handleScroll() {
    const scroll = this._messagesBox.element.getScroll() + 1;
    const height = this._messagesBox.element.getScrollHeight();

    this._userScrolled = scroll >= height ? false : true;
  }

  private getBoxHeight() {
    // Box height minus the border
    return (
      Number(this._messagesBox.element.height) -
      Number(this._messagesBox.element.iheight)
    );
  }

  private checkCurrentMessageExists() {
    if (this._currentMessageIndex !== -1) {
      return false;
    }

    const scroll = this._messagesBox.element.getScroll();
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

    this._messagesBox.element.setContent(formattedMessages.join("\n"));

    if (!this._userScrolled) {
      this._messagesBox.element.scrollTo(
        this._messagesBox.element.getScrollHeight(),
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
