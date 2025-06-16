import { describe, expect, it } from "vitest";
import { Parser } from "./parser.js";
import { ProtocolBuilder } from "./protocol.js";

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
      ] as const,
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
        .array({
          name: "tools",
          description:
            "list of selected tools identifiers that this agent type can utilize",
          type: "text",
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
        .array({
          name: "tools",
          isOptional: true,
          description:
            "list of selected tools identifiers that this agent type can utilize",
          type: "text",
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
      .toEqual(`RESPONSE_CHOICE_EXPLANATION: <!required;text;0;Brief explanation of *why* you selected the given RESPONSE_TYPE>
RESPONSE_TYPE: <!required;constant;0;CREATE_AGENT_CONFIG | UPDATE_AGENT_CONFIG | SELECT_AGENT_CONFIG | AGENT_CONFIG_UNAVAILABLE>
<Follow by one of the possible responses format based on the chosen response type>
RESPONSE_CREATE_AGENT_CONFIG: <!optional;object;0>
  agent_type: <!required;text;2;Name of the new agent config type in snake_case>
  tools: <!required;array;2;list of selected tools identifiers that this agent type can utilize>
  description: <!required;text;2;Description of the agent's behavior and purpose of his existence>
  instructions: <!required;text;2;Natural language but structured text instructs on how agent should act>
RESPONSE_UPDATE_AGENT_CONFIG: <!optional;object;0>
  agent_type: <!required;text;2;Name of the new agent config type in snake_case>
  tools: <!optional;array;2;list of selected tools identifiers that this agent type can utilize>
  description: <!optional;text;2;Description of the agent's behavior and purpose of his existence>
  instructions: <!optional;text;2;Natural language but structured text instructs on how agent should act>
RESPONSE_SELECT_AGENT_CONFIG: <!optional;object;0>
  agent_type: <!required;text;2;Name of the selected agent config type>
RESPONSE_AGENT_CONFIG_UNAVAILABLE: <!optional;object;0>
  explanation: <!required;text;2;Detail explanation why your are not able to create, update or select existing agent config>`);
  });

  it(`Print example`, () => {
    const example = protocol.printExample({
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new config is required.",
      RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
      RESPONSE_CREATE_AGENT_CONFIG: {
        agent_type: "news_headlines_24h",
        tools: ["news_search"],
        description: "Gathers news headlines the past 24 hours.",
        instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
      },
    });

    expect(example).toEqual(`\`\`\`
RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE: CREATE_AGENT_CONFIG
RESPONSE_CREATE_AGENT_CONFIG:
  agent_type: news_headlines_24h
  tools: news_search
  description: Gathers news headlines the past 24 hours.
  instructions: You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]
\`\`\``);
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
  tools: news_search
  description: Gathers news headlines the past 24 hours.
  instructions: You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]
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
  it("Wrong indent raises error", () => {
    const parser = new Parser(protocol);
    expect(() =>
      parser.parse(`\`\`\`
RESPONSE_CHOICE_EXPLANATION: No existing agent can gather stock split announcements on demand; a new config is required.
RESPONSE_TYPE: CREATE_AGENT_CONFIG
RESPONSE_CREATE_AGENT_CONFIG:
  agent_type: stock_split_announcements
  description: Gathers and summarizes upcoming stock split announcements for any S&P 500 company.
  instructions: Context: You are a financial news aggregation agent. Your role is to monitor announcements related to stock splits for companies listed in the S&P 500 index. You have access to a tool that allows you to search recent SEC filings (8-K, 10-K, etc.) by company ticker. Your primary task is to identify and summarize key details of upcoming stock splits.

    Objective: Search for recent SEC filings (8-K, 10-K) for S&P 500 companies that mention stock splits. Extract and summarize the critical details such as the company name, split ratio, ex-dividend date, and effective date.

    Response format: Begin with a summary of the search query and the number of results found. Then, for each relevant filing, provide a concise summary of the stock split announcement, including the company name, split ratio, ex-dividend date, and effective date. Ensure the information is clear and organized, with each announcement on a new line. For example:

    Stock Split Announcements:
    1. Company: [Company Name]
       Split Ratio: [Ratio]
       Ex-Dividend Date: [Date]
       Effective Date: [Date]

tools: sec_filings_search
\`\`\``),
    )
      .toThrowError(`Can't find field \`RESPONSE_CREATE_AGENT_CONFIG.tools\`. It should start with \`
  tools:\` but actually starts with \`\``);
  });

  describe("Bugs", () => {
    it("RESPONSE_CREATE_AGENT_CONFIG with extra characters at the end should not fail", () => {
      const parser = new Parser(protocol);
      expect(
        parser.parse(`RESPONSE_CHOICE_EXPLANATION: An explanation
RESPONSE_TYPE: CREATE_AGENT_CONFIG
RESPONSE_CREATE_AGENT_CONFIG: 
  agent_type: agent_type_1
  tools: tool_1
  description: Some description
  instructions: Some instruction
`),
      ).toEqual({
        RESPONSE_CHOICE_EXPLANATION: "An explanation",
        RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
        RESPONSE_CREATE_AGENT_CONFIG: {
          agent_type: "agent_type_1",
          tools: ["tool_1"],
          description: "Some description",
          instructions: `Some instruction`,
        },
      });

      expect(
        parser.parse(`RESPONSE_CHOICE_EXPLANATION: An explanation
RESPONSE_TYPE: CREATE_AGENT_CONFIG
RESPONSE_CREATE_AGENT_CONFIG: | 
  agent_type: agent_type_1
  tools: tool_1
  description: Some description
  instructions: Some instruction
`),
      ).toEqual({
        RESPONSE_CHOICE_EXPLANATION: "An explanation",
        RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
        RESPONSE_CREATE_AGENT_CONFIG: {
          agent_type: "agent_type_1",
          tools: ["tool_1"],
          description: "Some description",
          instructions: `Some instruction`,
        },
      });
    });
  });
});
