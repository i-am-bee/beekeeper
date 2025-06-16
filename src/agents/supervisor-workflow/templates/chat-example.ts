import {
  ExampleTemplateInput,
  ExamplePartInput,
  ExampleTemplateBuilder,
} from "./example.js";
import { sectionTemplate } from "./body.js";

export interface ChatExampleTemplateInput
  extends Omit<ExampleTemplateInput, "parts"> {
  context?: string;
  messages: ExamplePartInput[];
}

export class ChatExampleTemplateBuilder {
  private builder: ExampleTemplateBuilder;

  private constructor() {
    this.builder = ExampleTemplateBuilder.new();
  }

  static new() {
    return new ChatExampleTemplateBuilder();
  }

  title(...args: Parameters<(typeof this.builder)["title"]>) {
    this.builder.title(...args);
    return this;
  }

  context(content: string) {
    this.builder.part({
      role: "Context",
      content: sectionTemplate({
        content: content,
        delimiter: { start: true, end: true },
        newLines: {
          start: 0,
          contentEnd: 0,
          end: 0,
        },
      }),
    });
    return this;
  }

  user(content: string) {
    this.builder.part({
      role: "User",
      content,
    });
    return this;
  }

  assistant(content: string) {
    this.builder.part({
      role: "Assistant",
      content,
    });
    return this;
  }

  build() {
    return this.builder.build();
  }
}
