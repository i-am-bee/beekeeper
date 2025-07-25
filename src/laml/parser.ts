import { clone } from "remeda";
import { ConstantField, FieldKind, ListFieldType } from "./dto.js";
import { ParserOutput } from "./parser-output.js";
import { DEFAULT_INDENT, FieldRef, Protocol } from "./protocol.js";
import { pathStr, truncateText, unwrapString } from "./utils.js";

export class ParseError extends Error {
  constructor(
    message: string,
    public path: string[],
  ) {
    super(message);
    this.name = "ParseError";
  }
  toString() {
    return `ParseError: ${this.message} at path \`${pathStr(this.path)}\``;
  }
}

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
  "·", // U+00B7 Middle dot
] as const;

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
      throw new ParseError(`Protocol is not defined`, []);
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
          throw new ParseError(
            `Unparseable field kind \`${field.kind}\` at path \`${pathStr(path)}\``,
            path,
          );
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
            throw new ParseError(
              `Data doesn't contain required parameter \`${paramNameString}\``,
              path,
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
            throw new ParseError(
              `Can't find field \`${pathStr(path.concat(field.name))}\`. It should start with \`${paramNameString}\` but actually starts with \`${truncated}\``,
              path,
            );
          }
        }

        rest = rest.substring(paramNameString.length);
        const fieldPath = path.concat(field.name);
        if (field.kind !== "object") {
          const end = this.getEndIndex(nextFields, rest);
          const value = end >= 0 ? rest.substring(0, end) : rest;
          const convertedValue = this.applyConversions(
            { field, path: fieldPath },
            value,
          );
          output.set(fieldPath, convertedValue);
          rest = rest.length > value.length ? rest.substring(value.length) : "";
        } else {
          // Remove everything until the new line. LLM often adds extra spaces or pipes, but object attributes should start from the new line.
          const newLineIndex = rest.indexOf("\n");
          if (newLineIndex > 0) {
            rest = rest.substring(newLineIndex);
          }
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
          envelops: [
            ["[", "]"],
            ["(", ")"],
            ["<", ">"],
          ],
        }).trim();

        const usedBulletSign = BULLET_SIGNS.find((s) =>
          value.trimStart().startsWith(s),
        );
        const rawSplit =
          value.length === 0
            ? []
            : value
                .split(usedBulletSign ? "\n" : ",")
                .map((v) =>
                  usedBulletSign ? v.replace(usedBulletSign, "") : v,
                );

        const type = field.field.type;
        const constants = field.field.constants;
        const split = rawSplit.map((val, idx) => {
          val = unwrapString(val.trim(), {
            envelops: [
              ['"', '"'],
              ["'", "'"],
              ["`", "`"],
            ],
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
      case "list": {
        const getNeedles = (type: ListFieldType, num: number) => {
          return (type === "numbered" ? [String(num)] : BULLET_SIGNS).map(
            (s) => ({
              sign: s,
              value: `\n${DEFAULT_INDENT.repeat(field.path.length)}${s}`,
            }),
          );
        };

        const result = [];
        let rest = value;

        let num = 0;
        do {
          num++;

          const findNeedle = (needles: ReturnType<typeof getNeedles>) => {
            // Test all needles mainly used for different variants of bullets. TODO It can be done better via regexp.
            let needle;
            let tmpNeedle;
            let index = -1;
            while ((tmpNeedle = needles.pop()) && index < 0) {
              index = rest.indexOf(tmpNeedle.value);
              needle = tmpNeedle;
            }

            if (index < 0 || !needle) {
              return null;
            }

            return { index, needle };
          };

          const startNeedles = getNeedles(field.field.type, num);
          const start = findNeedle(startNeedles);
          if (!start) {
            break;
          }
          const startIndex =
            start.index +
            start.needle.value.length -
            1 +
            start.needle.sign.length;
          if (startIndex < 0) {
            break;
          }
          const endNeedles = getNeedles(field.field.type, num + 1);
          const end = findNeedle(endNeedles);
          const endIndex = end ? end.index : rest.length;
          const slice =
            endIndex >= 0
              ? rest.slice(startIndex, endIndex)
              : rest.slice(startIndex);

          const sanitized = unwrapString(slice, {
            start: [".", ")"],
          }).trim();

          result.push(sanitized);
          if (startIndex + 1 >= rest.length) {
            break;
          }
          rest = rest.slice(startIndex + 1);
        } while (rest.length);
        return result;
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

  private getEndIndex(nextFields: FieldRef[] | undefined, rest: string) {
    let end = -1;
    if (!nextFields) {
      return end;
    }

    let idx = 0;
    for (const nextFieldRef of nextFields) {
      const afterNextFieldRef =
        idx + 1 < nextFields.length ? nextFields[idx + 1] : undefined;

      if (nextFieldRef.field.kind === "comment") {
        throw new Error(
          `Unparsable next field kind \`${nextFieldRef.field.kind}\``,
        );
      }
      const nextParamNameString = Parser.getParamNameString(
        this._protocol,
        nextFieldRef.path,
        nextFieldRef.field.name,
        true,
      );

      if (
        !afterNextFieldRef ||
        nextFieldRef.path.length > afterNextFieldRef.path.length
      ) {
        // FIXME Handle case of the same attribute on the same level but in different following object. This will take it!
        end = rest.lastIndexOf(`${nextParamNameString}`);
      } else {
        end = rest.indexOf(`${nextParamNameString}`);
      }

      if (end >= 0) {
        break;
      }
      idx++;
    }
    return end;
  }
}
