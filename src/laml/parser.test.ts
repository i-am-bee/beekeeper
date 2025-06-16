import { describe, expect, it } from "vitest";
import { Protocol, ProtocolBuilder } from "./protocol.js";
import { Parser } from "./parser.js";

export interface TestItem {
  name: string;
  data: string;
  expected: any;
}

describe("LAML Parser", () => {
  describe("One field", () => {
    describe("Text", () => {
      const protocol = ProtocolBuilder.new().text({
        name: "RESPONSE_CHOICE_EXPLANATION",
        description:
          "Brief explanation of *why* you selected the given RESPONSE_TYPE",
      });

      const parser = new Parser({ protocol: protocol.build() });
      [
        [
          "Happy day",
          "RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "No white space at the beginning",
          "RESPONSE_CHOICE_EXPLANATION:No existing agent can gather tweets on demand; a new config is required.",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "New line at the end",
          "RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.\n",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "New line at the beginning",
          "RESPONSE_CHOICE_EXPLANATION:\n No existing agent can gather tweets on demand; a new config is required.\n",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "Whitespace at the end",
          "RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required. ",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "Whitespace at the end",
          "RESPONSE_CHOICE_EXPLANATION: \t\tNo existing agent can gather tweets on demand; a new config is required. ",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "Whitespace at the end, New line at the end",
          "RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.  \n",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "Whitespace at the beginning, Whitespace at the end, New line at the end",
          "RESPONSE_CHOICE_EXPLANATION:     No existing agent can gather tweets on demand; a new config is required.  \n",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "No at the beginning, Whitespace at the end, New line at the end",
          "RESPONSE_CHOICE_EXPLANATION:No existing agent can gather tweets on demand; a new config is required.  \n     \n",
          "No existing agent can gather tweets on demand; a new config is required.",
        ],
        [
          "No at the beginning, Whitespace at the end, New line at the end, Some other text",
          "RESPONSE_CHOICE_EXPLANATION:No existing agent can gather tweets on demand; a new config is required.  \n     \nNote: There is missing a required tool so I will create one.",
          "No existing agent can gather tweets on demand; a new config is required.  \n     \nNote: There is missing a required tool so I will create one.",
        ],
      ].forEach(([name, data, expected]) => {
        it(name, () => {
          const parsed = parser.parse(data);
          expect(parsed).toEqual({
            RESPONSE_CHOICE_EXPLANATION: expected,
          });
        });
      });
    });
  });

  describe("Two fields", () => {
    describe("Root attributes", () => {
      const protocol = ProtocolBuilder.new()
        .text({
          name: "RESPONSE_CHOICE_EXPLANATION",
          description:
            "Brief explanation of *why* you selected the given RESPONSE_TYPE",
        })
        .text({
          name: "RESPONSE_TYPE",
          description:
            "CREATE_AGENT_CONFIG | UPDATE_AGENT_CONFIG | SELECT_AGENT_CONFIG | AGENT_CONFIG_UNAVAILABLE",
        });
      const parser = new Parser({ protocol: protocol.build() });
      const testData = [
        {
          name: "Happy day",
          data: `RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE: CREATE_AGENT_CONFIG`,
          expected: {
            RESPONSE_CHOICE_EXPLANATION:
              "No existing agent can gather tweets on demand; a new config is required.",
            RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
          },
        },
        {
          name: "First attribute contains second attribute name",
          data: `RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE:
RESPONSE_TYPE: CREATE_AGENT_CONFIG`,
          expected: {
            RESPONSE_CHOICE_EXPLANATION: `No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE:`,
            RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
          },
        },
      ] satisfies TestItem[];

      testData.forEach(({ name, data, expected }) => {
        it(name, () => {
          const parsed = parser.parse(data);
          expect(parsed).toEqual(expected);
        });
      });
    });

    describe("Nested attributes", () => {
      describe("One nested attribute", () => {
        const protocol = ProtocolBuilder.new().object({
          name: "RESPONSE_CREATE_AGENT_CONFIG",
          isOptional: true,
          attributes: ProtocolBuilder.new()
            .text({
              name: "agent_type",
              description: "Name of the new agent config type in snake_case",
            })

            .buildFields(),
        });
        const parser = new Parser({ protocol: protocol.build() });
        const testData = [
          {
            name: "One level",
            data: `RESPONSE_CREATE_AGENT_CONFIG:
  agent_type: news_headlines_24h`,
            expected: {
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: "news_headlines_24h",
              },
            },
          },
        ] satisfies TestItem[];

        testData.forEach(({ name, data, expected }) => {
          it(name, () => {
            const parsed = parser.parse(data);
            expect(parsed).toEqual(expected);
          });
        });
      });

      describe("Two nested attribute", () => {
        const protocol = ProtocolBuilder.new().object({
          name: "RESPONSE_CREATE_AGENT_CONFIG",
          isOptional: true,
          attributes: ProtocolBuilder.new()
            .text({
              name: "agent_type",
              description: "Name of the new agent config type in snake_case",
            })
            .text({
              name: "instructions",
              description:
                "Natural language but structured text instructs on how agent should act",
            })
            .buildFields(),
        });
        const parser = new Parser({ protocol: protocol.build() });
        const testData = [
          {
            name: "One level; two attributes",
            data: `RESPONSE_CREATE_AGENT_CONFIG:
  agent_type: news_headlines_24h
  instructions: You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
            expected: {
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: "news_headlines_24h",
                instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
              },
            },
          },
        ] satisfies TestItem[];

        testData.forEach(({ name, data, expected }) => {
          it(name, () => {
            const parsed = parser.parse(data);
            expect(parsed).toEqual(expected);
          });
        });
      });
    });
  });
  describe("Optional attributes", () => {
    describe("One optional attribute; no match", () => {
      const protocol = ProtocolBuilder.new().text({
        name: "RESPONSE_CHOICE_EXPLANATION",
        isOptional: true,
        description:
          "Brief explanation of *why* you selected the given RESPONSE_TYPE",
      });
      const parser = new Parser({ protocol: protocol.build() });
      it("No match", () => {
        const parsed = parser.parse(
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        );
        expect(parsed).toEqual({});
      });

      it("Match", () => {
        const parsed = parser.parse(
          `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.          
`,
        );
        expect(parsed).toEqual({
          RESPONSE_CHOICE_EXPLANATION:
            "No existing agent can gather tweets on demand; a new config is required.",
        });
      });
    });
  });

  describe("Conversion", () => {
    describe("Type conversion", () => {
      describe("Single field", () => {
        interface ExpectedError {
          error: string;
        }
        type Expected<T> = T | ExpectedError;

        interface SingleFieldTestItem<T> {
          name: string;
          value: string;
          expected: Expected<T>;
        }

        interface CreateSingleFieldTestSectionConfig<T> {
          testData: SingleFieldTestItem<T>[];
          protocol: Protocol;
          getValue: (value: string) => string;
          getExpected: (expected: T) => any;
          getExpectedError: (expected: ExpectedError) => string;
        }

        const createSingleFieldTestSection = <T>({
          protocol,
          testData,
          getValue,
          getExpected,
          getExpectedError,
        }: CreateSingleFieldTestSectionConfig<T>) => {
          const parser = new Parser({ protocol });
          testData.forEach(({ name, value, expected }) => {
            it(name, () => {
              const error = expected as ExpectedError;
              value = getValue(value);
              if (error.error) {
                expect(() => parser.parse(value)).toThrow(
                  getExpectedError(error),
                );
              } else {
                expect(parser.parse(value)).toEqual(getExpected(expected as T));
              }
            });
          });
        };

        describe("Text", () => {
          type TextFieldTestItem = SingleFieldTestItem<String>;
          const textTestData: TextFieldTestItem[] = [
            {
              name: "true",
              value: "true",
              expected: "true",
            },
            {
              name: "1",
              value: "1",
              expected: "1",
            },
            {
              name: "-1",
              value: "-1",
              expected: "-1",
            },
            {
              name: "42.0",
              value: "42.0",
              expected: "42.0",
            },
            {
              name: "1,2,3,4",
              value: "1,2,3,4",
              expected: "1,2,3,4",
            },
            {
              name: "Empty",
              value: "",
              expected: "",
            },
          ];
          const textProtocol = ProtocolBuilder.new()
            .text({
              name: "TEXT",
            })
            .build();
          createSingleFieldTestSection({
            testData: textTestData,
            protocol: textProtocol,
            getValue: (value) => `TEXT: ${value}`,
            getExpected: (expected) => ({ TEXT: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Boolean", () => {
          type BooleanFieldTestItem = SingleFieldTestItem<Boolean>;
          const booleanTestData: BooleanFieldTestItem[] = [
            {
              name: "true",
              value: "true",
              expected: true,
            },
            {
              name: " true\\n",
              value: " true\n",
              expected: true,
            },
            {
              name: "True",
              value: "True",
              expected: true,
            },
            {
              name: "TRUE",
              value: "TRUE",
              expected: true,
            },
            {
              name: "false",
              value: "false",
              expected: false,
            },
            {
              name: " false\\n",
              value: " false\n",
              expected: false,
            },
            {
              name: "False",
              value: "False",
              expected: false,
            },
            {
              name: "FALSE",
              value: "FALSE",
              expected: false,
            },
            {
              name: "Empty -> ERROR",
              value: "",
              expected: { error: "Wrong format of boolean value" },
            },
            {
              name: "1 -> ERROR",
              value: "1",
              expected: { error: "Wrong format of boolean value" },
            },
            {
              name: "0 -> ERROR",
              value: "0",
              expected: { error: "Wrong format of boolean value" },
            },
            {
              name: "<True> -> ERROR",
              value: "<True>",
              expected: { error: "Wrong format of boolean value" },
            },
          ];
          const booleanProtocol = ProtocolBuilder.new()
            .boolean({
              name: "BOOLEAN",
            })
            .build();
          createSingleFieldTestSection({
            testData: booleanTestData,
            protocol: booleanProtocol,
            getValue: (value) => `BOOLEAN: ${value}`,
            getExpected: (expected) => ({ BOOLEAN: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Number", () => {
          type NumberFieldTestItem = SingleFieldTestItem<Number>;
          const numberTestData: NumberFieldTestItem[] = [
            {
              name: "1",
              value: "1",
              expected: 1,
            },
            {
              name: "-1",
              value: "-1",
              expected: -1,
            },
            {
              name: " 42\\n",
              value: " 42\n",
              expected: 42,
            },
            {
              name: "\\t42\\t",
              value: "\t42\t",
              expected: 42,
            },
            {
              name: "42.4",
              value: "42.4",
              expected: 42.4,
            },
            {
              name: "0.314",
              value: "0.314",
              expected: 0.314,
            },
            {
              name: "Empty -> ERROR",
              value: "",
              expected: { error: "Wrong format of number value" },
            },
            {
              name: "A -> ERROR",
              value: "A",
              expected: { error: "Wrong format of number value" },
            },
          ];
          const numberProtocol = ProtocolBuilder.new()
            .number({
              name: "NUMBER",
            })
            .build();
          createSingleFieldTestSection({
            testData: numberTestData,
            protocol: numberProtocol,
            getValue: (value) => `NUMBER: ${value}`,
            getExpected: (expected) => ({ NUMBER: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Integer", () => {
          type NumberFieldTestItem = SingleFieldTestItem<Number>;
          const numberTestData: NumberFieldTestItem[] = [
            {
              name: "1",
              value: "1",
              expected: 1,
            },
            {
              name: "-1",
              value: "-1",
              expected: -1,
            },
            {
              name: " 42\\n",
              value: " 42\n",
              expected: 42,
            },
            {
              name: "\\t42\\t",
              value: "\t42\t",
              expected: 42,
            },
            {
              name: "42.0",
              value: "42.0",
              expected: 42,
            },
            {
              name: "Empty -> ERROR",
              value: "",
              expected: { error: "Wrong format of integer value" },
            },
            {
              name: "42.4 -> ERROR",
              value: "42.4",
              expected: { error: "Wrong format of integer value" },
            },
            {
              name: "0.314 -> ERROR",
              value: "0.314",
              expected: { error: "Wrong format of integer value" },
            },
            {
              name: "A -> ERROR",
              value: "A",
              expected: { error: "Wrong format of integer value" },
            },
          ];
          const numberProtocol = ProtocolBuilder.new()
            .integer({
              name: "INTEGER",
            })
            .build();
          createSingleFieldTestSection({
            testData: numberTestData,
            protocol: numberProtocol,
            getValue: (value) => `INTEGER: ${value}`,
            getExpected: (expected) => ({ INTEGER: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Constant", () => {
          type Constant = "A" | "B" | "C";
          type ConstantFieldTestItem = SingleFieldTestItem<Constant>;
          const constantTestData: ConstantFieldTestItem[] = [
            {
              name: "A",
              value: "A",
              expected: "A",
            },
            {
              name: "\\tA\\n",
              value: "\tA\n",
              expected: "A",
            },
            {
              name: "D",
              value: "D",
              expected: { error: "Unsupported const value" },
            },
          ];
          const constantProtocol = ProtocolBuilder.new()
            .constant({
              name: "CONSTANT",
              values: ["A", "B", "C"] satisfies Constant[],
            })
            .build();
          createSingleFieldTestSection({
            testData: constantTestData,
            protocol: constantProtocol,
            getValue: (value) => `CONSTANT: ${value}`,
            getExpected: (expected) => ({ CONSTANT: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Text array", () => {
          type TextArrayFieldTestItem = SingleFieldTestItem<string[]>;
          const constantTestData: TextArrayFieldTestItem[] = [
            {
              name: "A",
              value: "A",
              expected: ["A"],
            },
            {
              name: "[A]",
              value: "[A]",
              expected: ["A"],
            },
            {
              name: '["A"]',
              value: '["A"]',
              expected: ["A"],
            },
            {
              name: "A,B",
              value: "A,B",
              expected: ["A", "B"],
            },
            {
              name: "\\tA,B\\n",
              value: "\tA,B\n",
              expected: ["A", "B"],
            },
            {
              name: "A,\\n\\tB\\n",
              value: "A,\n\tB\n",
              expected: ["A", "B"],
            },
            {
              name: " [\\nA,\\n\\tB\\n\\t ]\\n\\n",
              value: " [\nA,\n\tB\n\t ]\n\n",
              expected: ["A", "B"],
            },
            {
              name: '"A","B"',
              value: '"A","B"',
              expected: ["A", "B"],
            },
            {
              name: "A, B",
              value: "A, B",
              expected: ["A", "B"],
            },
            {
              name: "[A,B]",
              value: "[A,B]",
              expected: ["A", "B"],
            },
            {
              name: '["A","B"]',
              value: '["A","B"]',
              expected: ["A", "B"],
            },
            {
              name: "[A, B]",
              value: "[A, B]",
              expected: ["A", "B"],
            },
            {
              name: '["A", "B"]',
              value: '["A", "B"]',
              expected: ["A", "B"],
            },
          ];
          const textArrayProtocol = ProtocolBuilder.new()
            .array({
              name: "TEXT_ARRAY",
              type: "text",
            })
            .build();
          createSingleFieldTestSection({
            testData: constantTestData,
            protocol: textArrayProtocol,
            getValue: (value) => `TEXT_ARRAY: ${value}`,
            getExpected: (expected) => ({ TEXT_ARRAY: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Number array", () => {
          type NumberArrayFieldTestItem = SingleFieldTestItem<number[]>;
          const constantTestData: NumberArrayFieldTestItem[] = [
            {
              name: "1",
              value: "1",
              expected: [1],
            },
            {
              name: "[1]",
              value: "[1]",
              expected: [1],
            },
            {
              name: '["1"]',
              value: '["1"]',
              expected: [1],
            },
            {
              name: "1,2",
              value: "1,2",
              expected: [1, 2],
            },
            {
              name: "\\t1,2\\n",
              value: "\t1,2\n",
              expected: [1, 2],
            },
            {
              name: "1.45,\\n\\t2.56\\n",
              value: "1.45,\n\t2.56\n",
              expected: [1.45, 2.56],
            },
            {
              name: " [\\n1,\\n\\t2\\n\\t ]\\n\\n",
              value: " [\n1,\n\t2\n\t ]\n\n",
              expected: [1, 2],
            },
            {
              name: '"1","2"',
              value: '"1","2"',
              expected: [1, 2],
            },
            {
              name: "1, 2",
              value: "1, 2",
              expected: [1, 2],
            },
            {
              name: "[1,2]",
              value: "[1,2]",
              expected: [1, 2],
            },
            {
              name: '["1","2"]',
              value: '["1","2"]',
              expected: [1, 2],
            },
            {
              name: "[1, 2]",
              value: "[1, 2]",
              expected: [1, 2],
            },
            {
              name: '["1", "2"]',
              value: '["1", "2"]',
              expected: [1, 2],
            },
            {
              name: "a -> ERROR",
              value: "a",
              expected: {
                error:
                  "Wrong format of number value `a` at path `NUMBER_ARRAY.[0]`",
              },
            },
            {
              name: "1, a -> ERROR",
              value: "1, a",
              expected: {
                error:
                  "Wrong format of number value `a` at path `NUMBER_ARRAY.[1]`",
              },
            },
          ];
          const numberArrayProtocol = ProtocolBuilder.new()
            .array({
              name: "NUMBER_ARRAY",
              type: "number",
            })
            .build();
          createSingleFieldTestSection({
            testData: constantTestData,
            protocol: numberArrayProtocol,
            getValue: (value) => `NUMBER_ARRAY: ${value}`,
            getExpected: (expected) => ({ NUMBER_ARRAY: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Boolean array", () => {
          type BooleanArrayFieldTestItem = SingleFieldTestItem<boolean[]>;
          const constantTestData: BooleanArrayFieldTestItem[] = [
            {
              name: "true",
              value: "true",
              expected: [true],
            },
            {
              name: "false",
              value: "false",
              expected: [false],
            },
            {
              name: "[true]",
              value: "[true]",
              expected: [true],
            },
            {
              name: '["true"]',
              value: '["true"]',
              expected: [true],
            },
            {
              name: "true,false",
              value: "true,false",
              expected: [true, false],
            },
            {
              name: "\\ttrue,false\\n",
              value: "\ttrue,false\n",
              expected: [true, false],
            },
            {
              name: " [\\ntrue,\\n\\tfalse\\n\\t ]\\n\\n",
              value: " [\ntrue,\n\tfalse\n\t ]\n\n",
              expected: [true, false],
            },
            {
              name: '"true","false"',
              value: '"true","false"',
              expected: [true, false],
            },
            {
              name: "true, false",
              value: "true, false",
              expected: [true, false],
            },
            {
              name: "[true,false]",
              value: "[true,false]",
              expected: [true, false],
            },
            {
              name: '["true","false"]',
              value: '["true","false"]',
              expected: [true, false],
            },
            {
              name: "[true, false]",
              value: "[true, false]",
              expected: [true, false],
            },
            {
              name: '["true", "false"]',
              value: '["true", "false"]',
              expected: [true, false],
            },
            {
              name: "a -> ERROR",
              value: "a",
              expected: {
                error:
                  "Wrong format of boolean value `a` at path `BOOLEAN_ARRAY.[0]`",
              },
            },
            {
              name: "true, a -> ERROR",
              value: "true, a",
              expected: {
                error:
                  "Wrong format of boolean value `a` at path `BOOLEAN_ARRAY.[1]`",
              },
            },
          ];
          const booleanArrayProtocol = ProtocolBuilder.new()
            .array({
              name: "BOOLEAN_ARRAY",
              type: "boolean",
            })
            .build();
          createSingleFieldTestSection({
            testData: constantTestData,
            protocol: booleanArrayProtocol,
            getValue: (value) => `BOOLEAN_ARRAY: ${value}`,
            getExpected: (expected) => ({ BOOLEAN_ARRAY: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });

        describe("Constant array", () => {
          type Constant = "A" | "B" | "C";
          type ConstantArrayFieldTestItem = SingleFieldTestItem<Constant[]>;
          const constantTestData: ConstantArrayFieldTestItem[] = [
            {
              name: "A",
              value: "A",
              expected: ["A"],
            },
            {
              name: "B",
              value: "B",
              expected: ["B"],
            },
            {
              name: "[A]",
              value: "[A]",
              expected: ["A"],
            },
            {
              name: '["A"]',
              value: '["A"]',
              expected: ["A"],
            },
            {
              name: "A,B",
              value: "A,B",
              expected: ["A", "B"],
            },
            {
              name: "\\tA,B\\n",
              value: "\tA,B\n",
              expected: ["A", "B"],
            },
            {
              name: " [\\nA,\\n\\tB\\n\\t ]\\n\\n",
              value: " [\nA,\n\tB\n\t ]\n\n",
              expected: ["A", "B"],
            },
            {
              name: '"A","B"',
              value: '"A","B"',
              expected: ["A", "B"],
            },
            {
              name: "A, B",
              value: "A, B",
              expected: ["A", "B"],
            },
            {
              name: "[A,B]",
              value: "[A,B]",
              expected: ["A", "B"],
            },
            {
              name: '["A","B"]',
              value: '["A","B"]',
              expected: ["A", "B"],
            },
            {
              name: "[A, B]",
              value: "[A, B]",
              expected: ["A", "B"],
            },
            {
              name: '["A", "B"]',
              value: '["A", "B"]',
              expected: ["A", "B"],
            },
            {
              name: "x -> ERROR",
              value: "x",
              expected: {
                error:
                  "Unsupported const value `x` at path `CONSTANT_ARRAY.[0]`. Supported values are: A,B,C ",
              },
            },
            {
              name: "A, 1 -> ERROR",
              value: "A, 1",
              expected: {
                error:
                  "Unsupported const value `1` at path `CONSTANT_ARRAY.[1]`. Supported values are: A,B,C ",
              },
            },
          ];
          const constantArrayProtocol = ProtocolBuilder.new()
            .array({
              name: "CONSTANT_ARRAY",
              type: "constant",
              constants: ["A", "B", "C"] satisfies Constant[],
            })
            .build();
          createSingleFieldTestSection({
            testData: constantTestData,
            protocol: constantArrayProtocol,
            getValue: (value) => `CONSTANT_ARRAY: ${value}`,
            getExpected: (expected) => ({ CONSTANT_ARRAY: expected }),
            getExpectedError: (expected: ExpectedError) => expected.error,
          });
        });
      });
    });
  });
});
