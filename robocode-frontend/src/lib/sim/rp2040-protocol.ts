// Shared message protocol between Rp2040Engine (main thread) and rp2040.worker.ts.
// Plain types only — importable from both a React-client module and a Web Worker.
// NO "use client" directive.

/** A display part the worker should ACK on the I2C bus and decode. */
export type DisplaySpec = {
  partId: string;
  kind: "lcd" | "oled";
  address: number;
  cols?: number; // LCD only; default 16
  rows?: number; // LCD only; default 2
  // Hardware I2C bus (0 or 1) this display's SDA/DATA pin resolves to, per the RP2040's fixed
  // controller pinout. Undefined when the wiring can't be resolved to a known bus (e.g. no SDA
  // wire, or a GPIO not on either controller's SDA list) — the worker then falls back to
  // installing the display on BOTH buses, matching the pre-Task-9 behaviour.
  bus?: 0 | 1;
};

/** A NeoPixel (WS2812) part whose DIN GPIO the worker should decode. */
export type NeopixelSpec = {
  partId: string;
  din: number; // board GPIO number for the DIN data pin
  count: number; // 1 for single wokwi-neopixel; props.pixels (default 16) for wokwi-led-ring
};

/** main thread -> worker */
export type Rp2040InMessage =
  | {
      type: "init";
      uf2Url: string;
      bootromUrl: string;
      wasmUrl: string;
      code: string;
      displays: DisplaySpec[];
      neopixels: NeopixelSpec[];
    }
  | { type: "input"; gpioInputs: Record<number, boolean>; adcValues: Record<number, number> }
  | { type: "stop" };

/** worker -> main thread */
export type Rp2040OutMessage =
  | { type: "ready" } // firmware booted, USB-CDC up, main.py running
  | { type: "serial"; line: string } // one complete line (newline-split)
  | {
      type: "gpio";
      outputs: Record<number, boolean>; // raw pin out-values, coalesced (edge-driven)
      pwm: Record<number, number>;     // GPIO -> duty 0..1 (decoded), coalesced (polled)
      pwmFreq: Record<number, number>; // GPIO -> frequency in Hz (decoded), coalesced (polled)
    }
  // LCD posts the rendered flat cols*rows text; OLED posts the 1024-byte packed
  // GDDRAM as a transferable ArrayBuffer (ImageData is built engine-side only).
  | { type: "display"; partId: string; kind: "lcd"; text: string }
  | { type: "display"; partId: string; kind: "oled"; framebuffer: ArrayBuffer; inverse: boolean; displayOn: boolean }
  // pixels: flat RGB-packed (display order) [r0,g0,b0, r1,g1,b1, ...], 0..255 per
  // channel, length = 3 * (number of pixels the decoder emitted this frame).
  | { type: "neopixel"; partId: string; pixels: number[] }
  | { type: "error"; message: string } // fetch/boot/runtime failure
  | { type: "stop" };                  // worker has halted + cleaned up
