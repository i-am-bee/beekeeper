import { describe, expect, it } from "vitest";
import { TestMatrix } from "./test-matrix.js";
import { Dimension } from "./types.js";

describe("Matrix", () => {
  it("Two dimensions", () => {
    const time = {
      name: "Time",
      description: "Bla time",
      values: [
        {
          name: "PAST",
          description: "Bla past",
        },
        {
          name: "PRESENT",
          description: "Bla present",
        },
        {
          name: "FUTURE",
          description: "Bla future",
        },
      ],
    } as const satisfies Dimension;

    const position = {
      name: "Position",
      description: "Bla position",
      values: [
        {
          name: "HERE",
          description: "Bla here",
        },
        {
          name: "THERE",
          description: "Bla there",
        },
      ],
    } as const satisfies Dimension;
    const m = new TestMatrix([time, position] as const);
    m.add(["PAST", "HERE"], {
      meta: [
        { dimension: "Time", description: "Past values only" },
        { dimension: "Position", description: "Here positions only" },
      ] as const,
      value: ["Last week here", "Last day here around"],
    });
    m.add(["PAST", "THERE"], {
      meta: [
        { dimension: "Time", description: "Past values only" },
        { dimension: "Position", description: "There positions only" },
      ] as const,
      value: ["Last week there", "Last day there around"],
    });
    m.add(["PRESENT", "HERE"], {
      meta: [
        { dimension: "Time", description: "Present values only" },
        { dimension: "Position", description: "Here positions only" },
      ] as const,
      value: ["Today here", "Now here around"],
    });
    m.add(["PRESENT", "THERE"], {
      meta: [
        { dimension: "Time", description: "Present values only" },
        { dimension: "Position", description: "There positions only" },
      ] as const,
      value: ["Today there", "Now there around"],
    });
    m.add(["FUTURE", "HERE"], {
      meta: [
        { dimension: "Time", description: "Future values only" },
        { dimension: "Position", description: "Here positions only" },
      ] as const,
      value: ["Tomorrow here", "Next week here around"],
    });
    m.add(["FUTURE", "THERE"], {
      meta: [
        { dimension: "Time", description: "Future values only" },
        { dimension: "Position", description: "There positions only" },
      ] as const,
      value: ["Tomorrow there", "Next week there around"],
    });

    let all = "";
    m.walk((_, val) => {
      all += `${val.value.join()}\n`;
    });

    expect(all).toBe(`Past here
Past there
Present here
Present there
Future here
Future there
`);
  });
});
