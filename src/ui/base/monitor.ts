import blessed from "neo-blessed";
import {
  ControllableContainer,
  ControllableScreen,
  ControlsManager,
} from "../controls/controls-manager.js";

export interface ParentInput {
  parent: ControllableContainer | ControllableScreen;
  controlsManager: ControlsManager;
}

export interface ScreenInput {
  title: string;
}

export abstract class BaseMonitor {
  protected controlsManager: ControlsManager;
  protected screen: ControllableScreen;
  protected parent: ControllableContainer | ControllableScreen;

  constructor(arg: ParentInput | ScreenInput) {
    if ((arg as ScreenInput).title) {
      this.controlsManager = new ControlsManager(
        blessed.screen({
          smartCSR: true,
          title: (arg as ScreenInput).title,
        }),
      );
      this.screen = this.controlsManager.screen;
      this.parent = this.screen;
    } else {
      const { parent, controlsManager } = arg as ParentInput;
      this.controlsManager = controlsManager;
      this.screen = this.controlsManager.screen;
      this.parent = parent;
    }
  }
}
