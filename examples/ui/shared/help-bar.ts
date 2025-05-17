import blessed from "neo-blessed";
import { Messages } from "../../../src/ui/chat-monitor/messages/messages.js";
import { MessageTypeEnum } from "../../../src/ui/chat-monitor/runtime-handler.js";
import { ControlsManager } from "../../../src/ui/controls/controls-manager";
import { HelpBar } from "../../../src/ui/shared/help-bar.js";
import testMessages from "../chat-monitor/messages/messages.json";
import { getLogger } from "../helpers/log.js";

const logger = getLogger(true);
const screen = blessed.screen({ title: "Help Bar" });
const controlsManager = new ControlsManager(screen, logger);

new HelpBar({
  kind: "parent",
  parent: controlsManager.screen,
  controlsManager,
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

const messages = new Messages(
  {
    parent: controlsManager.screen,
    controlsManager,
    getChatFilters: () => extractChatFilterValues(testMessages),
  },
  logger,
);
controlsManager.focus(messages.container.id);

testMessages.forEach((message) =>
  messages.addMessage(
    message.role,
    message.content,
    message.type as MessageTypeEnum,
  ),
);
