import * as st from "../config.js";

export interface LogFormatterOptions {
  // Maximum depth to display nested objects
  maxDepth: number;
  // Maximum string length for values
  maxValueLength: number;
  // Maximum items to show in arrays
  maxArrayItems: number;
  // Indentation spaces for nested levels
  indentSize: number;
  // Show types of values (number, string, etc.)
  showTypes: boolean;
}

export class LogFormatter {
  private options: LogFormatterOptions;

  constructor(options?: Partial<LogFormatterOptions>) {
    this.options = {
      maxDepth: options?.maxDepth ?? 6,
      maxValueLength: options?.maxValueLength ?? 100,
      maxArrayItems: options?.maxArrayItems ?? 5,
      indentSize: options?.indentSize ?? 2,
      showTypes: options?.showTypes ?? false,
    };
  }

  /**
   * Format a log line that might be JSON or a simple string
   */
  public format(line: string): string {
    // Try to parse as JSON
    try {
      // Check if the line looks like JSON
      if (
        (line.startsWith("{") && line.endsWith("}")) ||
        (line.startsWith("[") && line.endsWith("]"))
      ) {
        const jsonData = JSON.parse(line);
        // Format the JSON with our custom formatter
        return this.formatJson(jsonData, 0);
      }
    } catch (e) {
      // Not valid JSON, continue with regular formatting
      console.error(e);
    }

    // Format as a regular string
    return this.formatPlainText(line);
  }

  /**
   * Format a plain text string
   */
  private formatPlainText(text: string): string {
    // Apply simple formatting to plain text
    return st.output(text);
  }

  /**
   * Format a JSON object with proper indentation and styling
   */
  private formatJson(value: any, depth = 0): string {
    if (depth > this.options.maxDepth) {
      return st.label("[Max Depth]");
    }

    if (value === null) {
      return st.label("null");
    }

    if (value === undefined) {
      return st.label("undefined");
    }

    const type = typeof value;

    // Format based on type
    if (type === "string") {
      const displayValue =
        value.length > this.options.maxValueLength
          ? value.substring(0, this.options.maxValueLength) + "..."
          : value;
      return this.formatString(displayValue);
    }

    if (type === "number") {
      return st.num(value);
    }

    if (type === "boolean") {
      return st.bool(value);
    }

    if (Array.isArray(value)) {
      return this.formatArray(value, depth);
    }

    if (type === "object") {
      return this.formatObject(value, depth);
    }

    // Fallback for any other types
    return st.label(String(value));
  }

  /**
   * Format a string value with quote indicators
   */
  private formatString(value: string): string {
    // Check if this is a date string
    if (isDateString(value)) {
      return st.timestamp(new Date(value));
    }

    // Try to parse color codes, errors, etc.
    if (value.toLowerCase().includes("error")) {
      return st.error(value);
    }

    // Default string formatting
    return st.output(value);
  }

  /**
   * Format an array with limits on number of items shown
   */
  private formatArray(arr: any[], depth: number): string {
    if (arr.length === 0) {
      return st.label("[]");
    }

    const indent = " ".repeat((depth + 1) * this.options.indentSize);
    const closingIndent = " ".repeat(depth * this.options.indentSize);

    let output = st.label("[") + "\n";

    // Limit number of items shown
    const itemsToShow = Math.min(arr.length, this.options.maxArrayItems);

    for (let i = 0; i < itemsToShow; i++) {
      output += indent + this.formatJson(arr[i], depth + 1);
      if (i < itemsToShow - 1) {
        output += st.label(",");
      }
      output += "\n";
    }

    if (arr.length > this.options.maxArrayItems) {
      output +=
        indent +
        st.label(`... ${arr.length - this.options.maxArrayItems} more items`) +
        "\n";
    }

    output += closingIndent + st.label("]");
    return output;
  }

  /**
   * Format an object with indentation
   */
  private formatObject(obj: Record<string, any>, depth: number): string {
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return st.label("{}");
    }

    const indent = " ".repeat((depth + 1) * this.options.indentSize);
    const closingIndent = " ".repeat(depth * this.options.indentSize);

    let output = st.label("{") + "\n";

    // Sort keys for consistent output
    keys.sort().forEach((key, index) => {
      const value = obj[key];

      const keyFormatted = this.formatKey(key);
      const valueFormatted = this.formatJson(value, depth + 1);

      output += indent + keyFormatted + ": " + valueFormatted;

      if (index < keys.length - 1) {
        output += st.label(",");
      }

      output += "\n";
    });

    output += closingIndent + st.label("}");
    return output;
  }

  /**
   * Format an object key with styling
   */
  private formatKey(key: string): string {
    // Apply special formatting to common keys
    if (key === "id" || key.endsWith("Id") || key.endsWith("ID")) {
      return st.label(key);
    }

    if (key === "error" || key === "errors" || key.includes("Error")) {
      return st.error(key);
    }

    if (
      key === "timestamp" ||
      key === "date" ||
      key === "createdAt" ||
      key === "updatedAt"
    ) {
      return st.label(key);
    }

    // Default key formatting
    return st.label(key);
  }
}

/**
 * Check if a string appears to be an ISO date
 */
function isDateString(str: string): boolean {
  // Simple check for ISO date format (YYYY-MM-DD or with time)
  return /^\d{4}-\d{2}-\d{2}(T|\s)/.test(str) && !isNaN(Date.parse(str));
}

/**
 * Helper function for quick formatting
 */
export function formatLogLine(
  line: string,
  options?: LogFormatterOptions,
): string {
  const formatter = new LogFormatter(options);
  return formatter.format(line);
}
