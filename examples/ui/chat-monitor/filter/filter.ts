import blessed from "neo-blessed";
import { ChatFilter } from "../../../../src/ui/chat-monitor/filter/filter.js";
import { ControlsManager } from "../../../../src/ui/controls/controls-manager.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../../../../src/ui/controls/navigation.js";
import { agentId } from "../../../../src/ui/config.js";
import { stringToAgent } from "../../../../src/agents/agent-id.js";
import { keyActionListenerFactory } from "../../../../src/ui/controls/key-bindings.js";
import { getLogger } from "../../helpers/log.js";

const logger = getLogger(true);
const screen = blessed.screen({ title: "Chat filter" });
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

const filter = new ChatFilter(
  {
    kind: "parent",
    parent: controlsManager.screen,
    controlsManager,
  },
  logger,
);
controlsManager.focus(filter.container.id);

filter.addRole(agentId(stringToAgent(`supervisor:boss[1]:1`)));
filter.addRole(agentId(stringToAgent(`operator:historical_sites_search[1]:1`)));
filter.addRole(agentId(stringToAgent(`operator:historical_sites_search[1]:2`)));
filter.addRole(agentId(stringToAgent(`operator:sports_events_search[1]:1`)));
filter.addRole(
  agentId(stringToAgent(`operator:restaurant_recommendations[1]:1`)),
);
filter.addRole(
  agentId(stringToAgent(`operator:restaurant_recommendations[1]:2`)),
);
