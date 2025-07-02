export function getArrayOnPath(
  path: (string | number)[],
  readState: () => any,
): any[] {
  const result = path.reduce((current, key) => current?.[key], readState());
  if (!Array.isArray(result)) {
    throw new Error(`Value on path ${path.join(".")} is not an array`);
  }
  return result;
}

export function getValueOnPath(
  path: (string | number)[],
  readState: () => any,
): any {
  const result = path.reduce((current, key) => current?.[key], readState());
  return result;
}

export function stringifyPath(path: (string | number)[]): string {
  return path
    .map((part) => (typeof part === "string" ? part : `[${part}]`))
    .join(".")
    .replaceAll(".[", "[");
}
