import blessed from "neo-blessed";
import { NavigationDirection, NavigationTransitions } from "./navigation.js";
import { createKeyBindings, KeyActions, KeyBindings } from "./key-bindings.js";
import { updateDeepPartialObject } from "@/utils/objects.js";
import { clone, isNonNullish } from "remeda";

export interface BaseControllable<TElement, TParent> {
  id: string;
  name: string;
  element: TElement;
  onFocus?: (element: TElement) => void;
  onBlur?: (element: TElement) => void;
  parent: TParent;
  navigation?: NavigationTransitions;
  keyActions?: KeyActions;
}

export interface ControllableElement
  extends BaseControllable<
    blessed.Widgets.BlessedElement,
    ControllableContainer | ControllableScreen
  > {
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

export type Controllable =
  | ControllableScreen
  | ControllableContainer
  | ControllableElement;

export type AddElementInput = Pick<
  ControllableElement,
  "kind" | "name" | "element" | "parent" | "onFocus" | "onBlur"
>;

export type AddContainerInput = Pick<
  ControllableContainer,
  "kind" | "name" | "element" | "parent" | "onFocus" | "onBlur"
>;

export class ControlsManager {
  private _screen: ControllableScreen;
  private elements = new Map<string, Controllable>();
  private _focused?: Controllable;
  private _keyBindings?: KeyBindings;

  public get screen() {
    return this._screen;
  }

  public get focused() {
    if (!this._focused) {
      throw new Error(`Focused can't be empty`);
    }
    return this._focused;
  }

  constructor(
    screen: blessed.Widgets.Screen,
    options?: {
      onFocus?: (element: blessed.Widgets.Screen) => void;
      onBlur?: (element: blessed.Widgets.Screen) => void;
    },
  ) {
    this._screen = {
      id: "screen",
      name: "screen",
      kind: "screen",
      element: screen,
      parent: undefined,
      children: [],
      onFocus: options?.onFocus,
      onBlur: options?.onBlur,
    };

    this.elements.set(this._screen.id, this._screen);
    this.focus(this._screen.id);
  }

  add(input: AddContainerInput): ControllableContainer;
  add(input: AddElementInput): ControllableElement;
  add(
    input: AddContainerInput | AddElementInput,
  ): ControllableContainer | ControllableElement {
    const parent = this.getContainer(input.parent.id);
    let element;
    switch (input.kind) {
      case "element":
        element = {
          ...input,
          id: this.getId(input.name, parent.id),
        } satisfies ControllableElement;
        break;
      case "container":
        element = {
          ...input,
          id: this.getId(input.name, parent.id),
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
    const el = this.getElement(id);
    if (el.navigation) {
      updateDeepPartialObject(el.navigation, navigation);
    } else {
      el.navigation = clone(navigation);
    }
    updateDeepPartialObject(el.navigation || {}, navigation);
  }

  updateKeyActions(id: string, keyActions: KeyActions) {
    const el = this.getElement(id);
    if (el.keyActions) {
      updateDeepPartialObject(el.keyActions, keyActions);
    } else {
      el.keyActions = clone(keyActions);
    }
    this.focus(this.focused.id);
  }

  focus(id: string, shouldRender = true) {
    // Blur old
    if (this._focused) {
      if (this._keyBindings) {
        this.unsetKeyBindings(this._focused, this._keyBindings);
      }
    }

    const el = this.getElement(id);
    const path = this.getElementsOnPath(id);
    const keyBindings = createKeyBindings(
      path.map((it) => it.keyActions).filter(isNonNullish),
    );

    // Focus new
    this._focused = el;
    this._keyBindings = keyBindings;
    if (this._keyBindings) {
      this.setKeyBindings(this._focused, this._keyBindings);
    }

    if (this._focused.element !== this.screen.element) {
      (this._focused.element as blessed.Widgets.BlessedElement).focus();
    }

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
    if (nextElementId) {
      this.focus(nextElementId);
    }
  }

  private setKeyBindings(target: Controllable, keyBindings: KeyBindings) {
    for (const entry of keyBindings.keys.entries()) {
      const [key, action] = entry;
      target.element.key(key, action.listener);
    }
  }

  private unsetKeyBindings(target: Controllable, keyBindings: KeyBindings) {
    for (const entry of keyBindings.keys.entries()) {
      const [key, action] = entry;
      target.element.unkey(key, action.listener);
    }
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

  private getId(name: string, prefix?: string) {
    return `${prefix ? prefix + ":" : ""}${name}`;
  }

  private getElementsOnPath(id: string): Controllable[] {
    const result: Controllable[] = [];
    let el;
    do {
      el = this.getElement(el?.id ?? id);
      result.push(el);
      el = el.parent;
    } while (el);

    return result.reverse();
  }
}
