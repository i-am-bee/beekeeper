import EventEmitter from "events";
import { BaseMonitor, ParentInput, ScreenInput } from "../../base/monitor.js";
import { clone } from "remeda";
import {
  MessageTypeFilter,
  MessageTypeFilterValues,
} from "./message-type-filter.js";
import { RoleFilter, RoleFilterValues } from "./role-filter.js";

export type ChatFilterValues = MessageTypeFilterValues & RoleFilterValues;

interface ChatFilterEvents {
  "filter:change": (filter: ChatFilterValues) => void;
}

export const EXPANSE_HEIGHT = 18;

export class ChatFilter extends BaseMonitor {
  private messageTypeFilter: MessageTypeFilter;
  private roleFilter: RoleFilter;
  private emitter = new EventEmitter();
  private _value: ChatFilterValues = { messageTypes: [], roles: [] };

  public on<K extends keyof ChatFilterEvents>(
    event: K,
    listener: ChatFilterEvents[K]
  ): typeof this.emitter {
    return this.emitter.on(event, listener);
  }

  public off<K extends keyof ChatFilterEvents>(
    event: K,
    listener: ChatFilterEvents[K]
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

  constructor(arg: ParentInput | ScreenInput) {
    super(arg);

    this.messageTypeFilter = new MessageTypeFilter(arg);
    this.roleFilter = new RoleFilter({
      controlsManager: this.controlsManager,
      parent: this.parent,
    });
    this.roleFilter.container.element.hide();
    this.roleFilter.container.element.top = 7;

    this.createChatFilterValue();
    this.setupEventHandlers();
    this.setupControls();
  }

  private setupEventHandlers() {
    this.messageTypeFilter.on("filter:change", this.onFilterChange.bind(this));
    this.roleFilter.on("filter:change", this.onFilterChange.bind(this));

    this.messageTypeFilter.on("filter:expand", this.showRoleFilter.bind(this));
    this.messageTypeFilter.on(
      "filter:collapse",
      this.hideRoleFilter.bind(this)
    );
  }

  private setupControls(shouldRender = true) {
    this.controlsManager.updateNavigation(
      this.messageTypeFilter.expandButton.id,
      {
        in: this.roleFilter.container.id,
      }
    );

    this.controlsManager.updateNavigation(
      this.roleFilter.container.id,
      {
        out: this.messageTypeFilter.expandButton.id,
      }
    );

    // Navigation
    if (shouldRender) {
      this.screen.element.render();
    }
  }

  // focus(type: "types" | "roles") {
  //   switch (type) {
  //     case "types":
  //       this.controlsManager.focus(this._container.id);
  //       break;
  //     case "roles":
  //       if (!this.isRoleFilterExpanded) {
  //         this.toggleRoleFilter();
  //       }
  //       this.controlsManager.focus(this.selectAllRolesCheckbox.id);
  //       break;
  //   }
  // }

  addRole(role: string) {
    this.roleFilter.addRole(role);
  }

  private onFilterChange() {
    this._value = this.createChatFilterValue();
    this.emit("filter:change", this._value);
  }

  private createChatFilterValue() {
    return {
      ...clone(this.messageTypeFilter.value),
      ...clone(this.roleFilter.value),
    };
  }

  private showRoleFilter() {
    this.controlsManager.updateNavigation(
      this.messageTypeFilter.expandButton.id,
      {
        in: undefined,
      }
    );
    this.roleFilter.container.element.show();
    this.screen.element.render();
  }

  private hideRoleFilter() {
    this.controlsManager.updateNavigation(
      this.messageTypeFilter.expandButton.id,
      {
        in: this.roleFilter.container.id,
      }
    );
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
