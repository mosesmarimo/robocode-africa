// Headless gate (npx tsx). Boots REAL MicroPython firmware via rp2040js, injects
// main.py through a LittleFS image, and asserts SMOKE_OK serial + GP25 toggle
// (blink mode) or PWM_OK + ~0.5 decoded duty on GP0 (pwm mode), or decodes real
// hardware-I2C traffic into the pure i2c-devices.ts decoders and asserts the
// rendered LCD text / OLED framebuffer (lcd/oled/read modes).
//
// Exercises the EXACT rp2040-boot.ts code the Web Worker uses, minus DOM writes.
//   npx tsx scripts/rp2040-smoke.ts        → blink gate
//   npx tsx scripts/rp2040-smoke.ts pwm    → pwm-duty gate
//   npx tsx scripts/rp2040-smoke.ts lcd    → I2C-LCD HD44780 text decode gate
//   npx tsx scripts/rp2040-smoke.ts oled   → SSD1306 framebuffer decode gate (proves #135)
//   npx tsx scripts/rp2040-smoke.ts read   → I2C read-path (completeRead) ENODEV gate
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import {
  bootChip,
  loadBootromBytes,
  decodePwmDuty,
  decodePwmFreq,
  attachI2cDecoders,
} from "../src/lib/sim/rp2040-boot";
import { Lcd1602Decoder, Ssd1306Decoder, type I2cDecoder } from "../src/lib/sim/i2c-devices";
import { Ws2812Decoder } from "../src/lib/sim/neopixel-decoder";
import { GPIOPinState } from "rp2040js";

const ROOT = resolve(__dirname, "..");
const uf2 = new Uint8Array(
  readFileSync(resolve(ROOT, "public/sim/RPI_PICO-20241129-v1.24.1.uf2")),
);
const bootrom = loadBootromBytes(
  readFileSync(resolve(ROOT, "public/sim/rp2040-bootrom.bin")),
);

// littlefs is compiled for the web (it fetches its .wasm). In Node we read the
// wasm off disk from the installed package and hand the bytes to bootChip.
const require = createRequire(__filename);
const wasmBinary = new Uint8Array(
  readFileSync(require.resolve("littlefs/dist/littlefs.wasm")),
);

const MAIN_PY =
  'from machine import Pin\nimport time\nprint("SMOKE_OK")\nled = Pin(25, Pin.OUT)\nled.toggle()\n';
const PWM_PY =
  'from machine import Pin, PWM\np = PWM(Pin(0))\np.freq(1000)\np.duty_u16(32768)\nprint("PWM_OK")\n';
// 50 Hz @ 4915/65535 duty (~7.5%) is the standard RC-servo probe: a real servo's usable
// pulse-width window (0.5-2.5ms) sits within a 50 Hz period, at ~7.5% duty for the
// midpoint (1.5ms). decodePwmFreq must decode ~50 Hz; decodePwmDuty must decode ~0.075.
const SERVO_PY =
  'from machine import Pin, PWM\np = PWM(Pin(0))\np.freq(50)\np.duty_u16(4915)\nprint("SERVO_OK")\n';

// SSD1306 OLED: the bare RPI_PICO MicroPython UF2 does NOT freeze the `ssd1306`
// library (confirmed: "ssd1306" absent from the UF2 image), but it DOES ship
// `framebuf`. So we inline the STANDARD MicroPython framebuf-based ssd1306 driver
// (verbatim from micropython-lib) and drive it exactly as student code would:
// SSD1306_I2C(128,64,i2c) -> .text("HI",0,0) -> .show(). This emits the genuine
// SSD1306 init sequence (charge pump, addressing mode, col/page windows) followed
// by a 1024-byte MONO_VLSB GDDRAM data write through the real rp2040js HW-I2C
// controller — the exact traffic our Ssd1306Decoder must reconstruct.
const OLED_PY = [
  "from machine import Pin, I2C",
  "import framebuf",
  "",
  "SET_CONTRAST = 0x81",
  "SET_ENTIRE_ON = 0xA4",
  "SET_NORM_INV = 0xA6",
  "SET_DISP = 0xAE",
  "SET_MEM_ADDR = 0x20",
  "SET_COL_ADDR = 0x21",
  "SET_PAGE_ADDR = 0x22",
  "SET_DISP_START_LINE = 0x40",
  "SET_SEG_REMAP = 0xA0",
  "SET_MUX_RATIO = 0xA8",
  "SET_COM_OUT_DIR = 0xC0",
  "SET_DISP_OFFSET = 0xD3",
  "SET_COM_PIN_CFG = 0xDA",
  "SET_DISP_CLK_DIV = 0xD5",
  "SET_PRECHARGE = 0xD9",
  "SET_VCOM_DESEL = 0xDB",
  "SET_CHARGE_PUMP = 0x8D",
  "",
  "class SSD1306(framebuf.FrameBuffer):",
  "    def __init__(self, width, height, external_vcc):",
  "        self.width = width",
  "        self.height = height",
  "        self.external_vcc = external_vcc",
  "        self.pages = self.height // 8",
  "        self.buffer = bytearray(self.pages * self.width)",
  "        super().__init__(self.buffer, self.width, self.height, framebuf.MONO_VLSB)",
  "        self.init_display()",
  "    def init_display(self):",
  "        for cmd in (",
  "            SET_DISP,",
  "            SET_MEM_ADDR, 0x00,",
  "            SET_DISP_START_LINE,",
  "            SET_SEG_REMAP | 0x01,",
  "            SET_MUX_RATIO, self.height - 1,",
  "            SET_COM_OUT_DIR | 0x08,",
  "            SET_DISP_OFFSET, 0x00,",
  "            SET_COM_PIN_CFG, 0x02 if self.width > 2 * self.height else 0x12,",
  "            SET_DISP_CLK_DIV, 0x80,",
  "            SET_PRECHARGE, 0x22 if self.external_vcc else 0xF1,",
  "            SET_VCOM_DESEL, 0x30,",
  "            SET_CONTRAST, 0xFF,",
  "            SET_ENTIRE_ON,",
  "            SET_NORM_INV,",
  "            SET_CHARGE_PUMP, 0x10 if self.external_vcc else 0x14,",
  "            SET_DISP | 0x01,",
  "        ):",
  "            self.write_cmd(cmd)",
  "        self.fill(0)",
  "        self.show()",
  "    def show(self):",
  "        x0 = 0",
  "        x1 = self.width - 1",
  "        if self.width == 64:",
  "            x0 += 32",
  "            x1 += 32",
  "        self.write_cmd(SET_COL_ADDR)",
  "        self.write_cmd(x0)",
  "        self.write_cmd(x1)",
  "        self.write_cmd(SET_PAGE_ADDR)",
  "        self.write_cmd(0)",
  "        self.write_cmd(self.pages - 1)",
  "        self.write_data(self.buffer)",
  "",
  "class SSD1306_I2C(SSD1306):",
  "    def __init__(self, width, height, i2c, addr=0x3C, external_vcc=False):",
  "        self.i2c = i2c",
  "        self.addr = addr",
  "        self.temp = bytearray(2)",
  "        self.write_list = [b'\\x40', None]",
  "        super().__init__(width, height, external_vcc)",
  "    def write_cmd(self, cmd):",
  "        self.temp[0] = 0x80",
  "        self.temp[1] = cmd",
  "        self.i2c.writeto(self.addr, self.temp)",
  "    def write_data(self, buf):",
  "        self.write_list[1] = buf",
  "        self.i2c.writevto(self.addr, self.write_list)",
  "",
  "i2c = I2C(0, scl=Pin(5), sda=Pin(4))",
  "oled = SSD1306_I2C(128, 64, i2c)",
  'oled.text("HI", 0, 0)',
  "oled.show()",
  'print("OLED_OK")',
].join("\n") + "\n";

// I2C-LCD: a minimal HD44780 4-bit strobe stream sufficient to exercise the decoder's
// nibble latch + DDRAM map (NOT a byte-for-byte replica of any one backpack library;
// real PCF8574 libs use a 3-write E-pulse pattern, but the decoder latches on E's
// falling edge regardless, so a 2-write rising/falling pair per nibble suffices here).
// RS=bit0, E=bit2, BL=bit3, D4-D7=bits4-7.
const LCD_PY = [
  "from machine import Pin, I2C",
  "import time",
  "ADDR = 0x27",
  "i2c = I2C(0, scl=Pin(5), sda=Pin(4))",
  "def strobe(d):",
  "    i2c.writeto(ADDR, bytes([d | 0x04 | 0x08]))",
  "    i2c.writeto(ADDR, bytes([(d & ~0x04) | 0x08]))",
  "def write4(nib, rs):",
  "    strobe((nib & 0xF0) | (0x01 if rs else 0x00))",
  "def cmd(c):",
  "    write4(c & 0xF0, 0)",
  "    write4((c << 4) & 0xF0, 0)",
  "def chr_(ch):",
  "    write4(ord(ch) & 0xF0, 1)",
  "    write4((ord(ch) << 4) & 0xF0, 1)",
  "for c in (0x33,0x32,0x28,0x0C,0x06,0x01):",
  "    cmd(c); time.sleep_ms(2)",
  "cmd(0x80)",
  'for ch in "HI": chr_(ch)',
  'print("LCD_OK")',
].join("\n") + "\n";

// READ path: ACKed display address that the firmware also READS from (PCF8574 read-back).
const READ_PY = [
  "from machine import Pin, I2C",
  "ADDR = 0x27",
  "i2c = I2C(0, scl=Pin(5), sda=Pin(4))",
  "i2c.writeto(ADDR, bytes([0x08]))",
  "v = i2c.readfrom(ADDR, 1)",
  'print("READ_OK", v[0])',
].join("\n") + "\n";

const NEOPIXEL_PY = [
  "import neopixel",
  "from machine import Pin",
  "np = neopixel.NeoPixel(Pin(2), 2)",
  "np[0] = (255, 0, 0)",
  "np[1] = (0, 255, 0)",
  "np.write()",
  'print("NEOPIXEL_OK")',
].join("\n") + "\n";

const MODE = (() => {
  const a = process.argv[2];
  return a === "pwm" || a === "servo" || a === "lcd" || a === "oled" || a === "read" || a === "neopixel"
    ? a
    : "blink";
})();
const CODE_BY_MODE: Record<string, string> = {
  blink: MAIN_PY,
  pwm: PWM_PY,
  servo: SERVO_PY,
  lcd: LCD_PY,
  oled: OLED_PY,
  read: READ_PY,
  neopixel: NEOPIXEL_PY,
};

async function main() {
  const MARKER =
    MODE === "pwm" ? "PWM_OK"
    : MODE === "servo" ? "SERVO_OK"
    : MODE === "lcd" ? "LCD_OK"
    : MODE === "oled" ? "OLED_OK"
    : MODE === "read" ? "READ_OK"
    : MODE === "neopixel" ? "NEOPIXEL_OK"
    : "SMOKE_OK";
  let sawSmoke = false;
  let gpio25Toggled = false;
  let ready = false;
  let done = false;
  let doneResolve!: () => void;
  const finished = new Promise<void>((r) => {
    doneResolve = r;
  });

  const settle = () => {
    if (MODE === "blink" && sawSmoke && gpio25Toggled && !done) {
      done = true;
      doneResolve();
    } else if (MODE !== "blink" && MODE !== "pwm" && MODE !== "servo" && sawSmoke && !done) {
      done = true;
      doneResolve();
    }
  };

  const chip = await bootChip({
    bootrom,
    uf2,
    code: CODE_BY_MODE[MODE],
    wasmBinary,
    onSerialLine: (line) => {
      if (line.includes(MARKER)) sawSmoke = true;
      if (line.length > 0) console.log("[serial]", line);
      settle();
    },
    onReady: () => {
      ready = true;
    },
  });

  // Pre-run sanity: firmware bytes present in flash (ARM vector table at
  // flash[0..3] not all 0xFF). Disambiguates a dead UF2 parse / wrong
  // FLASH_START_ADDRESS from a wrong LittleFS offset.
  const v = chip.rp2040.flash;
  if (v[0] === 0xff && v[1] === 0xff && v[2] === 0xff && v[3] === 0xff) {
    throw new Error(
      "FAIL: UF2 parse wrote nothing to flash[0..3] (parseUf2IntoFlash / FLASH_START off)",
    );
  }

  chip.rp2040.gpio[25].addListener(() => {
    gpio25Toggled = true;
    settle();
  });

  // B3 spike: attach the SAME Ws2812Decoder + high-check the worker uses to
  // the DIN GPIO (2). Capture early HIGH-pulse widths to confirm the 600 ns
  // threshold sits between the real firmware's T0H/T1H. (Debug-only — the
  // assert below keys on snapshot().pixels, not on these widths.)
  const npDec = new Ws2812Decoder({ partId: "np-spike" });
  const measuredHighWidths: number[] = [];
  let npLastRise: number | null = null;
  chip.rp2040.gpio[2].addListener((state) => {
    const nanos = chip.rp2040.clock.nanos;
    const hi = state === GPIOPinState.High;
    if (hi) {
      npLastRise = nanos;
    } else if (npLastRise !== null && measuredHighWidths.length < 8) {
      measuredHighWidths.push(nanos - npLastRise);
    }
    npDec.edge(nanos, hi);
  });

  // Attach decoders to BOTH I2C controllers, routing by address (same I2cDecoder contract,
  // same attachI2cDecoders wiring, the worker uses — Task 9 dedup). The 0xff read-back ACKs
  // a PCF8574 read so the READ path cannot ENODEV.
  const lcd = new Lcd1602Decoder({ partId: "lcd", address: 0x27, cols: 16, rows: 2 });
  const oled = new Ssd1306Decoder({ partId: "oled", address: 0x3c });
  const byBusAddr: [Map<number, I2cDecoder>, Map<number, I2cDecoder>] = [
    new Map<number, I2cDecoder>([[0x27, lcd], [0x3c, oled]]),
    new Map<number, I2cDecoder>([[0x27, lcd], [0x3c, oled]]),
  ];
  attachI2cDecoders(chip.rp2040, byBusAddr);

  chip.start();
  // Race the assertions against a 15s wall-clock ceiling (USB enumeration + main.py).
  await Promise.race([finished, new Promise((r) => setTimeout(r, 15000))]);

  if (MODE === "pwm") {
    let duty: number | null = null;
    for (let i = 0; i < 50; i++) {
      duty = decodePwmDuty(chip.rp2040, 0);
      if (duty !== null && duty > 0) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    chip.stop();
    console.log("ready:", ready, "PWM_OK:", sawSmoke);
    console.log("decoded duty GP0:", duty);
    if (!sawSmoke)
      throw new Error("FAIL: PWM_OK not seen — main.py never ran (LFS/boot path)");
    if (duty === null)
      throw new Error("FAIL: GP0 not in PWM mode (functionSelect != FUNCTION_PWM)");
    if (!(duty > 0.3 && duty < 0.7))
      throw new Error(`FAIL: decoded duty ${duty} not ~0.5`);
    console.log("PASS (pwm)");
    return;
  }

  if (MODE === "servo") {
    let duty: number | null = null;
    let freq: number | null = null;
    for (let i = 0; i < 50; i++) {
      duty = decodePwmDuty(chip.rp2040, 0);
      freq = decodePwmFreq(chip.rp2040, 0);
      if (duty !== null && duty > 0 && freq !== null) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    chip.stop();
    console.log("ready:", ready, "SERVO_OK:", sawSmoke);
    console.log("decoded freq GP0:", freq, "decoded duty GP0:", duty);
    if (!sawSmoke)
      throw new Error("FAIL: SERVO_OK not seen — main.py never ran (LFS/boot path)");
    if (duty === null || freq === null)
      throw new Error("FAIL: GP0 not in PWM mode (functionSelect != FUNCTION_PWM)");
    if (!(freq > 49 && freq < 51))
      throw new Error(`FAIL: decoded freq ${freq} not ~50 Hz`);
    if (!(duty > 0.06 && duty < 0.09))
      throw new Error(`FAIL: decoded duty ${duty} not ~0.075`);
    console.log("PASS (servo)");
    return;
  }

  if (MODE === "neopixel") {
    let snap = npDec.snapshot();
    for (let i = 0; i < 50; i++) {
      snap = npDec.snapshot();
      if (snap.pixels.length >= 6 && sawSmoke) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    chip.stop();
    console.log("ready:", ready, "NEOPIXEL_OK:", sawSmoke);
    console.log("frameCount:", npDec.frameCount);
    console.log("measured HIGH widths (ns):", JSON.stringify(measuredHighWidths));
    console.log("decoded pixels:", JSON.stringify(snap.pixels));
    if (!sawSmoke)
      throw new Error("FAIL: NEOPIXEL_OK not seen — main.py never ran (LFS/boot path)");
    const expected = [255, 0, 0, 0, 255, 0];
    const got = snap.pixels;
    const equal =
      got.length === expected.length && expected.every((v, i) => v === got[i]);
    if (!equal)
      throw new Error(
        `FAIL: decoded ${JSON.stringify(got)} != ${JSON.stringify(expected)} — ` +
          `if every bit is 0 the clock did not advance between edges (clock-resolution risk); ` +
          `STOP and escalate before building any wiring`,
      );
    console.log("PASS (neopixel)");
    return;
  }

  if (MODE === "oled") {
    chip.stop();
    const fb = oled.framebufferBytes;
    const lit = fb.reduce((n, byte) => n + (byte ? 1 : 0), 0);
    console.log("ready:", ready, "OLED_OK:", sawSmoke, "lit fb bytes:", lit, "displayOn:", oled.displayOn);
    const hex = (lo: number, hi: number) =>
      Array.from(fb.subarray(lo, hi), (b) => b.toString(16).padStart(2, "0")).join(" ");
    console.log("page0 cols0-15:", hex(0, 16));
    console.log("page1 cols0-15:", hex(128, 144));
    if (!sawSmoke) throw new Error("FAIL: OLED_OK not seen — ssd1306 driver never ran");
    if (lit === 0)
      throw new Error("FAIL: OLED framebuffer all-blank — #135 SUSPECTED on v1.24.1, ESCALATE");
    // "HI" at (0,0): framebuf renders an 8x8 glyph per char at y=0 -> page 0 (top 8 rows),
    // cols 0..15 (2 chars x 8px). Assert the RIGHT region lit AND ONLY the right region:
    //   - page 0, cols 0..15: a real 2-glyph render lights several columns -> require >= 6.
    //   - page 1 (rows 8..15), same cols: text at y=0 cannot touch it -> require all blank.
    let page0Lit = 0;
    for (let x = 0; x < 16; x++) if (fb[x]) page0Lit++;
    if (page0Lit < 6)
      throw new Error(`FAIL: only ${page0Lit} lit cols in page0 cols0-15 where 'HI' should render — decode garbled, ESCALATE`);
    for (let x = 0; x < 16; x++)
      if (fb[128 + x] !== 0)
        throw new Error(`FAIL: page1 col${x} lit but 'HI' at y=0 cannot reach page1 — pagePtr off-by-one, ESCALATE`);
    console.log("PASS (oled)");
    return;
  }

  if (MODE === "lcd") {
    chip.stop();
    const text = lcd.text;
    console.log("ready:", ready, "LCD_OK:", sawSmoke, "text:", JSON.stringify(text));
    if (!sawSmoke) throw new Error("FAIL: LCD_OK not seen — LCD strobe program never ran");
    const expected = "HI" + " ".repeat(14) + " ".repeat(16); // 16x2 flat, "HI" at row0 col0
    if (text.length !== 32) throw new Error(`FAIL: text length ${text.length} != 32`);
    if (text !== expected)
      throw new Error(`FAIL: decoded LCD text ${JSON.stringify(text)} != ${JSON.stringify(expected)}`);
    console.log("PASS (lcd)");
    return;
  }

  if (MODE === "read") {
    chip.stop();
    console.log("ready:", ready, "READ_OK:", sawSmoke);
    if (!sawSmoke)
      throw new Error("FAIL: READ_OK not seen — readfrom desynced/ENODEV; completeRead(0xff) wrong, ESCALATE");
    console.log("PASS (read)");
    return;
  }

  chip.stop();
  console.log(
    "ready:",
    ready,
    "SMOKE_OK:",
    sawSmoke,
    "gpio25Toggled:",
    gpio25Toggled,
  );
  if (!sawSmoke)
    throw new Error(
      "FAIL: SMOKE_OK not seen — LFS offset/geometry wrong, main.py never ran",
    );
  if (!gpio25Toggled) throw new Error("FAIL: gpio[25] never toggled");
  console.log("PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
