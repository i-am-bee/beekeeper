import { describe, expect, it } from "vitest";
import { textSplitter } from "./text.js";

describe("TextUtils", () => {
  describe("textSplitter", () => {
    it("should split text by multiple delimiters", () => {
      const text = "Hello, world! How are you?";
      const delimiters = [", ", "! ", "?"];
      const result = textSplitter(text, delimiters);
      expect(result).toEqual(["Hello", "world", "How are you"]);
    });

    it("should throw an error if a delimiter is not found", () => {
      const text = "Hello, world. How are you?";
      const delimiters = [", ", "! ", "?"];
      const result = () => textSplitter(text, delimiters);
      expect(result).toThrowError(
        "Splitter `! ` not found in text `Hello, world. How are you?` after `Hello, `",
      );
    });
    it("should return the original text if no delimiters are provided", () => {
      const text = "Hello, world! How are you?";
      const delimiters: string[] = [];
      const result = textSplitter(text, delimiters);
      expect(result).toEqual([text]);
    });
  });
});
