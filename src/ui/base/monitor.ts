import blessed from "neo-blessed";

export interface ParentInput {
  screen: blessed.Widgets.Screen;
  parent: blessed.Widgets.BoxElement;
}

export interface ScreenInput {
  title: string;
}

export abstract class BaseMonitor {
  protected screen: blessed.Widgets.Screen;
  protected parent: blessed.Widgets.Node;

  constructor(arg: ParentInput | ScreenInput) {
    if ((arg as ScreenInput).title) {
      this.screen = blessed.screen({
        smartCSR: true,
        title: (arg as ScreenInput).title,
      });
      this.parent = this.screen;
    } else {
      const { screen, parent } = arg as ParentInput;
      this.screen = screen;
      this.parent = parent;
    }
  }
}
