import { FlowStep } from "./flow-stepper.js";

/**
 * Utility class that turns a declarative `FlowStep[]` description into a list
 * of JSON‑path‑like strings (e.g. `addresses[0].street`) and lets the caller
 * step forward / backward through that list while exposing the current path.
 */
export class DataStepper {
  private paths: string[];
  private index = 0;

  set flow(flow: FlowStep[]) {
    this.paths = this.flatten(flow);
  }

  /**
   * @param flow Top‑level "flow" description that will be linearised in a
   *             deterministic, depth‑first order.
   */
  constructor(flow: FlowStep[] = []) {
    this.paths = [];
    this.flow = flow;
  }

  /** Human‑readable representation of the current location in the flow. */
  get currentPath(): string {
    return this.paths[this.index];
  }

  /** Move one step forward unless already at the end. */
  forward(): void {
    if (this.index < this.paths.length - 1) {
      this.index += 1;
    }
  }

  get isForwardPossible(): boolean {
    return this.index < this.paths.length - 1;
  }

  /** Move one step back unless already at the beginning. */
  backward(): void {
    if (this.index > 0) {
      this.index -= 1;
    }
  }

  get isBackwardPossible(): boolean {
    return this.index > 0;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /** Depth‑first linearisation of the `flow` definition. */
  private flatten(steps: FlowStep[], prefix = ""): string[] {
    const result: string[] = [];

    for (const step of steps) {
      if (step.array) {
        // Array property – its children must describe individual indices.
        const arrayProp = step.attr as string;

        if (step.flow?.length) {
          for (const child of step.flow) {
            const index = child.attr as number;
            const arrayPrefix = prefix
              ? `${prefix}.${arrayProp}[${index}]`
              : `${arrayProp}[${index}]`;

            if (child.flow?.length) {
              // Drill further down.
              result.push(...this.flatten(child.flow, arrayPrefix));
            } else {
              // Leaf path is the array element itself (rare but allowed).
              result.push(arrayPrefix);
            }
          }
        } else {
          // No child flow – treat the array property as a whole object.
          result.push(prefix ? `${prefix}.${arrayProp}` : arrayProp);
        }
      } else {
        // Regular property or numeric index inside an array element.
        const segment = step.attr;
        const propertyPrefix = prefix
          ? typeof segment === "number"
            ? `${prefix}[${segment}]`
            : `${prefix}.${segment}`
          : typeof segment === "number"
            ? `[${segment}]`
            : `${segment}`;

        if (step.flow?.length) {
          result.push(...this.flatten(step.flow, propertyPrefix));
        } else {
          result.push(propertyPrefix);
        }
      }
    }

    return result;
  }
}
