import blessed from "neo-blessed";
import { join } from "path";
import { clone } from "remeda";
import {
  AgentConfigId,
  AgentKindId,
  agentSomeIdToTypeValue,
  AgentTypeId,
  stringToAgent,
  stringToAgentConfig,
  stringToAgentKind,
} from "@/agents/agent-id.js";
import {
  AgentConfig,
  AgentKindEnumSchema,
  AvailableTool,
} from "@/agents/registry/dto.js";
import {
  AgentInfo,
  AgentStateBuilder,
  StateUpdateType,
} from "@/agents/state/builder.js";
import * as st from "../config.js";
import { BaseMonitor, ParentInput, ScreenInput } from "../base/monitor.js";

const AGENT_LIST_DEFAULT_TEXT = "Select pool to view agents";
const AGENT_VERSION_DEFAULT_TEXT = "Select pool to view versions";
const AGENT_TEMPLATE_DETAIL_DEFAULT_TEXT =
  "Select agent pool to view agent config detail";
const AGENT_DETAIL_DEFAULT_TEXT = "Select agent to view agent detail";

export class AgentMonitor extends BaseMonitor {
  private stateBuilder: AgentStateBuilder;
  private agentPoolList: blessed.Widgets.ListElement;
  private agentPoolListItemsData: {
    agentTypeId: AgentTypeId | AgentKindId;
    itemContent: string;
  }[] = [];
  private agentPoolListSelectedIndex: number | null = null;

  private agentVersionsList: blessed.Widgets.ListElement;
  private agentVersionsListItemsData: {
    agentTypeId: AgentConfigId;
    itemContent: string;
  }[] = [];
  private agentVersionsListSelectedIndex: number | null = null;

  private agentList: blessed.Widgets.ListElement;
  private agentListItemsData: {
    agent: AgentInfo;
    itemContent: string;
  }[] = [];
  private agentListSelectedIndex: number | null = null;

  private agentConfigDetail: blessed.Widgets.BoxElement;
  private agentDetail: blessed.Widgets.BoxElement;
  private logBox: blessed.Widgets.Log;

  constructor(arg: ParentInput | ScreenInput) {
    super(arg);
    this.stateBuilder = new AgentStateBuilder();
    this.stateBuilder.on("log:reset", () => {
      this.reset();
    });
    this.stateBuilder.on("log:new_line", (line) => {
      this.logBox.log(`${new Date().toLocaleString()} - ${line}`);
    });
    this.stateBuilder.on("state:updated", (update) => {
      switch (update.type) {
        case StateUpdateType.TOOLS:
        case StateUpdateType.AGENT_CONFIG:
        case StateUpdateType.POOL:
          this.updateAgentPoolsList();
          this.onAgentSelect(this.agentListSelectedIndex || 0);
          break;
        case StateUpdateType.AGENT:
          this.updateAgentVersionsList(false);
          this.onAgentSelect(this.agentListSelectedIndex || 0);
          break;
        case StateUpdateType.ASSIGNMENT:
          this.updateAgentDetails();
          this.onAgentSelect(this.agentListSelectedIndex || 0);
          break;
        case StateUpdateType.FULL:
          // Full refresh
          // this.reset();
          break;
      }
    });

    this.stateBuilder.on("error", (error: Error) => {
      // OK
      console.error("Error occurred:", error);
    });

    // Left column - Pools and Agents (30%)
    this.agentPoolList = blessed.list({
      parent: this.parent,
      width: "30%",
      height: "20%",
      left: 0,
      top: 0,
      border: { type: "line" },
      label: " Agent Pools ",
      style: st.UIConfig.list,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    this.agentVersionsList = blessed.list({
      parent: this.parent,
      width: "30%",
      height: "20%",
      left: 0,
      top: "20%",
      border: { type: "line" },
      label: " Agent Versions ",
      content: AGENT_VERSION_DEFAULT_TEXT,
      style: st.UIConfig.list,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    this.agentList = blessed.list({
      parent: this.parent,
      width: "30%",
      height: "50%",
      left: 0,
      top: "40%",
      border: { type: "line" },
      label: " Agents ",
      content: AGENT_LIST_DEFAULT_TEXT,
      style: st.UIConfig.list,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    // Center column - Details and Tools (40%)
    this.agentConfigDetail = blessed.box({
      parent: this.parent,
      width: "70%",
      height: "40%",
      left: "30%",
      top: 0,
      border: { type: "line" },
      label: " Agent Config ",
      content: AGENT_TEMPLATE_DETAIL_DEFAULT_TEXT,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    this.agentDetail = blessed.box({
      parent: this.parent,
      width: "70%",
      height: "50%",
      left: "30%",
      top: "40%",
      border: { type: "line" },
      label: " Agent Detail ",
      content: AGENT_DETAIL_DEFAULT_TEXT,
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    // Bottom - Live Updates
    this.logBox = blessed.log({
      parent: this.parent,
      width: "100%",
      height: "10%",
      left: 0,
      top: "90%",
      border: { type: "line" },
      label: " Live Updates ",
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: st.UIConfig.scrollbar,
    });

    this.setupEventHandlers();
    this.screen.render();
  }

  private onPoolSelect(selectedIndex: number) {
    this.agentPoolListSelectedIndex = selectedIndex;
    const itemData =
      this.agentPoolListItemsData[this.agentPoolListSelectedIndex];
    if (!itemData) {
      throw new Error(
        `Missing data for selected pool on index:${this.agentPoolListSelectedIndex}`,
      );
    }
    let agentConfig;
    const agentTypeId = itemData.agentTypeId;
    if ((agentTypeId as AgentTypeId).agentType) {
      agentConfig = this.stateBuilder.getAgentConfig(
        agentSomeIdToTypeValue(agentTypeId as AgentTypeId),
      );
    }

    this.updateAgentConfig(agentConfig, false);
    this.updateAgentVersionsList(false);
    this.onVersionSelect(0, true);
  }

  private onVersionSelect(selectedIndex: number, fromParent = false) {
    this.agentVersionsListSelectedIndex = selectedIndex;
    const itemData =
      this.agentVersionsListItemsData[this.agentVersionsListSelectedIndex];
    let agentConfig;
    if (itemData) {
      const agentConfigId = itemData.agentTypeId as AgentConfig;
      agentConfig = this.stateBuilder.getAgentConfig(
        agentSomeIdToTypeValue(agentConfigId),
        agentConfigId.agentConfigVersion,
      );
    }

    if (!fromParent || agentConfig) {
      this.updateAgentConfig(agentConfig, false);
    }
    this.updateAgentVersionsList(false);
    this.onAgentSelect(0, true);
  }

  private onAgentSelect(selectedIndex: number, fromParent = false) {
    this.agentListSelectedIndex = selectedIndex;
    const itemData = this.agentListItemsData[this.agentListSelectedIndex];
    let agentConfig;
    if (itemData) {
      const { agent } = itemData;
      const agentConfigId = stringToAgentConfig(agent.agentConfigId);
      const agentTypeId = agentSomeIdToTypeValue(agentConfigId);
      agentConfig = this.stateBuilder.getAgentConfig(
        agentTypeId,
        agentConfigId.agentConfigVersion,
      );
    }
    if (!fromParent || agentConfig) {
      this.updateAgentConfig(agentConfig, false);
    }
    this.updateAgentDetails((itemData && itemData.agent) || undefined);
  }

  private setupEventHandlers() {
    this.screen.key(["escape", "q", "C-c"], () => process.exit(0));

    this.agentPoolList.on("select", (_, selectedIndex) =>
      this.onPoolSelect(selectedIndex),
    );
    this.agentVersionsList.on("select", (_, selectedIndex) =>
      this.onVersionSelect(selectedIndex),
    );
    this.agentList.on("select", (_, selectedIndex) =>
      this.onAgentSelect(selectedIndex),
    );

    // Mouse scrolling for all components
    [
      this.agentPoolList,
      this.agentList,
      this.agentConfigDetail,
      this.agentDetail,      
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

  private reset(shouldRender = true): void {
    // Reset selections
    this.agentListSelectedIndex = null;
    this.agentPoolListSelectedIndex = null;
    this.agentVersionsListSelectedIndex = null;

    // Update content
    this.updateAgentPoolsList(false);
    this.updateAgentConfig(undefined, false);
    this.updateAgentList(false);

    // Reset log box
    this.logBox.setContent("");
    this.logBox.log("Reading initial state from log...");

    // Render
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateAgentPoolsList(shouldRender = true): void {
    this.agentPoolListItemsData.splice(0);
    const state = this.stateBuilder.getState();
    Array.from(state.agentPools.entries())
      .sort(([a], [b]) => {
        // Sort agent kind
        const aPoolId = stringToAgentKind(a);
        const bPoolId = stringToAgentKind(b);
        const aSuper =
          aPoolId.agentKind === AgentKindEnumSchema.Values.supervisor;
        const bSuper =
          bPoolId.agentKind === AgentKindEnumSchema.Values.supervisor;
        if (aSuper && !bSuper) {
          return -1;
        } else if (!aSuper && bSuper) {
          return 1;
        } else {
          return aPoolId.agentKind.localeCompare(bPoolId.agentKind);
        }
      })
      .forEach(([agentKindStr, agentTypePools]) => {
        const agentKindId = stringToAgentKind(agentKindStr);
        this.agentPoolListItemsData.push({
          agentTypeId: agentKindId,
          itemContent: st.agentKindId(agentKindId),
        });
        Array.from(agentTypePools.entries())
          .sort(([a], [b]) => {
            // Sort agent type
            return a.localeCompare(b);
          })
          .forEach(([agentTypeStr, agentPool]) => {
            this.agentPoolListItemsData.push({
              agentTypeId: {
                agentKind: agentKindId.agentKind,
                agentType: agentTypeStr,
              },
              itemContent: st.agentPool(agentPool),
            });
          });
      });

    if (
      this.agentPoolListSelectedIndex == null &&
      this.agentPoolListItemsData.length
    ) {
      this.agentPoolListSelectedIndex = 0;
      this.agentPoolList.select(this.agentPoolListSelectedIndex);
    }
    this.agentPoolList.setItems(
      this.agentPoolListItemsData.map((it) => it.itemContent),
    );

    this.updateAgentVersionsList(false);
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateAgentVersionsList(shouldRender = true): void {
    this.agentVersionsListItemsData.splice(0);

    if (this.agentPoolListSelectedIndex != null) {
      // Get versions of selected agent pool
      const itemData =
        this.agentPoolListItemsData[this.agentPoolListSelectedIndex];
      if (!itemData) {
        throw new Error(
          `Missing data for selected pool on index:${this.agentPoolListSelectedIndex}`,
        );
      }

      const agentPoolTypeId = itemData.agentTypeId as AgentTypeId;
      if (agentPoolTypeId.agentType != null) {
        // List versions
        const agentPool = this.stateBuilder.getAgentPool(
          agentPoolTypeId.agentKind,
          agentPoolTypeId.agentType,
        );
        if (agentPool) {
          const hasMultipleVersions = agentPool.versions.length > 1;
          if (hasMultipleVersions) {
            this.agentPoolListItemsData.push({
              agentTypeId: {
                agentKind: agentPoolTypeId.agentKind,
                agentType: agentPoolTypeId.agentType,
              },
              itemContent: st.versionAgentPoolStats("all"),
            });
          }

          clone(agentPool.versions)
            .reverse()
            .forEach(([agentConfigVersion, poolStats]) => {
              const agentTypeId = {
                agentKind: agentPoolTypeId.agentKind,
                agentType: agentPoolTypeId.agentType,
                agentConfigVersion,
              };
              this.agentVersionsListItemsData.push({
                agentTypeId,
                itemContent: st.versionAgentPoolStats(
                  st.versionNum(agentConfigVersion),
                  poolStats,
                ),
              });
            });
        }
      }
    }

    this.agentVersionsList.setItems(
      this.agentVersionsListItemsData.map((it) => it.itemContent),
    );
    this.agentVersionsList.setContent(
      this.agentVersionsListItemsData.length ? "" : AGENT_VERSION_DEFAULT_TEXT,
    );
    this.updateAgentList(false);
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateAgentList(shouldRender = true): void {
    this.agentListItemsData.splice(0);
    if (this.agentVersionsListSelectedIndex != null) {
      Array.from(this.stateBuilder.getAllAgents())
        .filter((a) => {
          if (this.agentVersionsListSelectedIndex == null) {
            return false;
          }

          const agentId = stringToAgent(a.agentId);
          const agentPoolListItem =
            this.agentVersionsListItemsData[
              this.agentVersionsListSelectedIndex
            ];
          if (
            agentPoolListItem &&
            agentPoolListItem.agentTypeId.agentKind === agentId.agentKind
          ) {
            if (
              (agentPoolListItem.agentTypeId as AgentTypeId).agentType != null
            ) {
              if (
                (agentPoolListItem.agentTypeId as AgentTypeId).agentType ==
                agentId.agentType
              ) {
                if (
                  (agentPoolListItem.agentTypeId as AgentConfigId)
                    .agentConfigVersion != null
                ) {
                  return (
                    (agentPoolListItem.agentTypeId as AgentConfigId)
                      .agentConfigVersion === agentId.agentConfigVersion
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
          const aAgentId = stringToAgent(a.agentId);
          const bAgentId = stringToAgent(b.agentId);

          if (aAgentId.agentConfigVersion != bAgentId.agentConfigVersion) {
            return Math.sign(
              aAgentId.agentConfigVersion - bAgentId.agentConfigVersion,
            );
          }

          const comp = aAgentId.agentType.localeCompare(bAgentId.agentType);
          if (comp === 0) {
            return Math.sign(aAgentId.agentNum - bAgentId.agentNum);
          } else {
            return comp;
          }
        })
        .forEach((agent) => {
          this.agentListItemsData.push({
            agent,
            itemContent: st.agent(agent),
          });
        });
    }

    this.agentList.setItems(
      this.agentListItemsData.map((it) => it.itemContent),
    );
    this.agentList.setContent(
      this.agentListItemsData.length ? "" : AGENT_LIST_DEFAULT_TEXT,
    );
    if (shouldRender) {
      this.screen.render();
    }
  }

  private updateAgentConfig(
    agentConfig?: AgentConfig,
    shouldRender = true,
  ): void {
    if (!agentConfig) {
      this.agentConfigDetail.setContent(AGENT_TEMPLATE_DETAIL_DEFAULT_TEXT);
      if (shouldRender) {
        this.screen.render();
      }
      return;
    }

    const details = [
      `{bold}Id:{/bold} ${st.agentConfigId(agentConfig.agentConfigId)}`,
      `{bold}Version:{/bold} ${st.versionNum(agentConfig.agentConfigVersion)}`,
      `{bold}Agent Kind:{/bold} ${st.agentKind(agentConfig.agentKind)}`,
      `{bold}Agent Type:{/bold} ${st.agentType(agentConfig.agentType)}`,
      `{bold}Max Pool Size:{/bold} ${st.num(agentConfig.maxPoolSize)}`,
      `{bold}Auto-populate pool:{/bold} ${st.bool(agentConfig.autoPopulatePool)}`,
      "",
      "{bold}Description:{/bold}",
      st.desc(agentConfig.description),
      "",
      "{bold}Instructions:{/bold}",
      st.desc(agentConfig.instructions),
      "",
      ...(agentConfig.tools.length
        ? ["{bold}Tools:{/bold}", st.tools(this.mapTools(agentConfig.tools))]
        : []),
    ].join("\n");
    this.agentConfigDetail.setContent(details);
    if (shouldRender) {
      this.screen.render();
    }
  }

  private mapTools(tools: string[]): AvailableTool[] {
    return tools.map(
      (t) =>
        this.stateBuilder.getAllTools().get(t) ?? {
          toolName: "Undefined",
          description: "Lorem ipsum....",
        },
    );
  }

  private updateAgentDetails(agent?: AgentInfo, shouldRender = true): void {
    if (!agent) {
      this.agentDetail.setContent(AGENT_DETAIL_DEFAULT_TEXT);
      if (shouldRender) {
        this.screen.render();
      }
      return;
    }

    const details = [
      `${st.label("Id")}: ${st.agentId(stringToAgent(agent.agentId))}`,
      `${st.label("In Use")}: ${st.bool(agent.inUse, "busy_idle")}`,
      `${st.label("Is destroyed")}: ${st.bool(agent.isDestroyed, "inverse_color")}`,
    ].join("\n");
    this.agentDetail.setContent(details);
    if (shouldRender) {
      this.screen.render();
    }
  }

  public async start(dirPath?: string): Promise<void> {
    const logPath = join(dirPath ?? process.cwd(), "state", "agent_state.log");
    // First read the entire log to build initial state
    await this.stateBuilder.watchLogFile(logPath);
  }
}
