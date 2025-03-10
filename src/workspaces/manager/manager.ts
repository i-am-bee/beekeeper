import { AbortScope } from "@/utils/abort-scope.js";
import { ensureDirectoryExistsSafe, validatePath } from "@/utils/file.js";
import { Logger } from "beeai-framework";
import EventEmitter from "events";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path, { basename, join } from "path";
import { clone } from "remeda";

export const WORKSPACES_DIR_PATH = ["..", "..", "workspaces"] as const;
export const DEFAULT_WORKSPACE_DIR_NAME = "default";

interface WorkspaceManagerEvents {
  "workspace:reset": () => void;
  "workspace:change": (resource: WorkspaceResource) => void;
}

export interface WorkspaceResource {
  isDirectory: boolean;
  name: string;
  path: string;
  ownerId: string;
}

type DirPath = string;

export interface CreateResourceInput {
  kind: "file" | "directory";
  path: readonly string[];
}

export interface CreateDirectoryResourceInput extends CreateResourceInput {
  kind: "directory";
}

export interface CreateFileResourceInput extends CreateResourceInput {
  kind: "file";
}

export const DEFAULT_PATH = ["workspaces"] as readonly string[];

export class WorkspaceManager extends EventEmitter {
  private logger: Logger;
  private static instance: WorkspaceManager;
  private _workspacesDirPath?: string;
  private _workspaceName?: string;
  private _workspacePath?: string;
  private resources = new Map<DirPath, WorkspaceResource>();
  private abortScope: AbortScope;

  static init(
    workspace: string,
    logger: Logger,
    options?: { dirPath?: string; signal?: AbortSignal }
  ) {
    if (this.instance) {
      throw new Error(`Workspace manager is already initialized`);
    }
    this.instance = new WorkspaceManager(logger, options?.signal);

    const workspacesDirPath = join(
      options?.dirPath ?? process.cwd(),
      ...DEFAULT_PATH
    );

    this.instance.setWorkspaceDirPath(workspacesDirPath);
    this.instance.setWorkspace(workspace);
    return this.instance;
  }

  static getInstance() {
    if (!this.instance) {
      throw new Error(`Workspace manager wasn't initialized yet`);
    }
    return this.instance;
  }

  get workspaceName() {
    if (!this._workspaceName) {
      throw Error(`Workspace wasn't set yet`);
    }

    return this._workspaceName;
  }

  get workspacesDirPath() {
    if (!this._workspacesDirPath) {
      throw Error(`Workspace dir path wasn't set yet`);
    }

    return this._workspacesDirPath;
  }

  get workspacePath() {
    if (!this._workspacePath) {
      throw Error(`Workspace path wasn't set yet`);
    }

    return this._workspacePath;
  }

  setWorkspaceDirPath(dirPath: string) {
    const dir = path.dirname(dirPath);
    if (!existsSync(dir)) {
      throw new Error(`Workspace directory ${dirPath} doesn't exists`);
    }
    this._workspacesDirPath = dirPath;
  }

  private constructor(logger: Logger, signal?: AbortSignal) {
    super();
    this.logger = logger.child({ name: "WorkspaceManager" });
    this.abortScope = new AbortScope({ parentSignal: signal });
  }

  public on<K extends keyof WorkspaceManagerEvents>(
    event: K,
    listener: WorkspaceManagerEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public emit<K extends keyof WorkspaceManagerEvents>(
    event: K,
    ...args: Parameters<WorkspaceManagerEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  setWorkspace(workspaceName: string) {
    const workspaceNameSanitized = basename(workspaceName);
    const workspacePathSanitized = path.join(
      this.workspacesDirPath,
      workspaceNameSanitized
    );
    ensureDirectoryExistsSafe(
      this.workspacesDirPath,
      workspacePathSanitized,
      this.logger
    );
    this._workspaceName = workspaceNameSanitized;
    this._workspacePath = workspacePathSanitized;
  }

  registerResource(
    input: CreateFileResourceInput | CreateDirectoryResourceInput,
    ownerId: string
  ): WorkspaceResource {
    this.abortScope.checkIsAborted();

    const { inputJoinedPath, validPath } = this.getWorkspacePath(input);
    const name = basename(validPath);

    // Check if resource already exists in our tracking
    const existingResource = this.resources.get(inputJoinedPath);
    if (existingResource) {
      throw new Error(
        `Resource on path ${inputJoinedPath} already exists and is owned by ${existingResource.ownerId}`
      );
    }

    try {
      if (input.kind === "directory") {
        if (!existsSync(validPath)) {
          // Create directory with all subdirectories only if it doesn't exist
          mkdirSync(validPath, { recursive: true });
          this.logger.info(`Created directory: ${input.path}`);
        } else {
          this.logger.info(
            `Directory already exists, skipping creation: ${input.path}`
          );
        }
      } else {
        if (!existsSync(validPath)) {
          // For files, first ensure parent directory exists
          const parentDir = path.dirname(validPath);
          if (!existsSync(parentDir)) {
            mkdirSync(parentDir, { recursive: true });
          }

          // Create empty file only if it doesn't exist
          writeFileSync(validPath, "");
          this.logger.info(`Created file: ${input.path}`);
        } else {
          this.logger.info(
            `File already exists, skipping creation: ${input.path}`
          );
        }
      }

      const resource = {
        name,
        path: validPath,
        ownerId,
        isDirectory: input.kind === "directory",
      };
      // Track the new resource
      this.resources.set(inputJoinedPath, resource);
      return clone(resource);
    } catch (error) {
      this.logger.error(
        `Error creating resource: ${inputJoinedPath} owned by ${ownerId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Reads the content of a file resource
   * @param path Path to the resource
   * @param ownerId ID of the resource owner
   * @param onLine Callback to handle the resource content
   * @throws Error if resource doesn't exist, belongs to different owner, is a directory, or can't be read
   */
  readResource(
    resourcePath: string,
    ownerId: string,
    onLine: (resource: WorkspaceResource, content: string) => void,
    signal?: AbortSignal
  ): void {
    if (signal?.aborted) {
      return;
    }

    // Check if resource exists in our tracking
    const resource = this.resources.get(resourcePath);
    if (!resource) {
      throw new Error(`Resource not found: ${resourcePath}`);
    }

    // Verify ownership
    if (resource.ownerId !== ownerId) {
      throw new Error(
        `Access denied: Resource ${resourcePath} is owned by ${resource.ownerId}`
      );
    }

    // Check if it's a directory
    if (resource.isDirectory) {
      throw new Error(`Cannot read content of directory: ${resourcePath}`);
    }

    try {
      // Read file content synchronously
      const content = readFileSync(resource.path, { encoding: "utf8" });
      if (content.length === 0) {
        // Nothing to parse
        return;
      }

      // Split content into lines and process each line
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        if (signal?.aborted) {
          return;
        }
        onLine(resource, line);
      }

      this.logger.info(`Successfully read file: ${resourcePath}`);
    } catch (error) {
      this.logger.error(`Error setting up file read: ${resourcePath}`, error);
      throw new Error(`Failed to read file ${resourcePath}: ${error.message}`);
    }
  }

  /**
   * Writes content to a file resource
   * @param resourcePath Path to the resource
   * @param resourceOwnerId ID of the resource owner
   * @param content Content to write to the file
   * @throws Error if resource doesn't exist, belongs to different owner, is a directory, or can't be written
   */
  writeResource(
    resourcePath: string,
    resourceOwnerId: string,
    content: string,
    signal?: AbortSignal
  ): void {
    if (signal?.aborted) {
      return;
    }

    // Check if resource exists in our tracking
    const resource = this.resources.get(resourcePath);
    if (!resource) {
      throw new Error(`Resource not found: ${resourcePath}`);
    }

    // Verify ownership
    if (resource.ownerId !== resourceOwnerId) {
      throw new Error(
        `Access denied: Resource ${resourcePath} is owned by ${resource.ownerId}`
      );
    }

    // Check if it's a directory
    if (resource.isDirectory) {
      throw new Error(`Cannot write content to directory: ${resourcePath}`);
    }

    try {
      // Write content to file
      writeFileSync(resource.path, content, "utf8");

      this.logger.info(`Successfully wrote to file: ${resourcePath}`);

      if (signal?.aborted) {
        return;
      }

      // Emit change event with the updated resource
      this.emit("workspace:change", clone(resource));
    } catch (error) {
      this.logger.error(`Error writing to file: ${resourcePath}`, error);
      throw new Error(
        `Failed to write to file ${resourcePath}: ${error.message}`
      );
    }
  }

  getWorkspacePath(
    input: CreateFileResourceInput | CreateDirectoryResourceInput
  ) {
    const inputJoinedPath = path.join(this.workspacePath, ...input.path);
    const validPath = validatePath(this.workspacePath, inputJoinedPath);
    return { inputJoinedPath, validPath };
  }
}
