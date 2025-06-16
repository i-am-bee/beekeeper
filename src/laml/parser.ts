import { clone } from "remeda";
import { ConstantField, FieldKind } from "./dto.js";
import { ParserOutput } from "./parser-output.js";
import { FieldRef, Protocol } from "./protocol.js";
import { pathStr, truncateText, unwrapString } from "./utils.js";

export type ConversionFn = (val: string) => string;

export interface BaseConversion {
  fn: ConversionFn;
}

export interface GlobalConversion extends BaseConversion {
  kind: "global";
  fieldKind?: FieldKind;
}

export interface FieldConversion extends BaseConversion {
  kind: "field";
  fieldKind: FieldKind;
}

export interface PathConversion extends BaseConversion {
  kind: "path";
  path: string[];
}

export type AnyConversion = GlobalConversion | FieldConversion | PathConversion;

export class Parser<TResult> {
  protected _globalConversions: GlobalConversion[];
  protected _fieldConversions: Map<FieldKind, FieldConversion[]>;
  protected _pathConversion: Map<string, PathConversion[]>;
  protected _protocol: Protocol<TResult>;

  constructor(
    protocol: Protocol<TResult>,
    options?: { rules?: AnyConversion[] },
  ) {
    this._globalConversions = [];
    this._fieldConversions = new Map();
    this._pathConversion = new Map();
    if (options?.rules) {
      options.rules.forEach(this.addConversion.bind(this));
    }
    this._protocol = protocol;
  }

  static new<TResult>(
    protocol: Protocol<TResult>,
    options?: { rules?: AnyConversion[] },
  ) {
    return new Parser(protocol, { rules: options?.rules });
  }

  static parse<TResult>(
    protocol: Protocol<TResult>,
    value: string,
    options?: { rules?: AnyConversion[] },
  ) {
    return Parser.new(protocol, options).parse(value);
  }

  addGlobalConversion(rule: Omit<GlobalConversion, "kind">) {
    this.addConversion({ kind: "global", ...clone(rule) });
  }

  addFieldConversion(rule: Omit<FieldConversion, "kind">) {
    this.addConversion({ kind: "field", ...clone(rule) });
  }

  addPathConversion(rule: Omit<PathConversion, "kind">) {
    this.addConversion({ kind: "path", ...clone(rule) });
  }

  private addConversion(conversion: AnyConversion) {
    switch (conversion.kind) {
      case "global":
        this._globalConversions.push(conversion);
        break;
      case "field": {
        let conversions = this._fieldConversions.get(conversion.fieldKind);
        if (!conversions) {
          conversions = [];
          this._fieldConversions.set(conversion.fieldKind, conversions);
        }
        conversions.push(conversion);
        break;
      }
      case "path": {
        const path = pathStr(conversion.path);
        let conversions = this._pathConversion.get(path);
        if (!conversions) {
          conversions = [];
          this._pathConversion.set(path, conversions);
        }
        conversions.push(conversion);
        break;
      }
    }
  }

  parse(data: string) {
    if (!this._protocol) {
      throw new Error(`Protocol is not defined`);
    }

    const output = new ParserOutput<TResult>();
    let rest = data;
    const protocol = this._protocol;
    let firstIteration = true;
    let foundBeginning = false;
    protocol.traverse(
      { skipCommentFields: true },
      (field, nextFields, path) => {
        if (field.kind === "comment") {
          throw new Error(`Unparseable field kind \`${field.kind}\``);
        }

        const paramNameString = Parser.getParamNameString(
          protocol,
          path,
          field.name,
          !firstIteration,
        );

        if (!foundBeginning) {
          // Find beginning of the parsed part
          const startIndex = rest.indexOf(paramNameString);
          if (startIndex === -1) {
            if (field.isOptional) {
              if (field.kind === "object") {
                return "STOP";
              } else {
                return "CONTINUE";
              }
            }
            throw new Error(
              `Data doesn't contain required parameter \`${paramNameString}\``,
            );
          }
          rest = rest.substring(startIndex);
          foundBeginning = true;
        } else {
          if (!rest.startsWith(paramNameString)) {
            if (field.isOptional) {
              if (field.kind === "object") {
                return "STOP";
              } else {
                return "CONTINUE";
              }
            }

            const truncated = truncateText(rest, 250);
            throw new Error(
              `Can't find field \`${pathStr(path.concat(field.name))}\`. It should start with \`${paramNameString}\` but actually starts with \`${truncated}\``,
            );
          }
        }

        rest = rest.substring(paramNameString.length);
        const fieldPath = path.concat(field.name);
        if (field.kind !== "object") {
          let end = -1;
          if (nextFields?.length) {
            for (const nextFieldRef of nextFields) {
              if (nextFieldRef.field.kind === "comment") {
                throw new Error(
                  `Unparsable next field kind \`${nextFieldRef.field.kind}\``,
                );
              }
              const nextParamNameString = Parser.getParamNameString(
                protocol,
                nextFieldRef.path,
                nextFieldRef.field.name,
                true,
              );
              end = rest.lastIndexOf(`${nextParamNameString}`); // FIXME We have to check that the index is before index of the following next field(s)
              if (end >= 0) {
                break;
              }
            }
          }

          const value = end >= 0 ? rest.substring(0, end) : rest;
          const convertedValue = this.applyConversions(
            { field, path: fieldPath },
            value,
          );
          output.set(fieldPath, convertedValue);
          rest = rest.length > value.length ? rest.substring(value.length) : "";
        } else {
          output.set(fieldPath, {});
        }

        firstIteration = false;
        return "CONTINUE";
      },
    );

    return output.result;
  }

  private applyConversions(field: FieldRef, value: string) {
    const stringConversions = [];

    const pathConversions = this._pathConversion.get(pathStr(field.path));
    if (pathConversions) {
      stringConversions.push(...clone(pathConversions));
    } else {
      const fieldConversions = this._pathConversion.get(pathStr(field.path));
      if (fieldConversions) {
        stringConversions.push(...clone(fieldConversions));
      } else {
        stringConversions.push(...clone(this._globalConversions));
      }
    }

    const output = stringConversions.length
      ? stringConversions.reduce((acc, curr) => curr.fn(acc), value)
      : value;

    return this.applyTypeConversion(field, output);
  }

  private applyTypeConversion(field: FieldRef, value: string) {
    switch (field.field.kind) {
      case "number": {
        const output = Number.parseFloat(value);
        if (isNaN(output)) {
          throw new Error(
            `Wrong format of number value \`${value}\` at path \`${pathStr(field.path)}\``,
          );
        }
        return output;
      }

      case "integer": {
        const output = Number.parseInt(value);
        if (isNaN(output)) {
          throw new Error(
            `Wrong format of integer value \`${value}\` at path \`${pathStr(field.path)}\``,
          );
        } else {
          const floatValue = Number.parseFloat(value);
          const diff = floatValue - output;
          if (diff) {
            throw new Error(
              `Wrong format of integer value \`${value}\` at path \`${pathStr(field.path)}\``,
            );
          }
        }
        return output;
      }
      case "boolean":
        if (value.toLocaleLowerCase().trim() === "true") {
          return true;
        } else if (value.toLocaleLowerCase().trim() === "false") {
          return false;
        }
        throw new Error(
          `Wrong format of boolean value \`${value}\` at path \`${pathStr(field.path)}\``,
        );

      case "text":
        return value.trim();
      case "constant": {
        value = value.trim();
        const constField = field.field as ConstantField;
        const found = constField.values.some((v) => v === value);
        if (found) {
          return value;
        } else {
          throw new Error(
            `Unsupported const value \`${value}\` at path \`${pathStr(field.path)}\`. Supported values are: ${constField.values.join(",")} `,
          );
        }
      }
      case "array": {
        value = unwrapString(value.trim(), {
          start: ["[", "(", "<"],
          end: ["]", ")", ">"],
        }).trim();

        // Bullet list
        const BULLET_SIGNS: string[] = [
          "•", // U+2022 Bullet
          "◦", // U+25E6 White (hollow) bullet
          "●", // U+25CF Black circle
          "○", // U+25CB White circle
          "‣", // U+2023 Triangular bullet
          "⁃", // U+2043 Hyphen bullet
          "∙", // U+2219 Bullet operator
          "▪", // U+25AA Black small square
          "▫", // U+25AB White small square
          "■", // U+25A0 Black square
          "◾", // U+25FE Black medium-small square
          "▸", // U+25B8 Black right-pointing small triangle
          "►", // U+25BA Black right-pointing pointer
          "❖", // U+2756 Black diamond with white X
          "♦", // U+2666 Black diamond
          "–", // U+2013 En dash
          "-", // U+002D Hyphen-minus
          "*", // U+002A Asterisk
          "+", // U+002B Plus sign
          "·", // U+00B7 Middle dot
        ] as const;
        const usedBulletSign = BULLET_SIGNS.find((s) =>
          value.trimStart().startsWith(s),
        );
        const rawSplit = value
          .split(usedBulletSign ? "\n" : ",")
          .map((v) => (usedBulletSign ? v.replace(usedBulletSign, "") : v));

        const type = field.field.type;
        const constants = field.field.constants;
        const split = rawSplit.map((val, idx) => {
          val = unwrapString(val.trim(), {
            start: ['"', "'", "`"],
            greedy: true,
          });

          let newField;
          if (type === "constant") {
            if (!constants) {
              throw new Error(`Missing constants at field \`\``);
            }
            newField = {
              kind: type,
              name: `[${idx}]`,
              values: clone(constants),
            };
          } else {
            newField = { kind: type, name: `[${idx}]` };
          }

          const out = this.applyTypeConversion(
            {
              field: newField,
              path: field.path.concat([`[${idx}]`]),
            },
            val,
          ) as number | string | boolean;
          return out;
        });

        return split;
      }
      case "object":
      case "comment":
        throw new Error(
          `Unsupported type conversion \`${field.field.kind}\` at path \`${pathStr(field.path)}\``,
        );
    }
  }

  private static getParamNameString<TResult>(
    protocol: Protocol<TResult>,
    path: string[],
    paramName: string,
    newLineBeginning: boolean,
  ) {
    return `${newLineBeginning ? "\n" : ""}${protocol.indent.repeat(path.length)}${paramName}:`;
  }
}
