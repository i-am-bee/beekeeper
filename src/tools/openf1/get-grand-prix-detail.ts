import { Tool, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import { parseISO } from "date-fns";
import { z } from "zod";
import {
  FormattedToolOutput,
  formatToolDescription,
  formatToolOutput,
} from "../helpers/tool-format.js";
import { GrandPrixDetail } from "./dto.js";
import { OpenF1Service } from "./service.js";

export type OutputObject = GrandPrixDetail;
export type GetGrandPrixDetailToolOutput = FormattedToolOutput<OutputObject>;

const example = {
  grand_prix_id: 1219,
  name: "Singapore Grand Prix",
  official_name: "FORMULA 1 SINGAPORE AIRLINES SINGAPORE GRAND PRIX 2023",
  circuit: "Singapore",
  date: parseISO("2023-09-15T09:30:00+00:00"),
  country: "SGP",
  location: "Marina Bay",
  sessions: [
    {
      session_id: 9158,
      session_name: "Practice 1",
      session_type: "Practice",
    },
    {
      session_id: 9159,
      session_name: "Practice 2",
      session_type: "Practice",
    },
    {
      session_id: 9160,
      session_name: "Qualifying",
      session_type: "Qualifying",
    },
    {
      session_id: 9161,
      session_name: "Race",
      session_type: "Race",
    },
  ],
} satisfies OutputObject;

export class GetGrandPrixDetailTool extends Tool<GetGrandPrixDetailToolOutput> {
  name = "f1_get_grand_prix_detail";
  description = formatToolDescription<OutputObject>({
    description:
      "Provides detailed information about a specific F1 Grand Prix, including its date, location, and results.",
    example,
  });

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    GetGrandPrixDetailToolOutput
  > = Emitter.root.child({
    namespace: ["tool", "f1_get_grand_prix_detail"],
    creator: this,
  });

  inputSchema() {
    return z.object({
      grand_prix_id: z.number(),
    });
  }

  protected async _run(input: ToolInput<this>) {
    const output = await OpenF1Service.getInstance().getGrandPrixDetail(
      input.grand_prix_id,
    );
    return formatToolOutput<OutputObject>(output);
  }
}
