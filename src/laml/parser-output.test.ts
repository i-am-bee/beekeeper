import { describe, expect, it } from "vitest";
import { ParserOutput } from "./parser-output.js";

describe("LAML Parser output", () => {
  describe("Set", () => {
    it("Top level", () => {
      const output = new ParserOutput();
      output.set(
        ["RESPONSE_CHOICE_EXPLANATION"],
        "No existing agent can gather tweets on demand; a new config is required.",
      );
      expect(output.result).toEqual({
        RESPONSE_CHOICE_EXPLANATION:
          "No existing agent can gather tweets on demand; a new config is required.",
      });
    });

    it("Nested level; Existing object", () => {
      const output = new ParserOutput();
      output.set(["RESPONSE_CREATE_AGENT_CONFIG"], {});
      output.set(["RESPONSE_CREATE_AGENT_CONFIG", "agent_type"], "my_agent");

      expect(output.result).toEqual({
        RESPONSE_CREATE_AGENT_CONFIG: {
          agent_type: "my_agent",
        },
      });
    });

    it("Nested level; Non-existing object", () => {
      const output = new ParserOutput();
      output.set(["RESPONSE_CREATE_AGENT_CONFIG", "agent_type"], "my_agent");

      expect(output.result).toEqual({
        RESPONSE_CREATE_AGENT_CONFIG: {
          agent_type: "my_agent",
        },
      });
    });
  });
});
