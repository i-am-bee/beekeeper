export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

export function textSplitter(
  text: string,
  splitters: string[],
  backwards = false,
): string[] {
  if (splitters.length === 0) {
    return [text];
  }

  const parts: string[] = [];
  let rest = text;

  for (const splitter of splitters) {
    const idx = backwards ? rest.lastIndexOf(splitter) : rest.indexOf(splitter);

    if (idx === -1) {
      throw new Error(
        `Splitter \`${splitter}\` not found in text \`${text}\` after \`${text.substring(
          0,
          text.indexOf(rest),
        )}\``,
      );
    }

    const chunk = rest.slice(0, idx);
    if (chunk.length) {
      parts.push(chunk);
    }

    rest = rest.slice(idx + splitter.length);
  }

  if (rest.length) {
    parts.push(rest);
  }

  return parts;
}
