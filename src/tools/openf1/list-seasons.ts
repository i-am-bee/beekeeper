import { Tool, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import {
  FormattedToolOutput,
  formatToolDescription,
  formatToolOutput,
} from "../helpers/tool-format.js";
import { Season } from "./dto.js";
import { OpenF1Service } from "./service.js";

export type OutputObject = Season[];

export type ListSeasonsToolOutput = FormattedToolOutput<OutputObject>;

const example = [
  {
    season_id: 2022,
    year: 2022,
    state: "completed",
  },
  {
    season_id: 2023,
    year: 2023,
    state: "completed",
  },
] satisfies OutputObject;

export class ListSeasonsTool extends Tool<ListSeasonsToolOutput> {
  name = "f1_list_seasons";
  description = formatToolDescription<OutputObject>({
    description: "Provides list of all available F1 seasons.",
    example,
  });

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<ToolInput<this>, ListSeasonsToolOutput> =
    Emitter.root.child({
      namespace: ["tool", "f1_list_seasons"],
      creator: this,
    });

  inputSchema() {
    return {};
  }

  protected async _run() {
    const output = await OpenF1Service.getInstance().listSeasons();
    return formatToolOutput<OutputObject>(output);
  }
}
