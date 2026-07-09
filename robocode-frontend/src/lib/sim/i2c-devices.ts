// Pure, framework-free I2C virtual-device decoders (same discipline as rp2040-boot.ts:
// no DOM, no postMessage). Exercised directly by scripts/rp2040-smoke.ts and driven by
// rp2040.worker.ts. The packed framebuffer / flat text snapshots are wire-ready.
//
// The rp2040js I2C "mode" (Write=0 / Read=1) is supplied to connect() by the caller but
// is ignored by both decoders (displays here are write-only on the data path; the read
// path is ACKed at the controller, not the decoder). We therefore keep this module free
// of any rp2040js import and type the mode as a plain number — I2CMode itself is imported
// from "rp2040js" only where the controller callbacks are installed (smoke + worker).

export interface I2cDecoder {
  readonly partId: string;
  readonly address: number;
  readonly kind: "lcd" | "oled";
  dirty: boolean;
  connect(mode: number): void;
  writeByte(value: number): void;
  stop(): void;
}

// PCF8574 backpack bit map (dominant Arduino/MicroPython I2C-LCD wiring). Kept as named
// constants so a clone variant is a one-line swap (see spec Risks: PCF8574 bit-wiring).
const LCD_RS = 0x01; // bit 0
const LCD_E = 0x04; // bit 2 (Enable strobe)
const LCD_BL = 0x08; // bit 3 (Backlight)

export class Lcd1602Decoder implements I2cDecoder {
  readonly partId: string;
  readonly address: number;
  readonly kind = "lcd" as const;
  dirty = false;

  private readonly cols: number;
  private readonly rows: number;
  private buf: string[][];
  private row = 0;
  private col = 0;
  private cursorStep = 1; // +1 / -1 (entry-mode increment direction)
  private displayOn = true;
  private backlight = false;
  private inCgram = false;
  private prevE = false;
  private pendingHighNibble: number | null = null;
  private pendingRs = false;

  constructor(opts: { partId: string; address: number; cols?: number; rows?: number }) {
    this.partId = opts.partId;
    this.address = opts.address;
    this.cols = opts.cols ?? 16;
    this.rows = opts.rows ?? 2;
    this.buf = this.blank();
  }

  private blank(): string[][] {
    return Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => " "));
  }

  connect(_mode: number): void {
    // PCF8574 LCD transactions are stateless across connects; nibble state persists.
  }

  stop(): void {}

  writeByte(b: number): void {
    this.backlight = (b & LCD_BL) !== 0;
    const e = (b & LCD_E) !== 0;
    // HD44780 4-bit: latch a nibble on the FALLING edge of E.
    if (this.prevE && !e) {
      const nibble = (b >> 4) & 0x0f;
      const rs = (b & LCD_RS) !== 0;
      if (this.pendingHighNibble === null) {
        this.pendingHighNibble = nibble; // HIGH nibble first
        this.pendingRs = rs; // rs is held steady across both nibbles by LCD libs
      } else {
        const value = (this.pendingHighNibble << 4) | nibble;
        this.pendingHighNibble = null;
        if (this.pendingRs) this.writeChar(value);
        else this.writeCommand(value);
      }
    }
    this.prevE = e;
  }

  private writeCommand(value: number): void {
    if (value === 0x01) {
      // Clear
      this.buf = this.blank();
      this.row = 0;
      this.col = 0;
    } else if (value === 0x02 || value === 0x03) {
      // Home
      this.row = 0;
      this.col = 0;
    } else if (value >= 0x04 && value <= 0x07) {
      // Entry mode set
      this.cursorStep = value & 0x02 ? 1 : -1;
    } else if (value >= 0x08 && value <= 0x0f) {
      // Display on/off
      this.displayOn = (value & 0x04) !== 0;
    } else if (value >= 0x40 && value <= 0x7f) {
      // Set CGRAM addr -> route subsequent char writes away from the screen
      this.inCgram = true;
    } else if (value >= 0x80) {
      // Set DDRAM addr
      this.inCgram = false;
      const addr = value & 0x7f;
      this.mapDdram(addr);
    }
    // 0x20-0x3F Function Set: ignored.
    this.dirty = true;
  }

  private mapDdram(addr: number): void {
    if (this.rows >= 4) {
      // Non-contiguous 20x4 HD44780 layout.
      if (addr >= 0x54) {
        this.row = 3;
        this.col = addr - 0x54;
      } else if (addr >= 0x40) {
        this.row = 1;
        this.col = addr - 0x40;
      } else if (addr >= 0x14) {
        this.row = 2;
        this.col = addr - 0x14;
      } else {
        this.row = 0;
        this.col = addr;
      }
    } else {
      if (addr >= 0x40) {
        this.row = 1;
        this.col = addr - 0x40;
      } else {
        this.row = 0;
        this.col = addr;
      }
    }
  }

  private writeChar(value: number): void {
    if (this.inCgram) return; // CGRAM glyph write: no-op, keep stream aligned.
    if (this.row >= 0 && this.row < this.rows && this.col >= 0 && this.col < this.cols) {
      this.buf[this.row][this.col] = String.fromCharCode(value);
      this.col = Math.max(0, Math.min(this.cols - 1, this.col + this.cursorStep));
      this.dirty = true;
    }
  }

  /** Flat cols*rows, row-major, each row right-padded to cols, NO separator. */
  get text(): string {
    let out = "";
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) out += this.buf[r][c] ?? " ";
    }
    return out;
  }
}

// Param-count class per opcode (the desync-critical model). Anything not listed = 0-param.
const SSD1306_PARAM_COUNT: Record<number, number> = {
  0x20: 1, // addressing mode
  0x21: 2, // column window
  0x22: 2, // page window
  0x81: 1, // contrast
  0xa8: 1, // multiplex ratio
  0xd3: 1, // display offset
  0xda: 1, // COM pins
  0xd5: 1, // clock divide
  0xd9: 1, // pre-charge
  0xdb: 1, // VCOMH deselect
  0x8d: 1, // charge pump
  0xad: 1, // (alt charge pump on some clones)
  0xd6: 1, // zoom
  0x26: 6, // right horizontal scroll (alignment insurance)
  0x27: 6, // left horizontal scroll
  0x29: 5, // vertical+right scroll
  0x2a: 5, // vertical+left scroll
  0xa3: 2, // set vertical scroll area
};

export class Ssd1306Decoder implements I2cDecoder {
  readonly partId: string;
  readonly address: number;
  readonly kind = "oled" as const;
  dirty = false;

  private fb = new Uint8Array(1024); // 8 pages x 128 cols, page-major
  private displayOnFlag = true;
  private inverseFlag = false;
  private colStart = 0;
  private colEnd = 127;
  private pageStart = 0;
  private pageEnd = 7;
  private colPtr = 0;
  private pagePtr = 0;

  // Per-transaction parse state.
  private sawCtrl = false; // have we consumed this write's leading control byte?
  private dataMode = false; // 0x40 stream -> GDDRAM data
  private singleCmd = false; // 0x80 framing -> exactly the next byte is a command
  private paramsLeft = 0;
  private pendingOpcode = -1;
  private params: number[] = [];

  constructor(opts: { partId: string; address: number }) {
    this.partId = opts.partId;
    this.address = opts.address;
  }

  connect(_mode: number): void {
    // New transaction: re-read the control byte; command-continuation counters persist
    // within an opcode but the leading control byte is per-write.
    this.sawCtrl = false;
    this.dataMode = false;
    this.singleCmd = false;
  }

  stop(): void {}

  writeByte(b: number): void {
    if (!this.sawCtrl) {
      this.sawCtrl = true;
      const dc = (b >> 6) & 1;
      const co = (b >> 7) & 1;
      if (dc === 1) {
        this.dataMode = true; // 0x40
      } else if (co === 1) {
        this.singleCmd = true; // 0x80: next one byte is a command
      }
      // else: 0x00 — remaining bytes are command bytes (no extra flag needed)
      return;
    }
    if (this.dataMode) {
      this.writeData(b);
      return;
    }
    // command byte (either 0x00 stream, or the single byte after 0x80)
    this.feedCommandByte(b);
    if (this.singleCmd) this.sawCtrl = false; // expect another control byte next write
  }

  private feedCommandByte(b: number): void {
    if (this.paramsLeft > 0) {
      this.params.push(b);
      this.paramsLeft--;
      if (this.paramsLeft === 0) this.applyOpcode(this.pendingOpcode, this.params);
      return;
    }
    this.pendingOpcode = b;
    this.params = [];
    const count = SSD1306_PARAM_COUNT[b] ?? 0;
    if (count === 0) this.applyOpcode(b, []);
    else this.paramsLeft = count;
  }

  private applyOpcode(op: number, params: number[]): void {
    switch (op) {
      case 0x21: // column window
        this.colStart = params[0] & 0x7f;
        this.colEnd = params[1] & 0x7f;
        this.colPtr = this.colStart;
        this.pagePtr = this.pageStart;
        break;
      case 0x22: // page window
        this.pageStart = params[0] & 0x07;
        this.pageEnd = params[1] & 0x07;
        this.pagePtr = this.pageStart;
        this.colPtr = this.colStart;
        break;
      case 0xae:
        this.displayOnFlag = false;
        break;
      case 0xaf:
        this.displayOnFlag = true;
        break;
      case 0xa6:
        this.inverseFlag = false;
        break;
      case 0xa7:
        this.inverseFlag = true;
        break;
      // 0x20 (addressing mode) + all skip-set opcodes: consumed by class, no effect.
    }
    this.dirty = true;
  }

  private writeData(value: number): void {
    this.fb[this.pagePtr * 128 + this.colPtr] = value;
    this.colPtr++;
    if (this.colPtr > this.colEnd) {
      this.colPtr = this.colStart;
      this.pagePtr++;
      if (this.pagePtr > this.pageEnd) this.pagePtr = this.pageStart;
    }
    this.dirty = true;
  }

  /** Packed 1024-byte GDDRAM (page-major, 8 pages x 128 cols, LSB = top row of page). */
  get framebufferBytes(): Uint8Array {
    return this.fb;
  }
  get displayOn(): boolean {
    return this.displayOnFlag;
  }
  get inverse(): boolean {
    return this.inverseFlag;
  }
}
