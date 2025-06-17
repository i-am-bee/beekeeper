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

export type OutputObject = dto.Position[];
export type ListGrandPrixPositionsToolOutput =
  FormattedToolOutput<OutputObject>;

const example = [
  {
    position: 1,
    driver: {
      driver_id: 123,
      full_name: "Lewis William",
    },
  },
  {
    position: 2,
    driver: {
      driver_id: 45,
      full_name: "Charles Borne",
    },
  },
] satisfies OutputObject;

export class ListGrandPrixPositionsTool extends Tool<ListGrandPrixPositionsToolOutput> {
  name = "f1_list_grand_prix_positions";
  description = formatToolDescription<OutputObject>({
    description:
      "Provides list of positions for a specific Grand Prix for qualification or race.",
    example,
  });

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    ListGrandPrixPositionsToolOutput
  > = Emitter.root.child({
    namespace: ["tool", "f1_list_grand_prix_positions"],
    creator: this,
  });

  inputSchema() {
    return z.object({
      grand_prix_id: z.number().int(),
      type: dto.SessionPositionTypeEnumSchema,
    });
  }

  protected async _run(input: ToolInput<this>) {
    const output = await OpenF1Service.getInstance().listPositions(
      input.grand_prix_id,
      input.type,
      "finish",
    );
    return formatToolOutput<OutputObject>(output);
  }
}
