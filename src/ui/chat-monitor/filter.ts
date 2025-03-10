import EventEmitter from "events";
import blessed from "neo-blessed";
import { MessageTypeEnum } from "./runtime-handler.js";
import { BaseMonitor, ParentInput, ScreenInput } from "../base/monitor.js";
import { clone, isNonNull } from "remeda";

interface ChatFilterEvents {
  "filter:change": (filter: ChatFilterValues) => void;
  "filter:expand": (heightDelta: number) => void;
  "filter:collapse": (heightDelta: number) => void;
}

interface ChatFilterValues {
  messageTypes: MessageTypeEnum[];
  roles: string[];
}

export const EXPANSE_HEIGHT = 18;

export class ChatFilter extends BaseMonitor {
  private typeFilterBox: blessed.Widgets.BoxElement;
  private roleFilterBox: blessed.Widgets.BoxElement;
  private expandRoleFilterButton: blessed.Widgets.ButtonElement;
  private typeCheckboxes: Record<string, blessed.Widgets.CheckboxElement> = {};
  private roleCheckboxes: Record<string, blessed.Widgets.CheckboxElement> = {};
  private selectAllRolesCheckbox: blessed.Widgets.CheckboxElement;
  private isRoleFilterExpanded = false;
  private emitter = new EventEmitter();
  private _values: ChatFilterValues = { messageTypes: [], roles: [] };

  get values() {
    return clone(this._values);
  }

  // Filter settings
  private messageTypeFilters: Record<MessageTypeEnum, boolean> = {
    [MessageTypeEnum.INPUT]: true, // Always visible
    [MessageTypeEnum.FINAL]: true, // Always visible
    [MessageTypeEnum.PROGRESS]: true, // Default visible
    [MessageTypeEnum.SYSTEM]: true, // Default visible
    [MessageTypeEnum.ABORT]: true, // Default visible
    [MessageTypeEnum.ERROR]: true, // Default visible
  };

  private messageRoleFilters: Record<string, boolean> = {};
  private knownRoles = new Set<string>();

  constructor(arg: ParentInput | ScreenInput) {
    super(arg);

    // Type filter box area
    this.typeFilterBox = blessed.box({
      parent: this.parent,
      width: "100%",
      height: 7,
      left: 0,
      top: 0,
      tags: true,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: "blue",
        },
      },
    });

    // Type filter title
    blessed.text({
      parent: this.typeFilterBox,
      content: "Message Filters:",
      left: 2,
      top: 0,
      style: {
        bold: true,
      },
    });

    // Create message type checkboxes
    this.createTypeCheckboxes();

    // Role filter box area (initially hidden)
    this.roleFilterBox = blessed.box({
      parent: this.parent,
      width: "100%",
      height: 0, // Will be resized when expanded
      left: 0,
      top: 7, // Below type filter box
      tags: true,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: "green",
        },
      },
      hidden: true, // Initially hidden
    });

    // Role filter title
    blessed.text({
      parent: this.roleFilterBox,
      content: "Role Filters:",
      left: 2,
      top: 0,
      style: {
        bold: true,
      },
    });

    // "Select All" checkbox for roles
    this.selectAllRolesCheckbox = blessed.checkbox({
      parent: this.roleFilterBox,
      content: "Select All",
      left: 2,
      top: 2,
      checked: true,
      style: {
        fg: "green",
        focus: {
          fg: "brightGreen",
        },
      },
      mouse: true,
    });

    // Toggle button for role filter
    this.expandRoleFilterButton = blessed.button({
      parent: this.typeFilterBox,
      content: "▼ Show Role Filters",
      width: 20,
      height: 1,
      right: 2,
      bottom: 1,
      style: {
        fg: "green",
        focus: {
          fg: "brightGreen",
        },
      },
      mouse: true,
    });

    this.setupEventHandlers();
    this.createChatFilterValue();
  }

  private setupEventHandlers() {
    // Set up event handler for select all checkbox
    this.selectAllRolesCheckbox.on("check", () => {
      // Check all role checkboxes
      Object.keys(this.roleCheckboxes).forEach((role) => {
        this.roleCheckboxes[role].checked = true;
        this.messageRoleFilters[role] = true;
      });
      this.onFilterChange();
    });

    this.selectAllRolesCheckbox.on("uncheck", () => {
      // Uncheck all role checkboxes
      Object.keys(this.roleCheckboxes).forEach((role) => {
        this.roleCheckboxes[role].checked = false;
        this.messageRoleFilters[role] = false;
      });
      this.onFilterChange();
    });

    // Set up event handler for toggle button
    this.expandRoleFilterButton.on("press", () => {
      this.toggleRoleFilter();
    });
  }

  public on<K extends keyof ChatFilterEvents>(
    event: K,
    listener: ChatFilterEvents[K],
  ): typeof this.emitter {
    return this.emitter.on(event, listener);
  }

  public off<K extends keyof ChatFilterEvents>(
    event: K,
    listener: ChatFilterEvents[K],
  ): typeof this.emitter {
    return this.emitter.off(event, listener);
  }

  public emit<K extends keyof ChatFilterEvents>(
    event: K,
    ...args: Parameters<ChatFilterEvents[K]>
  ): boolean {
    return this.emitter.emit(event, ...args);
  }

  addRole(role: string) {
    // Check if this is a new role and add to filters if needed
    if (!this.knownRoles.has(role)) {
      this.knownRoles.add(role);
      this.addRoleCheckbox(role);
    }
  }

  focus(type: "types" | "roles") {
    switch (type) {
      case "types":
        this.typeFilterBox.focus();
        break;
      case "roles":
        if (!this.isRoleFilterExpanded) {
          this.toggleRoleFilter();
        }
        this.selectAllRolesCheckbox.focus();
        break;
    }
  }

  private onFilterChange() {
    this._values = this.createChatFilterValue();
    this.emit("filter:change", this._values);
  }

  private onExpand(heightDelta: number) {
    this.emit("filter:expand", heightDelta);
  }

  private onCollapse(heightDelta: number) {
    this.emit("filter:collapse", -heightDelta);
  }

  private createChatFilterValue() {
    const roles = Object.keys(this.roleCheckboxes)
      .map((role) => (this.messageRoleFilters[role] ? role : null))
      .filter(isNonNull);
    const messageTypes = Object.keys(this.typeCheckboxes)
      .map((type) =>
        this.messageTypeFilters[type as MessageTypeEnum]
          ? (type as MessageTypeEnum)
          : null,
      )
      .filter(isNonNull);

    return {
      messageTypes,
      roles,
    } satisfies ChatFilterValues;
  }

  private toggleRoleFilter() {
    if (this.isRoleFilterExpanded) {
      // Collapse
      const originalHeight = Number(this.roleFilterBox.height);
      this.roleFilterBox.height = 0;
      this.roleFilterBox.hidden = true;
      this.onCollapse(originalHeight);
      this.expandRoleFilterButton.content = "▼ Show Role Filters";
    } else {
      // Expand
      // Calculate height based on number of roles (add 4 for padding and title)
      const numRolesRows = Math.ceil((this.knownRoles.size + 1) / 4); // +1 for Select All
      this.roleFilterBox.height = 6 + numRolesRows * 2;
      this.roleFilterBox.hidden = false;
      this.onExpand(this.roleFilterBox.height);
      this.expandRoleFilterButton.content = "▲ Hide Role Filters";
    }
    this.isRoleFilterExpanded = !this.isRoleFilterExpanded;
    this.screen.render();
  }

  private createTypeCheckboxes() {
    // Create checkboxes for optional filters
    // Progress messages
    this.typeCheckboxes[MessageTypeEnum.PROGRESS] = blessed.checkbox({
      parent: this.typeFilterBox,
      content: "Progress",
      left: 2,
      top: 2,
      checked: this.messageTypeFilters[MessageTypeEnum.PROGRESS],
      style: {
        fg: "green",
        focus: {
          fg: "brightGreen",
        },
      },
      mouse: true,
    });

    // System messages
    this.typeCheckboxes[MessageTypeEnum.SYSTEM] = blessed.checkbox({
      parent: this.typeFilterBox,
      content: "System",
      left: 20,
      top: 2,
      checked: this.messageTypeFilters[MessageTypeEnum.SYSTEM],
      style: {
        fg: "blue",
        focus: {
          fg: "brightBlue",
        },
      },
      mouse: true,
    });

    // Abort messages
    this.typeCheckboxes[MessageTypeEnum.ABORT] = blessed.checkbox({
      parent: this.typeFilterBox,
      content: "Abort",
      left: 38,
      top: 2,
      checked: this.messageTypeFilters[MessageTypeEnum.ABORT],
      style: {
        fg: "yellow",
        focus: {
          fg: "brightYellow",
        },
      },
      mouse: true,
    });

    // Error messages
    this.typeCheckboxes[MessageTypeEnum.ERROR] = blessed.checkbox({
      parent: this.typeFilterBox,
      content: "Error",
      left: 56,
      top: 2,
      checked: this.messageTypeFilters[MessageTypeEnum.ERROR],
      style: {
        fg: "red",
        focus: {
          fg: "brightRed",
        },
      },
      mouse: true,
    });

    // Fixed filters display (always on)
    blessed.text({
      parent: this.typeFilterBox,
      content: "Always visible: Input, Final",
      left: 2,
      top: 4,
      style: {
        fg: "grey",
        bold: true,
      },
    });

    // Set up checkbox event handlers
    Object.entries(this.typeCheckboxes).forEach(([type, checkbox]) => {
      checkbox.on("check", () => {
        this.messageTypeFilters[type as MessageTypeEnum] = true;
        this.onFilterChange();
      });

      checkbox.on("uncheck", () => {
        this.messageTypeFilters[type as MessageTypeEnum] = false;
        this.onFilterChange();
      });
    });
  }

  private addRoleCheckbox(role: string) {
    if (this.roleCheckboxes[role]) {
      return; // Already exists
    }

    // Calculate position based on number of existing checkboxes
    const checkboxCount = Object.keys(this.roleCheckboxes).length;
    const col = checkboxCount % 4;
    const row = Math.floor(checkboxCount / 4);

    // // "Select All" checkbox for roles
    // this.selectAllRolesCheckbox = blessed.checkbox({
    //     parent: this.roleFilterBox,
    //     content: "Select All",
    //     left: 2,
    //     top: 2,
    //     checked: true,
    //     style: {
    //       fg: "green",
    //       focus: {
    //         fg: "brightGreen",
    //       },
    //     },
    //     mouse: true,
    //   });

    this.roleCheckboxes[role] = blessed.checkbox({
      parent: this.roleFilterBox,
      content: role,
      left: 2 + col * 20,
      top: 4 + row, // +4 to account for title and Select All
      checked: true, // New roles are visible by default
      style: {
        fg: "white",
        focus: {
          fg: "brightWhite",
        },
      },
      mouse: true,
    });

    // Store the filter state
    this.messageRoleFilters[role] = true;

    // Set up event handlers
    this.roleCheckboxes[role].on("check", () => {
      this.messageRoleFilters[role] = true;
      this.updateSelectAllCheckbox();
      this.onFilterChange();
    });

    this.roleCheckboxes[role].on("uncheck", () => {
      this.messageRoleFilters[role] = false;
      this.updateSelectAllCheckbox();
      this.onFilterChange();
    });

    this.onFilterChange();

    // If we've added more roles, we might need to adjust the height
    if (this.isRoleFilterExpanded) {
      const numRolesRows = Math.ceil((this.knownRoles.size + 1) / 4);
      const originalHeight = Number(this.roleFilterBox.height);
      this.roleFilterBox.height = Math.min(10, 4 + numRolesRows);
      this.screen.render();
      this.onExpand(this.roleFilterBox.height - originalHeight);
    }
  }

  private updateSelectAllCheckbox() {
    // Check if all role checkboxes are checked or unchecked
    const allChecked = Object.keys(this.messageRoleFilters).every(
      (role) => this.messageRoleFilters[role],
    );
    const allUnchecked = Object.keys(this.messageRoleFilters).every(
      (role) => !this.messageRoleFilters[role],
    );

    if (allChecked && !this.selectAllRolesCheckbox.checked) {
      this.selectAllRolesCheckbox.checked = true;
    } else if (allUnchecked && this.selectAllRolesCheckbox.checked) {
      this.selectAllRolesCheckbox.checked = false;
    }
  }

  reset(shouldRender = true) {
    // Keep track of known roles
    this.knownRoles = new Set();

    // Clear role checkboxes
    Object.values(this.roleCheckboxes).forEach((checkbox) => {
      checkbox.destroy();
    });
    this.roleCheckboxes = {};
    this.messageRoleFilters = {};

    // Reset role filter height if it's expanded
    if (this.isRoleFilterExpanded) {
      this.toggleRoleFilter(); // This will collapse it
    }

    if (shouldRender) {
      this.screen.render();
    }
  }
}
