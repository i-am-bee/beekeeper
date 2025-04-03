# Beekeeper

Beekeeper is a TypeScript-based multi-agent system for AI agent orchestration. At its core lies Beekeeper, the main engine that manages and coordinates multiple AI agents through a task-driven architecture. Rather than allowing direct agent-to-agent communication, all interactions occur through a system of task inputs and outputs, providing control and predictability. 

![Beekeeper Application](./assets/Beekeeper%20Application.jpg)

The system includes two interfaces: 
- **Chat UI** - for user interaction with the system
- **Monitor UI** -  that shows agent activities and task execution in real-time. While Beekeeper handles processing and coordination, the Monitor UI provides insights by tracking the system's operation through generated log files.

This architecture combines functionality with oversight, resulting in a stable and manageable multi-agent system.

## Concept
The technical full name of the Beekeeper should be "Supervisor-Led, Task-Management-Driven Multi-Agent System with Agent Registry." It is a complete multi-agent system with its own runtime that presents itself to the outside world as a unified agent.

![Beekeeper Diagram](./assets/Beekeeper%20Diagram.jpg)

The system is composed of several key components that work together to create a multi-agent architecture:
- **Runtime** - Functions as an intelligent proxy layer that seamlessly integrates all other components into a cohesive unit, presenting itself externally as a single agent while managing internal communication and coordination between components.
- **Supervisor** -  A specialized built-in agent that serves as the strategic overseer, utilizing various tools to manage and coordinate both the Task Manager and Agent Registry. This component makes high-level decisions about system operation and resource allocation.
- **Agent Registry** - A component that handles the lifecycle of agents, including initialization, monitoring, resource allocation, and graceful termination when needed. It maintains a comprehensive directory of all available agents and their capabilities.
- **Task Manager** - The central orchestrator that oversees task distribution, execution, and completion while coordinating with agents through the Agent Registry. This component is responsible for maintaining task queues, tracking progress, and ensuring efficient task processing. !!!TBD Link to task manager!!!

## Task-Managemet-Driven
The fundamental architecture of this system is built around a task-driven approach to multi-agent system (MAS) communication and operation. Rather than allowing direct agent-to-agent interactions, all communication flows are mediated through well-defined tasks. This means that every piece of information, whether it's input data, processing requests, or output results, must be encapsulated within task structures.

![Task-Managemet-Driven Diagram](./assets/Task%20Management%20Driven%20Diagram.jpg)

This task-centric design philosophy ensures that the entire system operates in a highly organized and controlled manner, where each interaction is properly tracked and managed through the task management framework. By channeling all agent interactions through tasks, the system maintains a clear and consistent communication protocol that enhances reliability and traceability.

## Configuration-Instance Approach