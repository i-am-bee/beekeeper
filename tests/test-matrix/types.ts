export interface DimensionValueDescription<T = string> {
  dimension: T;
  description: string;
}

export interface DimensionValue {
  name: string;
  description?: string;
}

export interface Dimension extends DimensionValue {
  values: DimensionValue[];
}

export type DimensionValues<D extends Dimension> = D["values"][number]["name"];

export type Coord<D extends readonly Dimension[]> = D extends readonly [
  infer First,
  ...infer Rest,
] // peel off the head
  ? First extends Dimension
    ? Rest extends readonly Dimension[]
      ? // build the tuple head-first, recurse on the tail
        [DimensionValues<First>, ...Coord<Rest>]
      : never
    : never
  : [];

export interface TestCase<
  TInput = any,
  TExpected = any,
  TData extends Record<string, unknown> = Record<string, unknown>,
  TParsed = any,
> {
  name?: string;
  input: TInput;
  expected: TExpected;
  data?: TData;
  assert?: (parsed: TParsed, fullResp?: any) => void;
}

export type CellMeta<D extends readonly Dimension[]> = D extends readonly [
  infer First,
  ...infer Rest,
] // peel off the head
  ? First extends Dimension
    ? Rest extends readonly Dimension[]
      ? // build the tuple head-first, recurse on the tail
        [DimensionValueDescription<First["name"]>, ...CellMeta<Rest>]
      : never
    : never
  : [];

export interface Cell<D extends readonly Dimension[], V> {
  meta: CellMeta<D>;
  value: V;
}
