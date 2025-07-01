import blessed from "neo-blessed";


export class TextArea {
  private _element: blessed.Widgets.BoxElement;

  get element() {
    return this._element;
  }

  constructor(parent: blessed.Widgets.Node, style?: any) {
    this._element = blessed.box({
      parent,
      width: "100%",
      height: "100%",
      focusable: false,
      keys: false,
      mouse: false,
      tags: true,
      hidden: false,
      style,
    });
    this._element.setContent("AAAA");
  }
}
