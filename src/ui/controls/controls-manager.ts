import blessed from "neo-blessed";
import { NavigationDirection, NavigationTransitions } from "./navigation.js";
import {
  createKeyBindings,
  KeyActionListener,
  KeyActions,
  KeyBindings,
} from "./key-bindings.js";
import { updateDeepPartialObject } from "@/utils/objects.js";
import { clone, isNonNullish } from "remeda";
import EventEmitter from "events";
import { addToPathString, findPath } from "./tree-path.js";
import { Logger } from "beeai-framework";
import { v4 as uuidv4 } from "uuid";

export interface BaseControllable<
  TElement extends blessed.Widgets.BlessedElement | blessed.Widgets.Screen,
  TParent,
> {
  id: string;
  name: string;
  element: TElement;
  onFocus?: (element: TElement) => void;
  onBlur?: (element: TElement) => void;
  parent: TParent;
  navigation?: NavigationTransitions;
  keyActions?: KeyActions;
}

export interface ControllableElement<T extends blessed.Widgets.BlessedElement>
  extends BaseControllable<T, ControllableContainer | ControllableScreen> {
  kind: "element";
}

export interface ControllableContainer
  extends BaseControllable<
    blessed.Widgets.BoxElement,
    ControllableContainer | ControllableScreen
  > {
  kind: "container";
  children: string[];
}

export interface ControllableScreen
  extends BaseControllable<blessed.Widgets.Screen, undefined> {
  kind: "screen";
  id: "screen";
  name: "screen";
  children: string[];
}

export type Controllable<T extends blessed.Widgets.BlessedElement> =
  | ControllableScreen
  | ControllableContainer
  | ControllableElement<T>;

export type AddElementInput<T extends blessed.Widgets.BlessedElement> = Pick<
  ControllableElement<T>,
  "kind" | "name" | "element" | "parent" | "onFocus" | "onBlur"
>;

export type AddContainerInput = Pick<
  ControllableContainer,
  "kind" | "name" | "element" | "parent" | "onFocus" | "onBlur"
>;

export interface ControlsManagerEvents {
  "focus:change": (focused?: Controllable<any>) => void;
}

export interface PathStep {
  el: Controllable<any>;
  direction: "UP" | "DOWN";
}

const SCREEN_ID = "screen";
export class ControlsManager {
  private logger: Logger;
  private _screen: ControllableScreen;
  private elements = new Map<string, Controllable<any>>();
  private _focused?: Controllable<any>;
  private _keyBindings?: KeyBindings;
  private emitter = new EventEmitter();
  private keyActionListeners = new Map<string, KeyActionListener>();
  private static _lastKeypressEventId = uuidv4();

  static get lastKeypressEventId() {
    return this._lastKeypressEventId;
  }

  // Events emitting
  public on<K extends keyof ControlsManagerEvents>(
    event: K,
    listener: ControlsManagerEvents[K],
  ): typeof this.emitter {
    return this.emitter.on(event, listener);
  }

  public off<K extends keyof ControlsManagerEvents>(
    event: K,
    listener: ControlsManagerEvents[K],
  ): typeof this.emitter {
    return this.emitter.off(event, listener);
  }

  public emit<K extends keyof ControlsManagerEvents>(
    event: K,
    ...args: Parameters<ControlsManagerEvents[K]>
  ): boolean {
    return this.emitter.emit(event, ...args);
  }

  public get screen() {
    return this._screen;
  }

  public get focused() {
    if (!this._focused) {
      throw new Error(`Focused can't be empty`);
    }
    return this._focused;
  }

  public get keyBindings() {
    return this._keyBindings;
  }

  constructor(
    screen: blessed.Widgets.Screen,
    logger: Logger,
    options?: {
      onFocus?: (element: blessed.Widgets.Screen) => void;
      onBlur?: (element: blessed.Widgets.Screen) => void;
    },
  ) {
    this.logger = logger.child({
      name: this.constructor.name,
    });
    this._screen = {
      id: SCREEN_ID,
      name: SCREEN_ID,
      kind: "screen",
      element: screen,
      parent: undefined,
      children: [],
      onFocus: options?.onFocus,
      onBlur: options?.onBlur,
    };

    screen.on("keypress", () => {
      ControlsManager._lastKeypressEventId = uuidv4();
    });

    this.elements.set(this._screen.id, this._screen);
  }

  add(input: AddContainerInput): ControllableContainer;
  add<T extends blessed.Widgets.BlessedElement>(
    input: AddElementInput<T>,
  ): ControllableElement<T>;
  add<T extends blessed.Widgets.BlessedElement>(
    input: AddContainerInput | AddElementInput<T>,
  ): ControllableContainer | ControllableElement<T> {
    const parent = this.getContainer(input.parent.id);
    let element;
    const id = this.getId(input.name, parent.id);
    input.element.name = id;
    switch (input.kind) {
      case "element":
        element = {
          ...input,
          id,
        } satisfies ControllableElement<T>;
        break;
      case "container":
        element = {
          ...input,
          id,
          children: [],
        } satisfies ControllableContainer;
        break;
    }
    parent.children.push(element.id);
    this.elements.set(element.id, element);
    return element;
  }

  remove(id: string) {
    const element = this.getElement(id);
    if (element.parent) {
      const elIndex = element.parent.children.indexOf(element.id);
      if (elIndex === -1) {
        throw new Error(
          `Can't find element with id:${id} in parent element with id:${element.parent.id}`,
        );
      }
      element.parent.children.splice(elIndex, 1);
    }

    this.elements.delete(element.id);
  }

  updateNavigation(id: string, navigation: NavigationTransitions) {
    this.logger.debug({ navigation }, `updateNavigation(${id})`);
    const el = this.getElement(id);
    if (el.navigation) {
      updateDeepPartialObject(el.navigation, navigation);
    } else {
      el.navigation = clone(navigation);
    }
    updateDeepPartialObject(el.navigation || {}, navigation);
  }

  updateKeyActions(id: string, keyActions: KeyActions) {
    this.logger.debug({ keyActions }, `updateKeyActions(${id}`);
    const el = this.getElement(id);
    if (el.keyActions) {
      updateDeepPartialObject(el.keyActions, keyActions);
    } else {
      el.keyActions = clone(keyActions);
    }
  }

  focus(id: string, shouldRender = true) {
    this.logger.debug(`focus(${id})`);

    if (id === this._screen.id) {
      this.logger.warn(`Screen can't be focused, skip!`);
      return;
    }

    const path = this.getPath(id, this._focused?.id);
    this.logger.debug(
      path.map((s) => ({ direction: s.direction, el: s.el.id })),
    );
    // Blur old
    if (this._focused && this._keyBindings) {
      this.unsetKeyBindings(this._focused, this._keyBindings);
    }

    this._focused = this.getElement(id);
    this.setKeyBindings(this._focused);

    if (this._focused.element !== this.screen.element) {
      const element = this._focused.element as blessed.Widgets.BlessedElement;
      element.focus();
    }

    this.onFocusChange();

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  navigate(direction: NavigationDirection) {
    const { navigation } = this.getElement(this.focused.id);
    if (!navigation) {
      return;
    }

    const nextElementId = navigation[direction];
    const nextElementEffect = navigation[`${direction}Effect`];
    if (nextElementEffect) {
      nextElementEffect();
    }

    if (nextElementId) {
      this.focus(nextElementId);
    }
  }

  private setKeyBindings(target: Controllable<any>) {
    const pathFromRoot = this.getPath(target.id);
    const keyBindings = createKeyBindings(
      pathFromRoot.map((it) => it.el.keyActions).filter(isNonNullish),
    );

    this.logger.debug(
      Array.from(keyBindings.keys.entries()),
      `setKeyBindings(${target.id})`,
    );

    for (const entry of keyBindings.keys.entries()) {
      const [key, action] = entry;
      const listenerKey = `${target.id}[${key}]`;
      if (this.keyActionListeners.has(listenerKey)) {
        throw new Error(`Listener for \`${listenerKey}\` exists already`);
      }
      const listener = action.listener(ControlsManager.lastKeypressEventId);
      this.keyActionListeners.set(listenerKey, listener);
      target.element.key(key, listener);
    }
    this._keyBindings = keyBindings;
  }

  private unsetKeyBindings(target: Controllable<any>, keyBindings: KeyBindings) {
    this.logger.debug(
      Array.from(keyBindings.keys.entries()),
      `unsetKeyBindings(${target.id})`,
    );
    for (const entry of keyBindings.keys.entries()) {
      const [key] = entry;
      const listenerKey = `${target.id}[${key}]`;
      const listener = this.keyActionListeners.get(listenerKey);
      if (!listener) {
        throw new Error(`Undefined listener for \`${listenerKey}\``);
      }
      target.element.unkey(key, listener);
      this.keyActionListeners.delete(listenerKey);
    }
    this._keyBindings = undefined;
  }

  private getContainer(id: string) {
    if (id === "screen") {
      return this.screen;
    }

    const container = this.getElement(id);
    if (container.kind !== "container") {
      throw new Error(`Element with id:'${id}' isn't container`);
    }
    return container;
  }

  private getElement(id: string) {
    const element = this.elements.get(id);
    if (!element) {
      throw new Error(`Element with id:'${id}' can't be found`);
    }
    return element;
  }

  private getId(name: string, parentId?: string) {
    return addToPathString(name, parentId);
  }

  private getPath(to: string, from?: string) {
    return findPath(from, to, this.getElement.bind(this));
  }

  private onFocusChange() {
    this.emit("focus:change", this._focused);
  }
}
