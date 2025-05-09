import { describe, expect, it } from "vitest";
import { createKeyBindings } from "./key-bindings.js";

describe("Key Bindings", () => {
  describe("Basics", () => {
    it("No key actions", () => {
      const keyBindings = createKeyBindings([]);
      expect(Array.from(keyBindings.keys.values())).toEqual([]);
    });
  });

  describe("Override", () => {
    it("One override key action", () => {
      const keyBindings = createKeyBindings([
        {
          kind: "override",
          actions: [
            {
              key: "s",
              action: {
                description: "Original action",
                listener: () => {
                  return;
                },
              },
            },
          ],
        },
      ]);

      expect(Array.from(keyBindings.keys.entries())).toEqual([
        [
          "s",
          expect.objectContaining({
            description: "Original action",
            callback: expect.any(Function),
          }),
        ],
      ]);
    });

    it("Override action does override previous override key actions, add new ones and let be the others", () => {
      const keyBindings = createKeyBindings([
        {
          kind: "override",
          actions: [
            {
              key: "s",
              action: {
                description: "Original action",
                listener: () => {
                  return;
                },
              },
            },
            {
              key: "a",
              action: {
                description: "Other original action",
                listener: () => {
                  return;
                },
              },
            },
          ],
        },
        {
          kind: "override",
          actions: [
            {
              key: "s",
              action: {
                description: "Overridden action",
                listener: () => {
                  return;
                },
              },
            },
            {
              key: "d",
              action: {
                description: "New action",
                listener: () => {
                  return;
                },
              },
            },
          ],
        },
      ]);
      expect(Array.from(keyBindings.keys.entries())).toEqual([
        [
          "s",
          expect.objectContaining({
            description: "Overridden action",
            callback: expect.any(Function),
          }),
        ],
        [
          "a",
          expect.objectContaining({
            description: "Other original action",
            callback: expect.any(Function),
          }),
        ],
        [
          "d",
          expect.objectContaining({
            description: "New action",
            callback: expect.any(Function),
          }),
        ],
      ]);
    });
  });

  describe("Exclusive", () => {
    it("One exclusive key action", () => {
      const keyBindings = createKeyBindings([
        {
          kind: "exclusive",
          actions: [
            {
              key: "s",
              action: {
                description: "Original action",
                listener: () => {
                  return;
                },
              },
            },
          ],
        },
      ]);

      expect(Array.from(keyBindings.keys.entries())).toEqual([
        [
          "s",
          expect.objectContaining({
            description: "Original action",
            callback: expect.any(Function),
          }),
        ],
      ]);
    });

    it("Exclusive action does fully override previous actions", () => {
      const keyBindings = createKeyBindings([
        {
          kind: "override",
          actions: [
            {
              key: "s",
              action: {
                description: "Original action",
                listener: () => {
                  return;
                },
              },
            },
            {
              key: "a",
              action: {
                description: "Other original action",
                listener: () => {
                  return;
                },
              },
            },
          ],
        },
        {
          kind: "exclusive",
          actions: [
            {
              key: "s",
              action: {
                description: "Overridden action",
                listener: () => {
                  return;
                },
              },
            },
            {
              key: "d",
              action: {
                description: "New action",
                listener: () => {
                  return;
                },
              },
            },
          ],
        },
      ]);
      expect(Array.from(keyBindings.keys.entries())).toEqual([
        [
          "s",
          expect.objectContaining({
            description: "Overridden action",
            callback: expect.any(Function),
          }),
        ],
        [
          "d",
          expect.objectContaining({
            description: "New action",
            callback: expect.any(Function),
          }),
        ],
      ]);
    });
  });
});
