import { vi } from "vitest";

export default () =>
  vi.mock("@/agents/supervisor/workflow/state/logger.ts", async () => {
    const actual = await vi.importActual<
      typeof import("@/agents/supervisor/workflow/state/logger.ts")
    >("@/agents/supervisor/workflow/state/logger.ts");

    const fakeLogger = new Proxy<Record<string | symbol, unknown>>(
      {},
      {
        get(target, prop) {
          if (!(prop in target)) {
            target[prop] = vi.fn();
          }
          return target[prop];
        },
      },
    );

    return {
      ...actual,
      SupervisorWorkflowStateLogger: {
        ...actual.SupervisorWorkflowStateLogger,
        getInstance: vi.fn(() => fakeLogger),
      },
    };
  });
