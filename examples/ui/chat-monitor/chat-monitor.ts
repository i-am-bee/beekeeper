import { ChatMonitor } from "../../../src/ui/chat-monitor/chat-monitor.js";
import { getLogger } from "../helpers/log.js";

new ChatMonitor(
  { kind: "screen", title: "Runtime Chat Interface" },
  getLogger(true),
);
