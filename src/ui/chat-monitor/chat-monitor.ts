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
// import { HelpBar } from "../shared/help-bar.js";
// import { ChatFilter } from "./filter/filter.js";
// import { ChatInput } from "./input/input.js";
// import { Messages } from "./messages/messages.js";

export class ChatMonitor extends ContainerComponent {
  private closeDialog: CloseDialog;
  private chatFilter: ChatFilter;
  //   private messages: Messages;
  //   private helpBar: HelpBar;
  //   private chatInput: ChatInput;

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    super(arg, logger);

    this.chatFilter = new ChatFilter(
      {
        kind: "parent",
        parent: this.screen,
        controlsManager: this.controlsManager,
      },
      logger,
    );

    // Should be last to appear on top
    this.closeDialog = new CloseDialog(this.controlsManager);
    this.setupControls();
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
              this.closeDialog.show(this.controlsManager.focused.id);
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
      ],
    });

    this.controlsManager.focus(this.chatFilter.container.id, false);
    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
