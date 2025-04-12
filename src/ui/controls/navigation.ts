export enum NavigationDirection {
  NEXT = "next",
  PREVIOUS = "previous",
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  IN = "in",
  OUT = "out",
}

export type NavigationMap<T> = Partial<Record<NavigationDirection, T>>;
export type NavigationTransitions = NavigationMap<string>;
