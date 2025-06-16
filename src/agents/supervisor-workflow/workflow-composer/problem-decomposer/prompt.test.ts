import { describe, expect, it } from "vitest";
import { prompt } from "./prompt.js";

describe(`Prompt`, () => {
  it(`Sample`, () => {
    const p = prompt();

    expect(p).toEqual(``);
  });
});
