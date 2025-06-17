import { Tool, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";
import {
  FormattedToolOutput,
  formatToolDescription,
  formatToolOutput,
} from "../helpers/tool-format.js";
import { F1_AVAILABLE_FIRST_SEASON_YEAR } from "./client.js";
import { SeasonDetail } from "./dto.js";
import { OpenF1Service } from "./service.js";

export type OutputObject = SeasonDetail;
export type GetSeasonDetailToolOutput = FormattedToolOutput<OutputObject>;

const example = {
  season_id: 123,
  year: 2023,
  state: "completed",
  grands_prix: [
    {
      grand_prix_id: 1219,
      name: "Singapore Grand Prix",
      date: new Date("2023-09-15T09:30:00Z"),
    },
  ],
} satisfies OutputObject;

export class GetSeasonDetailTool extends Tool<GetSeasonDetailToolOutput> {
  name = "f1_get_season_detail";
  description = formatToolDescription<OutputObject>({
    description: `Provides detailed information about a specific F1 season, including the list of Grands Prix, their dates, and locations.`,
    example,
  });

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    GetSeasonDetailToolOutput
  > = Emitter.root.child({
    namespace: ["tool", "f1_get_season_detail"],
    creator: this,
  });

  inputSchema() {
    return z.object({
      year: z
        .number()
        .int()
        .min(F1_AVAILABLE_FIRST_SEASON_YEAR)
        .max(new Date().getFullYear()),
    });
  }

  protected async _run(input: ToolInput<this>) {
    const output = await OpenF1Service.getInstance().getSeasonDetail(
      input.year,
    );
    return formatToolOutput<OutputObject>(output);
  }
}
