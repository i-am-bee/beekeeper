<div align="center">
  
# Beekeeper <img align="cener" alt="Project Status: Alpha" src="https://img.shields.io/badge/Status-Alpha-red">

**A system for coordinating specialized AI agents in complex workflows**

[![Apache 2.0](https://img.shields.io/badge/Apache%202.0-License-EA7826?style=plastic&logo=apache&logoColor=white)](https://github.com/i-am-bee/beeai-framework?tab=Apache-2.0-1-ov-file#readme)
[![Follow on Bluesky](https://img.shields.io/badge/Follow%20on%20Bluesky-0285FF?style=plastic&logo=bluesky&logoColor=white)](https://bsky.app/profile/beeaiagents.bsky.social)
[![Join our Discord](https://img.shields.io/badge/Join%20our%20Discord-7289DA?style=plastic&logo=discord&logoColor=white)](https://discord.com/invite/NradeA6ZNF)
[![LF AI & Data](https://img.shields.io/badge/LF%20AI%20%26%20Data-0072C6?style=plastic&logo=linuxfoundation&logoColor=white)](https://lfaidata.foundation/projects/)

[Overview](#overview) - [Key Features](#key-features) - [Quick start](#quick-start) - [Interaction Modes](#interaction-modes) - [Workspaces](#workspaces)

</div>

## Overview

Beekeeper is a multi-agent AI system that orchestrates specialized AI agents to complete complex tasks. A central supervisor agent serves as your primary interface for configuring specialized agents. This eliminates the complexity of having to define agent configurations on your own, as the supervisor agent handles this.

### Core components
1. **Supervision:** A central supervisor agent oversees and coordinates multiple AI agents.
2. **Agent registry:** A centralized repository of available agents.
3. **Task management:** Manages and executes complex tasks, breaking them down into smaller sub-tasks.

These components work together to create a comprehensive solution for managing complex tasks, enabling efficient coordination and configuration through an intuitive interface. Beekeeper integrates the power of specialized AI agents with the flexibility of interactive configuration, all guided by natural conversations with the supervisor agent.

## Key features

- **Iterative development**: Refine agents and tasks through ongoing dialogue with the supervisor agent, ensuring continuous improvement.  
- **Workspace persistence**: Preserve and reuse configurations to save tokens and maintain consistent results across sessions.  
- **Parallel scalability**: Coordinate specialized agents to handle complex or high-volume operations efficiently.  
- **Unified interface**: Control all AI agents from a single entry point, simplifying orchestration.  
- **Active monitoring**: Gain real-time insights into platform operations to quickly identify and address bottlenecks.

## Quick start

### Installation
[Mise-en-place](https://mise.jdx.dev/) is used to manage tool versions (`python`, `uv`, `nodejs`, `pnpm`...), run tasks, and handle environments, automatically downloading required tools.

Clone the project, then run:

```sh
brew install mise  # more ways to install: https://mise.jdx.dev/installing-mise.html
mise trust
mise install
mise build
```

### Environment variables

Mise automatically creates a `.env` file using the `.env.template` in the project root. Choose an LLM Provider (`ollama` or `openai`) and configure its API key. 

For example, if you select OpenAI, your `.env` file might look like this:

```bash
# LLM Provider (ibm_rits/ollama/openai)
LLM_BACKEND="openai"

## OpenAI
OPENAI_API_KEY="<YOUR_OPEN_AI_API_KEY_HERE>"
OPENAI_MODEL_SUPERVISOR="gpt-4o"
OPENAI_MODEL_OPERATOR="gpt-4o"
```

> [!WARNING]
> If you use **Ollama**, make sure your model supports tool calling. Smaller models may cause frequent incorrect tool calls from the supervisor agent. For stable performance, we recommend using a large model like `qwq:32b`.

### Showcase

The Poetry and Hip-Hop Analysis showcase demonstrates Beekeeper’s ability to efficiently manage complex task dependencies, running multiple analyses in parallel while ensuring necessary synchronization. Agents work on different analysis aspects, with the supervisor agent coordinating task sequencing and resource allocation to avoid conflicts and optimize throughput.

### Agents
- `boss` 1x - `meta-llama/llama-3-1-405b-instruct-fp`
- `peom_generator` 4x - `meta-llama/llama-3-3-70b-instruct`
- `hip_hop_song_generator` 1x - `meta-llama/llama-3-3-70b-instruct`
- `poem_elements_highlighter` 1x - `meta-llama/llama-3-3-70b-instruct`

### Tasks
- `process_input_and_plan` 1x
- `poem_generation` 4x
- `hip_hop_song_generation` 1x
- `poem_elements_highlighting` 1x

## Interaction modes

The system operates in two modes: **Interactive** and **Autonomous**.

### Interactive mode

This mode enables real-time interaction with the supervisor agent via the Chat UI.

To start, run:
```bash
mise interactive
```

This mode lets you collaborate with the supervisor agent to:
- **Define your goals** – Start a conversation and receive guidance
- **Fine-tune settings** – Configure agents and tasks iteratively
- **Improve continuously** – Adjust your setup based on results
- **Modify in real time** – Abort or tweak tasks mid-process through chat

> [!TIP]
> **Want to monitor the process?**<br>
> Open another terminal and run: `mise monitor`. This provides a live view of the platform’s activity.

### Autonomous mode

For single-task execution or batch processing, use **autonomous mode**.

To start, run:
```bash
mise autonomous <<< "Hi, can you create a poem about each of these topics: bee, hive, queen, sun, flowers?"
```

What happens:
- **Single-step execution** – Provide your request in one command
- **Hands-free processing** – The system autonomously manages agents and tasks
- **Efficient & unattended** – No interaction required; the system works independently
- **Automatic completion** – Results are returned, and the system shuts down on its own

This mode is ideal for scripted operations, batch jobs, or one-off requests that don’t require back-and-forth adjustments.

> [!TIP]
> **Want to monitor the process?**<br>
> Open another terminal and run: `mise monitor`. This provides a live view of the platform’s activity.

## Workspaces

Managing resources efficiently is critical in a multi-agent system, where unnecessary object creation can quickly drain memory and processing power. Workspaces solve this by providing a persistence layer for both agent and task configurations. This allows you to:
1. Preserve configurations across sessions, eliminating the need to rebuild complex structures.
2. Iterate and refine setups, ensuring optimal performance over time.
3. Maintain consistent processing quality while optimizing token usage.

Once you've fine-tuned a configuration, you can easily reuse it for new inputs, making your workflow more efficient.

### Workspace directory

Workspaces are stored in the `./outputs/workspaces` folder.

### Creating or switching workspaces

To create or switch to a different workspace, set the `WORKSPACE` environment variable before launching the interactive session:
```bash
WORKSPACE=my_workspace mise interactive
```
