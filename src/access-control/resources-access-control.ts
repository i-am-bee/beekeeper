import { clone, difference } from "remeda";
import { Permission } from "./dto.js";
import { Logger } from "beeai-framework";

export type UserId = string;
export type ResourceId = string;

export interface ResourcePermissions {
  userPermissions: Map<UserId, Permission[]>;
  ownerId: UserId;
}
export interface ResourcesPermissionRegistry {
  resources: Map<ResourceId, ResourcePermissions>;
  admins: Set<UserId>;
}

export const ADMIN_USER = "@admin";
export const REGISTRY_RESOURCE = "@registry";
export const RESERVED_IDS = [ADMIN_USER, REGISTRY_RESOURCE];

export const FULL_ACCESS: Permission[] = ["read", "write", "execute"] as const;
export const READ_ONLY_ACCESS: Permission[] = ["read"] as const;
export const WRITE_ONLY_ACCESS: Permission[] = ["write"] as const;
export const READ_WRITE_ACCESS: Permission[] = ["read", "write"] as const;
export const READ_EXECUTE_ACCESS: Permission[] = ["read", "execute"] as const;

export class PermissionError extends Error {
  constructor(
    public userId: string,
    public requiredPermission: Permission,
    public resourceOwnerId: string,
  ) {
    super(
      `User ${userId} does not have ${requiredPermission} permission for resource owned by ${resourceOwnerId}`,
    );
    this.name = "PermissionError";
  }
}

export class ResourcesAccessControl {
  private readonly logger: Logger;
  private registry: ResourcesPermissionRegistry = {
    admins: new Set(),
    resources: new Map([
      [REGISTRY_RESOURCE, { ownerId: ADMIN_USER, userPermissions: new Map() }],
    ]),
  };

  constructor(entityName: string, admins: UserId[] = []) {
    this.logger = Logger.root.child({ name: `${entityName}AccessControl` });
    admins.forEach((adminId) => this.registry.admins.add(adminId));
  }

  private checkReservedConstants(...requestedIds: (UserId | ResourceId)[]) {
    RESERVED_IDS.forEach((id) => {
      requestedIds.forEach((requestedId) => {
        if (requestedId === id) {
          throw new Error(
            `${requestedId} is reserved for system purpose please chose another`,
          );
        }
      });
    });
  }

  public getResourcePermissionsByAdmin(
    resourceId: ResourceId,
    actingUserId: UserId,
  ) {
    this.checkPermission(REGISTRY_RESOURCE, actingUserId, ["read"]);
    return clone(this.getResourcePermissions(resourceId));
  }

  private getResourcePermissions(resourceId: ResourceId, throwError = true) {
    const resourcePermissions = this.registry.resources.get(resourceId);
    if (!resourcePermissions && throwError) {
      throw new Error(
        `Resource permissions for resourceId:${resourceId} was not found`,
      );
    }
    return resourcePermissions;
  }

  private destroyResourcePermissions(
    resourceId: ResourceId,
    throwError = true,
  ) {
    this.logger.info({ resourceId }, `destroyResourcePermissions`);
    const resourcePermissions = this.registry.resources.has(resourceId);
    if (!resourcePermissions && throwError) {
      throw new Error(
        `Resource permissions for resourceId:${resourceId} was not found for destruction`,
      );
    }
    this.registry.resources.delete(resourceId);
  }

  private isAdmin(userId: UserId) {
    return this.registry.admins.has(userId);
  }

  createPermissions(
    resourceId: ResourceId,
    userId: UserId,
    permissions: Permission[],
    actingUserId: UserId,
  ) {
    this.logger.info(
      { resourceId, userId, permissions, actingUserId },
      `createPermissions`,
    );
    this.checkReservedConstants(resourceId, userId);
    this.checkPermission(resourceId, actingUserId, ["write"]);

    const resourcePermissions = this.getResourcePermissions(resourceId)!;
    resourcePermissions.userPermissions.set(userId, clone(permissions));
  }

  removePermissions(
    resourceId: ResourceId,
    userId: UserId,
    actingUserId: UserId,
    permissions?: Permission[],
  ) {
    this.logger.info(
      { resourceId, userId, permissions, actingUserId },
      `removePermissions`,
    );
    this.checkPermission(resourceId, actingUserId, WRITE_ONLY_ACCESS);

    const resourcePermissions = this.getResourcePermissions(resourceId)!;
    const userPermissions = resourcePermissions.userPermissions.get(userId);
    if (!userPermissions) {
      throw new Error(`User permissions for userId:${userId} was not found`);
    }

    if (permissions == null) {
      resourcePermissions.userPermissions.delete(userId);
    } else {
      const newPermissions = difference(permissions, userPermissions);
      if (!newPermissions.length) {
        resourcePermissions.userPermissions.delete(userId);
      } else {
        resourcePermissions.userPermissions.set(userId, clone(permissions));
      }
    }
  }

  createResource(
    resourceId: ResourceId,
    ownerId: UserId,
    actingUserId: UserId,
    parentResourceId?: ResourceId,
  ) {
    this.logger.info(
      { resourceId, ownerId, actingUserId, parentResourceId },
      `createResource`,
    );
    this.checkReservedConstants(resourceId, ownerId);
    if (parentResourceId) {
      this.checkPermission(
        parentResourceId,
        actingUserId,
        WRITE_ONLY_ACCESS,
        false,
      );
    }

    let resourcePermissions = this.getResourcePermissions(resourceId, false);
    if (resourcePermissions) {
      throw new Error(
        `Resource permissions for resourceId: ${resourceId} already exist`,
      );
    }
    resourcePermissions = {
      ownerId,
      userPermissions: new Map(),
    } satisfies ResourcePermissions;
    this.registry.resources.set(resourceId, resourcePermissions);
  }

  hasResource(resourceId: ResourceId, ownerId: UserId, actingUserId: UserId) {
    this.logger.debug({ resourceId, ownerId, actingUserId }, `hasResource`);

    const resource = this.getResourcePermissions(resourceId, false);
    return resource && resource.ownerId === ownerId;
  }

  removeResource(resourceId: ResourceId, actingUserId: UserId) {
    this.logger.info({ resourceId, actingUserId }, `removeResource`);
    this.checkPermission(resourceId, actingUserId, WRITE_ONLY_ACCESS, false);
    this.destroyResourcePermissions(resourceId);
  }

  checkPermission(
    resourceId: ResourceId,
    userId: UserId,
    requestedPermissions: Permission[],
    throwError = true,
  ) {
    const resourcePermissions = this.getResourcePermissions(
      resourceId,
      throwError,
    )!;

    if (this.isAdmin(userId)) {
      // He is an admin
      return;
    }

    if (resourcePermissions.ownerId === userId) {
      // He is an owner
      return;
    }

    requestedPermissions.forEach((permission) => {
      const userResourcePermissions =
        resourcePermissions.userPermissions.get(userId);
      if (
        !userResourcePermissions ||
        !userResourcePermissions.includes(permission)
      ) {
        throw new PermissionError(
          userId,
          permission,
          resourcePermissions.ownerId,
        );
      }
    });
  }

  /**
   * Safe version that returns boolean instead of throwing
   */
  hasPermission(
    resourceId: ResourceId,
    userId: UserId,
    requestedPermissions: Permission[],
  ): boolean {
    try {
      this.checkPermission(resourceId, userId, requestedPermissions);
      return true;
    } catch (error) {
      if (error instanceof PermissionError) {
        return false;
      }
      throw error;
    }
  }
}
