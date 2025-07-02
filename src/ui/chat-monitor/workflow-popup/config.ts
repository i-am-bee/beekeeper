import { clone } from "remeda";
import * as st from "../../config.js";
import { UIColors } from "@/ui/colors.js";
import { getBorderedBoxStyle } from "../config.js";

export function getWorkflowPopupStyle(active = false) {
  return getBorderedBoxStyle(active);
}

export function getRunListStyle(active = false) {
  return getBorderedBoxStyle(active, {
    scrollbar: getRunListScrollbarStyle(),
  });
}

export function getRunListScrollbarStyle() {
  return clone(st.UIConfig.scrollbar);
}

export function getPlayPauseButtonContent(isPlay: boolean) {
  return isPlay ? "▶ Play" : "⏸ Pause";
}

export function getPlayPauseButtonStyle(isPlay: boolean, disabled: boolean) {
  return {
    align: "center" as any,
    valign: "middle" as any,
    style: {
      fg: disabled ? UIColors.gray.cool_gray : UIColors.white.white,
      bg: disabled
        ? UIColors.gray.gray
        : isPlay
          ? UIColors.blue.blue
          : UIColors.red.dark_red,
      focus: {
        bg: disabled
          ? UIColors.gray.cool_gray
          : isPlay
            ? UIColors.blue.electric_blue
            : UIColors.red.cardinal,
      },
    },
  };
}
