export interface TimeNode {
  type: "time";
  hour: number;
  minute?: number;
  second?: number;
}

export function timeFormats(node: TimeNode) {
  const h = node.hour;
  const m = node.minute;
  const s = node.second;

  const hStrs = [h.toString(), h.toString().padStart(2, "0")];

  const mStr = m?.toString().padStart(2, "0");
  const sStr = s?.toString().padStart(2, "0");

  // 24h formats
  const time24 = m
    ? s
      ? hStrs.map((hh) => `${hh}:${mStr}:${sStr}`)
      : hStrs.map((hh) => `${hh}:${mStr}`)
    : hStrs.map((hh) => `${hh}`);

  // 12h AM/PM formats if hour < 13
  const is12h = h < 13;
  const time12 = is12h
    ? hStrs.flatMap((hh) => {
        const base = m
          ? s
            ? `${hh}:${mStr}:${sStr}`
            : `${hh}:${mStr}`
          : `${hh}`;
        return [`${base} am`, `${base} pm`, `${base} AM`, `${base} PM`];
      })
    : [];

  const allTimes = [...time24, ...time12];
  return allTimes;
}
