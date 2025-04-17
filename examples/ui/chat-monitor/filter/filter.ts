import blessed from "neo-blessed";
import { ChatFilter } from "../../../../src/ui/chat-monitor/filter/filter.js";
import { ControlsManager } from "../../../../src/ui/controls/controls-manager.js";
import { NavigationDirection } from "../../../../src/ui/controls/navigation.js";
import { agentId } from "../../../../src/ui/config.js";
import { stringToAgent } from "../../../../src/agents/agent-id.js";

const screen = blessed.screen({ title: "Chat filter" });
const controlsManager = new ControlsManager(screen);
controlsManager.updateKeyActions(controlsManager.screen.id, {
  kind: "exclusive",
  actions: [
    {
      key: "C-c",
      action: {
        listener: () => {
          process.exit(0);
        },
        description: "Exit app",
      },
    },
    {
      key: "left",
      action: {
        description: "Move to the left element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.LEFT);
        },
      },
    },
    {
      key: "right",
      action: {
        description: "Move to the right element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.RIGHT);
        },
      },
    },
    {
      key: "up",
      action: {
        description: "Move to the up element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.UP);
        },
      },
    },
    {
      key: "down",
      action: {
        description: "Move to the down element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.DOWN);
        },
      },
    },
    {
      key: "tab",
      action: {
        description: "Move to the next element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.NEXT);
        },
      },
    },
    {
      key: "enter",
      action: {
        description: "Enter into the element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.IN);
        },
      },
    },
    {
      key: "escape",
      action: {
        description: "Exit from the element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.OUT);
        },
      },
    },
    {
      key: "S-tab",
      action: {
        description: "Move to the previous element",
        listener: () => {
          controlsManager.navigate(NavigationDirection.PREVIOUS);
        },
      },
    },
  ],
});

const filter = new ChatFilter({
  parent: controlsManager.screen,
  controlsManager,
});
controlsManager.focus(filter.container.id);

filter.addRole(agentId(stringToAgent(`supervisor:boss[1]:1`)));
filter.addRole(agentId(stringToAgent(`operator:historical_sites_search[1]:1`)));
filter.addRole(agentId(stringToAgent(`operator:historical_sites_search[1]:2`)));
filter.addRole(agentId(stringToAgent(`operator:sports_events_search[1]:1`)));
filter.addRole(
  agentId(stringToAgent(`operator:restaurant_recommendations[1]:1`))
);
filter.addRole(
  agentId(stringToAgent(`operator:restaurant_recommendations[1]:2`))
);
