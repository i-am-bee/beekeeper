import blessed from "neo-blessed";

// Define update types as const to ensure type safety
export enum PhaseType {
  WORKFLOW_INPUT = "workflow_input",
  REQUEST_HANDLER = "request_handler",
  PROBLEM_DECOMPOSER = "problem_decomposer",
  TASK_STEP = "task_step",
  WORKFLOW_OUTPUT = "workflow_output",
}

const PhasesOrder = [
  PhaseType.WORKFLOW_INPUT,
  PhaseType.REQUEST_HANDLER,
  PhaseType.PROBLEM_DECOMPOSER,
  PhaseType.TASK_STEP,
  PhaseType.WORKFLOW_OUTPUT,
];

export interface PhasesItem {
  type: PhaseType;
  index?: number;
  label: string;
}

export interface PhasesInput {
  items: PhasesItem[];
  selectedType: PhaseType;
}

export class Phases {
  private _element: blessed.Widgets.TextElement;

  get element() {
    return this._element;
  }

  constructor(parent: blessed.Widgets.Node) {
    this._element = blessed.text({
      parent,
      top: 0,
      focusable: false,
      keys: false,
      mouse: false,
      tags: true,
      hidden: true, // Initially hidden
      style: {
        // bold: true,
        fg: "white",
      },
    });
  }

  render(input: PhasesInput) {
    const selectedIndex = PhasesOrder.indexOf(input.selectedType);
    if (selectedIndex === -1) {
      throw new Error(`Invalid selectedType: ${input.selectedType}`);
    }
    const items = input.items.map((item, index) => {
      const isSelected = index === selectedIndex;
      const label = isSelected
        ? `{white-fg}{green-bg} ${item.label} {/green-bg}{/white-fg}`
        : item.label;
      return label;
    });

    this._element.setContent(`${items.join(" ➜ ")}`);
    this._element.screen.render();
  }
}
