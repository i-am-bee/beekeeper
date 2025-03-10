import { Logger } from "beeai-framework";
import { AnyTool } from "beeai-framework/tools/base";
import { AvailableTool } from "@/agents/registry/dto.js";

export type ToolFactoryMethod = () => AnyTool;

export abstract class BaseToolsFactory {
  protected readonly availableTools = new Map<string, AvailableTool>();
  protected readonly factories = new Map<string, ToolFactoryMethod>();
  private readonly logger: Logger;
  private initialized = false;

  constructor(logger: Logger) {
    this.logger = logger.child({
      name: this.constructor.name,
    });
  }

  async init() {
    const methods = await this.getFactoriesMethods();
    for (const factory of methods) {
      const product = factory();
      this.availableTools.set(product.name, {
        toolName: product.name,
        description: product.description,
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
}
