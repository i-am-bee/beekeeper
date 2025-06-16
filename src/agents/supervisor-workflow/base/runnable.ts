import { Logger } from "beeai-framework";
import { Context } from "./context.js";

export abstract class Runnable<TInput, TOutput> {
  protected logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger.child({
      name: this.constructor.name,
    });
  }

  abstract run(input: TInput, ctx: Context): Promise<TOutput>;
}
