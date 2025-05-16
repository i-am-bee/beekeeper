import blessed from "neo-blessed";
import {
  ControllableContainer,
  ControllableScreen,
  ControlsManager,
} from "../controls/controls-manager.js";
import { Logger } from "beeai-framework";

export interface ParentInput {
  kind: "parent";
  parent: ControllableContainer | ControllableScreen;
  controlsManager: ControlsManager;
}

export interface ScreenInput {
  kind: "screen";
  title: string;
}

export abstract class BaseMonitor {
  protected logger: Logger;
  protected controlsManager: ControlsManager;
  protected screen: ControllableScreen;
  protected parent: ControllableContainer | ControllableScreen;

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    this.logger = logger.child({
      name: this.constructor.name,
    });
    if (arg.kind === "screen") {
      this.controlsManager = new ControlsManager(
        blessed.screen({
          smartCSR: true,
          title: arg.title,
        }),
        this.logger,
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
