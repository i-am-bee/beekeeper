import { describe, expect, it } from "vitest";
import { ProtocolBuilder } from "./protocol.js";
import { Parser } from "./parser.js";

describe("LAML Protocol", () => {
  const protocol = ProtocolBuilder.new()
    .text({
      name: "RESPONSE_CHOICE_EXPLANATION",
      description:
        "Brief explanation of *why* you selected the given RESPONSE_TYPE",
    })
    .constant({
      name: "RESPONSE_TYPE",
      values: [
        "CREATE_AGENT_CONFIG",
        "UPDATE_AGENT_CONFIG",
        "SELECT_AGENT_CONFIG",
        "AGENT_CONFIG_UNAVAILABLE",
      ],
      description:
        "CREATE_AGENT_CONFIG | UPDATE_AGENT_CONFIG | SELECT_AGENT_CONFIG | AGENT_CONFIG_UNAVAILABLE",
    })
    .comment({
      comment:
        "Follow by one of the possible responses format based on the chosen response type",
    })
    .object({
      name: "RESPONSE_CREATE_AGENT_CONFIG",
      isOptional: true,
      attributes: ProtocolBuilder.new()
        .text({
          name: "agent_type",
          description: "Name of the new agent config type in snake_case",
        })
        .text({
          name: "description",
          description:
            "Description of the agent's behavior and purpose of his existence",
        })
        .text({
          name: "instructions",
          description:
            "Natural language but structured text instructs on how agent should act",
        })
        .array({
          name: "tools",
          description:
            "list of selected tools identifiers that this agent type can utilize",
          type: "text",
        }),
    })
    .object({
      name: "RESPONSE_UPDATE_AGENT_CONFIG",
      isOptional: true,
      attributes: ProtocolBuilder.new()
        .text({
          name: "agent_type",
          description: "Name of the new agent config type in snake_case",
        })
        .text({
          name: "description",
          isOptional: true,
          description:
            "Description of the agent's behavior and purpose of his existence",
        })
        .text({
          name: "instructions",
          isOptional: true,
          description:
            "Natural language but structured text instructs on how agent should act",
        })
        .array({
          name: "tools",
          isOptional: true,
          description:
            "list of selected tools identifiers that this agent type can utilize",
          type: "text",
        }),
    })
    .object({
      name: "RESPONSE_SELECT_AGENT_CONFIG",
      isOptional: true,
      attributes: ProtocolBuilder.new().text({
        name: "agent_type",
        description: "Name of the selected agent config type",
      }),
    })
    .object({
      name: "RESPONSE_AGENT_CONFIG_UNAVAILABLE",
      isOptional: true,
      attributes: ProtocolBuilder.new().text({
        name: "explanation",
        description:
          "Detail explanation why your are not able to create, update or select existing agent config",
      }),
    })
    .build();

  it(`Protocol definition`, () => {
    expect(protocol.toString())
      .toEqual(`RESPONSE_CHOICE_EXPLANATION: <!required;text;Brief explanation of *why* you selected the given RESPONSE_TYPE>
RESPONSE_TYPE: <!required;constant;CREATE_AGENT_CONFIG | UPDATE_AGENT_CONFIG | SELECT_AGENT_CONFIG | AGENT_CONFIG_UNAVAILABLE>
<Follow by one of the possible responses format based on the chosen response type>
RESPONSE_CREATE_AGENT_CONFIG: <!optional;object>
  agent_type: <!required;text;Name of the new agent config type in snake_case>
  description: <!required;text;Description of the agent's behavior and purpose of his existence>
  instructions: <!required;text;Natural language but structured text instructs on how agent should act>
  tools: <!required;array;list of selected tools identifiers that this agent type can utilize>
RESPONSE_UPDATE_AGENT_CONFIG: <!optional;object>
  agent_type: <!required;text;Name of the new agent config type in snake_case>
  description: <!optional;text;Description of the agent's behavior and purpose of his existence>
  instructions: <!optional;text;Natural language but structured text instructs on how agent should act>
  tools: <!optional;array;list of selected tools identifiers that this agent type can utilize>
RESPONSE_SELECT_AGENT_CONFIG: <!optional;object>
  agent_type: <!required;text;Name of the selected agent config type>
RESPONSE_AGENT_CONFIG_UNAVAILABLE: <!optional;object>
  explanation: <!required;text;Detail explanation why your are not able to create, update or select existing agent config>`);
  });

  it("Missing first required field cause error", () => {
    const parser = new Parser(protocol);
    const fn = () =>
      parser.parse(`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamc
RESPONSE_TYPE: CREATE_AGENT_CONFIG`);
    expect(fn).toThrow(
      "Data doesn't contain required parameter `RESPONSE_CHOICE_EXPLANATION:`",
    );
  });
  it("Missing second required field cause error", () => {
    const parser = new Parser(protocol);
    const fn = () =>
      parser.parse(`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamc

RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.`);
    expect(fn).toThrow("Can't find field `RESPONSE_TYPE`.");
  });
  it("Just first two lines are mandatory", () => {
    const parser = new Parser(protocol);
    expect(
      parser.parse(`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamc

RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE: CREATE_AGENT_CONFIG`),
    ).toEqual({
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new config is required.",
      RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
    });
  });
  it("First two lines are mandatory; Third optional", () => {
    const parser = new Parser(protocol);
    expect(
      parser.parse(`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamc

RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE: CREATE_AGENT_CONFIG
RESPONSE_CREATE_AGENT_CONFIG:
  agent_type: news_headlines_24h
  description: Gathers news headlines the past 24 hours.
  instructions: You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]
  tools: news_search
`),
    ).toEqual({
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new config is required.",
      RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
      RESPONSE_CREATE_AGENT_CONFIG: {
        agent_type: "news_headlines_24h",
        description: "Gathers news headlines the past 24 hours.",
        instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
        tools: ["news_search"],
      },
    });
  });

  it("First two lines are mandatory; Fourth optional", () => {
    const parser = new Parser(protocol);
    expect(
      parser.parse(`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamc

RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE: UPDATE_AGENT_CONFIG
RESPONSE_UPDATE_AGENT_CONFIG:
  agent_type: news_headlines_24h
  instructions: [NEW VERSION!] You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]
`),
    ).toEqual({
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new config is required.",
      RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
      RESPONSE_UPDATE_AGENT_CONFIG: {
        agent_type: "news_headlines_24h",
        instructions: `[NEW VERSION!] You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
      },
    });
  });
});
