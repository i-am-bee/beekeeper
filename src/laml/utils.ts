import { LAMLObject } from "./dto.js";
import { DEFAULT_INDENT } from "./protocol.js";

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

export function pathStr(path: string[]) {
  return path.join(".");
}

export function unwrapString(
  value: string,
  options: {
    start?: string | string[];
    end?: string | string[];
    greedy?: boolean;
  },
) {
  const { start, end, greedy } = options;
  const endValue = end === undefined ? start : end;

  if (start != null) {
    while (
      (Array.isArray(start) ? start : [start]).some((s) => value.startsWith(s))
    ) {
      value = value.substring(1);

      if (!greedy) {
        break;
      }
    }
  }

  if (endValue != null) {
    while (
      (Array.isArray(endValue) ? endValue : [endValue]).some((s) =>
        value.endsWith(s),
      )
    ) {
      value = value.substring(0, value.length - 1);
      if (!greedy) {
        break;
      }
    }
  }
  return value;
}

export function printLAMLObject(
  obj: LAMLObject,
  indent = DEFAULT_INDENT,
  depth = 0,
) {
  let output = "";
  for (const attr in obj) {
    const val = obj[attr];
    const valToPrint = Array.isArray(val)
      ? ` ${val.join(", ")}`
      : typeof val === "object"
        ? `\n${printLAMLObject(val as LAMLObject, indent, depth + 1)}`
        : ` ${val}\n`;
    output += `${indent.repeat(depth)}${attr}:${valToPrint}`;
  }

  if (depth === 0) {
    output = unwrapString(output, { end: ["\n"] });
  }

  return output;
}
