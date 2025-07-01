import blessed from "neo-blessed";
import { join } from "path";
import { WorkflowPopup } from "../../../../src/ui/chat-monitor/workflow-popup/workflow-popup.js";
import { ControlsManager } from "../../../../src/ui/controls/controls-manager.js";
import { keyActionListenerFactory } from "../../../../src/ui/controls/key-bindings.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../../../../src/ui/controls/navigation.js";
import { HelpBar } from "../../../../src/ui/shared/help-bar.js";
import { getLogger } from "../../helpers/log.js";

const logger = getLogger(true);

// // Mocking the file system for testing purposes
// mock({
//   '/tmp/project': {
//     'workflow_state.log': mock.load('./state.log') // can copy real files
//   }
// });

const screen = blessed.screen({ title: "Workflow" });
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

new HelpBar(
  {
    kind: "parent",
    parent: controlsManager.screen,
    controlsManager,
  },
  logger,
);

const workflow = new WorkflowPopup(
  {
    kind: "parent",
    parent: controlsManager.screen,
    controlsManager,
  },
  logger,
  join(
    process.cwd(),
    "examples",
    "ui",
    "chat-monitor",
    "workflow-popup",
    "state.log",
  ), // Path to the workflow state log file
);
workflow.show(controlsManager.screen.id);
