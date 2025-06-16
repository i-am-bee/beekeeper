import { format } from "date-fns";

export function groundInTime(prompt: string): string {
  return `Current time: ${format(new Date(), "EEEE, MMMM do, yyyy 'at' h:mm a")}!\n\n${prompt}`;
}
