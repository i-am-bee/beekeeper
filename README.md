<div align="center">

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/beekeeper-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/beekeeper-light.png">
    <img alt="Beekeeper" width="30%">
  </picture>
</p>

**Orchestrate multi-agent systems with centralized supervision and automatic agent creation**

![Alpha](https://img.shields.io/badge/Status-Alpha-red?style=plastic)
[![Apache 2.0](https://img.shields.io/badge/Apache%202.0-License-EA7826?style=plastic&logo=apache&logoColor=white)](https://github.com/i-am-bee/beeai-framework?tab=Apache-2.0-1-ov-file#readme)
[![Follow on Bluesky](https://img.shields.io/badge/Follow%20on%20Bluesky-0285FF?style=plastic&logo=bluesky&logoColor=white)](https://bsky.app/profile/beeaiagents.bsky.social)
[![Join our Discord](https://img.shields.io/badge/Join%20our%20Discord-7289DA?style=plastic&logo=discord&logoColor=white)](https://discord.com/invite/NradeA6ZNF)
[![LF AI & Data](https://img.shields.io/badge/LF%20AI%20%26%20Data-0072C6?style=plastic&logo=linuxfoundation&logoColor=white)](https://lfaidata.foundation/projects/)

[Overview](#overview) - [Key Features](#key-features) - [Installation](#installation) - [Quick start](#quick-start) - [Interaction Modes](#interaction-modes) - [Workspaces](#workspaces)

</div>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/beekeeper-diagram.jpg">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/beekeeper-diagram.jpg">
    <img alt="Beekeeper" width="100%">
  </picture>
</p>

## Overview

Beekeeper is an experimental multi-agent system, built on the [BeeAI framework](https://github.com/i-am-bee/beeai-framework), designed to coordinate specialized AI agents for complex tasks. At its core, a central supervisor agent acts as your primary interface, simplifying the setup and management of specialized agents. Instead of manually configuring each agent, you define your objectives, and the supervisor handles the rest.

### Core components
1. **Supervision:** A central supervisor agent oversees and coordinates multiple AI agents.
2. **Agent registry:** A centralized repository of available agents.
3. **Task management:** Manages and executes complex tasks, breaking them down into smaller sub-tasks.

These components enable seamless task management by coordinating specialized AI agents through an intuitive, conversational interface with the supervisor agent.

## Key features

- 🔄 **Iterative development**: Continuously refine agents and tasks by giving feedback to the supervisor agent.
- 📁 **Workspace persistence**: Save and reuse configurations for efficiency and consistency.
- 🚀 **Parallel scalability**: Run multiple agents simultaneously for complex tasks.
- 🖥️ **Unified interface**: Manage all AI agents from one central hub.
- 📡 **Active monitoring**: Get real-time insights to detect and fix issues quickly.

---

## Installation
[Mise-en-place](https://mise.jdx.dev/) is used to manage tool versions (`python`, `uv`, `nodejs`, `pnpm`...), run tasks, and handle environments, automatically downloading required tools.

Clone the project, then run:

```sh
brew install mise  # more ways to install: https://mise.jdx.dev/installing-mise.html
mise trust
mise install
mise build
```

### Environment setup

Mise generates a `.env` file using the `.env.template` in the project root. 

**1. Set your LLM provider**

<details>
  <summary>OpenAI (Recommended)</summary>

```
# LLM Provider (ollama/openai)
LLM_BACKEND="openai"

## OpenAI
OPENAI_API_KEY="<YOUR_OPEN_AI_API_KEY_HERE>"
OPENAI_MODEL_SUPERVISOR="gpt-4o"
OPENAI_MODEL_OPERATOR="gpt-4o"
```
</details>

<details>
  <summary>Ollama</summary>

```
# LLM Provider (ollama/openai)
LLM_BACKEND="openai"

## Ollama
OLLAMA_HOST="http://0.0.0.0:11434"
OLLAMA_MODEL_SUPERVISOR="deepseek-r1:8b"
OLLAMA_MODEL_OPERATOR="deepseek-r1:8b"
```

> Important Note: When using **Ollama**, ensure your model supports tool calling. Smaller models may lead to frequent incorrect tool calls. For stability, use a larger model like `qwq:32b`.

</details>

**2. Set your search tool**

<details>
  <summary>Tavily (Recommended)</summary>

Tavily offers 1,000 free API credits/month without a credit card. Get your API key from [Tavily Quickstart](https://docs.tavily.com/documentation/quickstart).

```
# Tools
SEARCH_TOOL="tavily"
TAVILY_API_KEY="<YOUR_TAVILY_API_KEY_HERE>"
```

</details>

<details>
  <summary>DuckDuckGo</summary>

```
# Tools
SEARCH_TOOL="duckduckgo"
```
</details>

---

## Quick start

| Step | Action                                           | Explanation                                                                                      |
|------|--------------------------------------------------|--------------------------------------------------------------------------------------------------|
| **1** | Run:<br> `WORKSPACE=trip_planner mise interactive`  | Run this command to start the interactive mode of the `mise` tool. This will allow you to input prompts easily and save your work in `output/workspaces/trip_planner`. |
| **2** | Split the terminal, then run:<br> `mise monitor`  | View a live activity feed of the platform's tasks and agents. |
| **3** | Input the following prompt: <br> `I'm planning a trip to Boston, MA next week and could use some help putting together a simple 3-day itinerary. I've already booked my flights and will be staying in the Back Bay area. I'd like to explore historical sites, attend a local hockey or football game, and enjoy some great food. Could you suggest a good restaurant for dinner each day? I'd like to try Italian, Chinese, and French cuisine.` | Observe the supervisor agent create tasks and generate specialized agents. |
| **4** | Modify an existing agent:<br> `Can you change the instructions of the restaurant researcher to only suggest restaurants that offer gluten free?` | Watch the supervisor agent update the instructions of the `restaurant_researcher`. |
| **5** | Add more agents:<br> `I also want suggestions for the best hotels around the North End Boston.` | Observe the supervisor agent create an additional agent focused on accomodations. |
| **6** | Now that you have all your agents set up, close out of the session (`esc` 2x, click yes) and start fresh:<br> `WORKSPACE=trip_planner mise interactive` | Revisit your multi-agent system at any time using this command. All tasks and agents are preserved in `output/workspaces/trip_planner`. |
| **7** | Finally, engage all agents with a prompt: `I'm traveling to Boston MA next week for 3 days. I want some excellent restaurant recommendations and hotel suggestions.` | Notice all agent configurations are preserved, allowing you to build on your work. For example, there is no need to specify gluten-free restaurants since your restaurant agents configuration is preserved. |

**You've just built your first multi-agent system with Beekeeper 👏**

Now you're ready to iterate, expand, or even create something completely new!

---

## Interaction modes

The system operates in two modes: **Interactive** and **Autonomous**.

### Interactive mode

Engage with the supervisor agent in real time via the Chat UI.

To start, run:
```bash
mise interactive
```

Use this mode when you want to:
- 🧭 Define goals - Get real-time guidance
- 🎛️ Tune settings - Adjust agents and tasks as you go
- 🛠️ Modify live — Pause, tweak, or stop tasks mid-run

> [!TIP]
> Monitor everything in another terminal: `mise monitor`.

> [!Important]
> To avoid losing your work, always define a workspace: `WORKSPACE=trip_planner mise interactive`.

### Autonomous mode

Execute tasks independently, ideal for batch jobs or one-off requests.

To start, run:
```bash
mise autonomous <<< "Hi, can you create a poem about each of these topics: bee, hive, queen, sun, flowers?"
```

In this mode:
- ⚡ One command, one result
- 👐 Zero interaction needed
- 💤 Auto-shutdown after execution

> [!TIP]
> Monitor everything in another terminal: `mise monitor`.

> [!Important]
> To avoid losing your work, always define a workspace: `WORKSPACE=your_workspace mise autonomous <<< "your_prompt"`.

---

## Workspaces

Workspaces provide a persistence layer for your agent and task configurations, optimizing resource use. With workspaces, you can:
1.	Retain configurations across sessions, eliminating the need to rebuild setups.
2.	Iterate and refine configurations for improved performance.
3.	Ensure consistent processing while reducing token costs.

Once fine-tuned, configurations can be easily reused, making workflows more efficient.

### Workspace directory

Workspaces are stored in the `./outputs/workspaces` folder.

### Creating or switching workspaces

To create or switch to a different workspace, set the `WORKSPACE` variable when launching your session:
```bash
WORKSPACE=my_workspace mise interactive
```

---

## Contribute

We're passionate about building a better Beekeeper, and we couldn't do it without your help! Our project is open-source and community-driven.

- **Want to share an idea or have a question?** Reach out to us on [Discord]((https://discord.com/invite/NradeA6ZNF)).
- **Find a bug or have a feature request?** Open an [issue](https://github.com/i-am-bee/beekeeper/issues).
- **Want to contribute?** Check out our [contribution guidelines](./CONTRIBUTING.md).

We appreciate all types of contributions!

## Maintainers

For information about maintainers, see [MAINTAINERS.md](./MAINTAINERS.md).

## Code of conduct

This project and everyone participating in it are governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please read the full text so that you know which actions may or may not be tolerated.

## Legal notice

All content in these repositories including code has been provided by IBM under the associated open source software license and IBM is under no obligation to provide enhancements, updates, or support. IBM developers produced this code as an open source project (not as an IBM product), and IBM makes no assertions as to the level of quality nor security, and will not be maintaining this code going forward.

---

Developed by contributors to the BeeAI project, this initiative is part of the [Linux Foundation AI & Data program](https://lfaidata.foundation/projects/). Its development follows open, collaborative, and community-driven practices.
