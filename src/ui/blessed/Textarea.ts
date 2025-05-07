import blessed from "neo-blessed";
import unicode from "neo-blessed/lib/unicode";

const nextTick = global.setImmediate || process.nextTick.bind(process);

type TextareaElement = blessed.Widgets.TextareaElement;
type TextareaOptions = blessed.Widgets.TextareaOptions;
type BlessedElement = blessed.Widgets.BlessedElement;
type Coords = blessed.Widgets.Coords;
type IKeyEventArg = blessed.Widgets.Events.IKeyEventArg;

const InputElement = blessed.input as unknown as new (
  opts: TextareaOptions,
) => TextareaElement & {
  _value: string;
  _clines: [];
  _reading: boolean;
  _getCoords: () => BlessedElement["lpos"];
  _render: () => Coords;
  _callback?: (err: any, value?: string) => void;
  _done?: (err: any, value?: string | null) => void;
  screen: {
    _listenKeys: (element: TextareaElement) => void;
  };
  clearInput: () => void;
};

export class Textarea extends InputElement {
  private __listener?: (ch: any, key: IKeyEventArg) => void;
  private __done?: (err: any, value?: string | null) => void;

  constructor(opts: TextareaOptions) {
    const options: TextareaOptions = {
      ...opts,
      scrollable: opts.scrollable !== false,
    };

    super(options);

    this.screen._listenKeys(this);

    this.options = options;
    this.value = options.value || "";

    this.on("resize", this._updateCursor.bind(this));
    this.on("move", this._updateCursor.bind(this));

    if (options.inputOnFocus) {
      this.on("focus", this.readInput.bind(this, undefined));
    }

    if (!options.inputOnFocus && options.keys) {
      this.on("keypress", (ch: any, key: IKeyEventArg) => {
        if (this._reading) {
          return;
        }

        if (key.name === "enter" || (options.vi && key.name === "i")) {
          return this.readInput();
        }

        if (key.name === "e") {
          return this.readEditor();
        }
      });
    }

    if (options.mouse) {
      this.on("click", (data) => {
        if (this._reading || data.button !== "right") {
          return;
        }

        this.readEditor();
      });
    }
  }

  _updateCursor(get?: boolean) {
    if (this.screen.focused !== this) {
      return;
    }

    const lpos = get ? this.lpos : this._getCoords();
    if (!lpos) {
      return;
    }

    let last = this._clines[this._clines.length - 1],
      line;
    const program = this.screen.program;

    // Stop a situation where the textarea begins scrolling
    // and the last cline appears to always be empty from the
    // _typeScroll `+ '\n'` thing.
    // Maybe not necessary anymore?
    if (last === "" && this.value[this.value.length - 1] !== "\n") {
      last = this._clines[this._clines.length - 2] || "";
    }

    line = Math.min(
      this._clines.length - 1 - (this.childBase || 0),
      lpos.yl - lpos.yi - (this.iheight as number) - 1,
    );

    // When calling clearValue() on a full textarea with a border, the first
    // argument in the above Math.min call ends up being -2. Make sure we stay
    // positive.
    line = Math.max(0, line);

    const cy = lpos.yi + (this.itop as number) + line;
    const cx =
      lpos.xi +
      (this.ileft as number) +
      (this.strWidth(last) as unknown as number); // strWidth actually returns number

    // XXX Not sure, but this may still sometimes
    // cause problems when leaving editor.
    if (cy === program.y && cx === program.x) {
      return;
    }

    if (cy === program.y) {
      if (cx > program.x) {
        program.cuf(cx - program.x);
      } else if (cx < program.x) {
        program.cub(program.x - cx);
      }
    } else if (cx === program.x) {
      if (cy > program.y) {
        program.cud(cy - program.y);
      } else if (cy < program.y) {
        program.cuu(program.y - cy);
      }
    } else {
      program.cup(cy, cx);
    }
  }

  _typeScroll() {
    // XXX Workaround
    const height = (this.height as number) - (this.iheight as number);
    if (this._clines.length - this.childBase > height) {
      this.scroll(this._clines.length);
    }
  }

  _listener(ch: any, key: Partial<IKeyEventArg>) {
    const done = this._done;
    const value = this.value;

    if (key.name === "return") {
      return;
    }
    if (key.name === "enter") {
      ch = "\n";
    }

    // TODO: Handle directional keys.
    if (
      key.name === "left" ||
      key.name === "right" ||
      key.name === "up" ||
      key.name === "down"
    ) {
      // console.log(key.name);
    }

    if (this.options.keys && key.ctrl && key.name === "e") {
      return this.readEditor();
    }

    // TODO: Optimize typing by writing directly
    // to the screen and screen buffer here.
    if (key.name === "escape") {
      done?.(null, null);
    } else if (key.name === "backspace") {
      if (this.value.length) {
        if (this.screen.fullUnicode) {
          if (unicode.isSurrogate(this.value, this.value.length - 2)) {
            this.value = this.value.slice(0, -2);
          } else {
            this.value = this.value.slice(0, -1);
          }
        } else {
          this.value = this.value.slice(0, -1);
        }
      }
    } else if (ch) {
      // eslint-disable-next-line no-control-regex
      if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
        this.value += ch;
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
      this._typeScroll();
      this._updateCursor();
    }
  }

  clearValue() {
    return this.setValue("");
  }

  submit() {
    if (!this._listener) {
      return;
    }

    return this._listener("\x1b", { name: "escape" });
  }

  cancel() {
    if (!this._listener) {
      return;
    }

    return this._listener("\x1b", { name: "escape" });
  }

  render() {
    this.setValue();
    return this._render();
  }

  readInput(callback?: (err: any, value?: string) => void) {
    const self = this;
    const focused = this.screen.focused === this;

    if (this._reading) {
      return;
    }
    this._reading = true;

    this._callback = callback;

    if (!focused) {
      this.screen.saveFocus();
      this.focus();
    }

    this.screen.grabKeys = true;

    this._updateCursor();
    this.screen.program.showCursor();
    //this.screen.program.sgr('normal');

    this._done = function fn(err, value) {
      if (!self._reading) {
        return;
      }

      if ((fn as any).done) {
        return;
      }
      (fn as any).done = true;

      self._reading = false;

      delete self._callback;
      delete self._done;

      if (self.__listener) {
        self.removeListener("keypress", self.__listener);
        delete self.__listener;
      }

      if (self.__done) {
        self.removeListener("blur", self.__done);
        delete self.__done;
      }

      self.screen.program.hideCursor();
      self.screen.grabKeys = false;

      if (!focused) {
        self.screen.restoreFocus();
      }

      if (self.options.inputOnFocus) {
        self.screen.rewindFocus();
      }

      // Ugly
      if (err === "stop") {
        return;
      }

      if (err) {
        self.emit("error", err);
      } else if (value != null) {
        self.emit("submit", value);
      } else {
        self.emit("cancel", value);
      }
      self.emit("action", value);

      if (!callback) {
        return;
      }

      return err
        ? callback(err)
        : callback(null, value != null ? value : undefined);
    };

    // Put this in a nextTick so the current
    // key event doesn't trigger any keys input.
    nextTick(() => {
      self.__listener = self._listener.bind(self);
      self.on("keypress", self.__listener);
    });

    this.__done = this._done.bind(this, null, null);
    this.on("blur", this.__done);
  }

  readEditor(callback?: (err: any, value?: string) => void) {
    if (this._reading) {
      const _cb = this._callback;
      const cb = callback;

      this._done?.("stop");

      callback = (err, value) => {
        if (_cb) {
          _cb(err, value);
        }

        if (cb) {
          cb(err, value);
        }
      };
    }

    if (!callback) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      callback = () => {};
    }

    return this.screen.readEditor({ value: this.value }, (err, value) => {
      if (err) {
        if (err.message === "Unsuccessful.") {
          this.screen.render();
          return this.readInput(callback);
        }

        this.screen.render();
        this.readInput(callback);

        return callback(err);
      }

      this.setValue(value as unknown as string);
      this.screen.render();

      return this.readInput(callback);
    });
  }
}

Textarea.prototype.input = Textarea.prototype.readInput;
Textarea.prototype.setInput = Textarea.prototype.readInput;

Textarea.prototype.clearInput = Textarea.prototype.clearValue;

Textarea.prototype.editor = Textarea.prototype.readEditor;
Textarea.prototype.setEditor = Textarea.prototype.readEditor;
