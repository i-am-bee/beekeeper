import {
  WorkspaceManager,
  WorkspaceResource,
} from "@workspaces/manager/manager.js";
import { Logger } from "beeai-framework";
import { AgentIdValue } from "@/agents/registry/dto.js";
import { Disposable } from "@/utils/disposable.js";

export abstract class WorkspaceRestorable implements Disposable {
  protected _logger: Logger | null;
  protected _workspaceManager: WorkspaceManager | null;
  protected _resource: WorkspaceResource | null;
  protected resourceOwnerId: string;
  protected _disposed = false;

  protected get workspaceManager() {
    if (!this._workspaceManager) {
      throw new Error("Missing workspace manager");
    }
    return this._workspaceManager;
  }

  protected get logger() {
    if (!this._logger) {
      throw new Error("Logger is missing");
    }
    return this._logger;
  }

  protected get resource() {
    if (!this._resource) {
      throw new Error("Resource is missing");
    }
    return this._resource;
  }

  get disposed() {
    return this._disposed;
  }

  constructor(
    path: readonly string[],
    resourceOwnerId: string,
    logger: Logger,
  ) {
    this._logger = logger.child({
      name: this.constructor.name,
    });
    this.resourceOwnerId = resourceOwnerId;
    this._workspaceManager = WorkspaceManager.getInstance();
    this._resource = this._workspaceManager.registerResource(
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

  dispose() {
    this._resource = null;
    this._workspaceManager = null;
    this._logger = null;
    this._disposed = true;
  }
}
