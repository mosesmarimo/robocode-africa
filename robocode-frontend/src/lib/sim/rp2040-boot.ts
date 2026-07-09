// Framework-free boot/inject/peripheral helpers shared by the Web Worker
// (rp2040.worker.ts) and the headless smoke (scripts/rp2040-smoke.ts).
// NO "use client", NO DOM, NO postMessage here — pure emulator wiring.
//
// Probe-resolved facts (rp2040js@1.3.3 + littlefs@0.1.0; see task-3 report):
//   * RP2040 / Simulator / USBCDC are all on the main "rp2040js" export.
//   * FLASH_START_ADDRESS and FUNCTION_PWM are NOT exported; the deep subpaths
//     are blocked by the package `exports` map → defined locally below.
//   * littlefs is an Emscripten factory (default export, async). Its glue is the
//     wokwi littlefs-wasm API: _new_lfs / _new_lfs_config(read,prog,erase,sync,
//     count,size) / _lfs_format(lfs,cfg) / _lfs_mount(lfs,cfg) / lfs_write_file
//     / _lfs_unmount(lfs). The .wasm is a SEPARATE file (dist/littlefs.wasm),
//     loaded via wasmBinary (Node) or locateFile (bundler/browser).
//   * pwm.channels[*] exposes cc/top + readonly pinA1/pinB1/pinA2/pinB2.

import { RP2040, Simulator, USBCDC, LogLevel, I2CMode } from "rp2040js";
import createLittleFS from "littlefs";
import type { I2cDecoder } from "./i2c-devices";

// FLASH_START_ADDRESS and FUNCTION_PWM are NOT on the rp2040js main export and the
// package `exports` map blocks the deep subpaths (probe Step 0). Define them locally.
const FLASH_START_ADDRESS = 0x10000000; // 268435456 — verified
const FUNCTION_PWM = 4; // gpio-pin FUNCTION_PWM — verified

/** RPI_PICO MicroPython LittleFS partition base + geometry (firmware-build-specific). */
export const LFS_OFFSET = 0xa0000;
export const LFS_BLOCK_COUNT = 352;
export const LFS_BLOCK_SIZE = 4096;

/** Read raw bootrom bytes (little-endian words) into the Uint32Array loadBootrom expects. */
export function loadBootromBytes(bytes: ArrayBuffer | Uint8Array): Uint32Array {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  // Copy into an aligned buffer so the Uint32Array view is valid regardless of byteOffset.
  const aligned = new Uint8Array(u8.length);
  aligned.set(u8);
  return new Uint32Array(aligned.buffer, 0, aligned.length >>> 2);
}

/** Parse a UF2 image (512-byte blocks) and copy each block's payload into flash. */
export function parseUf2IntoFlash(uf2: ArrayBuffer | Uint8Array, flash: Uint8Array): void {
  const data = uf2 instanceof Uint8Array ? uf2 : new Uint8Array(uf2);
  const BLOCK = 512;
  for (let off = 0; off + BLOCK <= data.length; off += BLOCK) {
    const dv = new DataView(data.buffer, data.byteOffset + off, BLOCK);
    // UF2 header: magic0 @0 (0x0A324655), magic1 @4 (0x9E5D5157). Skip non-UF2 blocks.
    if (dv.getUint32(0, true) !== 0x0a324655 || dv.getUint32(4, true) !== 0x9e5d5157) continue;
    const targetAddr = dv.getUint32(12, true); // bytes 12-15 LE
    const payloadLen = dv.getUint32(16, true); // bytes 16-19 LE — header is source of truth
    const flashAddr = targetAddr - FLASH_START_ADDRESS;
    if (flashAddr < 0 || flashAddr + payloadLen > flash.length) continue;
    for (let i = 0; i < payloadLen; i++) flash[flashAddr + i] = data[off + 32 + i]; // payload @32
  }
}

// Minimal structural type for the Emscripten module surface we actually use.
// littlefs ships `Promise<any>`, so we narrow it ourselves (probe-confirmed surface).
interface LittleFsModule {
  HEAPU8: Uint8Array;
  addFunction: (fn: (...args: number[]) => number | void, sig: string) => number;
  cwrap: (
    name: string,
    ret: string | null,
    args: (string | null)[],
  ) => (...a: unknown[]) => number;
  _free: (ptr: number) => void;
  _new_lfs: () => number;
  _new_lfs_config: (
    read: number,
    prog: number,
    erase: number,
    sync: number,
    blockCount: number,
    blockSize: number,
  ) => number;
  _lfs_format: (lfs: number, cfg: number) => number;
  _lfs_mount: (lfs: number, cfg: number) => number;
  _lfs_unmount: (lfs: number) => number;
}

/**
 * Format an empty LittleFS volume of RPI_PICO geometry, write `code` as main.py,
 * and return the raw image bytes (LFS_BLOCK_COUNT * LFS_BLOCK_SIZE).
 *
 * Uses the wokwi littlefs-wasm glue (probe Step 1):
 *   _new_lfs_config(read,prog,erase,sync,count,size) → _new_lfs() → _lfs_format
 *   → _lfs_mount → lfs_write_file (whole file in one call) → _lfs_unmount.
 * Memory marshaling for the file goes through cwrap 'string'/'array' (this build
 * exports no _malloc), which copies onto the Emscripten stack — no NUL truncation
 * because the data arg is 'array' (raw UTF-8 bytes), not 'string'.
 */
export async function buildLittleFsImage(
  code: string,
  wasmUrl?: string,
  wasmBinary?: ArrayLike<number> | ArrayBufferLike,
): Promise<Uint8Array> {
  // The littlefs build is compiled for the web (ENVIRONMENT_IS_NODE is false), so
  // it resolves the .wasm via fetch(locateFile(...)). In the BROWSER worker (Task 4)
  // pass `wasmUrl` (the bundler-hashed /sim copy) — fetch loads it. In NODE (smoke)
  // fetch can't read file:// URLs, so pass `wasmBinary` (the raw bytes from disk)
  // which Emscripten uses directly without any fetch.
  const factory = createLittleFS as unknown as (opts?: {
    wasmBinary?: ArrayLike<number> | ArrayBufferLike;
    locateFile?: (p: string) => string;
  }) => Promise<LittleFsModule>;

  const lfs = await factory(
    wasmBinary
      ? { wasmBinary }
      : wasmUrl
        ? { locateFile: (p: string) => (p.endsWith(".wasm") ? wasmUrl : p) }
        : undefined,
  );

  const flash = new Uint8Array(LFS_BLOCK_COUNT * LFS_BLOCK_SIZE); // 1,441,792 bytes
  flash.fill(0xff);

  // read/prog/erase/sync callbacks backing onto `flash` (signatures per wokwi glue).
  const read = lfs.addFunction(
    (_c: number, block: number, offIn: number, buf: number, size: number) => {
      const base = block * LFS_BLOCK_SIZE + offIn;
      lfs.HEAPU8.set(flash.subarray(base, base + size), buf);
      return 0;
    },
    "iiiiii",
  );
  const prog = lfs.addFunction(
    (_c: number, block: number, offIn: number, buf: number, size: number) => {
      const base = block * LFS_BLOCK_SIZE + offIn;
      flash.set(lfs.HEAPU8.subarray(buf, buf + size), base);
      return 0;
    },
    "iiiiii",
  );
  const erase = lfs.addFunction((_c: number, block: number) => {
    flash.fill(0xff, block * LFS_BLOCK_SIZE, (block + 1) * LFS_BLOCK_SIZE);
    return 0;
  }, "iii");
  const sync = lfs.addFunction(() => 0, "ii");

  const config = lfs._new_lfs_config(read, prog, erase, sync, LFS_BLOCK_COUNT, LFS_BLOCK_SIZE);
  const lfsObj = lfs._new_lfs();
  lfs._lfs_format(lfsObj, config);
  lfs._lfs_mount(lfsObj, config);

  // lfs_write_file(lfs, name, data, size) — open(RDWR|CREAT)+write+close in one call.
  // 'array' marshals raw UTF-8 bytes onto the stack (no NUL truncation); 'string' would.
  const writeFile = lfs.cwrap("lfs_write_file", null, ["number", "string", "array", "number"]);
  const bytes = new TextEncoder().encode(code);
  writeFile(lfsObj, "main.py", bytes, bytes.byteLength);

  lfs._lfs_unmount(lfsObj);
  lfs._free(lfsObj);
  lfs._free(config);

  return flash;
}

export interface BootedChip {
  rp2040: RP2040;
  cdc: USBCDC;
  start(): void;
  stop(): void;
}

/**
 * Boot real MicroPython firmware: load bootrom, parse UF2 into flash, splice the
 * LittleFS image at LFS_OFFSET, wire USB-CDC serial, and hand back start/stop.
 *
 * Run-loop: rp2040js `Simulator` (its execute()/stop() drive the event loop and
 * the USB enumeration timers). The smoke proves this loop boots + enumerates.
 */
export async function bootChip(opts: {
  bootrom: Uint32Array;
  uf2: Uint8Array;
  code: string;
  wasmUrl?: string;
  wasmBinary?: ArrayLike<number> | ArrayBufferLike;
  onSerialLine: (line: string) => void;
  onReady: () => void;
}): Promise<BootedChip> {
  const sim = new Simulator();
  const rp2040 = sim.rp2040;
  // Silence rp2040js's default ConsoleLogger (Info-level USB/SEV spam) without
  // replacing it (keeps throwOnError=false). Only Error-level messages survive.
  const logger = (rp2040 as unknown as { logger?: { currentLogLevel: number } }).logger;
  if (logger) logger.currentLogLevel = LogLevel.Error;
  rp2040.loadBootrom(opts.bootrom);
  parseUf2IntoFlash(opts.uf2, rp2040.flash);
  const fsImage = await buildLittleFsImage(opts.code, opts.wasmUrl, opts.wasmBinary);
  rp2040.flash.set(fsImage, LFS_OFFSET);

  const cdc = new USBCDC(rp2040.usbCtrl);
  let partial = "";
  const dec = new TextDecoder();
  cdc.onSerialData = (buf: Uint8Array) => {
    partial += dec.decode(buf, { stream: true });
    let nl: number;
    while ((nl = partial.indexOf("\n")) >= 0) {
      opts.onSerialLine(partial.slice(0, nl).replace(/\r$/, ""));
      partial = partial.slice(nl + 1);
    }
  };
  cdc.onDeviceConnected = () => {
    // Kick the MicroPython REPL so it advances past its prompt and runs main.py
    // (the rp2040js demo recipe). One CR+LF, byte-by-byte (no bulk send API).
    cdc.sendSerialByte(0x0d);
    cdc.sendSerialByte(0x0a);
    opts.onReady();
  };

  return {
    rp2040,
    cdc,
    start: () => {
      // The rp2040js flash/XIP model does not satisfy the bootrom's boot2 CRC +
      // XIP handoff, so the bootrom spins in its WFE idle loop and never jumps to
      // the application. The canonical rp2040js MicroPython recipe bypasses that
      // by jumping the core straight to the flash vector table at FLASH_START.
      rp2040.core.PC = FLASH_START_ADDRESS;
      sim.execute();
    },
    stop: () => sim.stop(),
  };
}

/**
 * Install I2C controller callbacks (onConnect/onWriteByte/onReadByte/onStop) on BOTH
 * RP2040 hardware I2C controllers, routing each purely by its own bus's address map
 * (`byBusAddr[0]` for i2c[0], `byBusAddr[1]` for i2c[1]). Shared by rp2040.worker.ts and
 * scripts/rp2040-smoke.ts so the two can never drift on I2C wiring behaviour.
 *
 * `onAnyConnect`, if given, fires on every successful or failed connect attempt on either
 * bus (worker-only use: the SoftI2C "no hardware-I2C traffic" hint needs to know whether
 * ANY hardware-I2C connect happened, regardless of which bus or address).
 */
export function attachI2cDecoders(
  rp2040: RP2040,
  byBusAddr: [Map<number, I2cDecoder>, Map<number, I2cDecoder>],
  onAnyConnect?: () => void,
): void {
  rp2040.i2c.forEach((bus, busIdx) => {
    const byAddr = byBusAddr[busIdx];
    let active: I2cDecoder | null = null;
    bus.onConnect = (address: number, mode: I2CMode) => {
      onAnyConnect?.();
      active = byAddr.get(address) ?? null;
      if (active) {
        active.connect(mode);
        bus.completeConnect(true); // ACK matched display address
      } else {
        bus.completeConnect(false); // NACK everything else (stock rp2040js behaviour)
      }
    };
    bus.onWriteByte = (value: number) => {
      if (active) {
        active.writeByte(value);
        bus.completeWrite(true);
      } else {
        bus.completeWrite(false);
      }
    };
    bus.onReadByte = (_ack: boolean) => {
      // Displays are write-only on the data path; reply 0xff ("not busy", = rp2040js
      // default) so a PCF8574 read-back / busy-flag poll proceeds. Read path proven by
      // the Task-2 smoke. Single behaviour whether or not a display is active.
      bus.completeRead(0xff);
    };
    bus.onStop = () => {
      active?.stop();
      bus.completeStop();
      active = null;
    };
    // onStart left at its rp2040js default. No symmetric teardown: the caller either
    // terminate()s the whole worker (rp2040.worker.ts) or exits the process (the smoke),
    // so these callbacks die with their owner — no leak.
  });
}

/** Decode PWM duty 0..1 for a GPIO in PWM function-select mode, or null if not PWM. */
export function decodePwmDuty(rp2040: RP2040, gpioNum: number): number | null {
  if (rp2040.gpio[gpioNum]?.functionSelect !== FUNCTION_PWM) return null;
  for (const ch of rp2040.pwm.channels) {
    const period = ch.top + 1; // top = wrap value (period - 1)
    if (period <= 0) continue;
    if (ch.pinA1 === gpioNum || ch.pinA2 === gpioNum) return (ch.cc & 0xffff) / period; // A = cc[15:0]
    if (ch.pinB1 === gpioNum || ch.pinB2 === gpioNum) return ((ch.cc >>> 16) & 0xffff) / period; // B = cc[31:16]
  }
  return null;
}

/**
 * PWM frequency in Hz for a GPIO in PWM mode, from DIV (8.4 fixed-point) + TOP.
 *
 * `ch.div` semantics (verified against node_modules/rp2040js dist/esm/peripherals/pwm.js
 * `writeRegister(CHn_DIV, ...)`): the channel stores the RAW register value written by
 * firmware (`this.div = value & 1048575`), not a pre-divided float — bits [11:4] are the
 * integer divisor, bits [3:0] are the 1/16ths fractional divisor, exactly like
 * `decodePwmDuty` already reads `cc`/`top` as raw register fields. clkSys is the fixed
 * 125 MHz RP2040 system clock (`rp2040.pwm.clockFreq` == `rp2040.clkSys`).
 */
export function decodePwmFreq(rp2040: RP2040, gpioNum: number): number | null {
  if (rp2040.gpio[gpioNum]?.functionSelect !== FUNCTION_PWM) return null;
  for (const ch of rp2040.pwm.channels) {
    const hit = ch.pinA1 === gpioNum || ch.pinA2 === gpioNum || ch.pinB1 === gpioNum || ch.pinB2 === gpioNum;
    if (!hit) continue;
    const divInt = (ch.div >> 4) & 0xff || 1;
    const divFrac = ch.div & 0xf;
    return 125_000_000 / ((divInt + divFrac / 16) * (ch.top + 1));
  }
  return null;
}
