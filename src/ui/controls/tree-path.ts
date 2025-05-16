export const PATH_DELIMITER = ":";

export interface PathStep<T = string> {
  el: T;
  direction: "UP" | "DOWN";
}

export function addToPathString(add: string, path?: string) {
  return `${path ? `${path}${PATH_DELIMITER}` : ""}${add}`;
}

export function toPathString(path: string[]) {
  return path.join(PATH_DELIMITER);
}

export function toPath(path: string) {
  return path.split(PATH_DELIMITER);
}

export function findPath<T = string>(
  from: string | undefined,
  to: string,
  mapper: (el: string) => T,
): PathStep<T>[] {
  const mapElements = (
    elements: string[],
    direction: "UP" | "DOWN",
    slice?: { start: number; end?: number },
  ) => {
    const start = slice ? slice.start : 0;
    const sliced = slice ? elements.slice(slice.start, slice.end) : elements;
    const _elements = direction === "UP" ? sliced.toReversed() : sliced;
    const _pathElements = elements;

    return _elements.map((_, index) => {
      let _end;
      if (direction === "UP") {
        _end = -(index + 1);
      } else {
        _end = start + index + 1;
      }
      const path = _pathElements.slice(0, _end);

      return {
        direction,
        el: mapper(toPathString(path)),
      } as const;
    });
  };

  const toElements = toPath(to);
  if (!from) {
    return mapElements(toElements, "DOWN");
  }

  const fromElements = toPath(from);

  const commonNodes = [];
  let i = 0;
  while (
    i < fromElements.length &&
    i < toElements.length &&
    fromElements[i] === toElements[i]
  ) {
    commonNodes.push(fromElements[i]);
    i++;
  }

  const lastCommonNode = commonNodes.length ? commonNodes.at(-1) : undefined;

  // Different tree
  if (!lastCommonNode) {
    throw new Error(
      `There is no path between these two elements \`${from}\` and \`${to}\``,
    );
  }

  const fromIsParent = commonNodes.length === fromElements.length;
  const toIsParent = commonNodes.length === toElements.length;
  // Same branch
  if (fromIsParent || toIsParent) {
    if (fromIsParent && toIsParent) {
      // Path to itself
      // return [{ direction: "DOWN", el: mapper(lastCommonNode) }];
      return mapElements([lastCommonNode], "DOWN");
    }

    if (fromIsParent) {
      const start = commonNodes.length;
      const end = toElements.length;
      return mapElements(toElements, "DOWN", { start, end });
    }

    if (toIsParent) {
      const start = commonNodes.length;
      const end = fromElements.length;
      // const sliced = fromElements.slice().reverse().slice(start, end);
      // return sliced.map((el) => ({ direction: "UP", el: mapper(el) }) as const);

      return mapElements(fromElements, "UP", {
        start,
        end,
      });
    }
  }

  // Different branches
  let start = commonNodes.length - 1;
  // let sliced = fromElements.slice(start, -1).reverse();
  // const upPath = sliced.map(
  //   (el) => ({ direction: "UP", el: mapper(el) }) as const,
  // );
  const upPath = mapElements(fromElements, "UP", {
    start,
    end: -1,
  });

  start = commonNodes.length;
  // sliced = toElements.slice(start);
  // const downPath = sliced.map(
  //   (el) => ({ direction: "DOWN", el: mapper(el) }) as const,
  // );
  const downPath = mapElements(toElements, "DOWN", {
    start,
  });

  return [...upPath, ...downPath] as const;
}
