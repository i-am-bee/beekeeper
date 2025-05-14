import blessed from "neo-blessed";
import { BaseMonitor, ParentInput, ScreenInput } from "../base/monitor.js";
import { UIColors } from "../colors.js";
import { ControllableContainer } from "../controls/controls-manager.js";

export class HelpBar extends BaseMonitor {
  private _container: ControllableContainer;

  constructor(arg: ParentInput | ScreenInput) {
    super(arg);

    this._container = this.controlsManager.add({
      kind: "container",
      name: "helpBar",
      element: blessed.box({
        parent: this.parent.element,
        width: "100%",
        height: 1,
        top: "100%-1",
        left: 0,
      }),
      parent: this.parent,
    });

    this.controlsManager.on("focus:change", () => {
      this.updateContent();
    });

    this.updateContent();
  }

  get container() {
    return this._container;
  }

  updateContent() {
    this._container.element.children.forEach((child) => child.destroy());
    this._container.element.children = [];

    const keys = this.controlsManager.keyBindings?.keys;

    if (!keys) {
      this.screen.element.render();

      return;
    }

    const keyEntries = [...keys.entries()];
    const grouped = keyEntries.reduce(
      (prev, [key, info]) => {
        const description = info.description;
        const group = prev.find((group) => group.description === description);
        const shortKey = this.getShortKey(key);

        if (group) {
          group.keys.push(shortKey);
        } else {
          prev.push({ description, keys: [shortKey] });
        }

        return prev;
      },
      [] as { description: string; keys: string[] }[],
    );

    let leftOffset = 0;

    grouped.forEach(({ description, keys }) => {
      const item = blessed.text({
        parent: this._container.element,
        content: `${description} {bold}[${keys.join("/")}]{/bold}`,
        top: 0,
        left: leftOffset,
        tags: true,
        style: {
          bg: UIColors.blue.blue,
        },
      });

      leftOffset += Number(item.strWidth(item.getContent())) + 1;
    });

    this.screen.element.render();
  }

  getShortKey(key: string) {
    const modifierKeys: Record<string, string> = {
      "C-": "^",
      "S-": "⇧",
    };

    const specialKeys: Record<string, string> = {
      left: "←",
      right: "→",
      up: "↑",
      down: "↓",
      pagedown: "PgDn",
      pageup: "PgUp",
      enter: "↵",
      escape: "Esc",
      tab: "⇥",
    };

    const parseModifiers = (key: string) => {
      const modifiers: string[] = [];
      let remaining = key;

      Object.keys(modifierKeys).forEach((modifier) => {
        if (remaining.startsWith(modifier)) {
          modifiers.push(modifier);

          remaining = remaining.slice(modifier.length);
        }
      });

      return { modifiers, base: remaining };
    };

    const formatKey = ({
      modifiers,
      base,
    }: {
      modifiers: string[];
      base: string;
    }) => {
      const modifiersPart = modifiers
        .map((modifier) => modifierKeys[modifier])
        .join("");
      const specialPart = specialKeys[base.toLowerCase()];
      const keyPart =
        specialPart || base.charAt(0).toUpperCase() + base.slice(1);

      return `${modifiersPart}${keyPart}`;
    };

    return formatKey(parseModifiers(key));
  }
}
