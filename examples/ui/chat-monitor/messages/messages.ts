import blessed from "neo-blessed";
import { ControlsManager } from "../../../../src/ui/controls/controls-manager";
import { Messages } from "../../../../src/ui/chat-monitor/messages/messages.js";
import { MessageTypeEnum } from "../../../../src/ui/chat-monitor/runtime-handler.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../../../../src/ui/controls/navigation.js";
import testMessages from "./messages.json";

const screen = blessed.screen({ title: "Messages" });
const controlsManager = new ControlsManager(screen);
controlsManager.updateKeyActions(controlsManager.screen.id, {
  kind: "exclusive",
  actions: [
    {
      key: "C-c",
      action: {
        description: NavigationDescription.EXIT_APP,
        listener: () => {
          process.exit(0);
        },
      },
    },
    {
      key: "enter",
      action: {
        description: NavigationDescription.IN_OUT,
        listener: () => {
          controlsManager.navigate(NavigationDirection.IN);
        },
      },
    },
    {
      key: "escape",
      action: {
        description: NavigationDescription.IN_OUT,
        listener: () => {
          controlsManager.navigate(NavigationDirection.OUT);
        },
      },
    },
    {
      key: "left",
      action: {
        description: NavigationDescription.LEFT_RIGHT,
        listener: () => {
          controlsManager.navigate(NavigationDirection.LEFT);
        },
      },
    },
    {
      key: "right",
      action: {
        description: NavigationDescription.LEFT_RIGHT,
        listener: () => {
          controlsManager.navigate(NavigationDirection.RIGHT);
        },
      },
    },
    {
      key: "up",
      action: {
        description: NavigationDescription.UP_DOWN,
        listener: () => {
          controlsManager.navigate(NavigationDirection.UP);
        },
      },
    },
    {
      key: "down",
      action: {
        description: NavigationDescription.UP_DOWN,
        listener: () => {
          controlsManager.navigate(NavigationDirection.DOWN);
        },
      },
    },
    {
      key: "tab",
      action: {
        description: NavigationDescription.NEXT_PREV,
        listener: () => {
          controlsManager.navigate(NavigationDirection.NEXT);
        },
      },
    },
    {
      key: "S-tab",
      action: {
        description: NavigationDescription.NEXT_PREV,
        listener: () => {
          controlsManager.navigate(NavigationDirection.PREVIOUS);
        },
      },
    },
  ],
});

function extractChatFilterValues(messages) {
  const messageTypeSet = new Set();
  const roleSet = new Set();

  for (const message of messages) {
    if (message.type) {
      messageTypeSet.add(message.type);
    }
    if (message.role) {
      roleSet.add(message.role);
    }
  }

  return {
    messageTypes: Array.from(messageTypeSet),
    roles: Array.from(roleSet),
  };
}

const messages = new Messages({
  parent: controlsManager.screen,
  controlsManager,
  getChatFilters: () => extractChatFilterValues(testMessages),
});
controlsManager.focus(messages.container.id);

testMessages.forEach((message) =>
  messages.addMessage(
    message.role,
    message.content,
    message.type as MessageTypeEnum,
  ),
);
