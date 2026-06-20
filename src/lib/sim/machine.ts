// The RoboCode Virtual Machine runtime state: pins, analog sources, tone, time, serial.
// The interpreter calls these methods; component drivers read/write pin signals.

export type PinMode = "input" | "output" | "input_pullup";

export class Machine {
  digital: Record<string, number> = {}; // board pin label -> 0/1 (output) ; also reflects pwm>0
  pwm: Record<string, number> = {}; // board pin -> 0..255
  modes: Record<string, PinMode> = {};
  tones: Record<string, number> = {}; // board pin -> frequency (0 = off)
  servoAngle: Record<string, number> = {}; // board pin -> 0..180

  // input providers (set by drivers / interactive controls)
  analogSources: Record<string, () => number> = {}; // board pin -> 0..1023
  digitalSources: Record<string, () => number> = {}; // board pin -> 0/1 (for buttons etc.)
  pulseProviders: Record<string, () => number> = {}; // board pin -> microseconds

  serialBuffer = "";
  onSerial: (line: string) => void = () => {};
  startMs = 0;
  virtualMs = 0;
  // character displays (LCD/OLED) registered by the interpreter, in creation order
  displays: { cols: number; rows: number; lines: string[] }[] = [];
  // addressable pixel strips (Adafruit_NeoPixel) in creation order
  neopixels: { pixels: { r: number; g: number; b: number }[] }[] = [];

  reset() {
    this.digital = {};
    this.pwm = {};
    this.modes = {};
    this.tones = {};
    this.servoAngle = {};
    this.serialBuffer = "";
    this.virtualMs = 0;
    this.displays = [];
    this.neopixels = [];
  }

  pinMode(pin: string, mode: PinMode) {
    this.modes[pin] = mode;
  }
  digitalWrite(pin: string, value: number) {
    this.digital[pin] = value ? 1 : 0;
    this.pwm[pin] = value ? 255 : 0;
  }
  analogWrite(pin: string, value: number) {
    const v = Math.max(0, Math.min(255, Math.round(value)));
    this.pwm[pin] = v;
    this.digital[pin] = v > 0 ? 1 : 0;
  }
  digitalRead(pin: string): number {
    if (this.digitalSources[pin]) return this.digitalSources[pin]();
    if (this.modes[pin] === "input_pullup") return 1;
    return this.digital[pin] ?? 0;
  }
  analogRead(pin: string): number {
    if (this.analogSources[pin]) return Math.round(this.analogSources[pin]());
    return 0;
  }
  tone(pin: string, freq: number) {
    this.tones[pin] = freq;
  }
  noTone(pin: string) {
    this.tones[pin] = 0;
  }
  servoWrite(pin: string, angle: number) {
    this.servoAngle[pin] = Math.max(0, Math.min(180, angle));
    this.digital[pin] = 1;
  }
  pulseIn(pin: string): number {
    if (this.pulseProviders[pin]) return this.pulseProviders[pin]();
    return 0;
  }

  millis(): number {
    return Math.floor(this.virtualMs);
  }
  micros(): number {
    return Math.floor(this.virtualMs * 1000);
  }
  advance(ms: number) {
    this.virtualMs += ms;
  }

  serialPrint(s: string) {
    this.serialBuffer += s;
    this.flushLines(false);
  }
  serialPrintln(s: string) {
    this.serialBuffer += s + "\n";
    this.flushLines(false);
  }
  private flushLines(force: boolean) {
    let idx;
    while ((idx = this.serialBuffer.indexOf("\n")) >= 0) {
      const line = this.serialBuffer.slice(0, idx);
      this.serialBuffer = this.serialBuffer.slice(idx + 1);
      this.onSerial(line);
    }
    if (force && this.serialBuffer) {
      this.onSerial(this.serialBuffer);
      this.serialBuffer = "";
    }
  }
}
