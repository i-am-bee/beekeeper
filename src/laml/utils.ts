export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

export function pathStr(path: string[]) {
  return path.join(".");
}

export function unwrapString(value: string, start: string | string[]): string;
export function unwrapString(
  value: string,
  start: string | string[],
  end: string | string[],
): string;
export function unwrapString(
  value: string,
  start: string | string[],
  end?: string | string[],
) {
  const endValue = end === undefined ? start : end;

  if (
    (Array.isArray(start) ? start : [start]).some((s) => value.startsWith(s))
  ) {
    value = value.substring(1);
  }
  if (
    (Array.isArray(endValue) ? endValue : [endValue]).some((s) =>
      value.endsWith(s),
    )
  ) {
    value = value.substring(0, value.length - 1);
  }
  return value;
}
