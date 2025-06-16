import { describe, expect, it } from "vitest";
import { Dimension, Matrix } from "./matrix.js";

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
    const m = new Matrix([time, position] as const);
    m.add(["PAST", "HERE"], "Past here");
    m.add(["PAST", "THERE"], "Past there");
    m.add(["PRESENT", "HERE"], "Present here");
    m.add(["PRESENT", "THERE"], "Present there");
    m.add(["FUTURE", "HERE"], "Future here");
    m.add(["FUTURE", "THERE"], "Future there");

    let all = "";
    m.walk((_, val) => {
      all += `${val.join()}\n`;
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
