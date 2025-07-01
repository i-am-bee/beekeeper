import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "@/ui/base/monitor.js";
import { ControllableElement } from "@/ui/controls/controls-manager.js";
import { Logger } from "beeai-framework";
import blessed from "neo-blessed";
import { getRunListScrollbarStyle, getRunListStyle } from "../config.js";
import { WorkflowPopupDataProvider } from "../data-provider.js";

export class WorkflowRuns extends ContainerComponent {
  private dataProvider: WorkflowPopupDataProvider;

  private runList: ControllableElement<blessed.Widgets.ListElement>;
  private runListItemsData: {
    runIndex: number;
    itemContent: string;
  }[] = [];
  private runListSelectedIndex: number | null = null;

  constructor(
    arg: ParentInput | ScreenInput,
    logger: Logger,
    dataProvider: WorkflowPopupDataProvider,
  ) {
    super(arg, logger);

    this.dataProvider = dataProvider;

    this.runList = this.controlsManager.add({
      kind: "element",
      name: "run_list",
      element: blessed.list({
        parent: this.parent.element,
        width: 30,
        height: "100%-10",
        left: 0,
        top: 3,
        border: { type: "line" },
        label: " Runs ",
        style: getRunListStyle(),
        tags: true,
        scrollable: true,
        mouse: false,
        keys: false,
        vi: false,
        valign: "middle",
        align: "left",
        scrollbar: getRunListScrollbarStyle(),
      }),
      parent: this.parent,
    });

    this.updateRunList(false);

    this.setupEventHandlers();
    this.setupControls();
  }

  private setupEventHandlers() {
    this.dataProvider.on("run:data", () => {
      this.updateRunList();
    });
  }

  private updateRunList(shouldRender = true) {
    this.runListItemsData.splice(0);

    const runs = this.dataProvider.state.runs;
    if (runs.length === 0) {
      this.runList.element.setContent("No runs available");
      this.runList.element.style.align = "center";
      this.runListSelectedIndex = null;
      this.runListItemsData = [];
      return;
    }

    this.runList.element.setContent("");
    this.runList.element.style.align = "left";

    this.runListItemsData = runs.map((run, index) => {
      const itemContent = `{bold}Run ${index + 1}{/bold}`;
      return { runIndex: index, itemContent };
    });

    if (this.runListSelectedIndex == null && this.runListItemsData.length) {
      this.runListSelectedIndex = 0;
      this.runList.element.select(this.runListSelectedIndex);
    }
    this.runList.element.setItems(
      this.runListItemsData.map((it) => it.itemContent),
    );

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private setupControls(shouldRender = true) {
    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
