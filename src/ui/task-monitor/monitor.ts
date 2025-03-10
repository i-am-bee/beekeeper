import { stringToAgent } from "@/agents/agent-id.js";
import {
  InteractionTaskRunStatusEnum,
  isTaskRunActiveStatus,
  TaskConfig,
  TaskKindEnumSchema,
} from "@/tasks/manager/dto.js";
import {
  StateUpdateType,
  TaskRunInfo,
  TaskStateBuilder,
} from "@/tasks/state/builder.js";
import {
  stringToTaskConfig,
  stringToTaskKind,
  stringToTaskRun,
  TaskConfigId,
  TaskKindId,
  taskSomeIdToTypeValue,
  TaskTypeId,
} from "@/tasks/task-id.js";
import { sortByObjectDateStringProperty } from "@/utils/time.js";
import blessed from "neo-blessed";
import { join } from "path";
import { clone, isNonNull } from "remeda";
import { BaseMonitorWithStatus } from "../base/monitor-with-status.js";
import { ParentInput, ScreenInput } from "../base/monitor.js";
import * as st from "../config.js";

const TASK_CONFIG_DETAIL_DEFAULT_TEXT =
  "Select task pool to view task config detail";
const TASK_VERSION_DEFAULT_TEXT = "Select pool to view versions";
const TASK_RUN_LIST_DEFAULT_TEXT = "Select pool to view tasks";
const TASK_RUN_DETAIL_DEFAULT_TEXT = "Select task run to view task run detail";

enum TaskRunDetailTab {
  DETAIL = "detail",
  TRAJECTORY = "trajectory",
  HISTORY = "history",
}

const TAB_LABELS = {
  [TaskRunDetailTab.DETAIL]: "Detail",
  [TaskRunDetailTab.TRAJECTORY]: "Trajectory",
  [TaskRunDetailTab.HISTORY]: "History",
};

export class TaskMonitor extends BaseMonitorWithStatus<TaskStateBuilder> {
  private taskPoolList: blessed.Widgets.ListElement;
  private taskPoolListItemsData: {
    taskTypeId: TaskTypeId | TaskKindId;
    itemContent: string;
  }[] = [];
  private taskPoolListSelectedIndex: number | null = null;

  private taskVersionsList: blessed.Widgets.ListElement;
  private taskVersionsListItemsData: {
    taskTypeId: TaskConfigId;
    itemContent: string;
  }[] = [];
  private taskVersionsListSelectedIndex: number | null = null;

  private taskRunList: blessed.Widgets.ListElement;
  private taskRunListItemsData: {
    taskRun: TaskRunInfo;
    itemContent: string;
  }[] = [];
  private taskRunListSelectedIndex: number | null = null;

  private taskConfigDetail: blessed.Widgets.BoxElement;

  private currentTaskRunDetailTab: TaskRunDetailTab = TaskRunDetailTab.DETAIL;
  private taskRunDetail: blessed.Widgets.BoxElement;

  private detailTabButton: blessed.Widgets.ButtonElement;
  private trajectoryTabButton: blessed.Widgets.ButtonElement;
  private historyTabButton: blessed.Widgets.ButtonElement;

  constructor(arg: ParentInput | ScreenInput) {
    super(arg, new TaskStateBuilder());
    this.stateBuilder.on("state:updated", (update) => {
      switch (update.type) {
        case StateUpdateType.TASK_CONFIG:
        case StateUpdateType.POOL:
          this.updateTaskPoolsList();
          this.onTaskRunSelect(this.taskRunListSelectedIndex || 0);
          break;
        case StateUpdateType.TASK_RUN:
          this.updateTaskVersionsList();
          this.onTaskRunSelect(this.taskRunListSelectedIndex || 0);
          break;
        // case StateUpdateType.HISTORY_ENTRY:
        //   this.updateTaskRunDetails();
        //   break;
        //   case StateUpdateType.AGENT:
        //     this.updateAgentVersionsList(false);
        //     this.updateAgentDetails();
        //     break;
        //   case StateUpdateType.ASSIGNMENT:
        //     this.updateAgentDetails();
        //     break;
        //   case StateUpdateType.FULL:
        //     // Full refresh
        //     // this.reset();
        //     break;
      }
    });

    // Left column - Pools and Task Runs (70%)
    this.taskPoolList = blessed.list({
      parent: this.contentBox,
      width: "30%",
      height: "30%",
      left: 0,
      top: 0,
      border: { type: "line" },
      label: " Task Pools ",
      style: st.UIConfig.list,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    this.taskVersionsList = blessed.list({
      parent: this.contentBox,
      width: "30%",
      height: "20%",
      left: 0,
      top: "30%",
      border: { type: "line" },
      label: " Task Runs Versions ",
      content: TASK_VERSION_DEFAULT_TEXT,
      style: st.UIConfig.list,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    this.taskRunList = blessed.list({
      parent: this.contentBox,
      width: "30%",
      height: "50%",
      left: 0,
      top: "50%",
      border: { type: "line" },
      label: " Task Runs ",
      content: TASK_RUN_LIST_DEFAULT_TEXT,
      style: st.UIConfig.list,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    // Center column - Details and Tools (40%)
    this.taskConfigDetail = blessed.box({
      parent: this.contentBox,
      width: "70%",
      height: "40%",
      left: "30%",
      top: 0,
      border: { type: "line" },
      label: " Task Config ",
      content: TASK_CONFIG_DETAIL_DEFAULT_TEXT,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    this.taskRunDetail = blessed.box({
      parent: this.contentBox,
      width: "70%",
      height: "60%",
      left: "30%",
      top: "40%",
      border: { type: "line" },
      label: " Task Run Detail ",
      content: TASK_RUN_DETAIL_DEFAULT_TEXT,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    // Tab buttons at the top of taskRunDetail
    this.detailTabButton = blessed.button({
      parent: this.taskRunDetail,
      mouse: true,
      keys: true,
      shrink: true,
      padding: {
        left: 1,
        right: 1,
      },
      left: 1,
      top: 0,
      name: "detailTab",
      content: TAB_LABELS[TaskRunDetailTab.DETAIL],
      style: {
        bg: "blue",
        focus: {
          bg: "blue",
        },
        hover: {
          bg: "blue",
        },
      },
      hidden: true,
    });

    this.trajectoryTabButton = blessed.button({
      parent: this.taskRunDetail,
      mouse: true,
      keys: true,
      shrink: true,
      padding: {
        left: 1,
        right: 1,
      },
      left: 10, // Fixed position instead of dynamic calculation
      top: 0,
      name: "trajectoryTab",
      content: TAB_LABELS[TaskRunDetailTab.TRAJECTORY],
      style: {
        bg: "grey",
        focus: {
          bg: "blue",
        },
        hover: {
          bg: "blue",
        },
      },
      hidden: true,
    });

    this.historyTabButton = blessed.button({
      parent: this.taskRunDetail,
      mouse: true,
      keys: true,
      shrink: true,
      padding: {
        left: 1,
        right: 1,
      },
      left: 23, // Fixed position instead of dynamic calculation
      top: 0,
      name: "historyTab",
      content: TAB_LABELS[TaskRunDetailTab.HISTORY],
      style: {
        bg: "grey",
        focus: {
          bg: "blue",
        },
        hover: {
          bg: "blue",
        },
      },
      hidden: true,
    });

    this.setupEventHandlers();
    this.screen.render();
  }

  private onPoolSelect(selectedIndex: number) {
    this.taskPoolListSelectedIndex = selectedIndex;
    const itemData = this.taskPoolListItemsData[this.taskPoolListSelectedIndex];
    let taskConfig;
    if (itemData) {
      const taskTypeId = itemData.taskTypeId;
      if ((taskTypeId as TaskTypeId).taskType) {
        taskConfig = this.stateBuilder.getTaskConfig(
          taskSomeIdToTypeValue(taskTypeId as TaskTypeId),
        );
      }
    }

    this.updateTaskConfig(taskConfig, false);
    this.updateTaskVersionsList(false);
    this.onVersionSelect(0, true);
  }

  private onVersionSelect(selectedIndex: number, fromParent = false) {
    this.taskVersionsListSelectedIndex = selectedIndex;
    const itemData =
      this.taskVersionsListItemsData[this.taskVersionsListSelectedIndex];
    let taskConfig;
    if (itemData) {
      const taskConfigId = itemData.taskTypeId as TaskConfig;
      taskConfig = this.stateBuilder.getTaskConfig(
        taskSomeIdToTypeValue(taskConfigId),
        taskConfigId.taskConfigVersion,
      );
    }

    if (!fromParent || taskConfig) {
      this.updateTaskConfig(taskConfig, false);
    }
    this.updateTaskVersionsList(false);
    this.onTaskRunSelect(0, true);
  }

  private onTaskRunSelect(selectedIndex: number, fromParent = false) {
    this.taskRunListSelectedIndex = selectedIndex;
    const itemData = this.taskRunListItemsData[this.taskRunListSelectedIndex];
    let taskConfig;
    if (itemData) {
      const { taskRun } = itemData;
      const taskRunConfigId = stringToTaskConfig(taskRun.taskConfigId);
      const taskRunTypeId = taskSomeIdToTypeValue(taskRunConfigId);
      taskConfig = this.stateBuilder.getTaskConfig(
        taskRunTypeId,
        taskRunConfigId.taskConfigVersion,
      );
    }

    if (!fromParent || taskConfig) {
      this.updateTaskConfig(taskConfig, false);
    }
    this.updateTaskRunDetails((itemData && itemData.taskRun) || undefined);
  }

  private onTabSelect(tab: TaskRunDetailTab): void {
    this.currentTaskRunDetailTab = tab;

    // Update tab button styles
    this.detailTabButton.style.bg =
      tab === TaskRunDetailTab.DETAIL ? "blue" : "grey";
    this.trajectoryTabButton.style.bg =
      tab === TaskRunDetailTab.TRAJECTORY ? "blue" : "grey";
    this.historyTabButton.style.bg =
      tab === TaskRunDetailTab.HISTORY ? "blue" : "grey";

    // Re-render the current task run with the new selected tab
    if (this.taskRunListSelectedIndex != null) {
      const itemData = this.taskRunListItemsData[this.taskRunListSelectedIndex];
      if (itemData) {
        this.updateTaskRunDetails(itemData.taskRun);
      }
    }

    this.screen.render();
  }

  private setupEventHandlers() {
    this.taskPoolList.on("select", (_, selectedIndex) =>
      this.onPoolSelect(selectedIndex),
    );
    this.taskVersionsList.on("select", (_, selectedIndex) =>
      this.onVersionSelect(selectedIndex),
    );
    this.taskRunList.on("select", (_, selectedIndex) =>
      this.onTaskRunSelect(selectedIndex),
    );

    // Add this to the setupEventHandlers method
    this.detailTabButton.on("press", () => {
      this.onTabSelect(TaskRunDetailTab.DETAIL);
    });

    this.trajectoryTabButton.on("press", () => {
      this.onTabSelect(TaskRunDetailTab.TRAJECTORY);
    });

    this.historyTabButton.on("press", () => {
      this.onTabSelect(TaskRunDetailTab.HISTORY);
    });

    // Add keyboard shortcuts for tab switching
    this.screen.key(["1"], () => {
      this.onTabSelect(TaskRunDetailTab.DETAIL);
      this.screen.render();
    });

    this.screen.key(["2"], () => {
      this.onTabSelect(TaskRunDetailTab.TRAJECTORY);
      this.screen.render();
    });

    this.screen.key(["3"], () => {
      this.onTabSelect(TaskRunDetailTab.HISTORY);
      this.screen.render();
    });

    // Mouse scrolling for all components
    [
      this.taskPoolList,
      this.taskRunList,
      this.taskConfigDetail,
      this.taskRunDetail,
      // this.lifecycleHistory,
    ].forEach((component) => {
      component.on("mouse", (data) => {
        if (data.action === "wheelup") {
          component.scroll(-1);
          this.screen.render();
        } else if (data.action === "wheeldown") {
          component.scroll(1);
          this.screen.render();
        }
      });
    });
  }

  updateTaskPoolsList(shouldRender = true): void {
    this.taskPoolListItemsData.splice(0);
    const state = this.stateBuilder.getState();
    Array.from(state.taskRunPools.entries())
      .sort(([a], [b]) => {
        // Sort task kind
        const aPoolId = stringToTaskKind(a);
        const bPoolId = stringToTaskKind(b);
        const aSuper =
          aPoolId.taskKind === TaskKindEnumSchema.Values.supervisor;
        const bSuper =
          bPoolId.taskKind === TaskKindEnumSchema.Values.supervisor;
        if (aSuper && !bSuper) {
          return -1;
        } else if (!aSuper && bSuper) {
          return 1;
        } else {
          return aPoolId.taskKind.localeCompare(bPoolId.taskKind);
        }
      })
      .forEach(([taskKindStr, taskTypePools]) => {
        const taskKindId = stringToTaskKind(taskKindStr);
        this.taskPoolListItemsData.push({
          taskTypeId: taskKindId,
          itemContent: st.taskKindId(taskKindId),
        });
        Array.from(taskTypePools.entries())
          .sort(([a], [b]) => {
            // Sort task type
            return a.localeCompare(b);
          })
          .forEach(([taskTypeStr, taskPool]) => {
            this.taskPoolListItemsData.push({
              taskTypeId: {
                taskKind: taskKindId.taskKind,
                taskType: taskTypeStr,
              },
              itemContent: st.taskPool(taskPool),
            });
          });
      });

    if (
      this.taskPoolListSelectedIndex == null &&
      this.taskPoolListItemsData.length
    ) {
      this.taskPoolListSelectedIndex = 0;
      this.taskPoolList.select(this.taskPoolListSelectedIndex);
    }
    this.taskPoolList.setItems(
      this.taskPoolListItemsData.map((it) => it.itemContent),
    );

    this.updateTaskVersionsList(false);
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateTaskVersionsList(shouldRender = true): void {
    this.taskVersionsListItemsData.splice(0);

    if (this.taskPoolListSelectedIndex != null) {
      // Get versions of selected task pool
      const itemData =
        this.taskPoolListItemsData[this.taskPoolListSelectedIndex];
      if (!itemData) {
        throw new Error(
          `Missing data for selected pool on index:${this.taskPoolListSelectedIndex}`,
        );
      }

      const taskPoolTypeId = itemData.taskTypeId as TaskTypeId;
      if (taskPoolTypeId.taskType != null) {
        // List versions
        const taskPool = this.stateBuilder.getTaskPool(
          taskPoolTypeId.taskKind,
          taskPoolTypeId.taskType,
        );
        if (taskPool) {
          const hasMultipleVersions = taskPool.versions.length > 1;
          if (hasMultipleVersions) {
            this.taskPoolListItemsData.push({
              taskTypeId: {
                taskKind: taskPoolTypeId.taskKind,
                taskType: taskPoolTypeId.taskType,
              },
              itemContent: st.versionAgentPoolStats("all"),
            });
          }

          clone(taskPool.versions)
            .reverse()
            .forEach(([taskConfigVersion, poolStats]) => {
              const taskTypeId = {
                taskKind: taskPoolTypeId.taskKind,
                taskType: taskPoolTypeId.taskType,
                taskConfigVersion,
              };
              this.taskVersionsListItemsData.push({
                taskTypeId,
                itemContent: st.versionTaskPoolStats(
                  st.versionNum(taskConfigVersion),
                  poolStats,
                ),
              });
            });
        }
      }
    }

    this.taskVersionsList.setItems(
      this.taskVersionsListItemsData.map((it) => it.itemContent),
    );
    this.taskVersionsList.setContent(
      this.taskVersionsListItemsData.length ? "" : TASK_VERSION_DEFAULT_TEXT,
    );
    this.updateTaskList(false);
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateTaskList(shouldRender = true): void {
    this.taskRunListItemsData.splice(0);
    if (this.taskVersionsListSelectedIndex != null) {
      Array.from(this.stateBuilder.getAllTaskRuns())
        .filter((a) => {
          if (this.taskVersionsListSelectedIndex == null) {
            return false;
          }

          const taskRunId = stringToTaskRun(a.taskRunId);
          const taskRunPoolListItem =
            this.taskVersionsListItemsData[this.taskVersionsListSelectedIndex];
          if (
            taskRunPoolListItem &&
            taskRunPoolListItem.taskTypeId.taskKind === taskRunId.taskKind
          ) {
            if (
              (taskRunPoolListItem.taskTypeId as TaskTypeId).taskType != null
            ) {
              if (
                (taskRunPoolListItem.taskTypeId as TaskTypeId).taskType ==
                taskRunId.taskType
              ) {
                if (
                  (taskRunPoolListItem.taskTypeId as TaskConfigId)
                    .taskConfigVersion != null
                ) {
                  return (
                    (taskRunPoolListItem.taskTypeId as TaskConfigId)
                      .taskConfigVersion === taskRunId.taskConfigVersion
                  );
                }
              } else {
                return false;
              }
            }
            return true;
          }
          return false;
        })
        .sort((a, b) => {
          const aTaskRunId = stringToTaskRun(a.taskRunId);
          const bTaskRunId = stringToTaskRun(b.taskRunId);

          if (aTaskRunId.taskConfigVersion != bTaskRunId.taskConfigVersion) {
            return Math.sign(
              aTaskRunId.taskConfigVersion - bTaskRunId.taskConfigVersion,
            );
          }

          const comp = aTaskRunId.taskType.localeCompare(bTaskRunId.taskType);
          if (comp === 0) {
            return Math.sign(bTaskRunId.taskRunNum - aTaskRunId.taskRunNum);
          } else {
            return comp;
          }
        })
        .forEach((task) => {
          this.taskRunListItemsData.push({
            taskRun: task,
            itemContent: st.task(task),
          });
        });
    }

    this.taskRunList.setItems(
      this.taskRunListItemsData.map((it) => it.itemContent),
    );
    this.taskRunList.setContent(
      this.taskRunListItemsData.length ? "" : TASK_RUN_LIST_DEFAULT_TEXT,
    );
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateTaskConfig(taskConfig?: TaskConfig, shouldRender = true): void {
    if (!taskConfig) {
      this.taskConfigDetail.setContent(TASK_CONFIG_DETAIL_DEFAULT_TEXT);
      if (shouldRender) {
        this.screen.render();
      }
      return;
    }

    const details = [
      `${st.label("Id")}:  ${st.taskConfigId(stringToTaskConfig(taskConfig.taskConfigId))} (${st.label(taskConfig.taskConfigId)})`,
      `${st.label("Version")}:  ${st.versionNum(taskConfig.taskConfigVersion)}`,
      `${st.label("Task Kind")}:  ${st.taskKind(taskConfig.taskKind)}`,
      `${st.label("Task Type")}:  ${st.taskType(taskConfig.taskType)}`,
      `${st.label("Required Agent")}:  ${st.agentId({ agentKind: taskConfig.agentKind, agentType: taskConfig.agentType, agentConfigVersion: taskConfig.agentConfigVersion })}`,
      `${st.label("Max Repeats")}:  ${st.num(taskConfig.maxRepeats || 0)}`,
      `${st.label("Interval ms")}:  ${st.num(taskConfig.intervalMs)}`,
      `${st.label("Concurrency Mode")}:  ${st.concurrencyMode(taskConfig.concurrencyMode)}`,
      "",
      `${st.label("Description")}: `,
      st.desc(taskConfig.description),
      "",
      `${st.label("Input")}: `,
      st.input(taskConfig.taskConfigInput, "ambient"),
    ].join("\n");
    this.taskConfigDetail.setContent(details);
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateTaskRunDetails(
    taskRunInfo?: TaskRunInfo,
    shouldRender = true,
  ): void {
    if (!taskRunInfo) {
      this.taskRunDetail.setContent(TASK_RUN_DETAIL_DEFAULT_TEXT);
      this.detailTabButton.hide();
      this.trajectoryTabButton.hide();
      this.historyTabButton.hide();
      if (shouldRender) {
        this.screen.render();
      }
      return;
    }

    this.taskRunDetail.setContent("");
    this.detailTabButton.show();
    this.trajectoryTabButton.show();
    this.historyTabButton.show();

    const {
      taskRunId,
      status,
      isOccupied,
      currentAgentId,
      ownerAgentId,
      completedRuns,
      errorCount,
      lastRunAt,
      nextRunAt,
      history,
      taskRunInput,
      currentTrajectory,
      blockingTaskRunIds,
      blockedByTaskRunIds,
      taskRunKind,
      originTaskRunId,
    } = taskRunInfo.taskRun;

    let interactionStatus: InteractionTaskRunStatusEnum | null = null;
    let response = null;
    if (taskRunInfo.taskRun.taskRunKind === "interaction") {
      interactionStatus = taskRunInfo.taskRun.interactionStatus;
      response = taskRunInfo.taskRun.response;
    }

    const { isDestroyed } = taskRunInfo;

    let content = "";

    switch (this.currentTaskRunDetailTab) {
      case TaskRunDetailTab.DETAIL:
        content = [
          `${st.label("Id")}: ${st.taskRunId(stringToTaskRun(taskRunId))} (${st.label(taskRunId)})`,
          originTaskRunId
            ? `${st.label("Origin Task Run Id")}: ${st.taskRunId(stringToTaskRun(originTaskRunId))} (${st.label(originTaskRunId)})`
            : null,
          blockingTaskRunIds?.length
            ? `${st.label("Blocking")}: \n${blockingTaskRunIds.map((blockedByTaskRunId) => `${st.taskRunId(stringToTaskRun(blockedByTaskRunId))} (${st.label(blockedByTaskRunId)})`).join("\n")}`
            : null,
          blockedByTaskRunIds?.length
            ? `${st.label("Blocked by")}: \n${blockedByTaskRunIds.map((blockedByTaskRunId) => `${st.taskRunId(stringToTaskRun(blockedByTaskRunId))} (${st.label(blockedByTaskRunId)})`).join("\n")}`
            : null,
          `${st.label("Run Kind")}: ${taskRunKind}`,
          interactionStatus
            ? `${st.label("Interaction State")}: ${st.taskRunInteractionStatus(interactionStatus)}`
            : null,
          `${st.label("In Use")}: ${st.bool(isTaskRunActiveStatus(status), "busy_idle")}`,
          `${st.label("Status")}: ${st.taskRunStatus(status)}`,
          `${st.label("Is Destroyed")}: ${st.bool(isDestroyed, "inverse_color")}`,
          `${st.label("Is Occupied")}:  ${st.bool(isOccupied)}${currentAgentId ? st.agentId(stringToAgent(currentAgentId)) : ""}`,
          `${st.label("Owner")}:  ${st.agentId(stringToAgent(ownerAgentId))}`,
          `${st.label("Completed Runs")}:  ${st.num(completedRuns)}`,
          `${st.label("Error Count")}:  ${st.num(errorCount, true)}`,
          lastRunAt
            ? `${st.label("Last Run")}:  ${st.timestamp(lastRunAt)}`
            : null,
          nextRunAt
            ? `${st.label("Next Run")}:  ${st.timestamp(nextRunAt)}`
            : null,
          "",
          `${st.label("Input")}:`,
          `${st.input(taskRunInput)}`,
          "",
          history.at(-1)?.output
            ? `${st.label("Output")}: \n${st.output(String(history.at(-1)?.output))}`
            : null,
          "",
          "",
          history.at(-1)?.error
            ? `${st.label("Error")}: \n${st.error(String(history.at(-1)?.error))}`
            : null,
          "",
          response ? `${st.label("Response")}:  ${st.output(response)}` : null,
        ]
          .filter(isNonNull)
          .join("\n");
        break;

      case TaskRunDetailTab.TRAJECTORY:
        if (currentTrajectory && currentTrajectory.length > 0) {
          content = currentTrajectory
            .sort(sortByObjectDateStringProperty("timestamp", "desc"))
            .map((entry) => {
              return [
                `${st.timestamp(entry.timestamp)} - ${st.label(entry.key)} - ${st.agentId(stringToAgent(entry.agentId))}`,
                `${st.output(entry.value)}`,
                "---",
              ].join("\n");
            })
            .join("\n");
        } else {
          content = "No trajectory entries available.";
        }
        break;

      case TaskRunDetailTab.HISTORY:
        if (history && history.length > 0) {
          content = history
            .sort(sortByObjectDateStringProperty("timestamp", "desc"))
            .map((entry, index) => {
              return [
                `${st.label("Run")} ${st.num(entry.runNumber)}/${entry.maxRuns || "∞"} - ${st.timestamp(entry.timestamp)} - ${st.taskRunStatus(entry.terminalStatus)}`,
                `${st.label("Agent")}: ${entry.agentId ? st.agentId(stringToAgent(entry.agentId)) : "None"}`,
                `${st.label("Execution Time")}: ${st.num(entry.executionTimeMs)}ms`,
                entry.output
                  ? `${st.label("Output")}: \n${st.output(String(entry.output))}`
                  : null,
                entry.error
                  ? `${st.label("Error")}: \n${st.error(entry.error)}`
                  : null,
                entry.trajectory && entry.trajectory.length > 0
                  ? `${st.label("Trajectory Entries")}: ${st.num(entry.trajectory.length)}`
                  : null,
                index < history.length - 1 ? "-------------------" : "",
              ]
                .filter(Boolean)
                .join("\n");
            })
            .join("\n");
        } else {
          content = "No history entries available.";
        }
        break;
    }

    // Add padding for content to appear below the tab buttons
    this.taskRunDetail.setContent("\n\n" + content);

    if (shouldRender) {
      this.screen.render();
    }
  }

  reset(shouldRender = true): void {
    super.reset(false);

    // Reset selections
    this.taskPoolListSelectedIndex = null;

    // Update content
    this.updateTaskPoolsList(false);

    // Render
    if (shouldRender) {
      this.screen.render();
    }
  }

  public async start(dirPath?: string): Promise<void> {
    const logPath = join(dirPath ?? process.cwd(), "state", "task_state.log");
    // First read the entire log to build initial state
    await this.stateBuilder.watchLogFile(logPath);
  }
}
