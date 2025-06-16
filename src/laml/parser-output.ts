import { clone } from "remeda";
import { LAMLObject, LAMLValue } from "./dto.js";
import { pathStr } from "./utils.js";

// export type OutputPrimitiveValue = string | number | boolean | string[];
// export type OutputValue =
//   | OutputPrimitiveValue
//   | OutputObject
//   | OutputObjectArray;
// export type OutputObjectArray = OutputValue[];
// export interface OutputObject {
//   [key: string]: OutputValue;
// }

export class ParserOutput {
  protected _output: LAMLObject = {};

  get result() {
    return clone(this._output);
  }

  set(path: string[], value: LAMLValue) {
    let idx = 0;
    let temp = this._output;
    const currentPath = [];
    for (const pathPart of path) {
      const isLast = idx + 1 === path.length;
      currentPath.push(pathPart);
      if (!isLast) {
        let obj = temp[pathPart];
        if (!obj) {
          obj = {};
          temp[pathPart] = obj;
          temp = obj;
        } else if (typeof obj !== "object") {
          throw new Error(
            `Cannot access property on primitive value at path '${pathStr(currentPath)}'. Expected an object but received a primitive type.`,
          );
        } else {
          temp = obj as LAMLObject;
        }
      } else {
        temp[pathPart] = value;
      }
      idx++;
    }
  }

  get(path: string[]) {
    let idx = 0;
    let temp = this._output;
    const currentPath = [];
    for (const pathPart of path) {
      currentPath.push(pathPart);
      const isLast = idx + 1 === path.length;
      if (!isLast) {
        const obj = temp[pathPart];
        if (!obj) {
          throw new Error(`Missing object at path '${pathStr(currentPath)}'.`);
        } else if (typeof obj !== "object") {
          throw new Error(
            `Cannot access property on primitive value at path '${pathStr(currentPath)}'. Expected an object but received a primitive type.`,
          );
        } else {
          temp = obj as LAMLObject;
        }
      } else {
        return temp[pathPart];
      }
      idx++;
    }
  }
}
