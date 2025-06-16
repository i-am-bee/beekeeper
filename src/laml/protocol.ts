import { clone, isNonNullish, omit, reverse } from "remeda";
import * as dto from "./dto.js";
import { protocolToSchema } from "./dto.js";
import { Parser } from "./parser.js";
import { printLAMLObject } from "./utils.js";

export const DEFAULT_INDENT = "  ";
export const INDENT_LENGTH = DEFAULT_INDENT.length;
export const DESCRIPTION = ``;

export type ProtocolBuilderResult<TProtocolBuilder> =
  TProtocolBuilder extends ProtocolBuilder<infer R> ? R : never;

export type ProtocolResult<TProtocol> =
  TProtocol extends Protocol<infer R> ? R : never;

type AddProp<
  K extends string,
  V,
  Opt extends boolean | undefined,
> = Opt extends true ? Partial<Record<K, V>> : Record<K, V>;

/**
 * Evaluate to `never` if the literal elements got widened.
 * - If `V[number]` is exactly `string`, the check fails.
 * - Otherwise the type passes through unchanged.
 */
type LiteralArray<V extends readonly string[]> = string extends V[number]
  ? never
  : V;

export class ProtocolBuilder<TResult> {
  private _fields: dto.AnyField[];

  private constructor() {
    this._fields = [];
  }

  static new() {
    return new ProtocolBuilder();
  }

  text<K extends string, Opt extends boolean | undefined = undefined>(
    field: {
      name: K;
      isOptional?: Opt;
    } & Omit<dto.TextField, "kind" | "name" | "isOptional">,
  ) {
    this._fields.push({ kind: "text", ...clone(field) });

    type Added = AddProp<K, string, Opt>;
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  number<K extends string, Opt extends boolean | undefined = undefined>(
    field: { name: K } & Omit<dto.NumberField, "kind">,
  ) {
    this._fields.push({ kind: "number", ...clone(field) });
    type Added = AddProp<K, number, Opt>;
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  integer<K extends string, Opt extends boolean | undefined = undefined>(
    field: { name: K } & Omit<dto.IntegerField, "kind">,
  ) {
    this._fields.push({ kind: "integer", ...clone(field) });
    type Added = AddProp<K, number, Opt>;
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  boolean<K extends string, Opt extends boolean | undefined = undefined>(
    field: { name: K } & Omit<dto.BooleanField, "kind">,
  ) {
    this._fields.push({ kind: "boolean", ...clone(field) });
    type Added = AddProp<K, boolean, Opt>;
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  constant<
    K extends string,
    V extends readonly string[],
    Opt extends boolean | undefined = undefined,
  >(field: {
    name: K;
    values: LiteralArray<V>;
    isOptional?: Opt;
    description?: string;
  }) {
    this._fields.push({
      kind: "constant",
      ...clone(field),
      values: [...field.values] as string[], // mutable for runtime DTO
    });

    type Added = AddProp<K, V[number], Opt>;
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  comment(field: Omit<dto.CommentField, "kind">) {
    this._fields.push({ kind: "comment", ...clone(field) });
    return this;
  }

  object<
    K extends string,
    PB extends ProtocolBuilder<any>,
    Opt extends boolean | undefined = undefined,
  >(
    args: {
      name: K;
      attributes: PB;
      isOptional?: Opt;
    } & Omit<dto.ObjectField, "kind" | "name" | "attributes" | "isOptional">,
  ) {
    const { name, attributes } = args;
    this._fields.push({
      kind: "object",
      name,
      attributes: attributes.buildFields(),
      ...clone(omit(args, ["name", "attributes"])),
    });

    type Added = AddProp<K, ProtocolBuilderResult<PB>, Opt>;
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  array<K extends string, Opt extends boolean | undefined = undefined>(
    field: {
      name: K;
      isOptional?: Opt;
    } & Omit<dto.ArrayField, "kind" | "name" | "isOptional">,
  ) {
    this._fields.push({ kind: "array", ...clone(field) });

    type Added = AddProp<K, string[], Opt>; // adjust element-type if needed
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  list<K extends string, Opt extends boolean | undefined = undefined>(
    field: {
      name: K;
      isOptional?: Opt;
    } & Omit<dto.ListField, "kind" | "name" | "isOptional">,
  ) {
    this._fields.push({ kind: "list", ...clone(field) });

    type Added = AddProp<K, string[], Opt>; // adjust element-type if needed
    return this as unknown as ProtocolBuilder<TResult & Added>;
  }

  buildFields() {
    return clone(this._fields);
  }

  build() {
    return new Protocol<TResult>(this.buildFields());
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

export class Protocol<TResult> {
  protected _protocol: dto.Protocol;

  get schema() {
    return protocolToSchema(this._protocol);
  }

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

  parse(value: string) {
    return Parser.parse<TResult>(this, value);
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
            : `${field.name}: <${[field.isOptional ? "!optional" : "!required", field.kind, path.length * INDENT_LENGTH, field.description].filter(isNonNullish).join(";")}>`;
        output += `${_indent}${text}\n`;
        return "CONTINUE";
      },
    );

    return output.trimEnd();
  }

  printExplanation() {
    return `All your responses **MUST** follow this exact format where each attribute comes with a metadata tag that you MUST read and obey when composing your response.
<!required|optional; indent; type; human-readable hint>
- required | optional - Whether the attribute **must** appear in your output (required) or can be omitted when you have no value for it (optional).  
- type - One of the following:
  - text – single-line string  
  - number – floating-point value (e.g., 3.14)  
  - integer – whole number  
  - boolean - true / false  
  - constant – one literal chosen from the values listed in the protocol  
  - array – list of items of the specified item-type (comma-separated or JSON-style)  
  - list - human readable list of items numbered or with bullet points
  - object – nested attributes, each described by its own metadata tag  
- indent – integer; the key’s left-margin offset in spaces (0 = column 0)
- human-readable hint - brief guidance explaining the purpose or expected content of the attribute.

The format:
\`\`\`
${this.toString()}
\`\`\`<STOP HERE>`;
  }

  printExample(input: ProtocolResult<typeof this>) {
    return `\`\`\`
${printLAMLObject(input as dto.LAMLObject)}
\`\`\``;
  }
}
