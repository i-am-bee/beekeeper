export interface TestMatrixCase<
  TInput = any,
  TExpected = any,
  TMeta extends Record<string, unknown> = Record<string, unknown>,
  TParsed = any,
> {
  name?: string;
  input: TInput;
  expected: TExpected;
  meta?: TMeta;
  assert?: (parsed: TParsed, fullResp?: any) => void;
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

export class Matrix<D extends Dimension[], V = string> {
  protected grid = new Map<string, V[]>();
  protected allCoordinates: Coord<D>[] = [];

  constructor(protected readonly dimensions: D) {
    this.allCoordinates = dimensions.reduce<Coord<D>[]>((prev, curr) => {
      if (prev.length === 0) {
        return curr.values.map((v) => v.name);
      }
      return prev
        .map((p) => curr.values.map((v) => [p, v.name].flat()))
        .flat() as any;
    }, []);

    this.allCoordinates.forEach(this.initCell.bind(this));
  }

  add(coord: Coord<D>, value: V) {
    const k = this.toKey(coord);
    this.grid.get(k)?.push(value);
  }

  protected initCell(coord: Coord<D>) {
    const k = this.toKey(coord);
    this.grid.set(k, []);
  }

  get(coord: Coord<D>) {
    const k = this.toKey(coord);
    return this.grid.get(k);
  }

  walk(cb: (coord: Coord<D>, value: V[]) => void) {
    this.allCoordinates.forEach((coord) => cb(coord, this.get(coord)!));
  }

  protected toKey(coord: Coord<D>) {
    return coord.map((d) => `[${d}]`).join("");
  }
}
