import { Machine } from "@/lib/sim/machine";
import { Interpreter } from "@/lib/sim/interpreter";

function runSketch(code: string, maxWaits = 8) {
  const m = new Machine();
  const serial: string[] = [];
  m.onSerial = (l) => serial.push(l);
  const interp = new Interpreter(code, m);
  const gen = interp.run();
  const pin13: number[] = [];
  let waits = 0;
  let res = gen.next();
  for (let i = 0; i < 200000 && !res.done; i++) {
    const y = res.value as { kind: string };
    if (y.kind === "wait") {
      waits++;
      pin13.push(m.digital["13"] ?? 0);
      if (waits >= maxWaits) break;
    }
    res = gen.next();
  }
  return { serial, pin13, machine: m };
}

console.log("=== Test 1: Blink ===");
const blink = `
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("RoboCode UNO ready!");
}
void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}`;
const r1 = runSketch(blink);
console.log("serial:", r1.serial);
console.log("pin13 at each delay:", r1.pin13.join(","));

console.log("\n=== Test 2: analogRead + map + Serial ===");
const analog = `
int val = 0;
void setup(){ Serial.begin(9600); pinMode(9, OUTPUT); }
void loop(){
  val = analogRead(A0);
  int b = map(val, 0, 1023, 0, 255);
  analogWrite(9, b);
  Serial.print("pot=");
  Serial.println(val);
  delay(100);
}`;
const m2 = new Machine();
m2.analogSources["A0"] = () => 512;
const serial2: string[] = [];
m2.onSerial = (l) => serial2.push(l);
const interp2 = new Interpreter(analog, m2);
const gen2 = interp2.run();
let waits = 0;
let res = gen2.next();
for (let i = 0; i < 100000 && !res.done; i++) {
  if ((res.value as { kind: string }).kind === "wait" && ++waits >= 3) break;
  res = gen2.next();
}
console.log("serial:", serial2);
console.log("pin9 pwm:", m2.pwm["9"]);

console.log("\n=== Test 3: for loop + tone ===");
const t3 = `
void setup(){ Serial.begin(9600); for (int i=0;i<3;i++){ Serial.print("i="); Serial.println(i); } }
void loop(){ delay(1000); }`;
const r3 = runSketch(t3, 1);
console.log("serial:", r3.serial);

console.log("\nDONE");
