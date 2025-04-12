import blessed from "neo-blessed";
import { clone } from "remeda";

export type KeyActionListener = (
  ch: any,
  key: blessed.Widgets.Events.IKeyEventArg,
) => void;

export interface Action {
  listener: KeyActionListener;
  description: string;
}

export interface KeyAction {
  key: string | string[];
  action: Action;
}

export interface KeyActions {
  kind: "exclusive" | "override";
  actions: KeyAction[];
}

export interface KeyBindings {
  keys: Map<string, Action>;
}

export function createKeyBindings(keyActions: KeyActions[]): KeyBindings {
  const bindings = { keys: new Map<string, Action>() } satisfies KeyBindings;
  const { keys } = bindings;
  for (const { kind, actions } of keyActions) {
    if (kind === "exclusive") {
      keys.clear();
    }

    for (const a of actions) {
      const keysArray = Array.isArray(a.key) ? a.key.slice() : [a.key];
      for (const k of keysArray) {
        if (kind === "override" || !keys.has(k)) {
          keys.set(k, clone(a.action));
        }
      }
    }
  }

  return bindings;
}
