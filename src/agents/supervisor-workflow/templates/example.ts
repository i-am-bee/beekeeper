import { sectionTemplate, TitleTemplateInput } from "./body.js";

export interface ExamplePartInput {
  role: string;
  content: string;
}

export interface ExampleTemplateInput {
  title: TitleTemplateInput;
  position: number;
  subtitle?: string;
  parts: ExamplePartInput[];
}

export class ExampleTemplateBuilder {
  private output: string;

  private constructor() {
    this.output = "";
  }

  static new() {
    return new ExampleTemplateBuilder();
  }

  title(input: TitleTemplateInput & { subtitle?: string; position?: number }) {
    const titleValue = `Example${input.position !== null ? `[${input.position}]` : ""}: ${input.text}${input.subtitle ? ` - ${input.subtitle}` : ""}`;
    this.output = sectionTemplate({ title: { ...input, text: titleValue } });
  }

  part(input: ExamplePartInput) {
    const { role, content } = input;
    this.output += `**${role}:**\n${content}\n`;
  }

  build() {
    return this.output;
  }
}
