import {
  WorkspaceManager,
  WorkspaceResource,
} from "@workspaces/manager/manager.js";
import { Logger } from "beeai-framework";
import { AgentIdValue } from "@/agents/registry/dto.js";

export abstract class WorkspaceRestorable {
  protected readonly logger: Logger;
  protected workspaceManager: WorkspaceManager;
  protected resource: WorkspaceResource;
  protected resourceOwnerId: string;

  constructor(
    path: readonly string[],
    resourceOwnerId: string,
    logger: Logger,
  ) {
    this.logger = logger.child({
      name: this.constructor.name,
    });
    this.resourceOwnerId = resourceOwnerId;
    this.workspaceManager = WorkspaceManager.getInstance();
    this.resource = this.workspaceManager.registerResource(
      {
        kind: "file",
        path,
      },
      resourceOwnerId,
    );
  }

  persist(): void {
    const entities = this.getSerializedEntities();
    this.workspaceManager.writeResource(
      this.resource.path,
      this.resourceOwnerId,
      entities,
    );
  }

  protected abstract getSerializedEntities(): string;

  restore(actingAgentId: AgentIdValue): void {
    this.workspaceManager.readResource(
      this.resource.path,
      this.resourceOwnerId,
      (resource, content) => {
        this.restoreEntity(resource, content, actingAgentId);
      },
    );
  }

  protected abstract restoreEntity(
    resource: WorkspaceResource,
    line: string,
    actingAgentId: AgentIdValue,
    signal?: AbortSignal,
  ): void;
}
