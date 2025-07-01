import { clone } from "remeda";
import { TextArea } from "./text-area.js";
import blessed from "neo-blessed";

export enum Style {
  USER_INPUT = "user-input",
  USER_OUTPUT = "user-output",
}

const styles: Record<Style, any> = {
  [Style.USER_INPUT]: {
    fg: "white",
    bg: "black",
  },
  [Style.USER_OUTPUT]: {
    fg: "green",
    bg: "red",
  },
} as const;

export class StyledTextArea extends TextArea {
  constructor(parent: blessed.Widgets.Node, style: Style) {
    super(parent, clone(styles[style] || styles[Style.USER_INPUT]));
  }
}
