import { Logger } from "beeai-framework";
import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "../base/monitor.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../controls/navigation.js";
import { CloseDialog } from "../shared/close-dialog.js";
import { keyActionListenerFactory } from "../controls/key-bindings.js";
import { ChatFilter } from "./filter/filter.js";
import { Messages } from "./messages/messages.js";
import { HelpBar } from "../shared/help-bar.js";
import { ChatInput } from "./input/input.js";

export class ChatMonitor extends ContainerComponent {
  private closeDialog: CloseDialog;
  private filter: ChatFilter;
  private messages: Messages;
  private helpBar: HelpBar;
  private chatInput: ChatInput;

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    super(arg, logger);

    this.helpBar = new HelpBar(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    this.chatInput = new ChatInput(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
        onValueChange() {
          return {} as any;
        },
      },
      logger,
    );

    this.messages = new Messages(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
        getChatFilters: this.getChatFilters.bind(this),
      },
      logger,
    );

    // Keep filter on top due to pop-up role filter
    this.filter = new ChatFilter(
      {
        kind: "parent",
        parent: this.parent,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    // Should be last to appear on top
    this.closeDialog = new CloseDialog(this.controlsManager);
    this.setupControls();
  }

  private getChatFilters() {
    return this.filter.values;
  }

  private setupControls(shouldRender = true) {
    // Global shortcuts
    this.controlsManager.updateKeyActions(this.controlsManager.screen.id, {
      kind: "exclusive",
      actions: [
        {
          key: "C-c",
          action: {
            description: NavigationDescription.EXIT_APP,
            listener: keyActionListenerFactory(() => {
              this.openCloseDialog();
            }),
          },
        },
        {
          key: "enter",
          action: {
            description: NavigationDescription.IN_OUT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.IN);
            }),
          },
        },
        {
          key: "escape",
          action: {
            description: NavigationDescription.IN_OUT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.OUT);
            }),
          },
        },
        {
          key: "left",
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.LEFT);
            }),
          },
        },
        {
          key: "right",
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.RIGHT);
            }),
          },
        },
        {
          key: "up",
          action: {
            description: NavigationDescription.UP_DOWN,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.UP);
            }),
          },
        },
        {
          key: "down",
          action: {
            description: NavigationDescription.UP_DOWN,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.DOWN);
            }),
          },
        },
        {
          key: "tab",
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.NEXT);
            }),
          },
        },
        {
          key: "S-tab",
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.PREVIOUS);
            }),
          },
        },
        {
          key: "C-e",
          action: {
            description: NavigationDescription.ROLE_FILTER,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.filter.focusRoleFilters();
            }),
          },
        },
        {
          key: "C-w",
          action: {
            description: NavigationDescription.MESSAGES_FILTER,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.filter.focusMessageFilters();
            }),
          },
        },
        {
          key: "C-s",
          action: {
            description: NavigationDescription.MESSAGES,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.messages.focusMessagesBox();
            }),
          },
        },
        {
          key: "C-x",
          action: {
            description: NavigationDescription.CHAT,
            listener: keyActionListenerFactory(() => {
              this.collapse();
              this.chatInput.focusInputBox();
            }),
          },
        },
      ],
    });

    // Navigation
    this.controlsManager.updateNavigation(this.filter.container.id, {
      next: this.messages.container.id,
      down: this.messages.container.id,
      outEffect: this.openCloseDialog.bind(this),
    });

    this.controlsManager.updateNavigation(this.messages.container.id, {
      previous: this.filter.container.id,
      up: this.filter.container.id,
      next: this.chatInput.container.id,
      down: this.chatInput.container.id,
      outEffect: this.openCloseDialog.bind(this),
    });

    this.controlsManager.updateNavigation(this.chatInput.container.id, {
      previous: this.messages.container.id,
      up: this.messages.container.id,
      outEffect: this.openCloseDialog.bind(this),
    });

    this.chatInput.focusInputBox();
    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private collapse() {
    this.filter.collapse();
    this.closeDialog.hide();
  }

  private openCloseDialog() {
    this.closeDialog.show(this.controlsManager.focused.id);
  }
}
