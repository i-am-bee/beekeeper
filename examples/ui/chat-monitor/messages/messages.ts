import blessed from "neo-blessed";
import { ControlsManager } from '../../../../src/ui/controls/controls-manager';
import { Messages } from '../../../../src/ui/chat-monitor/messages/messages.js';
import { MessageTypeEnum } from '../../../../src/ui/chat-monitor/runtime-handler.js';
import { NavigationDirection } from '../../../../src/ui/controls/navigation.js';
import testMessages from './messages.json';

const screen = blessed.screen({ title: "Messages" });
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

testMessages.forEach((message) => messages.addMessage(message.role, message.content, message.type as MessageTypeEnum));