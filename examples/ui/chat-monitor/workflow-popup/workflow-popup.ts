import blessed from "neo-blessed";
import { ControlsManager } from "../../../../src/ui/controls/controls-manager.js";
import { HelpBar } from "../../../../src/ui/shared/help-bar.js";
import { WorkflowPopup } from "../../../../src/ui/chat-monitor/workflow-popup/workflow-popup.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../../../../src/ui/controls/navigation.js";
import { getLogger } from "../../helpers/log.js";
import { keyActionListenerFactory } from "../../../../src/ui/controls/key-bindings.js";
import { WorkflowStep } from "../../../../src/ui/chat-monitor/workflow-popup/dto.js";

const logger = getLogger(true);

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
);
workflow.show(controlsManager.screen.id);

const steps = [
  {
    no: 1,
    status: "pending",
    step: "Step",
    resource: "Resource 1",
  },
  {
    no: 2,
    status: "initialized",
    step: "Step",
    resource: "Resource 2",
  },
  {
    no: 3,
    status: "running",
    step: "Step",
    resource: "Resource 3",
  },
  {
    no: 4,
    status: "completed",
    step: "Step",
    resource: "Resource 4",
  },
] satisfies WorkflowStep[];

steps.forEach(workflow.addStep.bind(workflow));
