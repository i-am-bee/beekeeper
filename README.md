<div align="center">
  
# Beekeeper

**A system for coordinating specialized AI agents in complex workflows**

[Overview](#overview) - [Key Benefits](#key-benefits) - [Get started](#get-started) - [Interaction Modes](#interaction-modes) - [Monitor](#monitor) - [Workspaces](#workspaces) - [Showcase](#showcase) - [Best Practices](#best-practices)

</div>

> [!WARNING]
> [PRE-Alpha] This repository contains the beeai supervisor which is still under a rapid development. Please treat it as
> highly experimental and expect breaking changes often. Reach out on discord if you'd like to contribute or get 
> involved in the discussions: [join discord](https://discord.gg/AZFrp3UF5k)

## Key benefits
- **Iterative Development**: Refine agents and tasks through ongoing dialogue with the Supervisor, ensuring continuous improvement.  
- **Workspace Persistence**: Preserve and reuse configurations to save tokens and maintain consistent results across sessions.  
- **Parallel Scalability**: Coordinate specialized agents to handle complex or high-volume operations efficiently.  
- **Unified Interface**: Control all AI agents from a single entry point, simplifying orchestration.  
- **Active Monitoring**: Gain real-time insights into platform operations to quickly identify and address bottlenecks.

## Overview

[🌅 Quick Intro - beeai-supervisor.pdf](https://github.com/user-attachments/files/19391229/beeai-supervisor-v01.pdf)
[📚 Full documentation](https://cheerful-sodalite-38a.notion.site/BeeAI-Supervisor-1ab3b270a700801cabadc0eb80ae9ddb)


BeeAI Supervisor is a multi-agent AI system designed to orchestrate specialized AI agents for completing complex tasks. While the name might suggest a single agent, it actually refers to the entire system - a comprehensive runtime that includes a Supervisor Agent at its core which serves as your primary interface, helping to configure, manage, and coordinate other specialized agents.

Think of BeeAI Supervisor as a hive of AI agents, with the Supervisor agent acting as the queen bee, orchestrating the activities of worker agents to efficiently accomplish your goals. This system enables you to harness the collective intelligence of multiple specialized agents through a single, coordinated interface.

## Get started

### 🛠️ Installation
This project uses [Mise-en-place](https://mise.jdx.dev/) as a manager of tool versions (`python`, `uv`, `nodejs`, `pnpm` etc.), as well as a task runner and environment manager. Mise will download all the needed tools automatically -- you don't need to install them yourself.

Clone this project, then run these setup steps:

```sh
brew install mise  # more ways to install: https://mise.jdx.dev/installing-mise.html
mise trust
mise install
mise build
```

### 🏡 Environment setup
Mise automatically creates a `.env` file based on the `.env.template` found in the project root. You must select one of the available LLM providers (`ibm_rits`, `ollama`, or `openai`) and set up its corresponding API key. 

For example, if you choose OpenAI, your `.env` file might look like this:

```bash
# LLM Provider (ibm_rits/ollama/openai)
LLM_BACKEND="openai"

  :
  :

## OpenAI
OPENAI_API_KEY="<YOUR_OPEN_AI_API_KEY_HERE>"
OPENAI_MODEL_SUPERVISOR="gpt-4o"
OPENAI_MODEL_OPERATOR="gpt-4o"
```

> [!WARNING]
> **Ollama**
> 
> If you choose the Ollama backend, ensure that all models you plan to use support tool calling. Using a small model can lead to many incorrect tool calls from the supervisor agent. For stable performance, we recommend a large model such as `qwq:32b`.



## Interaction Modes

The system can be operated in two distinct modes: **interactive** and **autonomous**.

### 💬 Interactive Mode

![chat](https://github.com/user-attachments/assets/eb8ad753-d89e-4e02-959f-c7c458a4ddb4)

In this mode, you engage in an ongoing conversation with the Supervisor in Chat UI:

```bash
mise interactive
```

This command starts the platform in interactive mode where you can:
- **Start a Conversation**: Interact with the Supervisor Agent to describe your goals  
- **Iterative Configuration**: Collaborate with the Supervisor to define appropriate agent and task configurations  
- **Refine Your Approach**: Based on results, work with the Supervisor to improve your setup  
- **Adjust On the Fly**: You can abort an ongoing task and refine the assignment through chat with the Supervisor

### 🤖 Autonomous Mode

For one-off tasks or batch processing, you can run the platform in autonomous mode:

```bash
mise autonomous <<< "Hi, can you create a poem about each of these topics: bee, hive, queen, sun, flowers?"
```

This command runs the platform in autonomous mode where you can:
- **One-Shot Requests**: Provide your instruction or data in a single command
- **Hands-Off Processing**: The Supervisor Agent autonomously orchestrates the required agents and tasks  
- **Focused Efficiency**: No ongoing conversation is required, letting the system complete your task in the background  
- **Automatic Wrap-Up**: Once the request is fulfilled, results are returned and the platform shuts down

Autonomous mode is ideal for scripted operations, batch processing, or one-off requests that don’t require iterative development. Once your request is complete, results are returned, and the system automatically shuts down—no further input or interaction needed.

## Monitor

![monitors](https://github.com/user-attachments/assets/ea8a8ca5-77ea-46f2-80b0-9afba7b99f69)

To monitor the process while in both modes, open another terminal window and run:

```bash
mise monitor
```

This allows you to observe the platform's operations as it works on your request.

## Workspaces

One of the main challenges in a multi-agent system is preventing the creation of unnecessary objects that can quickly consume resources. To address this, Workspaces provide a persistence layer for both agent and task configurations. This layer preserves configuration states across sessions and supports iterative refinement. Once you’ve fine-tuned a configuration to meet your needs, you can reuse it for new inputs—avoiding the expense of rebuilding complex structures, ensuring consistent processing quality, and optimizing token usage.

Workspaces are located in `./outputs/workspaces` folder:

![workspaces](https://github.com/user-attachments/assets/4a238768-9978-4616-97bb-b97e1959dc44)

You can create or switch a workspace by setting an environment variable like this:
```bash
WORKSPACE=my_workspace mise interactive
```

## Showcase

[🎶 Creative Multi-Agent Tasks Showcase: Poetry and Hip-Hop Analysis](https://cheerful-sodalite-38a.notion.site/Creative-Multi-Agent-Tasks-Showcase-Poetry-and-Hip-Hop-Analysis-1b53b270a700800ab1d3eb28f825bd2a)

The Poetry and Hip-Hop Analysis showcase demonstrates BeeAI Supervisor's sophisticated task orchestration capabilities. The system efficiently manages complex task dependencies, enabling parallel execution of multiple poem and song analyses while maintaining synchronization points where needed. Multiple agent instances work simultaneously on different aspects of the analysis, with the supervisor ensuring proper task sequencing and resource allocation.

This showcase particularly highlights the system's ability to handle both parallel and sequential task flows, dynamically adjusting agent allocation based on task dependencies and availability. The supervisor maintains coherent coordination across multiple concurrent analysis streams while preventing resource conflicts and ensuring optimal throughput.

### ⚙️ Specification

- 🤹‍♂️ Interactive, 🤖 Autonomous, 🖼️ No-code
- Used agents
    - `boss` 1x  
    *meta-llama/llama-3-1-405b-instruct-fp*
    - `peom_generator` 4x
    *meta-llama/llama-3-3-70b-instruct*
    - `hip_hop_song_generator` 1x
    *meta-llama/llama-3-3-70b-instruct*
    - `poem_elements_highlighter` 1x
    *meta-llama/llama-3-3-70b-instruct*
- Executed tasks
    - `process_input_and_plan` 1x
    - `poem_generation` 4x
    - `hip_hop_song_generation` 1x
    - `poem_elements_highlighting` 1x


## 🏁 Conclusion

This platform combines the power of specialized AI agents with the flexibility of interactive configuration, all managed through natural conversation with the Supervisor Agent.

### Best practices
- **Incremental Approach**: Start with smaller tasks and gradually expand to more complex, multi-agent workflows.  
- **Leverage Workspaces**: Reuse proven agent and task configurations to optimize resource usage and maintain quality.  
- **Stay Observant**: Use the Monitor to track operations and make timely adjustments based on system feedback.  
- **Document Configurations**: Keep a record of effective setups and methods for easier knowledge sharing and future reference.
