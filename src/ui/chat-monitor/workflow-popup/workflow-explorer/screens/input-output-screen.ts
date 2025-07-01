import { ParentInput, ScreenInput } from "@/ui/base/monitor.js";
import { WorkflowScreen } from "./workflow-screen.js";
import { Logger } from "beeai-framework";
import { Style, StyledTextArea } from "../components/styled-text-area.js";
import blessed from "neo-blessed";

export class InputOutputScreen extends WorkflowScreen {
  private _input?: string;
  private inputTitleElement: blessed.Widgets.TextElement;
  private inputTextArea: StyledTextArea;
  private _output?: string;
  private outputTextArea: StyledTextArea;

  constructor(arg: ParentInput | ScreenInput, logger: Logger) {
    super(arg, logger);

    this.inputTitleElement = blessed.text({
      parent: this.parent.element,
      top: 0,
      left: 0,
      width: "100%-2",
      height: 1,
      content: "Input:",  
      style: {
        fg: "white",        
        bold: true,
      },    
    });
    this.inputTextArea = new StyledTextArea(
      this.parent.element,
      Style.USER_INPUT,
    );
    this.inputTextArea.element.top = 1;
    this.inputTextArea.element.left = 0;
    this.inputTextArea.element.width = "100%-2";
    this.inputTextArea.element.height = "50%-2";

    this.outputTextArea = new StyledTextArea(
      this.parent.element,
      Style.USER_OUTPUT,
    );
    this.outputTextArea.element.top = "50%+1";
    this.outputTextArea.element.left = 0;
    this.outputTextArea.element.width = "100%-2";
    this.outputTextArea.element.height = "50%-2";

    this.render();
  }

  set input(value: string) {
    this._input = value;
    this.render();
  }

  set output(value: string) {
    this._output = value;
    this.render();
  }

  render(): void {
    if (!this._input) {
      this.inputTextArea.element.hide();
      this.inputTitleElement.hide();
    } else {
      // this.inputTextArea.element.setContent(this._input);
      this.inputTextArea.element.setText("XXX");
      this.inputTextArea.element.show();     
      this.inputTitleElement.show();
    }

    if (!this._output) {
      this.outputTextArea.element.hide();
    } else {
      // this.outputTextArea.element.setContent(this._output);
      this.inputTextArea.element.setText("YYY");
      this.outputTextArea.element.show();
    }

    this.screen.element.render();
  }

  //   get input() {
  //     return this._input;
  //   }

  //   set input(value: string) {
  //     this._input = value;
  //   }

  //   render(): string {
  //     return `Input Screen: ${this._input}`;
  //   }
}
