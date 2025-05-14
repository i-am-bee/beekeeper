import { Cell, Coord, Dimension } from "./types.js";

export class TestMatrix<D extends Dimension[], V = string> {
  protected grid = new Map<string, Cell<D, V[]>>();
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
  }

  add(coord: Coord<D>, value: Cell<D, V[]>) {
    const k = this.toKey(coord);
    this.grid.set(k, value);
  }

  get(coord: Coord<D>) {
    const k = this.toKey(coord);
    return this.grid.get(k);
  }

  walk(cb: (coord: Coord<D>, value: Cell<D, V[]>) => void) {
    this.allCoordinates.forEach((coord) => cb(coord, this.get(coord)!));
  }

  protected toKey(coord: Coord<D>) {
    return coord.map((d) => `[${d}]`).join("");
  }
}
