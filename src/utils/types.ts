// Extract type of an array items
export type ArrayItemsType<T extends readonly unknown[]> = T[number];
