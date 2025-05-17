import { describe, expect, it } from "vitest";
import { findPath, PathStep, toPath } from "./tree-path.js";

describe(`Tree Path`, () => {
  describe("toPath", () => {
    it(`root`, () => {
      expect(toPath("screen:panel:button")).toEqual([
        "screen",
        "panel",
        "button",
      ]);
    });
    it(`child`, () => {
      expect(toPath("screen:panel")).toEqual(["screen", "panel"]);
    });
    it(`nested child`, () => {
      expect(toPath("screen:panel:button")).toEqual([
        "screen",
        "panel",
        "button",
      ]);
    });
  });

  describe(`findPath`, () => {
    it(`undefined from and defined to should return path equals to \`to\` `, () => {
      expect(findPath(undefined, "screen", (el) => el)).toEqual([
        { direction: "DOWN", el: "screen" },
      ]);
      expect(findPath(undefined, "screen:panel", (el) => el)).toEqual([
        { direction: "DOWN", el: "screen" },
        { direction: "DOWN", el: "screen:panel" },
      ]);
    });
    it(`same from and to should return the item`, () => {
      expect(findPath("screen", "screen", (el) => el)).toEqual([
        { direction: "DOWN", el: "screen" },
      ] satisfies PathStep[]);
    });
    it(`from parent to child`, () => {
      expect(findPath("screen", "screen:panel", (el) => el)).toEqual([
        { direction: "DOWN", el: "screen:panel" },
      ] satisfies PathStep[]);
    });
    it(`from parent to nested child`, () => {
      expect(findPath("screen", "screen:panel:button", (el) => el)).toEqual([
        { direction: "DOWN", el: "screen:panel" },
        { direction: "DOWN", el: "screen:panel:button" },
      ] satisfies PathStep[]);
    });
    it(`from nested parent to nested child`, () => {
      expect(
        findPath("screen:panel", "screen:panel:dialog:button", (el) => el),
      ).toEqual([
        { direction: "DOWN", el: "screen:panel:dialog" },
        { direction: "DOWN", el: "screen:panel:dialog:button" },
      ] satisfies PathStep[]);
    });
    it(`from child to parent`, () => {
      expect(findPath("screen:panel", "screen", (el) => el)).toEqual([
        { direction: "UP", el: "screen" },
      ] satisfies PathStep[]);
    });
    it(`from nested child to parent`, () => {
      expect(findPath("screen:panel:button", "screen", (el) => el)).toEqual([
        { direction: "UP", el: "screen:panel" },
        { direction: "UP", el: "screen" },
      ] satisfies PathStep[]);
    });
    it(`from deeper nested child to parent`, () => {
      expect(
        findPath("screen:panel:dialog:button", "screen", (el) => el),
      ).toEqual([
        { direction: "UP", el: "screen:panel:dialog" },
        { direction: "UP", el: "screen:panel" },
        { direction: "UP", el: "screen" },
      ] satisfies PathStep[]);
    });
    it(`from nested child to nested parent`, () => {
      expect(
        findPath("screen:panel:dialog:button", "screen:panel", (el) => el),
      ).toEqual([
        { direction: "UP", el: "screen:panel:dialog" },
        { direction: "UP", el: "screen:panel" },
      ] satisfies PathStep[]);
    });
    it(`from deeper nested child to nested parent`, () => {
      expect(
        findPath(
          "screen:panel:dialog:left_panel:button",
          "screen:panel",
          (el) => el,
        ),
      ).toEqual([
        { direction: "UP", el: "screen:panel:dialog:left_panel" },
        { direction: "UP", el: "screen:panel:dialog" },
        { direction: "UP", el: "screen:panel" },
      ] satisfies PathStep[]);
    });
    it(`from child to another over parent`, () => {
      expect(findPath("screen:panel", "screen:button", (el) => el)).toEqual([
        { direction: "UP", el: "screen" },
        { direction: "DOWN", el: "screen:button" },
      ] satisfies PathStep[]);
    });

    it(`from child to another nested over parent`, () => {
      expect(
        findPath("screen:panel", "screen:dialog:button", (el) => el),
      ).toEqual([
        { direction: "UP", el: "screen" },
        { direction: "DOWN", el: "screen:dialog" },
        { direction: "DOWN", el: "screen:dialog:button" },
      ] satisfies PathStep[]);
    });

    it(`from nested child to another non-nested over parent`, () => {
      expect(
        findPath("screen:dialog:button", "screen:panel", (el) => el),
      ).toEqual([
        { direction: "UP", el: "screen:dialog" },
        { direction: "UP", el: "screen" },
        { direction: "DOWN", el: "screen:panel" },
      ] satisfies PathStep[]);
    });

    it(`from one child to another over parent with omit of root`, () => {
      expect(
        findPath("root:screen:panel", "root:screen:button", (el) => el),
      ).toEqual([
        { direction: "UP", el: "root:screen" },
        { direction: "DOWN", el: "root:screen:button" },
      ] satisfies PathStep[]);
    });

    it(`from one child to another over parent with omit of root deeper`, () => {
      expect(
        findPath(
          "root:screen:panel:dialog",
          "root:screen:panel:button",
          (el) => el,
        ),
      ).toEqual([
        { direction: "UP", el: "root:screen:panel" },
        { direction: "DOWN", el: "root:screen:panel:button" },
      ] satisfies PathStep[]);
    });
  });
});
