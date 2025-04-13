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

export type Effect = () => void;

export interface NavigationTransitions {
  next?: string;
  nextEffect?: Effect;
  previous?: string;
  previousEffect?: Effect;
  up?: string;
  upEffect?: Effect;
  down?: string;
  downEffect?: Effect;
  left?: string;
  leftEffect?: Effect;
  right?: string;
  rightEffect?: Effect;
  in?: string;
  inEffect?: Effect;
  out?: string;
  outEffect?: Effect;
}
