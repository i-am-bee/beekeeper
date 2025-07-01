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

export const NavigationDescription = {
  EXIT_APP: "Exit app",
  CANCEL: "Cancel",
  HIDE: "Hide",
  IN_OUT: "Navigate in/out",
  OUT: "Navigate out",
  LEFT_RIGHT: "Navigate left/right",
  TOGGLE_AUTO_POPUP: "Toggle auto popup",
  UP_DOWN: "Navigate up/down",
  NEXT_PREV: "Navigate next/prev",
  SELECT_CONTAINER: "Select container",
  SELECT_COLUMN: "Select left/right column",
  SELECT_INPUT: "Select input",
  ESCAPE_INPUT_MODE: "Escape input mode",
  ENTER_INPUT_MODE: "Enter input mode",
  MOVE_LEFT_RIGHT: "Move left/right",
  MOVE_UP_DOWN: "Move up/down",
  MOVE_UP_DOWN_PAGE: "Move up/down one page",
  MOVE_START_END: "Move to start/end",
  MOVE_PREV_NEXT_WORD: "Move to prev/next word",
  MOVE_START_END_LINE: "Move to line start/end",
  HIGHLIGHT_NEXT_PREV: "Highlight next/prev message",
  COPY_MESSAGE: "Copy highlighted message",
  MESSAGES_FILTER: "Messages filter",
  ROLE_FILTER: "Roles filter",
  MESSAGES: "Messages",
  CHAT: "Chat",
  SEND_MESSAGE: "Send message",
} as const;
