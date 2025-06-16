import { LAMLObject, LAMLPrimitiveValue, ListFieldType } from "./dto.js";
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

export type UnwrapEnvelope = [string, string];

export function unwrapString(
  value: string,
  options: {
    envelops?: UnwrapEnvelope[];
    start?: string | string[];
    end?: string | string[];
    greedy?: boolean;
  },
) {
  const { envelops, start, end, greedy } = options;

  if (envelops) {
    do {
      const found = envelops.find(
        ([s, e]) => value.startsWith(s) && value.endsWith(e),
      );
      if (!found) {
        break;
      }
      const [s, e] = found;
      value = value.substring(s.length);
      if (value.length > 1) {
        value = value.substring(0, value.length - e.length);
      }

      if (!greedy) {
        break;
      }
      // eslint-disable-next-line no-constant-condition
    } while (1 == 1);
  }

  if (start != null) {
    const _starts = Array.isArray(start) ? start : [start];
    do {
      const found = _starts.find((s) => value.startsWith(s));
      if (!found) {
        break;
      }
      value = value.substring(found.length);

      if (!greedy) {
        break;
      }
      // eslint-disable-next-line no-constant-condition
    } while (1 == 1);
  }

  if (end != null) {
    const _ends = Array.isArray(end) ? end : [end];
    do {
      const found = _ends.find((e) => value.endsWith(e));
      if (!found) {
        break;
      }
      value = value.substring(0, value.length - 1);

      if (!greedy) {
        break;
      }
      // eslint-disable-next-line no-constant-condition
    } while (1 == 1);
    // while (
    //   (Array.isArray(endValue) ? endValue : [endValue]).some((s) =>
    //     value.endsWith(s),
    //   )
    // ) {
    //   value = value.substring(0, value.length - 1);
    //   if (!greedy) {
    //     break;
    //   }
    // }
  }
  return value;
}

export type LAMLPrimitiveValueFormatterFn = (
  val: LAMLPrimitiveValue,
  indentValue: string,
) => string;

export interface LAMLPrimitiveValueFormatter {
  path: string[];
  fn: LAMLPrimitiveValueFormatterFn;
}

export const listFormatter = (type: ListFieldType) =>
  ((val: LAMLPrimitiveValue, indent: string = DEFAULT_INDENT) =>
    (val as string[])
      .map((v, index) => {
        let bullet;
        switch (type) {
          case "numbered":
            bullet = `${indent}${index + 1}.`;
            break;
          case "bullets":
            bullet = `-`;
            break;
        }
        return `${index === 0 ? "\n" : ""}${bullet} ${v}`;
      })
      .join("\n")) satisfies LAMLPrimitiveValueFormatterFn;

export function printLAMLObject(
  obj: LAMLObject,
  options?: {
    indent?: string;
    depth?: number;
    formatters?: LAMLPrimitiveValueFormatter[];
  },
  path?: string[],
) {
  const _path = path ?? [];
  const _formatters = options?.formatters ?? [];
  const depth = options?.depth ?? 0;
  const indent = options?.indent ?? DEFAULT_INDENT;
  const indentValue = indent.repeat(depth);
  let output = "";
  for (const attr in obj) {
    let val = obj[attr];
    const attrPath = _path.concat(attr);
    const attrPathStr = pathStr(attrPath);

    const attrFormatters = _formatters
      .filter((v) => pathStr(v.path) === attrPathStr)
      .map(({ fn }) => fn);
    if (attrFormatters.length > 1) {
      throw new Error(
        `\`${attrPathStr}\` has registered multiple formatters, but can have just one`,
      );
    }
    const attrFormatter = attrFormatters.length ? attrFormatters[0] : undefined;

    let valToPrint;
    if (Array.isArray(val)) {
      valToPrint = `${attrFormatter ? attrFormatter(val, indent.repeat(depth + 1)) : ` ${val.join(", ")}`}\n`;
    } else if (typeof val === "object") {
      valToPrint = `\n${printLAMLObject(val as LAMLObject, { indent, depth: depth + 1, formatters: options?.formatters }, (_path || []).concat(attr))}`;
    } else {
      val = attrFormatter ? attrFormatter(val, indentValue) : val;
      valToPrint = ` ${val}\n`;
    }

    output += `${indentValue}${attr}:${valToPrint}`;
  }

  if (depth === 0) {
    output = unwrapString(output, { end: ["\n"] });
  }

  return output;
}

/**
 * Get the split by the most success delimiter (with most items)
 *
 * @param value
 * @param delimiters
 * @returns
 */
export function splitArrayString(value: string, delimiters = [",", "\n", ";"]) {
  const splits = delimiters
    .map((d) => [d, value.split(d)])
    .sort((a, b) => b[1].length - a[1].length);
  return splits[0];
}
