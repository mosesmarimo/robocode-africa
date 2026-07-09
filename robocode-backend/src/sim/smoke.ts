// Headless smoke run for the sim engine. No test framework: assertions are
// hardcoded expected serial lines / pin values. Exits non-zero on any failure.
// The drain mirrors grader.ts: stop after a few `wait` yields so a sketch with
// an empty loop() does not spin forever.
import { Machine } from "./machine";
import { Interpreter } from "./interpreter";
import { UNO_PROFILE, ESP32_PROFILE, type BoardProfile } from "./board-profile";
import { gradeCode } from "./grader";

let failures = 0;
function check(name: string, cond: boolean, detail: string) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}: ${detail}`);
  }
}

// Run a sketch against a profile; drain until `maxWaits` wait-yields or a tick
// cap, then return serial lines + the machine. setup() runs before the first
// wait, so single-shot setup fixtures are fully captured immediately.
function run(
  code: string,
  profile: BoardProfile,
  analog: Record<string, number> = {},
  maxWaits = 4,
): { serial: string[]; m: Machine } {
  const serial: string[] = [];
  const m = new Machine(profile);
  m.onSerial = (l) => serial.push(l);
  for (const [k, v] of Object.entries(analog)) m.analogSources[k] = () => v;
  const name = profile === ESP32_PROFILE ? "ESP32 DevKit V1" : "Arduino UNO R3";
  const interp = new Interpreter(code, m, profile, name);
  const gen = interp.run();
  let res = gen.next();
  let waits = 0;
  let ticks = 0;
  while (!res.done && waits < maxWaits && ticks++ < 200000) {
    if (res.value && (res.value as { kind?: string }).kind === "wait") waits++;
    res = gen.next();
  }
  return { serial, m };
}

// fixture-ledc-fade: ledcWrite(0,128) at 8-bit -> pwm["2"]===128, pwmRaw["2"]===128
{
  const code = `
void setup() {
  ledcSetup(0, 5000, 8);
  ledcAttachPin(2, 0);
  ledcWrite(0, 128);
}
void loop() {}
`;
  const { m } = run(code, ESP32_PROFILE);
  check("ledc-fade pwm", m.pwm["2"] === 128, `pwm["2"]=${m.pwm["2"]}`);
  check("ledc-fade pwmRaw", m.pwmRaw["2"] === 128, `pwmRaw["2"]=${m.pwmRaw["2"]}`);
}

// fixture-adc12: analogRead(34) reaches 4095 at 12-bit; caps at 1023 after analogReadResolution(10)
{
  const code12 = `
void setup() { Serial.begin(115200); Serial.println(analogRead(34)); }
void loop() {}
`;
  const { serial: s12 } = run(code12, ESP32_PROFILE, { "34": 4095 });
  check("adc12 full-scale", s12[0] === "4095", `got "${s12[0]}"`);

  const code10 = `
void setup() { Serial.begin(115200); analogReadResolution(10); Serial.println(analogRead(34)); }
void loop() {}
`;
  const { serial: s10 } = run(code10, ESP32_PROFILE, { "34": 4095 });
  check("adc12 capped@10bit", s10[0] === "1023", `got "${s10[0]}"`);
}

// fixture-adc-rescale: analogReadResolution(10) on ESP32 (native 12-bit) rescales
// a native-scale source reading instead of clamping it. Source at 2048 (12-bit
// mid-scale) must read back as 512 (10-bit mid-scale), not a saturated 1023.
{
  const code = `
void setup() { Serial.begin(115200); analogReadResolution(10); Serial.println(analogRead(34)); }
void loop() {}
`;
  const { serial } = run(code, ESP32_PROFILE, { "34": 2048 });
  check("adc-rescale @10bit", serial[0] === "512", `got "${serial[0]}"`);
}

// fixture-touch: touchRead(4)===70 with no warning; touchRead(99) warns invalid pin
{
  const code = `
void setup() {
  Serial.begin(115200);
  Serial.println(touchRead(4));
  Serial.println(touchRead(99));
}
void loop() {}
`;
  const { serial } = run(code, ESP32_PROFILE);
  check("touch T0 value", serial[0] === "70", `got "${serial[0]}"`);
  check("touch invalid-pin warn", serial.some((l) => l.startsWith("[sim] invalid pin 99")), `serial=${JSON.stringify(serial)}`);
  check("touch T0 no-warn", serial.filter((l) => l.startsWith("[sim]")).length === 1, `[sim] lines=${JSON.stringify(serial.filter((l) => l.startsWith("[sim]")))}`);
}

// fixture-touch-t3-const: T3 must resolve to ESP32 touchPins[3] ("15"); confirm
// touchRead(T3) returns the machine's overridden touch value (not the 0-fallback
// from an undefined `T3` Ident, nor the unconfigured default of 70).
{
  const code = `
void setup() {
  Serial.begin(115200);
  Serial.println(touchRead(T3));
}
void loop() {}
`;
  const serial: string[] = [];
  const m = new Machine(ESP32_PROFILE);
  m.onSerial = (l) => serial.push(l);
  m.touch["15"] = 5;
  const interp = new Interpreter(code, m, ESP32_PROFILE, "ESP32 DevKit V1");
  const gen = interp.run();
  let res = gen.next();
  let waits = 0;
  let ticks = 0;
  while (!res.done && waits < 4 && ticks++ < 200000) {
    if (res.value && (res.value as { kind?: string }).kind === "wait") waits++;
    res = gen.next();
  }
  check("touch T3 const override", serial[0] === "5", `serial=${JSON.stringify(serial)}`);
}

// fixture-bluetooth-serial: `BluetoothSerial SerialBT;` must declare a real BT
// object (not fall through the generic-decl branch to 0), and println() must
// route into the serial transcript via makeBT()'s m.serialPrintln sink.
{
  const code = `
BluetoothSerial SerialBT;
void setup() {
  SerialBT.begin("ESP32");
  SerialBT.println("bt-hello");
}
void loop() {}
`;
  const { serial } = run(code, ESP32_PROFILE);
  check("bluetooth serial println", serial.includes("bt-hello"), `serial=${JSON.stringify(serial)}`);
}

// fixture-wifi-connect: status() returns WL_CONNECTED immediately; localIP printed
{
  const code = `
void setup() {
  Serial.begin(115200);
  WiFi.begin("ssid", "pass");
  while (WiFi.status() != WL_CONNECTED) { delay(10); }
  Serial.println(WiFi.localIP());
}
void loop() {}
`;
  const { serial } = run(code, ESP32_PROFILE);
  check("wifi connects + ip", serial.some((l) => l === "192.168.4.2"), `serial=${JSON.stringify(serial)}`);
}

// fixture-serial2: Serial2.println("hi") lands in the transcript
{
  const code = `
void setup() {
  Serial2.begin(115200);
  Serial2.println("hi");
}
void loop() {}
`;
  const { serial } = run(code, ESP32_PROFILE);
  check("serial2 println", serial.includes("hi"), `serial=${JSON.stringify(serial)}`);
}

// fixture-input-only: digitalWrite(34, HIGH) warns input-only and does not set digital["34"]
{
  const code = `
void setup() { digitalWrite(34, HIGH); }
void loop() {}
`;
  const { serial, m } = run(code, ESP32_PROFILE);
  check("input-only warn", serial.some((l) => l === "[sim] pin 34 is input-only"), `serial=${JSON.stringify(serial)}`);
  check("input-only no write", m.digital["34"] !== 1, `digital["34"]=${m.digital["34"]}`);
}

// fixture-uno-blink (Uno profile regression): exact serial + ADC 0-1023 + PWM 255 + LED pin "13"
{
  const code = `
void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(13, HIGH);
  Serial.println("on");
  delay(500);
  digitalWrite(13, LOW);
  Serial.println("off");
  delay(500);
}
`;
  // Two full on/off cycles = 4 wait yields, then stop.
  const { serial, m } = run(code, UNO_PROFILE, {}, 4);
  check("uno-blink serial[0]", serial[0] === "on", `got "${serial[0]}"`);
  check("uno-blink serial[1]", serial[1] === "off", `got "${serial[1]}"`);
  check("uno-blink adcMax", m.adcMax === 1023, `adcMax=${m.adcMax}`);
  check("uno-blink pwmMax", m.pwmMax === 255, `pwmMax=${m.pwmMax}`);
  check("uno-blink led pin13 driven", typeof m.digital["13"] === "number", `digital["13"]=${m.digital["13"]}`);
}

// fixture-unknown-board: gradeCode with an unrecognized board id must return
// the graceful "teacher will review" failure shape, NOT attempt to parse the
// sketch as an Arduino UNO. Guards PROFILE_BY_BOARD's fail-closed routing.
{
  const code = `
void setup() { Serial.begin(9600); Serial.println("hi"); }
void loop() {}
`;
  const result = gradeCode(code, { rules: [{ type: "serial_contains", value: "hi" }] }, { board: "raspberry-pi-pico" });
  check("unknown-board not passed", result.passed === false, `passed=${result.passed}`);
  check("unknown-board score 0", result.score === 0, `score=${result.score}`);
  check(
    "unknown-board graceful feedback",
    result.error === "Auto-grading for this board isn't available yet — a teacher will review your submission.",
    `error="${result.error}"`,
  );
  check("unknown-board no parse error", !/syntax error/i.test(result.error ?? ""), `error="${result.error}"`);
}

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nAll smoke fixtures passed");
