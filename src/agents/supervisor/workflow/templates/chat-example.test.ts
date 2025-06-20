import { describe, expect, it } from "vitest";
import { ChatExampleTemplateBuilder } from "./chat-example.js";

describe(`Chat Example Prompt Template`, () => {
  it(`Sample`, () => {
    const prompt = ChatExampleTemplateBuilder.new()
      .title({
        text: "Create agent config",
        level: 3,
        subtitle:
          "Collect tweets (Available suitable agent tool allow to create a new agent config)",
        position: 1,
      })
      .context(
        `### Existing agent configs
There is no existing agent config yet.

### Available agent tools
1. twitter_search:
  description: Query the public Twitter/X API for recent tweets that match a given keyword, hashtag, or user handle. Returns tweet text, author, timestamp, and basic engagement metrics, with optional filters for time window, language, and result count.`,
      )
      .user("Collect tweets containing the hashtag #AI from the past 24 hours.")
      .assistant(
        `RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE: CREATE_AGENT_CONFIG
RESPONSE_CREATE_AGENT_CONFIG:
  agent_type: tweets_collector_24h
  description: Gathers tweets that match a user-supplied query or hashtag within a given time window (default = 24 h).
  instructions: Context: You are a tweet collection agent specializing in gathering tweets containing specific hashtags. You have access to a web search tool that allows you to find tweets based on search queries. Users will provide you with a hashtag and a time frame for the tweets they want collected. 

Objective: Collect tweets containing the specified hashtag from the past 24 hours. Use the web search tool to execute a search query for the hashtag and filter results to include only tweets from the past 24 hours. Provide a list of tweet URLs and their content.

Response format: Begin with a summary of the search query and time frame. Then list each tweet with its URL and content. Ensure the list is clear and organized, with each tweet entry on a new line. For example:

#AI Tweets from the past 24 hours:
1. URL: [tweet_url_1] Content: [tweet_content_1]
2. URL: [tweet_url_2] Content: [tweet_content_2]
  tools: twitter_search`,
      )
      .build();

    expect(prompt)
      .toEqual(`### Example[1]: Create agent config - Collect tweets (Available suitable agent tool allow to create a new agent config)

**Context:**
---
### Existing agent configs
There is no existing agent config yet.

### Available agent tools
1. twitter_search:
  description: Query the public Twitter/X API for recent tweets that match a given keyword, hashtag, or user handle. Returns tweet text, author, timestamp, and basic engagement metrics, with optional filters for time window, language, and result count.
---
**User:**
Collect tweets containing the hashtag #AI from the past 24 hours.
**Assistant:**
\`\`\`
RESPONSE_CHOICE_EXPLANATION: No existing agent can gather tweets on demand; a new config is required.
RESPONSE_TYPE: CREATE_AGENT_CONFIG
RESPONSE_CREATE_AGENT_CONFIG:
  agent_type: tweets_collector_24h
  description: Gathers tweets that match a user-supplied query or hashtag within a given time window (default = 24 h).
  instructions: Context: You are a tweet collection agent specializing in gathering tweets containing specific hashtags. You have access to a web search tool that allows you to find tweets based on search queries. Users will provide you with a hashtag and a time frame for the tweets they want collected. 

Objective: Collect tweets containing the specified hashtag from the past 24 hours. Use the web search tool to execute a search query for the hashtag and filter results to include only tweets from the past 24 hours. Provide a list of tweet URLs and their content.

Response format: Begin with a summary of the search query and time frame. Then list each tweet with its URL and content. Ensure the list is clear and organized, with each tweet entry on a new line. For example:

#AI Tweets from the past 24 hours:
1. URL: [tweet_url_1] Content: [tweet_content_1]
2. URL: [tweet_url_2] Content: [tweet_content_2]
  tools: twitter_search
\`\`\`
`);
  });
});
