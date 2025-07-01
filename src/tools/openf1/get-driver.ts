import { Tool, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";
import {
  FormattedToolOutput,
  formatToolDescription,
  formatToolOutput,
} from "../helpers/tool-format.js";
import * as dto from "./dto.js";
import { OpenF1Service } from "./service.js";

export type OutputObject = dto.DriverDetail;
export type GetDriverToolOutput = FormattedToolOutput<OutputObject>;

const example = {
  driver_id: 2,
  broadcast_name: "Lewis Hamilton",
  full_name: "Lewis William Hamilton",
  name_acronym: "HAM",
  team_name: "Mercedes-AMG Petronas Formula One Team",
  team_colour: "#00D2BE",
  first_name: "Lewis",
  last_name: "Hamilton",
  headshot_url: "https://example.com/headshot.jpg",
  country_code: "GB",
} satisfies OutputObject;

export class GetDriverTool extends Tool<GetDriverToolOutput> {
  name = "f1_get_driver";
  description = formatToolDescription<OutputObject>({
    description: "Provides detailed information about a specific F1 driver.",
    example,
  });

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<ToolInput<this>, GetDriverToolOutput> =
    Emitter.root.child({
      namespace: ["tool", "f1_get_driver"],
      creator: this,
    });

  inputSchema() {
    return z.object({
      driverId: z.number().int(),
      sessionId: z.number().int(),
    });
  }

  protected async _run(input: ToolInput<this>) {
    const output = await OpenF1Service.getInstance().getDriver(
      input.driverId,
      input.sessionId,
    );
    return formatToolOutput<OutputObject>(output);
  }
}
