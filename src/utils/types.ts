// Extract type of an array items
export type ArrayItemsType<T extends readonly unknown[]> = T[number];

export type DeepPartial<T> = T extends object // only dive in if it’s an object/array/function
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
