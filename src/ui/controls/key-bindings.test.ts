import { describe, expect, it } from "vitest";
import { createKeyBindings, keyActionListenerFactory } from "./key-bindings.js";

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
                listener: keyActionListenerFactory(() => {
                  return;
                }),
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
            listener: expect.any(Function),
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
                listener: keyActionListenerFactory(() => {
                  return;
                }),
              },
            },
            {
              key: "a",
              action: {
                description: "Other original action",
                listener: keyActionListenerFactory(() => {
                  return;
                }),
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
                listener: keyActionListenerFactory(() => {
                  return;
                }),
              },
            },
            {
              key: "d",
              action: {
                description: "New action",
                listener: keyActionListenerFactory(() => {
                  return;
                }),
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
            listener: expect.any(Function),
          }),
        ],
        [
          "a",
          expect.objectContaining({
            description: "Other original action",
            listener: expect.any(Function),
          }),
        ],
        [
          "d",
          expect.objectContaining({
            description: "New action",
            listener: expect.any(Function),
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
                listener: keyActionListenerFactory(() => {
                  return;
                }),
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
            listener: expect.any(Function),
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
                listener: keyActionListenerFactory(() => {
                  return;
                }),
              },
            },
            {
              key: "a",
              action: {
                description: "Other original action",
                listener: keyActionListenerFactory(() => {
                  return;
                }),
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
                listener: keyActionListenerFactory(() => {
                  return;
                }),
              },
            },
            {
              key: "d",
              action: {
                description: "New action",
                listener: keyActionListenerFactory(() => {
                  return;
                }),
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
            listener: expect.any(Function),
          }),
        ],
        [
          "d",
          expect.objectContaining({
            description: "New action",
            listener: expect.any(Function),
          }),
        ],
      ]);
    });
  });
});
