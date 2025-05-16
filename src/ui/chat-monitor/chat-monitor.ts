import { Logger } from "beeai-framework";
import { BaseMonitor, ParentInput, ScreenInput } from "../base/monitor.js";
import { NavigationDescription } from "../controls/navigation.js";
import { CloseDialog } from "../shared/close-dialog.js";
import { keyActionListenerFactory } from "../controls/key-bindings.js";
// import { HelpBar } from "../shared/help-bar.js";
// import { ChatFilter } from "./filter/filter.js";
// import { ChatInput } from "./input/input.js";
// import { Messages } from "./messages/messages.js";

export class ChatMonitor extends BaseMonitor {
  private closeDialog: CloseDialog;
  //   private chatFilter: ChatFilter;
  //   private messages: Messages;
  //   private helpBar: HelpBar;
  //   private chatInput: ChatInput;

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    super(arg, logger);

    this.closeDialog = new CloseDialog(this.controlsManager);
    this.setupControls();
  }

  private setupControls(shouldRender = true) {
    // Navigation
    // this.controlsManager.updateNavigation(this.controlsManager.screen.id, {
    //   in: this.chatBox.id,
    // });

    // this.controlsManager.focus(this.chatBox.id, false);

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
      ],
    });

    this.controlsManager.focus(this.screen.id, false);
    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
