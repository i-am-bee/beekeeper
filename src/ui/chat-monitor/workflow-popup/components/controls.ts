import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "@/ui/base/monitor.js";
import {
  ControllableContainer,
  ControllableElement,
} from "@/ui/controls/controls-manager.js";
import { Logger } from "beeai-framework";
import blessed from "neo-blessed";
import * as chatStyles from "../config.js";
import { UIColors } from "@/ui/colors.js";
import { getPlayPauseButtonStyle } from "../config.js";
import {
  WorkflowDataProviderMode,
  WorkflowPopupDataProvider,
} from "../data-provider.js";

export class Controls extends ContainerComponent {
  private _container: ControllableContainer;
  private playPauseButton: ControllableElement<blessed.Widgets.ButtonElement>;
  private autoPopupCheckbox: ControllableElement<blessed.Widgets.CheckboxElement>;
  private autoPlayCheckbox: ControllableElement<blessed.Widgets.CheckboxElement>;
  private dataProvider: WorkflowPopupDataProvider;
  private buttonsEnabled = false;

  constructor(
    arg: ParentInput | ScreenInput,
    logger: Logger,
    dataProvider: WorkflowPopupDataProvider,
  ) {
    super(arg, logger);

    this.dataProvider = dataProvider;

    this._container = this.controlsManager.add({
      kind: "container",
      name: "controls_container",
      element: blessed.box({
        parent: this.parent.element,
        top: "100%-7",
        left: 0,
        width: "100%-2",
        height: 3,
        tags: true,
        focusable: false,
        keys: false,
        mouse: false,
        style: {
          bg: UIColors.black.black,
        },
        vi: false,
      }),
      parent: this.parent,
    });

    this.playPauseButton = this.controlsManager.add({
      kind: "element",
      name: "play_pause_button",
      element: blessed.button({
        parent: this._container.element,
        width: 10,
        height: 3,
        left: "50%-5",
        top: 1,
        content: chatStyles.getPlayPauseButtonContent(
          this.dataProvider.isPlaying,
        ),
        ...chatStyles.getPlayPauseButtonStyle(
          this.dataProvider.isPlaying,
          this.dataProvider.hasRuns,
        ),
        tags: true,
        mouse: false,
      }),
      parent: this._container,
    });

    this.autoPlayCheckbox = this.controlsManager.add({
      kind: "element",
      name: "play_pause_button",
      element: blessed.checkbox({
        parent: this._container.element,
        top: 2,
        left: "100%-40",
        content: "Auto play",
        checked: this.dataProvider.autoPlayEnabled,
        mouse: false,
        keys: false,
        style: {
          bg: UIColors.black.black,
          fg: UIColors.white.white,
          focus: {
            bg: UIColors.black.black,
            fg: UIColors.white.white,
          },
        },
      }),
      parent: this._container,
    });

    this.autoPopupCheckbox = this.controlsManager.add({
      kind: "element",
      name: "play_pause_button",
      element: blessed.checkbox({
        parent: this._container.element,
        top: 2,
        left: "100%-20",
        content: "Auto popup",
        checked: this.dataProvider.autoPopupEnabled,
        mouse: false,
        keys: false,
        style: {
          bg: UIColors.black.black,
          fg: UIColors.white.white,
          focus: {
            bg: UIColors.black.black,
            fg: UIColors.white.white,
          },
        },
      }),
      parent: this._container,
    });

    this.setupEventHandlers();
    this.setupControls();
  }

  private setupEventHandlers() {
    this.dataProvider.on("mode:change", (mode) => {
      const isPlaying = mode === WorkflowDataProviderMode.PLAY;
      this.playPauseButton.element.setContent(
        chatStyles.getPlayPauseButtonContent(isPlaying),
      );
      this.playPauseButton.element.style = getPlayPauseButtonStyle(
        isPlaying,
        this.buttonsEnabled,
      );
      this.setupControls();
    });

    this.dataProvider.on("run:data", (isEmpty) => {
      this.enablePlayPauseButton(!isEmpty);
    });

    this.dataProvider.on("auto_popup:change", (enabled) => {
      this.autoPopupCheckbox.element.checked = enabled;
    });

    this.dataProvider.on("auto_play:change", (enabled) => {
      this.autoPlayCheckbox.element.checked = enabled;
    });
  }

  private setupControls(shouldRender = true) {
    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private enablePlayPauseButton(isEnabled: boolean) {
    if (this.buttonsEnabled === isEnabled) {
      return;
    }
    this.buttonsEnabled = isEnabled;
    this.playPauseButton.element.style = getPlayPauseButtonStyle(
      this.dataProvider.isPlaying,
      isEnabled,
    );
  }
}
