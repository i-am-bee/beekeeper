import blessed from "neo-blessed";

export class CloseDialog {
  private dialog: blessed.Widgets.BoxElement;
  private title: blessed.Widgets.TextElement;
  private message: blessed.Widgets.TextElement;
  private screen: blessed.Widgets.Screen;
  private confirmButton: blessed.Widgets.ButtonElement;
  private cancelButton: blessed.Widgets.ButtonElement;
  private isVisible = false;
  private onConfirm: () => void;
  private onCancel: () => void;

  constructor(screen: blessed.Widgets.Screen) {
    this.screen = screen;
    this.onConfirm = () => process.exit(0); // Default action
    this.onCancel = () => {
      this.hide();
    }; // Default action

    // Create dialog box
    this.dialog = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 50,
      height: 10,
      tags: true,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: "red",
        },
        bg: "black",
      },
      hidden: true, // Initially hidden
    });

    // Dialog title
    this.title = blessed.text({
      parent: this.dialog,
      top: 1,
      left: "center",
      content: "Confirm Exit",
      style: {
        bold: true,
        fg: "white",
      },
    });

    // Dialog message
    this.message = blessed.text({
      parent: this.dialog,
      top: 3,
      left: "center",
      content: "Are you sure you want to exit?",
      style: {
        fg: "white",
      },
    });

    // Confirm button
    this.confirmButton = blessed.button({
      parent: this.dialog,
      top: 6,
      left: "25%-8",
      width: 10,
      height: 1,
      content: "Yes",
      style: {
        bg: "red",
        fg: "white",
        focus: {
          bg: "brightRed",
        },
        hover: {
          bg: "brightRed",
        },
      },
      tags: true,
      mouse: true,
    });

    // Cancel button
    this.cancelButton = blessed.button({
      parent: this.dialog,
      top: 6,
      left: "75%-8",
      width: 10,
      height: 1,
      content: "No",
      style: {
        bg: "blue",
        fg: "white",
        focus: {
          bg: "brightBlue",
        },
        hover: {
          bg: "brightBlue",
        },
      },
      tags: true,
      mouse: true,
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Confirm button handler
    this.confirmButton.on("press", () => {
      this.onConfirm();
    });

    // Cancel button handler
    this.cancelButton.on("press", () => {
      this.onCancel();
    });

    // Handle Escape key to cancel
    this.dialog.key(["escape"], () => {
      this.onCancel();
    });

    // Handle Enter key on focused button
    this.dialog.key(["enter"], () => {
      const focused = this.screen.focused;
      if (focused === this.confirmButton) {
        this.onConfirm();
      } else if (focused === this.cancelButton) {
        this.onCancel();
      }
    });

    // Handle Tab key for navigation between buttons
    this.dialog.key(["tab"], () => {
      const focused = this.screen.focused;
      if (focused === this.confirmButton) {
        this.cancelButton.focus();
      } else {
        this.confirmButton.focus();
      }
    });
  }

  /**
   * Show the dialog
   */
  public show(
    options: {
      onConfirm?: () => void;
      onCancel?: () => void;
      message?: string;
      title?: string;
    } = {},
  ): void {
    // Update handlers if provided
    if (options.onConfirm) {
      this.onConfirm = options.onConfirm;
    } else {
      this.onConfirm = () => process.exit(0);
    }

    if (options.onCancel) {
      this.onCancel = options.onCancel;
    } else {
      this.onCancel = () => this.hide();
    }

    // Update message and title if provided
    if (options.message) {
      this.message.setContent(options.message);
    }

    if (options.title) {
      this.title.setContent(options.title);
    }

    // Show dialog and focus on cancel button by default (safer option)
    this.dialog.show();
    this.cancelButton.focus();
    this.isVisible = true;
    this.screen.render();
  }

  /**
   * Hide the dialog
   */
  public hide(): void {
    this.dialog.hide();
    this.isVisible = false;
    this.screen.render();
  }

  /**
   * Check if the dialog is currently visible
   */
  public isOpen(): boolean {
    return this.isVisible;
  }
}
