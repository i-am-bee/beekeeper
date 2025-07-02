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
import {
  ControllableContainer,
  ControllableElement,
} from "../../controls/controls-manager.js";
import {
  getBorderedBoxStyle,
  getCheckboxStyle,
  getTextFieldStyle,
} from "../config.js";

export interface RoleFilterValues {
  roles: string[];
}

export interface RoleFilterEvents {
  "filter:change": (filter: RoleFilterValues) => void;
  "filter:blur": () => void;
}

export class RoleFilter extends ContainerComponent {
  static readonly DEFAULT_HEIGHT = 7;
  static readonly MAX_ROWS = 4;
  static readonly COL_WIDTH = 40;

  private _container: ControllableContainer;
  private _selectAllRolesCheckbox: ControllableElement<blessed.Widgets.CheckboxElement>;
  private knownRoles: string[] = [];
  private emitter = new EventEmitter();
  private roleCheckboxes: Record<
    string,
    ControllableElement<blessed.Widgets.CheckboxElement>
  > = {};

  // Filter settings
  private messageRoleFilters: Record<string, boolean> = {};
  private _value: RoleFilterValues = { roles: [] };

  // Events emitting
  public on<K extends keyof RoleFilterEvents>(
    event: K,
    listener: RoleFilterEvents[K],
  ): typeof this.emitter {
    return this.emitter.on(event, listener);
  }

  public off<K extends keyof RoleFilterEvents>(
    event: K,
    listener: RoleFilterEvents[K],
  ): typeof this.emitter {
    return this.emitter.off(event, listener);
  }

  public emit<K extends keyof RoleFilterEvents>(
    event: K,
    ...args: Parameters<RoleFilterEvents[K]>
  ): boolean {
    return this.emitter.emit(event, ...args);
  }

  get container() {
    return this._container;
  }

  get selectAllRolesCheckbox() {
    return this._selectAllRolesCheckbox;
  }

  get value() {
    return this._value;
  }

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    super(arg, logger);

    // Role filter box area
    this._container = this.controlsManager.add({
      kind: "container",
      name: "role_filter_box",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: RoleFilter.DEFAULT_HEIGHT, // Will be resized when expanded
        left: 0,
        top: 0, // Below type filter box
        tags: true,
        mouse: false,
        keys: false,
        focusable: false,
        ...getBorderedBoxStyle(),
      }),
      parent: this.parent,
    });

    // Role filter title
    blessed.text({
      parent: this.container.element,
      content: "Role Filters:",
      left: 2,
      top: 0,
      ...getTextFieldStyle({
        style: {
          bold: true,
        },
      }),
    });

    // "Select All" checkbox for roles
    this._selectAllRolesCheckbox = this.controlsManager.add({
      kind: "element",
      name: "select_all_roles_checkbox",
      element: blessed.checkbox({
        parent: this.container.element,
        content: "Select All",
        left: 2,
        top: 2,
        checked: true,
        mouse: false,
        keys: false,
        focusable: false,
        ...getCheckboxStyle(true, {
          style: {
            fg: UIColors.green.green,
          },
        }),
      }),
      parent: this.container,
    });

    this.setupEventHandlers();
    this.setupControls();
  }

  private setupEventHandlers() {
    // Set up event handler for select all checkbox
    this._selectAllRolesCheckbox.element.on("check", () => {
      // Check all role checkboxes
      Object.keys(this.roleCheckboxes).forEach((role) => {
        (
          this.roleCheckboxes[role].element as blessed.Widgets.CheckboxElement
        ).checked = true;
        this.messageRoleFilters[role] = true;
      });
      this.onFilterChange();
    });

    this._selectAllRolesCheckbox.element.on("uncheck", () => {
      // Uncheck all role checkboxes
      Object.keys(this.roleCheckboxes).forEach((role) => {
        (
          this.roleCheckboxes[role].element as blessed.Widgets.CheckboxElement
        ).checked = false;
        this.messageRoleFilters[role] = false;
      });
      this.onFilterChange();
    });
  }

  private setupControls(shouldRender = true) {
    // Navigation
    this.controlsManager.updateNavigation(this._selectAllRolesCheckbox.id, {
      out: undefined,
      outEffect: () => this.onBlur(),
      previousEffect: () => this.onBlur(),
      upEffect: () => this.onBlur(),
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  addRole(role: string) {
    // Check if this is a new role and add to filters if needed
    if (!this.knownRoles.includes(role)) {
      this.addRoleCheckbox(role);
      this.knownRoles.push(role);
    }
  }

  private addRoleCheckbox(role: string) {
    if (this.roleCheckboxes[role]) {
      return; // Already exists
    }

    // Calculate position based on number of existing checkboxes
    const checkboxCount = Object.keys(this.roleCheckboxes).length;
    const col = Math.floor(checkboxCount / RoleFilter.MAX_ROWS);
    const row = checkboxCount % RoleFilter.MAX_ROWS;

    const currentCheckbox = this.controlsManager.add({
      kind: "element",
      name: `roleCheckboxes[${role}]`,
      element: blessed.checkbox({
        parent: this.container.element,
        content: role,
        left: 2 + col * RoleFilter.COL_WIDTH,
        top: 4 + row, // +4 to account for title and Select All
        checked: true, // New roles are visible by default
        ...getCheckboxStyle(true),
        mouse: false,
        tags: true,
      }),
      parent: this.container,
    });

    const lastRole = this.knownRoles.at(-1);
    const lastCheckbox = lastRole ? this.roleCheckboxes[lastRole] : undefined;
    this.roleCheckboxes[role] = currentCheckbox;
    const shared = {
      outEffect: () => this.onBlur(),
    };

    if (lastCheckbox) {
      this.controlsManager.updateNavigation(lastCheckbox.id, {
        ...shared,
        next: currentCheckbox.id,
      });

      this.controlsManager.updateNavigation(currentCheckbox.id, {
        ...shared,
        previous: lastCheckbox.id,
      });
    } else {
      this.controlsManager.updateNavigation(this._selectAllRolesCheckbox.id, {
        ...shared,
        next: currentCheckbox.id,
      });

      this.controlsManager.updateNavigation(currentCheckbox.id, {
        ...shared,
        previous: this._selectAllRolesCheckbox.id,
      });
    }

    const leftCheckbox =
      col > 0
        ? this.roleCheckboxes[this.knownRoles[row + (col - 1)]]
        : undefined;
    if (leftCheckbox) {
      this.controlsManager.updateNavigation(leftCheckbox.id, {
        ...shared,
        right: currentCheckbox.id,
      });

      this.controlsManager.updateNavigation(currentCheckbox.id, {
        ...shared,
        left: leftCheckbox.id,
      });
    }

    const upCheckbox =
      row > 0
        ? this.roleCheckboxes[
            this.knownRoles[row - 1 + col * RoleFilter.MAX_ROWS]
          ]
        : undefined;

    if (upCheckbox) {
      this.controlsManager.updateNavigation(upCheckbox.id, {
        ...shared,
        down: currentCheckbox.id,
      });

      this.controlsManager.updateNavigation(currentCheckbox.id, {
        ...shared,
        up: upCheckbox.id,
      });
    }

    if (row === 0) {
      this.controlsManager.updateNavigation(currentCheckbox.id, {
        ...shared,
        up: this._selectAllRolesCheckbox.id,
      });

      if (col === 0) {
        this.controlsManager.updateNavigation(this._selectAllRolesCheckbox.id, {
          ...shared,
          down: currentCheckbox.id,
        });
      }
    }

    // Store the filter state
    this.messageRoleFilters[role] = true;

    // Set up event handlers
    this.roleCheckboxes[role].element.on("check", () => {
      this.messageRoleFilters[role] = true;
      this.updateSelectAllCheckbox();
      this.onFilterChange();
    });

    this.roleCheckboxes[role].element.on("uncheck", () => {
      this.messageRoleFilters[role] = false;
      this.updateSelectAllCheckbox();
      this.onFilterChange();
    });

    this.onFilterChange();

    this.updateHeight(col ? RoleFilter.MAX_ROWS : row + 1);
  }

  private updateHeight(row: number, shouldRender = true) {
    this.container.element.height = RoleFilter.DEFAULT_HEIGHT + row;
    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private updateSelectAllCheckbox() {
    // Check if all role checkboxes are checked or unchecked
    const allChecked = Object.keys(this.messageRoleFilters).every(
      (role) => this.messageRoleFilters[role],
    );

    const selectedAllCheckboxEl = this._selectAllRolesCheckbox
      .element as blessed.Widgets.CheckboxElement;
    if (allChecked && !selectedAllCheckboxEl.checked) {
      selectedAllCheckboxEl.checked = true;
    } else if (!allChecked && selectedAllCheckboxEl.checked) {
      selectedAllCheckboxEl.checked = false;
    }
  }

  private onFilterChange() {
    this._value = this.createRoleFilterValue();
    this.emit("filter:change", this._value);
  }

  private createRoleFilterValue() {
    const roles = Object.keys(this.roleCheckboxes)
      .map((role) => (this.messageRoleFilters[role] ? role : null))
      .filter(isNonNull);

    return {
      roles,
    } satisfies RoleFilterValues;
  }

  private onBlur() {
    this.emit("filter:blur");
  }

  reset(shouldRender = true) {
    this.knownRoles.splice(0);

    // Clear role checkboxes
    Object.values(this.roleCheckboxes).forEach((checkbox) => {
      checkbox.element.destroy();
    });
    this.roleCheckboxes = {};
    this.updateHeight(0);
    this._value = this.createRoleFilterValue();

    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
