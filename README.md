<div align="center">
  
# Beekeeper <img align="cener" alt="Project Status: Alpha" src="https://img.shields.io/badge/Status-Alpha-red">

**A system for coordinating specialized AI agents in complex workflows**

[![Apache 2.0](https://img.shields.io/badge/Apache%202.0-License-EA7826?style=plastic&logo=apache&logoColor=white)](https://github.com/i-am-bee/beeai-framework?tab=Apache-2.0-1-ov-file#readme)
[![Follow on Bluesky](https://img.shields.io/badge/Follow%20on%20Bluesky-0285FF?style=plastic&logo=bluesky&logoColor=white)](https://bsky.app/profile/beeaiagents.bsky.social)
[![Join our Discord](https://img.shields.io/badge/Join%20our%20Discord-7289DA?style=plastic&logo=discord&logoColor=white)](https://discord.com/invite/NradeA6ZNF)
[![LF AI & Data](https://img.shields.io/badge/LF%20AI%20%26%20Data-0072C6?style=plastic&logo=linuxfoundation&logoColor=white)](https://lfaidata.foundation/projects/)

[Overview](#overview) - [Key Features](#key-features) - [Installation](#installation) - [Quick start](#quick-start) - [Interaction Modes](#interaction-modes) - [Workspaces](#workspaces)

</div>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="Beekeeper.jpg">
    <source media="(prefers-color-scheme: light)" srcset="Beekeeper.jpg">
    <img alt="Beekeeper" width="100%">
  </picture>
</p>

## Overview

Beekeeper is a multi-agent system, built on the [BeeAI framework](https://github.com/i-am-bee/beeai-framework), designed to coordinate specialized AI agents for complex tasks. At its core, a central supervisor agent acts as your primary interface, simplifying the setup and management of specialized agents. Instead of manually configuring each agent, you define your objectives, and the supervisor handles the rest.

### Core components
1. **Supervision:** A central supervisor agent oversees and coordinates multiple AI agents.
2. **Agent registry:** A centralized repository of available agents.
3. **Task management:** Manages and executes complex tasks, breaking them down into smaller sub-tasks.

These components enable seamless task management by coordinating specialized AI agents through an intuitive, conversational interface with the supervisor agent.

## Key features

- **Iterative development**: Refine agents and tasks through ongoing dialogue with the supervisor agent, ensuring continuous improvement.  
- **Workspace persistence**: Preserve and reuse configurations to save tokens and maintain consistent results across sessions.  
- **Parallel scalability**: Coordinate specialized agents to handle complex or high-volume operations efficiently.  
- **Unified interface**: Control all AI agents from a single entry point, simplifying orchestration.  
- **Active monitoring**: Gain real-time insights into platform operations to quickly identify and address bottlenecks.

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

Mise generates a `.env` file using the `.env.template` in the project root. Select an LLM provider (**Ollama** or **OpenAI**) and update your `.env` file accordingly.

For **OpenAI**, your `.env` file might look like this:

```bash
# LLM Provider (ollama/openai)
LLM_BACKEND="openai"

## OpenAI
OPENAI_API_KEY="<YOUR_OPEN_AI_API_KEY_HERE>"
OPENAI_MODEL_SUPERVISOR="gpt-4o"
OPENAI_MODEL_OPERATOR="gpt-4o"
```

> [!WARNING]
> When using **Ollama**, ensure your model supports tool calling. Smaller models may lead to frequent incorrect tool calls. For stability, use a larger model like `qwq:32b`.

## Quick start

1. To start, run: `mise interactive`

2. Enter the following prompt: `Help me plan a trip to San Francisco CA for next week`

[More coming soon]

> [!TIP]
> **Want to monitor the process?**<br>
> Open another terminal and run: `mise monitor`. This provides a live view of the platform’s activity.

## Interaction modes

The system operates in two modes: **Interactive** and **Autonomous**.

### Interactive mode

Engage with the supervisor agent in real time via the Chat UI.

To start, run:
```bash
mise interactive
```

Use this mode to:
- **Define goals** – Get guidance through conversation.
- **Fine-tune settings** – Adjust agents and tasks iteratively.
- **Modify in real time** – Tweak or abort tasks mid-process.

### Autonomous mode

Execute tasks independently, ideal for batch jobs or one-off requests.

To start, run:
```bash
mise autonomous <<< "Hi, can you create a poem about each of these topics: bee, hive, queen, sun, flowers?"
```

What happens:
- **Single-step execution** – One command, one result.
- **Hands-free processing** – No interaction needed.
- **Automatic completion** – The system shuts down after execution.

## Workspaces

Workspaces provide a persistence layer for your agent and task configurations, optimizing resource use. With workspaces, you can:
1.	Retain configurations across sessions, eliminating the need to rebuild setups.
2.	Iterate and refine configurations for improved performance.
3.	Ensure consistent processing while reducing token costs.

Once fine-tuned, configurations can be easily reused, making workflows more efficient.

### Workspace directory

Workspaces are stored in the `./outputs/workspaces` folder.

### Creating or switching workspaces

To create or switch to a different workspace, set the `WORKSPACE` environment variable before launching the interactive session:
```bash
WORKSPACE=my_workspace mise interactive
```
