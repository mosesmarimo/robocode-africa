// Pure WS2812 (NeoPixel) pulse-width decoder. Framework-free: NO rp2040js
// import, NO DOM, NO postMessage — same discipline as i2c-devices.ts.
//
// Fed (nanos, isHigh) GPIO edge events; runs the WS2812 NRZ-L pulse-width
// state machine and exposes a flat RGB-packed snapshot + a dirty flag.
//
// Class is named after the chip (Ws2812Decoder); the protocol type/role/
// message use the product name "neopixel" — this split is intentional.

/** HIGH-pulse width threshold: >= 600 ns => bit 1, else bit 0. */
const T_THRESH_NS = 600;
/** LOW gap >= 50 us is the end-of-frame LATCH. */
const RESET_LOW_NS = 50000;
/** WS2812 sends 24 bits per pixel: GRB, 8 bits each. */
const BITS_PER_PIXEL = 24;

export class Ws2812Decoder {
  readonly partId: string;

  // bit accumulator (current pixel under construction)
  private acc = 0;
  // bits accumulated into acc so far (0..24)
  private nbits = 0;
  // timestamp of the most recent rising edge
  private lastRiseNanos = 0;
  // timestamp of the most recent falling edge (for the next LOW-gap measure)
  private lastFallNanos = 0;
  // whether any falling edge has been seen yet (so the first rising edge does
  // not register a spurious multi-second LOW gap as a LATCH)
  private sawFall = false;

  // flat RGB-packed triplets [r0,g0,b0, r1,g1,b1, ...], 0..255, DISPLAY order
  private pixels: number[] = [];
  // index of the next pixel to write (resets to 0 on LATCH/realign)
  private pixelIndex = 0;

  private _dirty = false;
  private _frameCount = 0;

  constructor(opts: { partId: string }) {
    this.partId = opts.partId;
  }

  /** Number of completed frames (LATCH count). A cheap test/settle hook. */
  get frameCount(): number {
    return this._frameCount;
  }

  edge(nanos: number, isHigh: boolean): void {
    if (isHigh) {
      // Rising edge.
      if (this.sawFall && nanos - this.lastFallNanos >= RESET_LOW_NS) {
        // LATCH: finalize the current frame, then realign to LED0.
        this._dirty = true;
        this._frameCount++;
        this.acc = 0;
        this.nbits = 0;
        this.pixelIndex = 0;
      }
      this.lastRiseNanos = nanos;
      return;
    }

    // Falling edge: measure the HIGH-pulse width and decode one bit.
    const highWidth = nanos - this.lastRiseNanos;
    const bit = highWidth >= T_THRESH_NS ? 1 : 0;
    this.acc = ((this.acc << 1) | bit) >>> 0;
    this.nbits++;

    if (this.nbits === BITS_PER_PIXEL) {
      // WS2812 wire order is GRB, MSB-first. Reorder to display RGB.
      const g = (this.acc >> 16) & 0xff;
      const r = (this.acc >> 8) & 0xff;
      const b = this.acc & 0xff;
      this.pixels[this.pixelIndex * 3] = r;
      this.pixels[this.pixelIndex * 3 + 1] = g;
      this.pixels[this.pixelIndex * 3 + 2] = b;
      this.pixelIndex++;
      this.acc = 0;
      this.nbits = 0;
    }

    this.lastFallNanos = nanos;
    this.sawFall = true;
  }

  /** A copy of the flat pixels array (so the worker can transfer by value). */
  snapshot(): { partId: string; pixels: number[]; frameCount: number } {
    return {
      partId: this.partId,
      pixels: this.pixels.slice(),
      frameCount: this._frameCount,
    };
  }

  get dirty(): boolean {
    return this._dirty;
  }

  clearDirty(): void {
    this._dirty = false;
  }

  /**
   * Force dirty if at least one pixel has been emitted this frame. Lets the
   * worker render a write-once np.write() whose terminal LATCH never arrives,
   * without corrupting an in-progress frame (does NOT reset acc/pixelIndex).
   */
  flush(): void {
    if (this.pixelIndex > 0) this._dirty = true;
  }
}
