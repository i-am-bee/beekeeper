import blessed from "neo-blessed";
import { ChatInput } from "../../../../src/ui/chat-monitor/input/input.js";
import { ControlsManager } from "../../../../src/ui/controls/controls-manager";
import {
  NavigationDescription,
  NavigationDirection,
} from "../../../../src/ui/controls/navigation.js";
import { getLogger } from "../../helpers/log.js";
import { keyActionListenerFactory } from "../../../../src/ui/controls/key-bindings.js";

const logger = getLogger(true);
const screen = blessed.screen({ title: "Input" });
const controlsManager = new ControlsManager(screen, logger);
controlsManager.updateKeyActions(controlsManager.screen.id, {
  kind: "exclusive",
  actions: [
    {
      key: "C-c",
      action: {
        description: NavigationDescription.EXIT_APP,
        listener: keyActionListenerFactory(() => {
          process.exit(0);
        }),
      },
    },
    {
      key: "enter",
      action: {
        description: NavigationDescription.IN_OUT,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.IN);
        }),
      },
    },
    {
      key: "escape",
      action: {
        description: NavigationDescription.IN_OUT,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.OUT);
        }),
      },
    },
    {
      key: "left",
      action: {
        description: NavigationDescription.LEFT_RIGHT,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.LEFT);
        }),
      },
    },
    {
      key: "right",
      action: {
        description: NavigationDescription.LEFT_RIGHT,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.RIGHT);
        }),
      },
    },
    {
      key: "up",
      action: {
        description: NavigationDescription.UP_DOWN,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.UP);
        }),
      },
    },
    {
      key: "down",
      action: {
        description: NavigationDescription.UP_DOWN,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.DOWN);
        }),
      },
    },
    {
      key: "tab",
      action: {
        description: NavigationDescription.NEXT_PREV,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.NEXT);
        }),
      },
    },
    {
      key: "S-tab",
      action: {
        description: NavigationDescription.NEXT_PREV,
        listener: keyActionListenerFactory(() => {
          controlsManager.navigate(NavigationDirection.PREVIOUS);
        }),
      },
    },
  ],
});

const input = new ChatInput(
  {
    parent: controlsManager.screen,
    controlsManager,
    onValueChange: () => input.setProcessing(false),
  },
  logger,
);
input.startValueMonitoring();
controlsManager.focus(input.inputBox.id);
