export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

export function textSplitter(text: string, splitters: string[]): string[] {
  if (!splitters.length) {
    return [text];
  }

  let rest = text;
  const result: string[] = [];
  do {
    const splitter = splitters.shift();
    const idx = rest.indexOf(splitter!);
    if (idx === -1) {
      throw new Error(
        `Splitter \`${splitter}\` not found in text \`${text}\` after \`${text.substring(0, text.indexOf(rest))}\``,
      );
    }
    const part = rest.slice(0, idx);
    result.push(part);
    rest = rest.slice(idx + splitter!.length);
  } while (rest.length);

  return result;
}
