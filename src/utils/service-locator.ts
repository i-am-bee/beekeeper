export class ServiceLocator {
  private static instance: ServiceLocator | null;
  private services = new Map<Function, any>();
  private disposed = false;

  public static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  public register<T>(
    constructor: new (...args: any[]) => T,
    instance: T,
  ): void {
    this.services.set(constructor, instance);
  }

  public get<T>(constructor: new (...args: any[]) => T): T {
    const service = this.services.get(constructor);
    if (!service) {
      throw new Error(`Service '${constructor.name}' wasn't registered yet`);
    }

    return service as T;
  }

  public dispose() {
    if (this.disposed) {
      return;
    }

    this.services.clear();
    ServiceLocator.instance = null;
  }
}
