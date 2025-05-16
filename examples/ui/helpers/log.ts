import { Logger } from "beeai-framework";
import path from "path";
import pino from "pino";

const LEVEL = "debug";

export function getLogger(logToFile = false) {
  return logToFile
    ? new Logger(
        {
          name: "ui",
          level: LEVEL,
        },
        pino({
          level: LEVEL,
          transport: {
            target: "pino-pretty", // the built-in prettifier
            options: {
              singleLine: true, // one physical line per record
              colorize: false,
              destination: path.join("examples/ui", "ui.log"), // write straight to a file
              append: false,
            },
          },
        }),
      )
    : Logger.root.child({ name: "app", level: LEVEL });
}
