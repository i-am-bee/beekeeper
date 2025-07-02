import {
  AgentId,
  AgentKindId,
  AgentTypeId,
  stringToAgent,
  stringToAgentType,
} from "@/agents/agent-id.js";
import {
  AgentConfigPoolStats,
  AgentKindEnum,
  AgentKindEnumSchema,
  AgentKindValue,
  AgentTypeValue,
  AvailableTool,
} from "@/agents/registry/dto.js";
import { AgentInfo } from "@/agents/state/builder.js";
import {
  InteractionTaskRunStatusEnum,
  TaskConfigPoolStats,
  TaskKindEnum,
  TaskKindEnumSchema,
  TaskKindValue,
  TaskRunStatusEnum,
  TaskTypeValue,
} from "@/tasks/manager/dto.js";
import { TaskRunInfo } from "@/tasks/state/builder.js";
import {
  stringToTaskRun,
  stringToTaskType,
  TaskConfigId,
  TaskKindId,
  TaskRunId,
  TaskTypeId,
} from "@/tasks/task-id.js";
import { clone } from "remeda";
import { UIColors } from "./colors.js";

export interface StyleItem {
  fg?: string;
  bold?: boolean;
  underline?: boolean;
  icon?: string;
}
export type StyleItemVersioned = Record<string, StyleItem>;
export type StyleItemValue = StyleItem | StyleItemVersioned;

export type StyleCategory = Record<string, StyleItemValue>;

export const DEFAULT_VERSION = "default";
export const BUSY_IDLE = "busy_idle";
export const INVERSE_COLOR = "inverse_color";
export const AMBIENT_VERSION = "ambient";

export const UIConfig = {
  labels: {
    default: { fg: UIColors.white.white, bold: true },
    taskId: { fg: UIColors.orange.asda_orange, bold: true },
    status: { fg: UIColors.white.white, bold: true },
    agentKind: { fg: UIColors.purple.magenta, bold: true },
    taskKind: { fg: UIColors.purple.magenta, bold: true },
    agentType: { fg: UIColors.blue.cyan, bold: true },
    taskType: { fg: UIColors.blue.cyan, bold: true },
    system: { fg: UIColors.gray.granite_gray },
    agentId: {
      [AgentKindEnumSchema.Values.supervisor]: {
        fg: UIColors.brown.saddle_brown,
        bold: true,
        icon: "⬢",
      },
      [AgentKindEnumSchema.Values.operator]: {
        fg: UIColors.brown.saddle_brown,
        bold: true,
        icon: "⬡",
      },
    },
    taskRunId: {
      [TaskKindEnumSchema.Values.supervisor]: {
        fg: UIColors.brown.saddle_brown,
        bold: true,
        icon: "■",
      },
      [TaskKindEnumSchema.Values.operator]: {
        fg: UIColors.brown.saddle_brown,
        bold: true,
        icon: "□",
      },
    },
    agentTypeId: { fg: UIColors.white.white },
    taskTypeId: { fg: UIColors.white.white },
    owner: { fg: UIColors.brown.saddle_brown, bold: true },
    description: { fg: UIColors.blue.cerulean, bold: false },
    input: {
      [DEFAULT_VERSION]: { fg: UIColors.yellow.yellow, bold: false },
      [AMBIENT_VERSION]: { fg: UIColors.yellow.corn, bold: false },
    },
    output: {
      [DEFAULT_VERSION]: { fg: UIColors.green.green, bold: false },
      [AMBIENT_VERSION]: { fg: UIColors.green.sea_green, bold: false },
    },
    error: { fg: UIColors.red.red, bold: true },
    executionTime: { fg: UIColors.yellow.yellow },
    timestamp: { fg: UIColors.gray.cadet_gray },
    tool: { fg: UIColors.blue.cyan, icon: "⚒" },
    eventType: {
      fg: UIColors.yellow.yellow,
      bold: true,
      icon: "⚡",
    },
    version: { fg: UIColors.gray.cool_gray, bold: false },
  } satisfies StyleCategory,

  colors: {
    focused: UIColors.blue.cyan,
    active: UIColors.purple.magenta,
    fg: UIColors.white.white,
    // bg: UIColors.gray.granite_gray,
    bg: UIColors.black.black,
  },

  status: {
    CREATED: { fg: UIColors.yellow.yellow, icon: "◆" }, // Diamond
    EXECUTING: { fg: UIColors.green.green, icon: "▶" }, // Play triangle
    SCHEDULED: { fg: UIColors.blue.cyan, icon: "↻" }, // Hollow diamond
    PENDING: { fg: UIColors.blue.cyan, icon: "⏱" }, // Hollow diamond
    AWAITING_AGENT: { fg: UIColors.blue.steel_blue, icon: "◇" }, // Hollow diamond
    FAILED: { fg: UIColors.red.red, icon: "×" }, // Cross
    ABORTED: { fg: UIColors.red.upsdell_red, icon: "⊘" }, // Crossed circle
    COMPLETED: { fg: UIColors.blue.blue, icon: "✔" }, // Circle
    STOPPED: { fg: UIColors.gray.cadet_gray, icon: "◼" }, // Filled square
  } satisfies StyleCategory,

  BUSY: {
    fg: UIColors.red.red,
    bg: null,
    bold: true,
    prefix: "⚡",
    suffix: "",
  },
  IDLE: {
    fg: UIColors.green.green,
    bg: null,
    bold: false,
    prefix: "○",
    suffix: "",
  },

  boolean: {
    TRUE: {
      [DEFAULT_VERSION]: { fg: UIColors.green.green, icon: "[✓]" },
      [INVERSE_COLOR]: { fg: UIColors.red.red, icon: "[✓]" },
      [BUSY_IDLE]: {
        fg: UIColors.red.red,
        bold: true,
        icon: "⚡",
      },
    },
    FALSE: {
      [DEFAULT_VERSION]: { fg: UIColors.red.red, icon: "[✕]" },
      [INVERSE_COLOR]: { fg: UIColors.green.green, icon: "[✕]" },
      [BUSY_IDLE]: {
        fg: UIColors.green.green,
        bold: false,
        icon: "○",
      },
    },
  } satisfies StyleCategory,

  borders: {
    general: {
      type: "line",
      fg: UIColors.white.white,
      focus: {
        border: {
          fg: UIColors.blue.cyan,
        },
      },
    },
    inner: {
      type: "none",
      focus: {
        bg: UIColors.green.dartmouth_green,
      },
    },
  },

  list: {
    selected: { bg: UIColors.blue.blue, fg: UIColors.white.white },
    border: { fg: UIColors.white.white, focus: { fg: UIColors.blue.cyan } },
    item: {
      hover: { bg: UIColors.blue.blue },
    },
  },
  input: {
    fg: UIColors.white.white,
    focus: {
      bg: UIColors.green.dartmouth_green,
    },
  },

  scrollbar: {
    ch: " ",
    track: { bg: UIColors.gray.gray },
    style: { inverse: true },
  },
  number: {
    positive: { fg: UIColors.green.green, bold: true },
    neutral: { fg: UIColors.gray.battleship_gray, bold: false },
    negative: { fg: UIColors.red.red, bold: true },
  } satisfies StyleCategory,
};

export const applyStyle = (
  text: string,
  styleItem: StyleItem | StyleItemVersioned,
  version = "default",
) => {
  let style;
  if (version && Object.keys(styleItem).includes(version)) {
    style = (styleItem as StyleItemVersioned)[version];
  } else {
    style = styleItem;
  }

  let styled = text;
  if (style.fg) {
    styled = `{${style.fg}-fg}${styled}{/${style.fg}-fg}`;
  }
  if (style.bold) {
    styled = `{bold}${styled}{/bold}`;
  }
  if (style.underline) {
    styled = `{underline}${styled}{/underline}`;
  }
  return styled;
};

export function applyStatusStyle(status: TaskRunStatusEnum, value?: string) {
  const { fg, icon } = (UIConfig.status as any)[status];
  return applyStyle(`${icon} ${value ?? status}`, {
    ...UIConfig.labels.status,
    fg,
  });
}

export function applyNumberStyle(count: number, inverse = false) {
  let style;
  if (count === 0) {
    style = UIConfig.number.neutral;
  } else if (count > 0) {
    style = inverse ? UIConfig.number.negative : UIConfig.number.positive;
  } else {
    style = inverse ? UIConfig.number.positive : UIConfig.number.negative;
  }

  return applyStyle(String(count), style);
}

export function applyBooleanStyle(
  value: boolean,
  version?: typeof DEFAULT_VERSION | typeof BUSY_IDLE | typeof INVERSE_COLOR,
) {
  const styleVersions = value ? UIConfig.boolean.TRUE : UIConfig.boolean.FALSE;
  const style = styleVersions[version ?? DEFAULT_VERSION];
  return applyStyle(style.icon, { ...style }, version);
}

export function applyAgentKindIdStyle(agentKindId: AgentKindId) {
  const style = UIConfig.labels.agentTypeId;
  return applyStyle(agentKindId.agentKind, clone(style));
}

export function applyAgentIdStyle(
  input: AgentId | AgentTypeId,
  includeVersion = true,
) {
  const style = UIConfig.labels.agentId[input.agentKind as AgentKindEnum];
  if ((input as AgentId).agentNum != null) {
    const agentId = input as AgentId;
    return applyStyle(
      `${style.icon} ${agentId.agentType}[${agentId.agentNum}]${includeVersion ? ` ${versionNum(agentId.agentConfigVersion)}` : ""}`,
      { ...style },
    );
  } else {
    const agentId = input as AgentTypeId;
    return applyStyle(`${style.icon} ${agentId.agentType}`, { ...style });
  }
}

export function applyToolsStyle(tools: AvailableTool[]) {
  return tools
    .map((t) => [
      applyToolNameStyle(t.toolName),
      applyStyle(t.description, UIConfig.labels.description),
      "",
    ])
    .join("\n");
}

export function applyToolNameStyle(toolName: string) {
  const style = UIConfig.labels.tool;
  return applyStyle(`${style.icon} ${toolName}`, style);
}

export function bool(
  value: boolean,
  version?: typeof DEFAULT_VERSION | typeof BUSY_IDLE | typeof INVERSE_COLOR,
) {
  return applyBooleanStyle(value, version);
}

export function num(value: number, inverse = false) {
  return applyNumberStyle(value, inverse);
}

export function label(value: string) {
  return applyStyle(value, UIConfig.labels.default);
}

export function system(value: string, highlighted?: boolean) {
  return applyStyle(value, {
    ...UIConfig.labels.system,
    underline: highlighted,
  });
}

export function agentConfigId(value: string) {
  return label(value);
}

export function versionAgentPoolStats(
  value: string,
  poolStats?: AgentConfigPoolStats,
) {
  return `${applyStyle(value, UIConfig.labels.version)}${poolStats ? ` ${agentPoolStats(poolStats)}` : ""}`;
}

export function versionNum(value: number) {
  return applyStyle(`v${String(value)}`, UIConfig.labels.version);
}

export function agentKindId(value: AgentKindId) {
  return applyAgentKindIdStyle(value);
}
export function agentTypeId(value: AgentTypeId) {
  return applyAgentIdStyle(value);
}
export function agentId(value: AgentId | AgentTypeId, includeVersion = true) {
  return applyAgentIdStyle(value, includeVersion);
}
export function agentKind(value: AgentKindValue) {
  return applyStyle(value, UIConfig.labels.agentKind);
}
export function agentType(value: AgentTypeValue) {
  return applyStyle(value, UIConfig.labels.agentType);
}
export function desc(description: string) {
  return applyStyle(description, UIConfig.labels.description);
}
export function tools(tools: AvailableTool[]) {
  return applyToolsStyle(tools);
}

export function timestamp(timestamp: string | Date) {
  let value;
  if (typeof timestamp === "string") {
    value = new Date(timestamp).toLocaleString();
  } else {
    value = timestamp.toLocaleString();
  }

  return applyStyle(value, UIConfig.labels.timestamp);
}

export function eventType(event: string) {
  return applyStyle(event, UIConfig.labels.eventType);
}
export function error(error: string, highlighted?: boolean) {
  return applyStyle(error, {
    ...UIConfig.labels.error,
    underline: highlighted,
  });
}

export function input(
  input: string,
  version?: typeof DEFAULT_VERSION | typeof AMBIENT_VERSION,
  highlighted?: boolean,
) {
  const style = UIConfig.labels.input[version ?? DEFAULT_VERSION];
  return applyStyle(input, { ...style, underline: highlighted });
}

export function output(
  output: string,
  version?: typeof DEFAULT_VERSION | typeof AMBIENT_VERSION,
  highlighted?: boolean,
) {
  const style = UIConfig.labels.output[version ?? DEFAULT_VERSION];
  return applyStyle(output, { ...style, underline: highlighted });
}

export function agentPoolStats(poolStats: AgentConfigPoolStats) {
  return `[${num(poolStats.available)}/${num(poolStats.poolSize)}]`;
}

export function agentPool(agentPool: {
  agentType: string;
  poolStats: AgentConfigPoolStats;
  agentConfigVersion?: number;
}): string {
  return `${agentId(stringToAgentType(agentPool.agentType))} ${(agentPool.agentConfigVersion && `${versionNum(agentPool.agentConfigVersion)} `) || ""}${agentPoolStats(agentPool.poolStats)}`;
}

export function agent(agent: AgentInfo) {
  return `${agentId(stringToAgent(agent.agentId), false)} ${versionNum(agent.agentConfigVersion)} ${bool(agent.inUse, agent.inUse ? DEFAULT_VERSION : BUSY_IDLE)}`;
}

export function applyTaskKindIdStyle(taskKindId: TaskKindId) {
  const style = UIConfig.labels.taskTypeId;
  return applyStyle(taskKindId.taskKind, clone(style));
}

export function applyTaskRunIdStyle(taskRunId: TaskRunId | TaskTypeId) {
  const style = UIConfig.labels.taskRunId[taskRunId.taskKind as TaskKindEnum];
  const isTaskRunId = (taskRunId as TaskRunId).taskRunNum != null;
  return applyStyle(
    `${style.icon} ${taskRunId.taskType}${isTaskRunId ? `[${(taskRunId as TaskRunId).taskRunNum}]` : ""}`,
    { ...style },
  );
}

export function taskKind(taskKind: TaskKindValue) {
  return applyStyle(taskKind, UIConfig.labels.taskKind);
}

export function taskType(taskType: TaskTypeValue) {
  return applyStyle(taskType, UIConfig.labels.taskType);
}

export function concurrencyMode(concurrencyMode: string) {
  return applyStyle(concurrencyMode, UIConfig.labels.default);
}

export function taskKindId(taskKindId: TaskKindId): string {
  return applyTaskKindIdStyle(taskKindId);
}

export function taskRunId(value: TaskRunId | TaskTypeId) {
  return applyTaskRunIdStyle(value);
}

export function taskPoolStats(poolStats: TaskConfigPoolStats) {
  return `[${num(poolStats.active)}/${num(poolStats.poolSize)}]`;
}

export function taskPool(taskPool: {
  taskType: TaskTypeValue;
  poolStats: TaskConfigPoolStats;
  taskConfigVersion?: number;
}): string {
  return `${taskRunId(stringToTaskType(taskPool.taskType))} ${(taskPool.taskConfigVersion && `${versionNum(taskPool.taskConfigVersion)} `) || ""}${taskPoolStats(taskPool.poolStats)}`;
}

export function task(taskRunInfo: TaskRunInfo) {
  return `${taskRunId(stringToTaskRun(taskRunInfo.taskRunId))} ${versionNum(taskRunInfo.taskConfigVersion)} ${applyStatusStyle(taskRunInfo.taskRun.status)}`;
}

export function taskConfigId(value: TaskConfigId) {
  return applyTaskKindIdStyle(value);
}

export function versionTaskPoolStats(
  value: string,
  poolStats?: TaskConfigPoolStats,
) {
  return `${applyStyle(value, UIConfig.labels.version)}${poolStats ? ` ${taskPoolStats(poolStats)}` : ""}`;
}

export function taskRunStatus(status: TaskRunStatusEnum) {
  return applyStatusStyle(status);
}

export function taskRunInteractionStatus(status: InteractionTaskRunStatusEnum) {
  return applyStatusStyle(status);
}
