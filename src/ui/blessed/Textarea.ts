import { noop } from "@/utils/noop.js";
import blessed from "neo-blessed";

const nextTick = global.setImmediate || process.nextTick.bind(process);

type TextareaElement = blessed.Widgets.TextareaElement;
type TextareaOptions = blessed.Widgets.TextareaOptions;
type BlessedElement = blessed.Widgets.BlessedElement;
type Coords = blessed.Widgets.Coords;
type IKeyEventArg = blessed.Widgets.Events.IKeyEventArg;
type CallbackFn = (err: any, value?: string) => void;

interface Clines {
  real: string[];
  fake: string[];
  rtof: number[];
  length: number;
  [index: number]: string;
}

const InputElement = blessed.input as unknown as new (
  opts: TextareaOptions,
) => TextareaElement & {
  _value: string;
  _clines: Clines;
  _reading: boolean;

  _getCoords: () => BlessedElement["lpos"];
  _wrapContent: (content: string, width: number) => Clines;
  _render: () => Coords;
  _callback?: CallbackFn;

  screen: {
    _listenKeys: (element: TextareaElement) => void;
  };

  clearInput: () => void;
  done?: CallbackFn;
};

export class Textarea extends InputElement {
  private offsetY: number;
  private offsetX: number;

  constructor(opts: TextareaOptions) {
    const options: TextareaOptions = {
      ...opts,
      scrollable: opts.scrollable ?? true,
    };

    super(options);

    this.options = options;
    this.value = options.value || "";
    this.offsetY = 0;
    this.offsetX = 0;

    this.setupEventHandlers(options);
  }

  private setupEventHandlers(options: TextareaOptions) {
    const { inputOnFocus, keys, vi, mouse } = options;

    this.screen._listenKeys(this);

    this.on("resize", this.updateCursor.bind(this));
    this.on("move", this.updateCursor.bind(this));

    if (inputOnFocus) {
      this.on("focus", this.readInput.bind(this, undefined));
    } else if (keys) {
      this.on("keypress", (ch: any, key: IKeyEventArg) => {
        if (this._reading) {
          return;
        }

        const { name } = key;
        const isEnter = name === "enter";
        const isViInsert = vi && name === "i";
        const isEditorKey = name === "e";

        if (isEnter || isViInsert) {
          return this.readInput();
        }

        if (isEditorKey) {
          return this.readEditor();
        }
      });
    }

    if (mouse) {
      this.on("click", ({ button }) => {
        const isRightClick = button === "right";

        if (this._reading || isRightClick) {
          return;
        }

        this.readEditor();
      });
    }
  }

  private getCursor() {
    return {
      x: this.offsetX,
      y: this.offsetY,
    };
  }

  private setCursor(x: number, y: number) {
    this.offsetX = x;
    this.offsetY = y;
  }

  private moveCursor(x: number, y: number) {
    const totalLines = this._clines.length;
    const currentLineIndex = totalLines - 1 + this.offsetY;
    const isYInRange = y <= 0 && y > -totalLines;

    let shouldSyncX = false;

    if (isYInRange) {
      shouldSyncX = this.offsetY !== y;

      this.offsetY = y;
    }

    const targetLineIndex = totalLines - 1 + this.offsetY;
    const targetLine = this._clines[targetLineIndex];
    const targetLineWidth = Number(this.strWidth(targetLine));

    if (shouldSyncX) {
      const currentLine = this._clines[currentLineIndex];
      const currentLineWidth = Number(this.strWidth(currentLine));
      const positionFromLineStart = Math.max(
        currentLineWidth + this.offsetX,
        0,
      );

      x = -Math.max(0, targetLineWidth - positionFromLineStart);
    }

    const isXInRange = x <= 0 && x >= -targetLineWidth;

    if (isXInRange) {
      this.offsetX = x;
    }

    this.updateCursor(true);
    this.screen.render();
  }

  private updateCursor(get?: boolean) {
    const isFocused = this.screen.focused === this;

    if (!isFocused) {
      return;
    }

    const lpos = get ? this.lpos : this._getCoords();

    if (!lpos) {
      return;
    }

    const { yi, yl, xi } = lpos;
    const program = this.screen.program;
    const currentLineIndex = this._clines.length - 1 + this.offsetY;
    const clineOffset = currentLineIndex - (this.childBase || 0);
    const availableLines = yl - yi - Number(this.iheight) - 1;
    const line = Math.max(0, Math.min(clineOffset, availableLines));
    let currentLine = this._clines[currentLineIndex];

    if (currentLine === "" && this.value.at(-1) !== "\n") {
      currentLine = this._clines[currentLineIndex - 1] ?? "";
    }

    const cy = yi + Number(this.itop) + line;
    const cx =
      this.offsetX +
      xi +
      Number(this.ileft) +
      Number(this.strWidth(currentLine));
    const dy = cy - program.y;
    const dx = cx - program.x;

    if (dy === 0 && dx === 0) {
      return;
    }

    if (dy === 0) {
      dx > 0 ? program.cuf(dx) : program.cub(-dx);
    } else if (dx === 0) {
      dy > 0 ? program.cud(dy) : program.cuu(-dy);
    } else {
      program.cup(cy, cx);
    }
  }

  private typeScroll() {
    const currentLineIndex = this._clines.length - 1 + this.offsetY;

    this.setScroll(currentLineIndex);
  }

  private listener(ch: any, key: Partial<IKeyEventArg>) {
    const value = this.value;

    if (key.name === "return") {
      return;
    }

    if (key.name === "enter") {
      ch = "\n";
    }

    const cursor = this.getCursor();

    // TODO: Handle directional keys.
    if (
      key.name === "left" ||
      key.name === "right" ||
      key.name === "up" ||
      key.name === "down" ||
      key.name === "end" ||
      key.name === "home"
    ) {
      if (key.name === "left") {
        cursor.x--;
      } else if (key.name === "right") {
        cursor.x++;
      }
      if (key.name === "up") {
        cursor.y--;
      } else if (key.name === "down") {
        cursor.y++;
      }

      if (key.name === "end") {
        cursor.x = 0;
      } else if (key.name === "home") {
        const currentLine = this._clines.length - 1 + this.offsetY;
        const currentLineLength = Number(
          this.strWidth(this._clines[currentLine] ?? ""),
        );
        cursor.x = -currentLineLength;
      }

      this.moveCursor(cursor.x, cursor.y);
    }

    if (this.options.keys && key.ctrl && key.name === "e") {
      return this.readEditor();
    }

    // TODO: Optimize typing by writing directly
    // to the screen and screen buffer here.
    if (key.name === "escape") {
      this.done?.(null);
    } else if (key.name === "backspace") {
      if (this.value.length) {
        if (this.screen.fullUnicode) {
          //
        } else {
          if (cursor.x === 0 && cursor.y === 0) {
            this.value = this.value.slice(0, -1);
          } else {
            const realLines = this._clines.real.slice();
            const fakeLines = this._clines.fake.slice();
            const mapper = this._clines.rtof;

            const currentLine = realLines.length - 1 + cursor.y;

            const fakeLineIndex = mapper[currentLine];

            let fakeCursorPosition = 0;
            for (let i = 0; i <= currentLine; i++) {
              if (mapper[i] === fakeLineIndex) {
                fakeCursorPosition += Number(this.strWidth(realLines[i]));
              }
            }
            fakeCursorPosition += cursor.x;

            const realCursorPosition =
              Number(this.strWidth(realLines[currentLine])) + cursor.x;

            if (fakeLines[fakeLineIndex] === "") {
              fakeLines.splice(fakeLineIndex, 1);
            } else if (
              cursor.x === -Number(this.strWidth(realLines[currentLine]))
            ) {
              if (currentLine > 0) {
                const lineLengthBefore = Number(
                  this.strWidth(realLines[currentLine - 1] ?? ""),
                );

                if (mapper[currentLine] !== mapper[currentLine - 1]) {
                  const currentLineString = fakeLines.splice(fakeLineIndex, 1);
                  fakeLines[fakeLineIndex - 1] += currentLineString;
                }

                const predict = this._wrapContent(
                  fakeLines.join("\n"),
                  Number(this.width) - Number(this.iwidth),
                );

                cursor.x = -(
                  Number(this.strWidth(predict[currentLine - 1] ?? "")) -
                  lineLengthBefore
                );
                if (predict.real.length === realLines.length) {
                  cursor.y--;
                }
              }
            } else {
              fakeLines[fakeLineIndex] =
                fakeLines[fakeLineIndex].slice(0, fakeCursorPosition - 1) +
                fakeLines[fakeLineIndex].slice(fakeCursorPosition);
              const predict = this._wrapContent(
                fakeLines.join("\n"),
                Number(this.width) - Number(this.iwidth),
              );
              cursor.x = -(
                Number(this.strWidth(predict.real[currentLine])) -
                realCursorPosition +
                1
              );
              if (predict.real.length !== realLines.length) {
                cursor.y++;
              }
            }
            this.value = fakeLines.join("\n");
            this.setCursor(cursor.x, cursor.y);
          }
        }
      }
    } else if (key.name === "delete") {
      if (this.value.length) {
        if (this.screen.fullUnicode) {
          //
        } else {
          // const currentLine = this._clines.length - 1 + cursor.y;
          if (cursor.x === 0 && cursor.y === 0) {
            //
          } else {
            const realLines = this._clines.real.slice();
            const fakeLines = this._clines.fake.slice();
            const mapper = this._clines.rtof;

            const currentLine = realLines.length - 1 + cursor.y;

            const fakeLineIndex = mapper[currentLine];

            let fakeCursorPosition = 0;
            for (let i = 0; i <= currentLine; i++) {
              if (mapper[i] === fakeLineIndex) {
                fakeCursorPosition += Number(this.strWidth(realLines[i]));
              }
            }
            fakeCursorPosition += cursor.x;

            const realCursorPosition =
              Number(this.strWidth(realLines[currentLine])) + cursor.x;

            if (fakeLines[fakeLineIndex] === "") {
              const nextLineLength = Number(
                this.strWidth(fakeLines[fakeLineIndex + 1] ?? ""),
              );
              if (fakeLineIndex + 1 < fakeLines.length) {
                fakeLines.splice(fakeLineIndex, 1);
                cursor.y++;
                cursor.x = -nextLineLength;
              }
            } else {
              const lineLength = Number(
                this.strWidth(fakeLines[fakeLineIndex]),
              );

              if (fakeCursorPosition < lineLength) {
                fakeLines[fakeLineIndex] =
                  fakeLines[fakeLineIndex].slice(0, fakeCursorPosition) +
                  fakeLines[fakeLineIndex].slice(fakeCursorPosition + 1);

                const predict = this._wrapContent(
                  fakeLines.join("\n"),
                  Number(this.width) - Number(this.iwidth),
                );
                cursor.x = -(
                  Number(this.strWidth(predict.real[currentLine])) -
                  realCursorPosition
                );
                if (predict.real.length !== realLines.length) {
                  cursor.y++;
                }
              }
            }
            this.value = fakeLines.join("\n");
            this.setCursor(cursor.x, cursor.y);
          }
        }
      }
    } else if (ch) {
      // eslint-disable-next-line no-control-regex
      if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
        if (cursor.x === 0 && cursor.y === 0) {
          this.value += ch;
        } else if (cursor.x >= this.value.length * -1) {
          const realLines = this._clines.real.slice();
          const fakeLines = this._clines.fake.slice();
          const mapper = this._clines.rtof;

          const currentLine = realLines.length - 1 + cursor.y;

          const fakeLineIndex = mapper[currentLine];
          let fakeCursorPosition = 0;
          for (let i = 0; i <= currentLine; i++) {
            if (mapper[i] === fakeLineIndex) {
              fakeCursorPosition += Number(this.strWidth(realLines[i]));
            }
          }
          fakeCursorPosition += cursor.x;

          fakeLines[fakeLineIndex] =
            fakeLines[fakeLineIndex].slice(0, fakeCursorPosition) +
            ch +
            fakeLines[fakeLineIndex].slice(fakeCursorPosition);

          const predict = this._wrapContent(
            fakeLines.join("\n"),
            Number(this.width) - Number(this.iwidth),
          );
          if (ch === "\n") {
            if (predict.real.length === realLines.length) {
              cursor.y++;
            }
            cursor.x = -Number(
              this.strWidth(predict[predict.length - 1 + cursor.y]),
            );
          }

          this.value = fakeLines.join("\n");
          this.setCursor(cursor.x, cursor.y);
        }
      }
    }

    if (this.value !== value) {
      this.screen.render();
    }
  }

  getValue() {
    return this.value;
  }

  setValue(value?: string) {
    if (value == null) {
      value = this.value;
    }

    if (this._value !== value) {
      this.value = value;
      this._value = value;
      this.setContent(this.value);
      this.typeScroll();
      this.updateCursor();
    }
  }

  clearValue() {
    return this.setValue("");
  }

  submit() {
    return this.listener("\x1b", { name: "escape" });
  }

  cancel() {
    return this.listener("\x1b", { name: "escape" });
  }

  render() {
    this.setValue();

    return this._render();
  }

  readInput(callback: CallbackFn = noop) {
    if (this._reading) {
      return;
    }

    this._reading = true;
    this._callback = callback;

    const isFocused = this.screen.focused === this;

    if (!isFocused) {
      this.screen.saveFocus();
      this.focus();
    }

    this.screen.grabKeys = true;

    this.updateCursor();
    this.screen.program.showCursor();

    const onKeyPress = this.listener.bind(this);

    const done: CallbackFn = (err, value) => {
      if (!this._reading || (done as any).done) {
        return;
      }

      (done as any).done = true;

      this._reading = false;
      this._callback = undefined;
      this.done = undefined;

      this.removeListener("keypress", onKeyPress);

      this.screen.program.hideCursor();

      this.screen.grabKeys = false;

      if (!isFocused) {
        this.screen.restoreFocus();
      }

      if (this.options.inputOnFocus) {
        this.screen.rewindFocus();
      }

      if (err === "stop") {
        return;
      }

      if (err) {
        this.emit("error", err);
      } else if (value != null) {
        this.emit("submit", value);
      } else {
        this.emit("cancel", value);
      }

      this.emit("action", value);

      return err ? callback(err) : callback(null, value);
    };

    this.done = done;

    nextTick(() => {
      this.on("keypress", onKeyPress);
    });

    this.once("blur", this.done.bind(this, null));
  }

  readEditor(callback: CallbackFn = noop) {
    let mergedCallback = callback;

    if (this._reading) {
      const prevCallback = this._callback;
      const newCallback = callback;

      this.done?.("stop");

      mergedCallback = (err, value) => {
        prevCallback?.(err, value);
        newCallback(err, value);
      };
    }

    return this.screen.readEditor({ value: this.value }, (err, value) => {
      if (err) {
        this.screen.render();

        if (err.message === "Unsuccessful.") {
          return this.readInput(mergedCallback);
        }

        this.readInput(mergedCallback);

        return mergedCallback(err);
      }

      this.setValue(String(value));
      this.screen.render();

      return this.readInput(mergedCallback);
    });
  }
}

Textarea.prototype.input = Textarea.prototype.readInput;
Textarea.prototype.setInput = Textarea.prototype.readInput;

Textarea.prototype.clearInput = Textarea.prototype.clearValue;

Textarea.prototype.editor = Textarea.prototype.readEditor;
Textarea.prototype.setEditor = Textarea.prototype.readEditor;
