import { unwrapString } from "@/laml/index.js";
import { updateDeepPartialObject } from "@/utils/objects.js";

const TITLE_SIGN = "#";
const SECTION_DELIMITER = "---";

export interface TitleTemplateInput {
  text: string;
  level: number;
}

export function titleTemplate(input: TitleTemplateInput) {
  return `${TITLE_SIGN.repeat(input.level)} ${input.text}`;
}

export interface SectionTemplateInput {
  title?: TitleTemplateInput;
  content?: string;
  delimiter?: {
    start?: boolean;
    end?: boolean;
  };
  newLines?: {
    contentStart?: number;
    contentEnd?: number;
    start?: number;
    end?: number;
  };
}

export function sectionTemplate(input: SectionTemplateInput) {
  const { title, content, delimiter } = input;

  const newLines = {
    start: 0,
    contentStart: 0,
    contentEnd: 1,
    end: 0,
  } satisfies (typeof input)["newLines"];

  const updateNewLines = (content: string, repeats: number) => {
    if (repeats >= 0) {
      return `${content}${`\n`.repeat(repeats)}`;
    } else {
      return unwrapString(content, { end: ["\n"] });
    }
  };

  if (input.newLines) {
    updateDeepPartialObject(newLines, input.newLines);
  }

  let output = "";
  if (delimiter?.start) {
    output += SECTION_DELIMITER + `\n`;
  }
  if (newLines.start != null) {
    output = updateNewLines(output, newLines.start);
  }
  if (title) {
    output += titleTemplate(title) + `\n`;
  }
  if (newLines.contentStart != null) {
    output = updateNewLines(output, newLines.contentStart);
  }
  if (content) {
    output += content + `\n`;
  }
  if (newLines.contentEnd != null) {
    output = updateNewLines(output, newLines.contentEnd);
  }
  if (delimiter?.end) {
    output += SECTION_DELIMITER;
  }
  if (newLines.end != null) {
    output = updateNewLines(output, newLines.end);
  }

  return output;
}

export class BodyTemplateBuilder {
  private output: string;

  private constructor() {
    this.output = "";
  }

  static new() {
    return new BodyTemplateBuilder();
  }

  introduction(text: string) {
    this.output += text + "\n\n";
    return this;
  }

  section(input: SectionTemplateInput) {
    this.output += sectionTemplate(input);
    return this;
  }

  callToAction(text: string) {
    this.output += `\n\n${text}:`;
    return this;
  }

  build() {
    return this.output;
  }
}
