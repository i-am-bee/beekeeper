export class Fixtures<T extends string, U> {
  private readonly entries: Map<T, U>;

  constructor(entries: [T, U][]) {
    this.entries = new Map(entries);
  }

  get<Name extends T>(name: Name): U {
    const entry = this.entries.get(name);
    if (!entry) {
      throw new Error(`No entry found for name: ${name}`);
    }
    return entry;
  }

  at(index: number): U {
    const entry = Array.from(this.entries.values())[index];
    if (!entry) {
      throw new Error(`No entry found at index: ${index}`);
    }
    return entry;
  }

  get values(): U[] {
    return Array.from(this.entries.values()).map((entry) => entry);
  }
}

export function createFixtures<U, T extends string = string>(
  entries: U[],
  getName: (entry: U) => T,
) {
  return new Fixtures<T, U>(
    entries.map((entry) => [getName(entry), entry] as [T, U]),
  );
}

export type FixtureName<T> = T extends Fixtures<infer Name, any> ? Name : never;
