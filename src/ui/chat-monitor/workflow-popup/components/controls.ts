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
import { UIColors } from "@/ui/colors.js";
import {
  getPlayPauseButtonContent,
  getPlayPauseButtonStyle,
} from "../config.js";
import {
  WorkflowDataProviderMode,
  WorkflowPopupDataProvider,
} from "../data-provider.js";
import { getCheckboxStyle } from "../../config.js";
import { NavigationDirection } from "@/ui/controls/navigation.js";

export class Controls extends ContainerComponent {
  private _container: ControllableContainer;
  private playPauseButton: ControllableElement<blessed.Widgets.ButtonElement>;
  private autoPopupCheckbox: ControllableElement<blessed.Widgets.CheckboxElement>;
  private autoPlayCheckbox: ControllableElement<blessed.Widgets.CheckboxElement>;
  private dataProvider: WorkflowPopupDataProvider;
  private playPauseButtonEnabled = false;
  private focusedElementId?: string;
  private onBlurCallback?: (direction: NavigationDirection) => void;

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
        content: getPlayPauseButtonContent(this.dataProvider.isPlaying),
        ...getPlayPauseButtonStyle(
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
      name: "auto_play_checkbox",
      element: blessed.checkbox({
        parent: this._container.element,
        top: 2,
        left: "100%-40",
        content: "Auto play",
        mouse: false,
        keys: false,
        ...getCheckboxStyle(this.dataProvider.autoPlayEnabled),
      }),
      parent: this._container,
    });

    this.autoPopupCheckbox = this.controlsManager.add({
      kind: "element",
      name: "auto_popup_checkbox",
      element: blessed.checkbox({
        parent: this._container.element,
        top: 2,
        left: "100%-20",
        content: "Auto popup",
        mouse: false,
        keys: false,
        ...getCheckboxStyle(this.dataProvider.autoPopupEnabled),
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
        getPlayPauseButtonContent(isPlaying),
      );
      this.playPauseButton.element.style = getPlayPauseButtonStyle(
        isPlaying,
        this.playPauseButtonEnabled,
      );
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

  focus(onBlur: (direction: NavigationDirection) => void, shouldRender = true) {
    this.onBlurCallback = onBlur;

    this.focusedElementId = this.controlsManager.focused.id;
    this.setupControls(shouldRender);

    if (this.playPauseButtonEnabled) {
      this.controlsManager.focus(this.playPauseButton.id);
    } else {
      this.controlsManager.focus(this.autoPlayCheckbox.id);
    }
  }

  blur(direction: NavigationDirection, shouldRender = true) {
    if (this.focusedElementId === undefined) {
      return;
    }
    this.onBlurCallback?.(direction);
    this.onBlurCallback = undefined;
    this.controlsManager.focus(this.focusedElementId);
    this.focusedElementId = undefined;
    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private setupControls(shouldRender = true) {
    this.enablePlayPauseButton(this.dataProvider.hasRuns);

    // Navigation
    if (this.playPauseButtonEnabled) {
      this.controlsManager.updateNavigation(this.playPauseButton.id, {
        right: this.autoPlayCheckbox.id,
        next: this.autoPlayCheckbox.id,
        leftEffect: () => this.blur(NavigationDirection.LEFT),
        previousEffect: () => this.blur(NavigationDirection.PREVIOUS),
        upEffect: () => this.blur(NavigationDirection.UP),
        outEffect: () => this.blur(NavigationDirection.OUT),
      });
      this.controlsManager.updateNavigation(this.autoPlayCheckbox.id, {
        right: this.autoPopupCheckbox.id,
        next: this.autoPopupCheckbox.id,
        left: this.playPauseButton.id,
        previous: this.playPauseButton.id,
        upEffect: () => this.blur(NavigationDirection.UP),
        inEffect: () => this.dataProvider.toggleAutoPlay(),
        outEffect: () => this.blur(NavigationDirection.OUT),
      });
      this.controlsManager.updateNavigation(this.autoPopupCheckbox.id, {
        left: this.autoPlayCheckbox.id,
        previous: this.autoPlayCheckbox.id,
        inEffect: () => this.dataProvider.toggleAutoPopup(),
        upEffect: () => this.blur(NavigationDirection.UP),
        outEffect: () => this.blur(NavigationDirection.OUT),
      });
    } else {
      this.controlsManager.updateNavigation(this.autoPlayCheckbox.id, {
        right: this.autoPopupCheckbox.id,
        next: this.autoPopupCheckbox.id,
        leftEffect: () => this.blur(NavigationDirection.LEFT),
        previousEffect: () => this.blur(NavigationDirection.PREVIOUS),
        inEffect: () => this.dataProvider.toggleAutoPlay(),
        upEffect: () => this.blur(NavigationDirection.UP),
        outEffect: () => this.blur(NavigationDirection.OUT),
      });
      this.controlsManager.updateNavigation(this.autoPopupCheckbox.id, {
        left: this.autoPlayCheckbox.id,
        previous: this.autoPlayCheckbox.id,
        inEffect: () => this.dataProvider.toggleAutoPopup(),
        upEffect: () => this.blur(NavigationDirection.UP),
        outEffect: () => this.blur(NavigationDirection.OUT),
      });
    }

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private enablePlayPauseButton(isEnabled: boolean) {
    if (this.playPauseButtonEnabled === isEnabled) {
      return;
    }
    this.playPauseButtonEnabled = isEnabled;
    this.playPauseButton.element.style = getPlayPauseButtonStyle(
      this.dataProvider.isPlaying,
      isEnabled,
    );
  }
}
