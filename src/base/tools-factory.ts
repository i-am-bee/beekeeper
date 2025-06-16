import { Logger } from "beeai-framework";
import { AnyTool } from "beeai-framework/tools/base";
import { AvailableTool } from "@/agents/registry/dto.js";
import { Disposable } from "@/utils/disposable.js";

export type ToolFactoryMethod = () => AnyTool;

export abstract class BaseToolsFactory implements Disposable {
  private _logger: Logger | null;
  protected _availableTools: Map<string, AvailableTool> | null;
  protected _factories: Map<string, ToolFactoryMethod> | null;
  private initialized = false;
  private _disposed = false;

  get logger() {
    if (!this._logger) {
      throw new Error(`Logger is missing`);
    }
    return this._logger;
  }

  get availableTools() {
    if (!this._availableTools) {
      throw new Error(`AvailableTools are missing`);
    }
    return this._availableTools;
  }

  get factories() {
    if (!this._factories) {
      throw new Error(`Factories are missing`);
    }
    return this._factories;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  constructor(logger: Logger) {
    this._logger = logger.child({
      name: this.constructor.name,
    });

    this._availableTools = new Map<string, AvailableTool>();
    this._factories = new Map<string, ToolFactoryMethod>();
  }

  async init() {
    const methods = await this.getFactoriesMethods();
    for (const factory of methods) {
      const product = factory();
      const inputSchema = await product.getInputJsonSchema();
      this.availableTools.set(product.name, {
        toolName: product.name,
        description: product.description,
        toolInput: JSON.stringify(inputSchema),
      });
      this.factories.set(product.name, factory);
    }
    this.initialized = true;
  }

  abstract getFactoriesMethods(): Promise<ToolFactoryMethod[]>;

  getAvailableTools(): AvailableTool[] {
    this.checkInitialization();
    return Array.from(this.availableTools.values());
  }

  getAvailableToolsNames(): string[] {
    this.checkInitialization();
    return Array.from(this.availableTools.keys());
  }

  private checkInitialization() {
    if (!this.initialized) {
      throw new Error(`Uninitialized tools factory`);
    }
  }

  createTools(tools: string[]): AnyTool[] {
    this.checkInitialization();

    return tools.map((t) => {
      const factory = this.factories.get(t);
      if (!factory) {
        throw new Error(`Undefined tool ${t}`);
      }
      return factory();
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.factories.clear();
    this._factories = null;

    this.availableTools.clear();
    this._availableTools = null;

    this._logger = null;
    this._disposed = true;
  }
}
