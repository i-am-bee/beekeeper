import { parseEnv } from "beeai-framework/internals/env";

export const examplesEnabled = () =>
  !parseEnv.asBoolean("DEV_SUPERVISOR_WORKFLOW_DISABLE_EXAMPLES", false);
