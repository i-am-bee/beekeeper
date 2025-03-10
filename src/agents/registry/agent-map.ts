import {
  AgentConfigVersionValue,
  AgentKindEnum,
  AgentTypeValue,
} from "./dto.js";

export interface AgentMapOptions<TValue> {
  autoCreateMap: boolean;
  getDefaultValue: (() => TValue) | null;
}

export class AgentMap<TValue> {
  protected map = new Map<AgentKindEnum, Map<AgentTypeValue, TValue>>();
  protected options: AgentMapOptions<TValue>;

  constructor(options?: Partial<AgentMapOptions<TValue>>) {
    this.options = {
      autoCreateMap: false,
      getDefaultValue: null,
      ...options,
    };
  }

  entries() {
    return this.map.entries();
  }

  addKind(agentKind: AgentKindEnum) {
    this.map.set(agentKind, new Map());
  }

  setTypeValue(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    value: TValue,
    throwError?: boolean
  ) {
    const kindMap = this.getKindMap(agentKind, throwError);
    if (kindMap.has(agentType)) {
      throw new Error(
        `There already exists agentKind:${agentKind} agentType:${agentType}`
      );
    }
    kindMap.set(agentType, value);
  }

  getKindMap(agentKind: AgentKindEnum, throwError?: boolean) {
    let kindMap = this.map.get(agentKind);
    if (!kindMap) {
      if (!throwError && this.options.autoCreateMap) {
        kindMap = new Map();
        this.map.set(agentKind, kindMap);
      } else {
        throw new Error(`There is missing kind map for agentKind:${agentKind}`);
      }
    }
    return kindMap;
  }

  getTypeValue(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    throwError?: boolean
  ) {
    const kindMap = this.getKindMap(agentKind, throwError);
    const typeMap = kindMap.get(agentType);
    if (!typeMap) {
      if (
        !throwError &&
        this.options.autoCreateMap &&
        this.options.getDefaultValue
      ) {
        kindMap.set(agentType, this.options.getDefaultValue());
      } else {
        throw new Error(
          `There is missing type map for agentKind:${agentKind} agentType:${agentType}`
        );
      }
    }
    return typeMap;
  }
}

export class AgentVersionMap<TValue> extends AgentMap<
  [AgentConfigVersionValue, TValue][]
> {
  getTypeValue(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    throwError?: boolean
  ) {
    const kindMap = this.getKindMap(agentKind);
    let typeMap = kindMap.get(agentType);
    if (!typeMap) {
      if (!throwError && this.options.autoCreateMap) {
        typeMap = [];
        kindMap.set(agentType, typeMap);
      } else {
        throw new Error(
          `There is missing type map for agentKind:${agentKind} agentType:${agentType}`
        );
      }
    }
    return typeMap;
  }

  setVersionValue(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: AgentConfigVersionValue,
    value: TValue,
    throwError?: boolean
  ) {
    const typeValue = this.getTypeValue(agentKind, agentType, throwError);
    const versionValue = typeValue.find(
      ([version]) => version === agentConfigVersion
    );
    if (versionValue) {
      // Replace
      versionValue[1] = value;
    } else {
      // Add
      typeValue.push([agentConfigVersion, value]);
    }
  }

  deleteVersion(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: AgentConfigVersionValue,
    throwError?: boolean
  ) {
    const typeValue = this.getTypeValue(agentKind, agentType, throwError);
    const versionIndex = typeValue.findIndex(
      ([version]) => version === agentConfigVersion
    );
    if (versionIndex < 0) {
      throw new Error(
        `There missing agentKind:${agentKind} agentType:${agentType} agentConfigVersion:${agentConfigVersion} for delete`
      );
    }

    const deleted = typeValue.splice(versionIndex, 1)[0][1];

    if (!typeValue.length && !this.options.autoCreateMap) {
      const kindMap = this.getKindMap(agentKind);
      kindMap.delete(agentType);
    }

    return deleted;
  }

  getVersionValue(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: AgentConfigVersionValue,
    throwError?: boolean
  ) {
    const typeMap = this.getTypeValue(agentKind, agentType);
    let version = typeMap.find(([version]) => version === agentConfigVersion);
    if (!version) {
      if (
        !throwError &&
        this.options.autoCreateMap &&
        this.options.getDefaultValue
      ) {
        const versionVal = this.options.getDefaultValue();
        version = [agentConfigVersion, versionVal[0][1]];
        typeMap.push(version);
      } else {
        throw new Error(
          `There missing agentKind:${agentKind} agentType:${agentType} agentConfigVersion:${agentConfigVersion}`
        );
      }
    }
    return version[1];
  }
}
