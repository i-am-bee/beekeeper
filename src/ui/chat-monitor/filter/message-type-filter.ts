import { Logger } from "beeai-framework";
import EventEmitter from "events";
import blessed from "neo-blessed";
import { isNonNull } from "remeda";
import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "../../base/monitor.js";
import { UIColors } from "../../colors.js";
import { UIConfig } from "../../config.js";
import {
  ControllableContainer,
  ControllableElement,
} from "../../controls/controls-manager.js";
import { MessageTypeEnum } from "../runtime-handler.js";

export interface MessageTypeFilterValues {
  messageTypes: MessageTypeEnum[];
}

export interface MessageTypeFilterEvents {
  "filter:change": (filter: MessageTypeFilterValues) => void;
  "filter:expand": () => void;
  "filter:collapse": () => void;
}

export class MessageTypeFilter extends ContainerComponent {
  private _container: ControllableContainer;
  private _expandButton: ControllableElement<blessed.Widgets.ButtonElement>;
  private _typeCheckboxes: Record<
    string,
    ControllableElement<blessed.Widgets.CheckboxElement>
  > = {};
  private _isExpanded = false;
  private emitter = new EventEmitter();
  private _value: MessageTypeFilterValues = { messageTypes: [] };

  // Filter settings
  private messageTypeFilters: Record<MessageTypeEnum, boolean> = {
    [MessageTypeEnum.INPUT]: true, // Always visible
    [MessageTypeEnum.FINAL]: true, // Always visible
    [MessageTypeEnum.PROGRESS]: true, // Default visible
    [MessageTypeEnum.SYSTEM]: true, // Default visible
    [MessageTypeEnum.ABORT]: true, // Default visible
    [MessageTypeEnum.ERROR]: true, // Default visible
  };

  // Events emitting
  public on<K extends keyof MessageTypeFilterEvents>(
    event: K,
    listener: MessageTypeFilterEvents[K],
  ): typeof this.emitter {
    return this.emitter.on(event, listener);
  }

  public off<K extends keyof MessageTypeFilterEvents>(
    event: K,
    listener: MessageTypeFilterEvents[K],
  ): typeof this.emitter {
    return this.emitter.off(event, listener);
  }

  public emit<K extends keyof MessageTypeFilterEvents>(
    event: K,
    ...args: Parameters<MessageTypeFilterEvents[K]>
  ): boolean {
    return this.emitter.emit(event, ...args);
  }

  get container() {
    return this._container;
  }

  get expandButton() {
    return this._expandButton;
  }

  get isExpanded() {
    return this._isExpanded;
  }

  get value() {
    return this._value;
  }

  getCheckbox(type: MessageTypeEnum) {
    return this._typeCheckboxes[type];
  }

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    super(arg, logger);

    // Type filter box area
    this._container = this.controlsManager.add({
      kind: "container",
      name: "typeFilterBox",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: 7,
        left: 0,
        top: 0,
        tags: true,
        mouse: false,
        keys: false,
        focusable: false,
        border: {
          type: "line",
        },
        style: {
          border: {
            fg: UIColors.white.white,
          },
          focus: {
            border: {
              fg: UIColors.blue.cyan,
            },
          },
        },
      }),
      parent: this.parent,
    });

    // Type filter title
    blessed.text({
      parent: this._container.element,
      content: "Message Filters:",
      left: 2,
      top: 0,
      style: {
        bold: true,
      },
    });

    // Create message type checkboxes
    this.createTypeCheckboxes();

    // Toggle button for role filter
    this._expandButton = this.controlsManager.add({
      kind: "element",
      name: "expandButton",
      element: blessed.button({
        parent: this._container.element,
        content: "▼ Show Role Filters",
        width: 20,
        height: 1,
        right: 2,
        bottom: 1,
        mouse: false,
        keys: false,
        focusable: false,
        style: {
          fg: UIColors.white.white,
          focus: {
            fg: UIConfig.colors.focused,
          },
        },
      }),
      parent: this._container,
    });
    this.updateExpandButtonLabel();

    this.createChatFilterValue();
    this.setupControls();
  }

  private updateExpandButtonLabel(shouldRender = true) {
    if (this._isExpanded) {
      this._expandButton.element.content = "▲ Hide Role Filters";
    } else {
      this._expandButton.element.content = "▼ Show Role Filters";
    }

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private setupControls(shouldRender = true) {
    // Navigation
    this.controlsManager.updateNavigation(this.parent.id, {
      in: this._container.id,
    });
    this.controlsManager.updateNavigation(this._container.id, {
      in: this._typeCheckboxes[MessageTypeEnum.PROGRESS].id,
      out: this.parent.id,
    });
    this.controlsManager.updateNavigation(
      this._typeCheckboxes[MessageTypeEnum.PROGRESS].id,
      {
        right: this._typeCheckboxes[MessageTypeEnum.SYSTEM].id,
        next: this._typeCheckboxes[MessageTypeEnum.SYSTEM].id,
        down: this._expandButton.id,
        out: this._container.id,
      },
    );
    this.controlsManager.updateNavigation(
      this._typeCheckboxes[MessageTypeEnum.SYSTEM].id,
      {
        right: this._typeCheckboxes[MessageTypeEnum.ABORT].id,
        next: this._typeCheckboxes[MessageTypeEnum.ABORT].id,
        left: this._typeCheckboxes[MessageTypeEnum.PROGRESS].id,
        previous: this._typeCheckboxes[MessageTypeEnum.PROGRESS].id,
        down: this._expandButton.id,
        out: this._container.id,
      },
    );
    this.controlsManager.updateNavigation(
      this._typeCheckboxes[MessageTypeEnum.ABORT].id,
      {
        right: this._typeCheckboxes[MessageTypeEnum.ERROR].id,
        next: this._typeCheckboxes[MessageTypeEnum.ERROR].id,
        left: this._typeCheckboxes[MessageTypeEnum.SYSTEM].id,
        previous: this._typeCheckboxes[MessageTypeEnum.SYSTEM].id,
        down: this._expandButton.id,
        out: this._container.id,
      },
    );
    this.controlsManager.updateNavigation(
      this._typeCheckboxes[MessageTypeEnum.ERROR].id,
      {
        right: this._expandButton.id,
        next: this._expandButton.id,
        left: this._typeCheckboxes[MessageTypeEnum.ABORT].id,
        previous: this._typeCheckboxes[MessageTypeEnum.ABORT].id,
        down: this._expandButton.id,
        out: this._container.id,
      },
    );
    this.controlsManager.updateNavigation(this._expandButton.id, {
      left: this._typeCheckboxes[MessageTypeEnum.ERROR].id,
      previous: this._typeCheckboxes[MessageTypeEnum.ERROR].id,
      up: this._typeCheckboxes[MessageTypeEnum.ERROR].id,
      out: this._container.id,
      inEffect: () => {
        if (this._isExpanded) {
          this.onCollapse();
        } else {
          this.onExpand();
        }
      },
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private createTypeCheckboxes() {
    // Create checkboxes for optional filters
    // Progress messages
    this._typeCheckboxes[MessageTypeEnum.PROGRESS] = this.controlsManager.add({
      kind: "element",
      name: `typeCheckbox[${MessageTypeEnum.PROGRESS}]`,
      element: blessed.checkbox({
        parent: this._container.element,
        content: "Progress",
        left: 2,
        top: 2,
        focusable: false,
        mouse: false,
        checked: this.messageTypeFilters[MessageTypeEnum.PROGRESS],
        style: {
          fg: "green",
          focus: {
            fg: UIConfig.colors.focused,
          },
        },
      }),
      parent: this._container,
    });

    // System messages
    this._typeCheckboxes[MessageTypeEnum.SYSTEM] = this.controlsManager.add({
      kind: "element",
      name: `typeCheckbox[${MessageTypeEnum.SYSTEM}]`,
      element: blessed.checkbox({
        parent: this._container.element,
        content: "System",
        left: 20,
        top: 2,
        focusable: false,
        mouse: false,
        checked: this.messageTypeFilters[MessageTypeEnum.SYSTEM],
        style: {
          fg: "blue",
          focus: {
            fg: UIConfig.colors.focused,
          },
        },
      }),
      parent: this._container,
    });

    // Abort messages
    this._typeCheckboxes[MessageTypeEnum.ABORT] = this.controlsManager.add({
      kind: "element",
      name: `typeCheckbox[${MessageTypeEnum.ABORT}]`,
      element: blessed.checkbox({
        parent: this._container.element,
        content: "Abort",
        left: 38,
        top: 2,
        focusable: false,
        mouse: false,
        checked: this.messageTypeFilters[MessageTypeEnum.ABORT],
        style: {
          fg: UIColors.yellow.yellow,
          focus: {
            fg: UIConfig.colors.focused,
          },
        },
      }),
      parent: this._container,
    });

    // Error messages
    this._typeCheckboxes[MessageTypeEnum.ERROR] = this.controlsManager.add({
      kind: "element",
      name: `typeCheckbox[${MessageTypeEnum.ERROR}]`,
      element: blessed.checkbox({
        parent: this._container.element,
        content: "Error",
        left: 56,
        top: 2,
        focusable: false,
        mouse: false,
        checked: this.messageTypeFilters[MessageTypeEnum.ERROR],
        style: {
          fg: UIColors.red.red,
          focus: {
            fg: UIConfig.colors.focused,
          },
        },
      }),
      parent: this._container,
    });

    // Fixed filters display (always on)
    blessed.text({
      parent: this._container.element,
      content: "Always visible: Input, Final",
      left: 2,
      top: 4,
      style: {
        fg: "grey",
        bold: true,
      },
    });

    // Set up checkbox event handlers
    Object.entries(this._typeCheckboxes).forEach(([type, checkbox]) => {
      checkbox.element.on("check", () => {
        this.messageTypeFilters[type as MessageTypeEnum] = true;
        this.onFilterChange();
      });

      checkbox.element.on("uncheck", () => {
        this.messageTypeFilters[type as MessageTypeEnum] = false;
        this.onFilterChange();
      });
    });
  }

  private onFilterChange() {
    this.createChatFilterValue();
    this.emit("filter:change", this._value);
  }

  private createChatFilterValue() {
    const messageTypes = Object.keys(this._typeCheckboxes)
      .map((type) =>
        this.messageTypeFilters[type as MessageTypeEnum]
          ? (type as MessageTypeEnum)
          : null,
      )
      .filter(isNonNull);

    this._value = {
      messageTypes,
    } satisfies MessageTypeFilterValues;
  }

  expand() {
    this.onExpand();
  }

  private onExpand() {
    this._isExpanded = true;
    this.emit("filter:expand");
    this.updateExpandButtonLabel();
  }

  collapse() {
    this.onCollapse();
  }

  private onCollapse() {
    this._isExpanded = false;
    this.emit("filter:collapse");
    this.updateExpandButtonLabel();
  }

  reset(shouldRender = true) {
    this.messageTypeFilters = {
      [MessageTypeEnum.INPUT]: true, // Always visible
      [MessageTypeEnum.FINAL]: true, // Always visible
      [MessageTypeEnum.PROGRESS]: true, // Default visible
      [MessageTypeEnum.SYSTEM]: true, // Default visible
      [MessageTypeEnum.ABORT]: true, // Default visible
      [MessageTypeEnum.ERROR]: true, // Default visible
    };
    this.createChatFilterValue();

    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
