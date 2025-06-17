import { StringToolOutput } from "beeai-framework";
import { stringify } from "yaml";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type FormattedToolOutput<T> = StringToolOutput; // Placeholder for future output types

export function formatToolDescription<T>({
  example,
  description,
}: {
  description: string;
  example: T;
}): string {
  return `${description}\n\nOutput example:\n${stringify(example)}`;
}

export function formatToolOutput<T>(output: T): FormattedToolOutput<T> {
  return new StringToolOutput(stringify(output));
}
