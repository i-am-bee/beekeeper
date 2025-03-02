import { DateString } from "@/base/dto.js";

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export const sortByDateString =
  (direction: "asc" | "desc" = "asc") =>
  (a: DateString, b: DateString) =>
    (direction === "asc" ? 1 : -1) *
    (new Date(a).getTime() - new Date(b).getTime());

export const sortByObjectDateStringProperty =
  <T extends Record<string, any>>(
    property: keyof T,
    direction: "asc" | "desc" = "asc",
  ) =>
  (a: T, b: T) => {
    const dateComparer = sortByDateString(direction);
    return dateComparer(a[property] as DateString, b[property] as DateString);
  };
