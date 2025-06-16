type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Recursively updates original object with values from update object
 * @param original The original object to update
 * @param update Partial object containing updates
 * @returns The updated original object
 */
export function updateDeepPartialObject<T extends object>(
  original: T,
  update?: DeepPartial<T>,
): T {
  if (!update) {
    return original;
  }

  const keys = Object.keys(update) as (keyof T)[];

  for (const key of keys) {
    const updateValue = update[key];

    // Special case for Date objects
    if (updateValue instanceof Date) {
      original[key] = updateValue as T[keyof T];
    }
    // Handle nested objects recursively
    else if (
      updateValue !== null &&
      typeof updateValue === "object" &&
      !Array.isArray(updateValue) &&
      typeof original[key] === "object" &&
      !(original[key] instanceof Date) // Don't treat Date as a regular object
    ) {
      original[key] = {
        ...(original[key] as object),
        ...updateDeepPartialObject(
          original[key] as object,
          updateValue as DeepPartial<T[keyof T]>,
        ),
      } as T[keyof T];
    } else {
      original[key] = updateValue as T[keyof T];
    }
  }

  return original;
}
