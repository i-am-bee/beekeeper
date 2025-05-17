import EventEmitter from "events";
import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "../../base/monitor.js";
import { clone } from "remeda";
import {
  MessageTypeFilter,
  MessageTypeFilterValues,
} from "./message-type-filter.js";
import { RoleFilter, RoleFilterValues } from "./role-filter.js";
import { Logger } from "beeai-framework";
import { MessageTypeEnum } from "../runtime-handler.js";

export type ChatFilterValues = MessageTypeFilterValues & RoleFilterValues;

interface ChatFilterEvents {
  "filter:change": (filter: ChatFilterValues) => void;
}

export const EXPANSE_HEIGHT = 18;

export class ChatFilter extends ContainerComponent {
  private messageTypeFilter: MessageTypeFilter;
  private roleFilter: RoleFilter;
  private emitter = new EventEmitter();
  private _value: ChatFilterValues = { messageTypes: [], roles: [] };

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

  get container() {
    return this.messageTypeFilter.container;
  }

  get values() {
    return {
      ...clone(this.messageTypeFilter.value),
      ...clone(this.roleFilter.value),
    };
  }

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    super(arg, logger);

    this.messageTypeFilter = new MessageTypeFilter(arg, logger);
    this.roleFilter = new RoleFilter(
      {
        kind: "parent",
        controlsManager: this.controlsManager,
        parent: this.parent,
      },
      logger,
    );
    this.roleFilter.container.element.hide();
    this.roleFilter.container.element.top = 7;

    this.createChatFilterValue();
    this.setupEventHandlers();
    this.setupControls();
  }

  private setupEventHandlers() {
    this.messageTypeFilter.on("filter:change", this.onFilterChange.bind(this));
    this.roleFilter.on("filter:change", this.onFilterChange.bind(this));
    this.roleFilter.on("filter:blur", this.onFilterBlur.bind(this));

    this.messageTypeFilter.on("filter:expand", this.showRoleFilter.bind(this));
    this.messageTypeFilter.on(
      "filter:collapse",
      this.hideRoleFilter.bind(this),
    );
  }

  private setupControls(shouldRender = true) {
    this.controlsManager.updateNavigation(
      this.messageTypeFilter.expandButton.id,
      {
        down: this.roleFilter.selectAllRolesCheckbox.id,
        downEffect: () => {
          this.messageTypeFilter.expand();
        },
        in: this.roleFilter.selectAllRolesCheckbox.id,
        inEffect: () => {
          this.messageTypeFilter.expand();
        },
        right: this.roleFilter.selectAllRolesCheckbox.id,
        rightEffect: () => {
          this.messageTypeFilter.expand();
        },
        next: this.roleFilter.selectAllRolesCheckbox.id,
        nextEffect: () => {
          this.messageTypeFilter.expand();
        },
      },
    );

    // Navigation
    if (shouldRender) {
      this.screen.element.render();
    }
  }

  addRole(role: string) {
    this.roleFilter.addRole(role);
  }

  focusMessageFilters() {
    this.controlsManager.focus(
      this.messageTypeFilter.getCheckbox(MessageTypeEnum.PROGRESS).id,
    );
  }

  focusRoleFilters() {
    this.messageTypeFilter.expand();
    this.controlsManager.focus(this.roleFilter.selectAllRolesCheckbox.id);
  }

  collapse() {
    this.messageTypeFilter.collapse();
  }

  private onFilterChange() {
    this._value = this.createChatFilterValue();
    this.emit("filter:change", this._value);
  }

  private onFilterBlur() {
    this.messageTypeFilter.collapse();
    this.controlsManager.focus(this.messageTypeFilter.expandButton.id);
  }

  private createChatFilterValue() {
    return {
      ...clone(this.messageTypeFilter.value),
      ...clone(this.roleFilter.value),
    };
  }

  private showRoleFilter() {
    this.roleFilter.container.element.show();
    this.screen.element.render();
  }

  private hideRoleFilter() {
    this.roleFilter.container.element.hide();
    this.screen.element.render();
  }

  reset(shouldRender = true) {
    this.messageTypeFilter.reset(false);
    this.roleFilter.reset(false);
    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
