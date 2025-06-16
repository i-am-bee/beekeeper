import { describe, expect, it } from "vitest";
import { prompt } from "./prompt.js";
import { readFileSync } from "fs";
import { resolve } from "path";

describe(`Prompt`, () => {
  it(`should not change`, () => {
    const p = prompt();
    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
