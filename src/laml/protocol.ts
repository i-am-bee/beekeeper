import { clone, isNonNullish, reverse } from "remeda";
import * as dto from "./dto.js";

export const DEFAULT_INDENT = "  ";

export class ProtocolBuilder {
  private _fields: dto.AnyField[];

  private constructor() {
    this._fields = [];
  }

  static new() {
    return new ProtocolBuilder();
  }

  text(field: Omit<dto.TextField, "kind">) {
    this._fields.push({ kind: "text", ...clone(field) });
    return this;
  }

  number(field: Omit<dto.NumberField, "kind">) {
    this._fields.push({ kind: "number", ...clone(field) });
    return this;
  }

  integer(field: Omit<dto.IntegerField, "kind">) {
    this._fields.push({ kind: "integer", ...clone(field) });
    return this;
  }

  boolean(field: Omit<dto.BooleanField, "kind">) {
    this._fields.push({ kind: "boolean", ...clone(field) });
    return this;
  }

  constant(field: Omit<dto.ConstantField, "kind">) {
    this._fields.push({ kind: "constant", ...clone(field) });
    return this;
  }

  comment(field: Omit<dto.CommentField, "kind">) {
    this._fields.push({ kind: "comment", ...clone(field) });
    return this;
  }

  object(field: Omit<dto.ObjectField, "kind">) {
    this._fields.push({ kind: "object", ...clone(field) });
    return this;
  }

  array(field: Omit<dto.ArrayField, "kind">) {
    this._fields.push({ kind: "array", ...clone(field) });
    return this;
  }

  buildFields() {
    return clone(this._fields);
  }

  build() {
    return new Protocol(this.buildFields());
  }
}

export interface FieldRef {
  field: dto.AnyField;
  path: string[];
}

export type TraverseCallback = (
  field: dto.AnyField,
  nextField: FieldRef[] | undefined,
  path: string[],
) => "STOP" | "CONTINUE";

export class Protocol {
  protected _protocol: dto.Protocol;

  get fields() {
    return clone(this._protocol.fields);
  }

  get indent() {
    return this._protocol.indent;
  }

  constructor(fields: dto.AnyField[], indent = DEFAULT_INDENT) {
    this._protocol = { fields, indent } satisfies dto.Protocol;
  }

  add(field: dto.AnyField) {
    this._protocol.fields.push(field);
  }

  static traverse(
    options: { skipCommentFields: boolean },
    fields: dto.AnyField[],
    nextOuterFields: FieldRef[],
    callback: TraverseCallback,
    path?: string[],
  ) {
    fields
      .filter((f) => !options.skipCommentFields || f.kind !== "comment")
      .forEach((field, index, arr) => {
        const _path = path || [];
        const _newPath = _path.concat((field as any).name ?? "comment");

        const innerFields = [];
        if (field.kind === "object" && field.attributes.length) {
          innerFields.push(
            ...field.attributes
              .slice(0)
              .map(
                (f) => ({ field: f, path: clone(_newPath) }) satisfies FieldRef,
              ),
          );
        }
        const restNeighborFields = [];
        if (index + 1 < arr.length) {
          restNeighborFields.push(
            ...arr
              .slice(index + 1)
              .map(
                (f) => ({ field: f, path: clone(_path) }) satisfies FieldRef,
              ),
          );
        }
        const nextFields = Protocol.collectNextFields(
          innerFields,
          restNeighborFields,
          nextOuterFields,
        );

        switch (field.kind) {
          case "object": {
            if (callback(field, nextFields, _path) === "CONTINUE") {
              const newNextOuterFields = nextOuterFields.concat(
                // First next outer field to process should be the last in the array
                reverse(restNeighborFields),
              );
              Protocol.traverse(
                options,
                field.attributes,
                newNextOuterFields,
                callback,
                _newPath,
              );
            }
            break;
          }
          default:
            callback(field, nextFields, _path);
            break;
        }
      });
  }

  static collectNextFields(
    innerFields: FieldRef[],
    neighborFields: FieldRef[],
    outerFields: FieldRef[],
  ) {
    const output = [];
    let collectNeighbors = true;
    for (const inner of innerFields) {
      output.push(inner);
      if (inner.field.kind === "comment" || !inner.field.isOptional) {
        collectNeighbors = false;
        break;
      }
    }

    if (collectNeighbors) {
      let collectOuters = true;
      for (const neighbor of neighborFields) {
        output.push(neighbor);
        if (neighbor.field.kind === "comment" || !neighbor.field.isOptional) {
          collectOuters = false;
          break;
        }
      }

      if (collectOuters) {
        for (const outer of reverse(outerFields)) {
          output.push(outer);
          if (outer.field.kind === "comment" || !outer.field.isOptional) {
            break;
          }
        }
      }
    }

    return output;
  }

  traverse(
    options: { skipCommentFields: boolean },
    callback: TraverseCallback,
  ) {
    Protocol.traverse(options, this._protocol.fields, [], callback);
  }

  toString() {
    let output = "";
    Protocol.traverse(
      { skipCommentFields: false },
      this._protocol.fields,
      [],
      (field, nextFields, path) => {
        const _indent = `${this._protocol.indent.repeat(path.length)}`;
        const text =
          field.kind === "comment"
            ? `<${field.comment}>`
            : `${field.name}: <${[field.isOptional ? "!optional" : "!required", field.kind, field.description].filter(isNonNullish).join(";")}>`;
        output += `${_indent}${text}\n`;
        return "CONTINUE";
      },
    );

    return output.trimEnd();
  }
}
