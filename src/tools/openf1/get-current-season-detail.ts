import { Tool, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import {
  FormattedToolOutput,
  formatToolDescription,
  formatToolOutput,
} from "../helpers/tool-format.js";
import * as dto from "./dto.js";
import { OpenF1Service } from "./service.js";

export type OutputObject = dto.SeasonDetail;
export type GetCurrentSeasonDetailToolOutput =
  FormattedToolOutput<OutputObject>;

const example = {
  season_id: 0,
  year: 2023,
  state: "completed",
  grands_prix: [
    {
      grand_prix_id: 1219,
      name: "Singapore Grand Prix",
      date: new Date("2023-09-15T09:30:00Z"),
    },
    {
      grand_prix_id: 1141,
      name: "Bahrain Grand Prix",
      date: new Date("2023-03-05T13:00:00Z"),
    },
  ],
} satisfies OutputObject;

export class GetCurrentSeasonDetailTool extends Tool<GetCurrentSeasonDetailToolOutput> {
  name = "f1_get_current_season_detail";
  description = formatToolDescription<OutputObject>({
    description:
      "Provides detailed information about current F1 season, including the list of Grands Prix, their dates, and locations.",
    example,
  });

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    GetCurrentSeasonDetailToolOutput
  > = Emitter.root.child({
    namespace: ["tool", "f1_get_current_season_detail"],
    creator: this,
  });

  inputSchema() {
    return {};
  }

  protected async _run() {
    const output = await OpenF1Service.getInstance().getSeasonDetail(
      new Date().getFullYear(),
    );

    return formatToolOutput<OutputObject>(output);
  }
}
