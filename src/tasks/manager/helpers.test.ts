import { describe, expect, it } from "vitest";
import {
  deserializeTaskRunInput,
  extendBlockingTaskRunOutput,
  serializeTaskRunInput,
} from "./helpers.js";

describe("TaskRunInput serialization/deserialization", () => {
  describe(`Serialization`, () => {
    it(`context`, () => {
      expect(
        serializeTaskRunInput({
          context:
            "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          options: {
            hasUnfinishedBlockingTasks: false,
          },
        }),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
      );
    });

    it(`context with input`, () => {
      expect(
        serializeTaskRunInput({
          context:
            "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          input: "love",
          options: {
            hasUnfinishedBlockingTasks: false,
          },
        }),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove",
      );
    });

    it(`context with input and unfinished blocking tasks runs`, () => {
      expect(
        serializeTaskRunInput({
          context:
            "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          input: "love",
          options: {
            hasUnfinishedBlockingTasks: true,
          },
        }),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\n${blocking_task_output}",
      );
    });

    it(`context with input and unfinished blocking tasks runs and blocking task runs outputs`, () => {
      expect(
        serializeTaskRunInput({
          context:
            "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          input: "love",
          options: {
            hasUnfinishedBlockingTasks: true,
            blockingTasksOutputs: "Previous task run output",
          },
        }),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nPrevious task run output\n\n${blocking_task_output}",
      );
    });

    it(`context with input and unfinished blocking tasks runs and blocking task runs outputs`, () => {
      expect(
        serializeTaskRunInput({
          context:
            "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          input: "love",
          options: {
            hasUnfinishedBlockingTasks: true,
            blockingTasksOutputs: "Previous task run output",
          },
        }),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nPrevious task run output\n\n${blocking_task_output}",
      );
    });

    it(`context with unfinished blocking tasks runs`, () => {
      expect(
        serializeTaskRunInput({
          context:
            "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          options: {
            hasUnfinishedBlockingTasks: true,
          },
        }),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is the output from blocking tasks:\n${blocking_task_output}",
      );
    });
  });

  describe(`Deserialization`, () => {
    it(`context`, () => {
      expect(
        deserializeTaskRunInput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
        ),
      ).toEqual({
        context:
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
        options: {
          hasUnfinishedBlockingTasks: false,
        },
      });
    });

    it(`context with input`, () => {
      expect(
        deserializeTaskRunInput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove",
        ),
      ).toEqual({
        context:
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
        input: "love",
        options: {
          hasUnfinishedBlockingTasks: false,
        },
      });
    });

    it(`context with input and unfinished blocking tasks runs`, () => {
      expect(
        deserializeTaskRunInput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\n${blocking_task_output}",
        ),
      ).toEqual({
        context:
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
        input: "love",
        options: {
          hasUnfinishedBlockingTasks: true,
        },
      });
    });

    it(`context with input and unfinished blocking tasks runs and blocking task runs outputs`, () => {
      expect(
        deserializeTaskRunInput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nPrevious task run output\n\n${blocking_task_output}",
        ),
      ).toEqual({
        context:
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
        input: "love",
        options: {
          hasUnfinishedBlockingTasks: true,
          blockingTasksOutputs: "Previous task run output",
        },
      });
    });

    it(`context with unfinished blocking tasks runs`, () => {
      expect(
        deserializeTaskRunInput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is the output from blocking tasks:\n${blocking_task_output}",
        ),
      ).toEqual({
        context:
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
        options: {
          hasUnfinishedBlockingTasks: true,
        },
      });
    });
  });

  describe("Extending", () => {
    it(`context`, () => {
      expect(
        extendBlockingTaskRunOutput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          "Some blocking task run output",
          false,
        ),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is the output from blocking tasks:\nSome blocking task run output",
      );
    });

    it(`context with unfinished blocking tasks runs`, () => {
      expect(
        extendBlockingTaskRunOutput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic",
          "Some blocking task run output",
          true,
        ),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is the output from blocking tasks:\nSome blocking task run output\n\n${blocking_task_output}",
      );
    });

    it(`context with input`, () => {
      expect(
        extendBlockingTaskRunOutput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove",
          "Some blocking task run output",
          false,
        ),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output",
      );
    });

    it(`context with input and unfinished blocking tasks runs`, () => {
      expect(
        extendBlockingTaskRunOutput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove",
          "Some blocking task run output",
          true,
        ),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output\n\n${blocking_task_output}",
      );
    });

    it(`context with input and two blocking task runs outputs`, () => {
      expect(
        extendBlockingTaskRunOutput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output",
          "Some next blocking task run output",
          false,
        ),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output\n\nSome next blocking task run output",
      );
    });

    it(`context with input and unfinished blocking tasks runs two blocking task runs outputs`, () => {
      expect(
        extendBlockingTaskRunOutput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output",
          "Some next blocking task run output",
          true,
        ),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output\n\nSome next blocking task run output\n\n${blocking_task_output}",
      );
    });

    it(`context with input and unfinished blocking tasks runs two blocking task runs outputs (override)`, () => {
      expect(
        extendBlockingTaskRunOutput(
          "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output\n\n${blocking_task_output}",
          "Some next blocking task run output",
          false,
        ),
      ).toBe(
        "You are acting on behalf of task `operator:poem_generation[1]:1`:\nGenerates a poem based on the given topic\n\nThis is your input for this task:\nlove\n\nThis is the output from blocking tasks:\nSome blocking task run output\n\nSome next blocking task run output",
      );
    });
  });
});
