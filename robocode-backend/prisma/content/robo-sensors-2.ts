import { type LessonDef, md, code, svg, callout, body } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — BH1750 Digital Light Sensor (Lux)
// ---------------------------------------------------------------------------

const SVG_BH1750_MODULE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="BH1750 digital light sensor module">
  <!-- PCB body -->
  <rect x="60" y="50" width="200" height="110" rx="6" ry="6" fill="#1a6b3a" stroke="#0f4a27" stroke-width="2"/>
  <!-- Sensor IC chip -->
  <rect x="130" y="80" width="60" height="50" rx="3" ry="3" fill="#1a1a2e" stroke="#444" stroke-width="1.5"/>
  <text x="160" y="110" font-family="monospace" font-size="9" fill="#aaa" text-anchor="middle">BH1750</text>
  <text x="160" y="121" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">FVI</text>
  <!-- Light diffuser window -->
  <rect x="140" y="85" width="40" height="20" rx="2" ry="2" fill="#cce8ff" opacity="0.6" stroke="#99ccff" stroke-width="1"/>
  <text x="160" y="97" font-family="sans-serif" font-size="7" fill="#0066cc" text-anchor="middle">LIGHT</text>
  <!-- Pin header (5 pins on left) -->
  <rect x="62" y="60" width="14" height="90" rx="2" ry="2" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
  <circle cx="69" cy="75" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="91" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="107" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="123" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="139" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <!-- Pin labels -->
  <text x="88" y="78" font-family="monospace" font-size="10" fill="#ffe082">VCC</text>
  <text x="88" y="94" font-family="monospace" font-size="10" fill="#ffe082">GND</text>
  <text x="88" y="110" font-family="monospace" font-size="10" fill="#ffe082">SCL</text>
  <text x="88" y="126" font-family="monospace" font-size="10" fill="#ffe082">SDA</text>
  <text x="88" y="142" font-family="monospace" font-size="10" fill="#ffe082">ADDR</text>
  <!-- Decoupling capacitors -->
  <rect x="215" y="70" width="12" height="22" rx="2" ry="2" fill="#4a90d9" stroke="#2266aa" stroke-width="1"/>
  <rect x="235" y="70" width="12" height="22" rx="2" ry="2" fill="#4a90d9" stroke="#2266aa" stroke-width="1"/>
  <!-- Title -->
  <text x="160" y="175" font-family="sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="bold">BH1750 — I²C Digital Ambient Light Sensor</text>
</svg>`;

const SVG_BH1750_WIRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" role="img" aria-label="BH1750 wiring diagram to Arduino Uno">
  <!-- Arduino Uno outline -->
  <rect x="20" y="30" width="140" height="190" rx="8" ry="8" fill="#007fc8" stroke="#005a8e" stroke-width="2"/>
  <text x="90" y="52" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Arduino UNO</text>
  <!-- Arduino pins -->
  <rect x="30" y="60" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="71" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">5V</text>
  <rect x="30" y="80" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="91" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">GND</text>
  <rect x="30" y="100" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="111" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">A4/SDA</text>
  <rect x="30" y="120" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="131" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">A5/SCL</text>
  <!-- Sensor module -->
  <rect x="250" y="50" width="120" height="140" rx="6" ry="6" fill="#1a6b3a" stroke="#0f4a27" stroke-width="2"/>
  <text x="310" y="72" font-family="sans-serif" font-size="10" fill="white" text-anchor="middle" font-weight="bold">BH1750</text>
  <!-- Sensor pins -->
  <rect x="260" y="82" width="40" height="13" rx="2" fill="#0f4a27"/>
  <text x="280" y="92" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">VCC</text>
  <rect x="260" y="100" width="40" height="13" rx="2" fill="#0f4a27"/>
  <text x="280" y="110" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">GND</text>
  <rect x="260" y="118" width="40" height="13" rx="2" fill="#0f4a27"/>
  <text x="280" y="128" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">SCL</text>
  <rect x="260" y="136" width="40" height="13" rx="2" fill="#0f4a27"/>
  <text x="280" y="146" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">SDA</text>
  <rect x="260" y="154" width="40" height="13" rx="2" fill="#0f4a27"/>
  <text x="280" y="164" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">ADDR</text>
  <!-- ADDR to GND note -->
  <line x1="300" y1="160" x2="340" y2="170" stroke="#ff6b6b" stroke-width="1.5" stroke-dasharray="4,2"/>
  <text x="342" y="173" font-family="monospace" font-size="8" fill="#ff6b6b">→ GND</text>
  <!-- Wires -->
  <line x1="70" y1="67" x2="260" y2="88" stroke="#ff4444" stroke-width="2"/>
  <line x1="70" y1="87" x2="260" y2="106" stroke="#333333" stroke-width="2"/>
  <line x1="70" y1="127" x2="260" y2="124" stroke="#f5a623" stroke-width="2"/>
  <line x1="70" y1="107" x2="260" y2="142" stroke="#4a90e2" stroke-width="2"/>
  <!-- Wire labels -->
  <text x="155" y="63" font-family="monospace" font-size="8" fill="#ff4444">5V (red)</text>
  <text x="155" y="83" font-family="monospace" font-size="8" fill="#555">GND (blk)</text>
  <text x="155" y="118" font-family="monospace" font-size="8" fill="#f5a623">SCL (yel)</text>
  <text x="155" y="138" font-family="monospace" font-size="8" fill="#4a90e2">SDA (blu)</text>
</svg>`;

const SKETCH_BH1750 = `#include <Wire.h>
#include <BH1750.h>

// Create a BH1750 instance. The default I2C address is 0x23
// (ADDR pin connected to GND). Connect ADDR to VCC for 0x5C.
BH1750 lightMeter;

void setup() {
  Serial.begin(9600);
  Wire.begin();           // Start the I2C bus

  // Initialise the sensor in continuous high-resolution mode.
  // Resolution: 1 lux, measurement time: ~120 ms.
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 sensor found. Reading lux...");
  } else {
    Serial.println("Error: BH1750 not found. Check wiring (SDA=A4, SCL=A5).");
    while (true) {}   // Halt — nothing useful to do without the sensor
  }
}

void loop() {
  // readLightLevel() returns a float in lux.
  // Returns -1.0 if the measurement is not ready yet.
  float lux = lightMeter.readLightLevel();

  if (lux >= 0) {
    Serial.print("Light: ");
    Serial.print(lux, 1);    // one decimal place
    Serial.println(" lux");
  }

  delay(500);   // BH1750 needs ~120 ms per reading; 500 ms is comfortable
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Sound / Microphone KY-038
// ---------------------------------------------------------------------------

const SVG_KY038_MODULE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="KY-038 sound sensor module">
  <!-- PCB body -->
  <rect x="60" y="40" width="200" height="120" rx="6" ry="6" fill="#1a3a6b" stroke="#0f2245" stroke-width="2"/>
  <!-- Microphone capsule -->
  <circle cx="220" cy="100" r="22" fill="#2a2a2a" stroke="#555" stroke-width="2"/>
  <circle cx="220" cy="100" r="14" fill="#111" stroke="#444" stroke-width="1"/>
  <circle cx="220" cy="100" r="5" fill="#333"/>
  <!-- Sound holes -->
  <circle cx="213" cy="93" r="1.5" fill="#555"/>
  <circle cx="220" cy="91" r="1.5" fill="#555"/>
  <circle cx="227" cy="93" r="1.5" fill="#555"/>
  <circle cx="213" cy="107" r="1.5" fill="#555"/>
  <circle cx="220" cy="109" r="1.5" fill="#555"/>
  <circle cx="227" cy="107" r="1.5" fill="#555"/>
  <text x="220" y="135" font-family="sans-serif" font-size="8" fill="#aaa" text-anchor="middle">MIC</text>
  <!-- LM393 comparator chip -->
  <rect x="130" y="80" width="50" height="30" rx="3" ry="3" fill="#1a1a2e" stroke="#444" stroke-width="1.5"/>
  <text x="155" y="99" font-family="monospace" font-size="8" fill="#aaa" text-anchor="middle">LM393</text>
  <!-- Potentiometer -->
  <rect x="80" y="82" width="26" height="26" rx="3" ry="3" fill="#4a3a00" stroke="#777" stroke-width="1.5"/>
  <circle cx="93" cy="95" r="7" fill="#222" stroke="#888" stroke-width="1"/>
  <line x1="93" y1="88" x2="93" y2="83" stroke="#aaa" stroke-width="2"/>
  <text x="93" y="120" font-family="sans-serif" font-size="7" fill="#ccc" text-anchor="middle">TRIM</text>
  <!-- LEDs (power + signal) -->
  <circle cx="170" cy="58" r="5" fill="#ff4444" opacity="0.9"/>
  <text x="170" y="50" font-family="sans-serif" font-size="7" fill="#ff8888" text-anchor="middle">PWR</text>
  <circle cx="185" cy="58" r="5" fill="#44ff44" opacity="0.9"/>
  <text x="185" y="50" font-family="sans-serif" font-size="7" fill="#88ff88" text-anchor="middle">OUT</text>
  <!-- Pin header (4 pins) -->
  <rect x="62" y="70" width="14" height="60" rx="2" ry="2" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
  <circle cx="69" cy="83" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="99" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="115" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="131" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <!-- Pin labels -->
  <text x="88" y="86" font-family="monospace" font-size="10" fill="#ffe082">VCC</text>
  <text x="88" y="102" font-family="monospace" font-size="10" fill="#ffe082">GND</text>
  <text x="88" y="118" font-family="monospace" font-size="10" fill="#ffe082">DO</text>
  <text x="88" y="134" font-family="monospace" font-size="10" fill="#ffe082">AO</text>
  <text x="160" y="180" font-family="sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="bold">KY-038 Sound Sensor Module</text>
</svg>`;

const SVG_KY038_WIRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" role="img" aria-label="KY-038 sound sensor wiring diagram to Arduino Uno">
  <!-- Arduino Uno outline -->
  <rect x="20" y="30" width="140" height="190" rx="8" ry="8" fill="#007fc8" stroke="#005a8e" stroke-width="2"/>
  <text x="90" y="52" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Arduino UNO</text>
  <!-- Arduino pins -->
  <rect x="30" y="60" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="71" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">5V</text>
  <rect x="30" y="80" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="91" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">GND</text>
  <rect x="30" y="100" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="111" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">D7</text>
  <rect x="30" y="120" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="131" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">A0</text>
  <!-- Sensor module -->
  <rect x="250" y="50" width="120" height="140" rx="6" ry="6" fill="#1a3a6b" stroke="#0f2245" stroke-width="2"/>
  <text x="310" y="72" font-family="sans-serif" font-size="10" fill="white" text-anchor="middle" font-weight="bold">KY-038</text>
  <!-- Sensor pins -->
  <rect x="260" y="82" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="92" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">VCC</text>
  <rect x="260" y="100" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="110" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">GND</text>
  <rect x="260" y="118" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="128" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">DO</text>
  <rect x="260" y="136" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="146" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">AO</text>
  <!-- Wires -->
  <line x1="70" y1="67" x2="260" y2="88" stroke="#ff4444" stroke-width="2"/>
  <line x1="70" y1="87" x2="260" y2="106" stroke="#333333" stroke-width="2"/>
  <line x1="70" y1="107" x2="260" y2="124" stroke="#44aa44" stroke-width="2"/>
  <line x1="70" y1="127" x2="260" y2="142" stroke="#4a90e2" stroke-width="2"/>
  <!-- Wire labels -->
  <text x="155" y="63" font-family="monospace" font-size="8" fill="#ff4444">5V</text>
  <text x="155" y="83" font-family="monospace" font-size="8" fill="#555">GND</text>
  <text x="155" y="103" font-family="monospace" font-size="8" fill="#44aa44">DO → D7</text>
  <text x="155" y="123" font-family="monospace" font-size="8" fill="#4a90e2">AO → A0</text>
</svg>`;

const SKETCH_KY038 = `// KY-038 Sound / Microphone Sensor
// DO (digital out) goes HIGH when sound exceeds the potentiometer threshold.
// AO (analog out) gives a 0–1023 value proportional to sound amplitude.

const int PIN_DIGITAL = 7;    // DO pin → digital pin 7
const int PIN_ANALOG  = A0;   // AO pin → analog pin A0

// Tune this threshold for the analog channel (0 = silent, 1023 = loudest)
const int ANALOG_THRESHOLD = 600;

void setup() {
  pinMode(PIN_DIGITAL, INPUT);
  Serial.begin(9600);
  Serial.println("KY-038 Sound Sensor ready.");
  Serial.println("Adjust the blue potentiometer to set the digital trigger level.");
}

void loop() {
  // --- Digital channel ---
  // The on-board LM393 comparator fires DO LOW when sound exceeds the trim pot.
  int digitalState = digitalRead(PIN_DIGITAL);

  // --- Analog channel ---
  // Raw ADC value: quieter = lower number, louder = higher number.
  int analogValue = analogRead(PIN_ANALOG);

  Serial.print("Analog: ");
  Serial.print(analogValue);
  Serial.print("  |  Digital trigger: ");
  Serial.print(digitalState == LOW ? "YES" : "no");

  if (analogValue > ANALOG_THRESHOLD) {
    Serial.print("  <<< LOUD !");
  }

  Serial.println();
  delay(100);   // 10 readings per second is plenty for sound detection
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — MQ-2 Gas & Smoke Sensor
// ---------------------------------------------------------------------------

const SVG_MQ2_MODULE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="MQ-2 gas and smoke sensor module">
  <!-- PCB body -->
  <rect x="55" y="40" width="210" height="120" rx="6" ry="6" fill="#8b4513" stroke="#5a2d0c" stroke-width="2"/>
  <!-- Metal dome / sensing element -->
  <ellipse cx="220" cy="100" rx="28" ry="28" fill="#888" stroke="#555" stroke-width="2"/>
  <ellipse cx="220" cy="100" rx="20" ry="20" fill="#aaa" stroke="#777" stroke-width="1.5"/>
  <!-- Metal mesh holes pattern -->
  <circle cx="214" cy="94" r="2" fill="#666"/>
  <circle cx="221" cy="94" r="2" fill="#666"/>
  <circle cx="228" cy="94" r="2" fill="#666"/>
  <circle cx="214" cy="101" r="2" fill="#666"/>
  <circle cx="221" cy="101" r="2" fill="#666"/>
  <circle cx="228" cy="101" r="2" fill="#666"/>
  <circle cx="214" cy="108" r="2" fill="#666"/>
  <circle cx="221" cy="108" r="2" fill="#666"/>
  <circle cx="228" cy="108" r="2" fill="#666"/>
  <text x="220" y="142" font-family="sans-serif" font-size="8" fill="#ffddaa" text-anchor="middle">MQ-2</text>
  <!-- LM393 comparator -->
  <rect x="125" y="78" width="50" height="28" rx="3" ry="3" fill="#1a1a2e" stroke="#444" stroke-width="1.5"/>
  <text x="150" y="96" font-family="monospace" font-size="8" fill="#aaa" text-anchor="middle">LM393</text>
  <!-- Potentiometer -->
  <rect x="80" y="80" width="26" height="26" rx="3" ry="3" fill="#4a3a00" stroke="#777" stroke-width="1.5"/>
  <circle cx="93" cy="93" r="7" fill="#222" stroke="#888" stroke-width="1"/>
  <line x1="93" y1="86" x2="93" y2="81" stroke="#aaa" stroke-width="2"/>
  <text x="93" y="118" font-family="sans-serif" font-size="7" fill="#ccc" text-anchor="middle">TRIM</text>
  <!-- LEDs -->
  <circle cx="160" cy="57" r="5" fill="#ff4444" opacity="0.9"/>
  <text x="160" y="49" font-family="sans-serif" font-size="7" fill="#ff8888" text-anchor="middle">PWR</text>
  <circle cx="175" cy="57" r="5" fill="#44ff44" opacity="0.9"/>
  <text x="175" y="49" font-family="sans-serif" font-size="7" fill="#88ff88" text-anchor="middle">DO</text>
  <!-- Pin header (4 pins) -->
  <rect x="57" y="66" width="14" height="60" rx="2" ry="2" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
  <circle cx="64" cy="79" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="64" cy="95" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="64" cy="111" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="64" cy="127" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <!-- Pin labels -->
  <text x="82" y="82" font-family="monospace" font-size="10" fill="#ffe082">VCC</text>
  <text x="82" y="98" font-family="monospace" font-size="10" fill="#ffe082">GND</text>
  <text x="82" y="114" font-family="monospace" font-size="10" fill="#ffe082">DO</text>
  <text x="82" y="130" font-family="monospace" font-size="10" fill="#ffe082">AO</text>
  <text x="160" y="180" font-family="sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="bold">MQ-2 Gas &amp; Smoke Sensor Module</text>
</svg>`;

const SVG_MQ2_WIRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" role="img" aria-label="MQ-2 gas sensor wiring diagram to Arduino Uno">
  <!-- Arduino Uno outline -->
  <rect x="20" y="30" width="140" height="190" rx="8" ry="8" fill="#007fc8" stroke="#005a8e" stroke-width="2"/>
  <text x="90" y="52" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Arduino UNO</text>
  <!-- Arduino pins -->
  <rect x="30" y="60" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="71" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">5V</text>
  <rect x="30" y="80" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="91" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">GND</text>
  <rect x="30" y="100" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="111" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">D8</text>
  <rect x="30" y="120" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="131" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">A0</text>
  <!-- Sensor module -->
  <rect x="250" y="50" width="120" height="140" rx="6" ry="6" fill="#8b4513" stroke="#5a2d0c" stroke-width="2"/>
  <text x="310" y="72" font-family="sans-serif" font-size="10" fill="white" text-anchor="middle" font-weight="bold">MQ-2</text>
  <!-- Sensor pins -->
  <rect x="260" y="82" width="40" height="13" rx="2" fill="#5a2d0c"/>
  <text x="280" y="92" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">VCC</text>
  <rect x="260" y="100" width="40" height="13" rx="2" fill="#5a2d0c"/>
  <text x="280" y="110" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">GND</text>
  <rect x="260" y="118" width="40" height="13" rx="2" fill="#5a2d0c"/>
  <text x="280" y="128" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">DO</text>
  <rect x="260" y="136" width="40" height="13" rx="2" fill="#5a2d0c"/>
  <text x="280" y="146" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">AO</text>
  <!-- Wires -->
  <line x1="70" y1="67" x2="260" y2="88" stroke="#ff4444" stroke-width="2"/>
  <line x1="70" y1="87" x2="260" y2="106" stroke="#333333" stroke-width="2"/>
  <line x1="70" y1="107" x2="260" y2="124" stroke="#44aa44" stroke-width="2"/>
  <line x1="70" y1="127" x2="260" y2="142" stroke="#4a90e2" stroke-width="2"/>
  <!-- Wire labels -->
  <text x="155" y="63" font-family="monospace" font-size="8" fill="#ff4444">5V</text>
  <text x="155" y="83" font-family="monospace" font-size="8" fill="#555">GND</text>
  <text x="155" y="103" font-family="monospace" font-size="8" fill="#44aa44">DO → D8</text>
  <text x="155" y="123" font-family="monospace" font-size="8" fill="#4a90e2">AO → A0</text>
  <!-- Warm-up note -->
  <rect x="20" y="200" width="360" height="22" rx="4" fill="#fff3cd" stroke="#c8a200" stroke-width="1"/>
  <text x="30" y="215" font-family="sans-serif" font-size="9" fill="#664d00">Note: MQ-2 requires ~20 s warm-up after power on before readings stabilise.</text>
</svg>`;

const SKETCH_MQ2 = `// MQ-2 Gas & Smoke Sensor
// AO gives an analog level proportional to gas concentration.
// DO fires LOW when gas exceeds the on-board potentiometer threshold.
// IMPORTANT: Allow at least 20 seconds after power-on before trusting values.

const int PIN_DIGITAL = 8;    // DO → D8
const int PIN_ANALOG  = A0;   // AO → A0

// Alarm threshold on the analog channel (adjust for your environment).
// 0 = clean air baseline; higher values indicate more gas/smoke.
const int GAS_THRESHOLD = 400;

// How many seconds to wait for sensor warm-up
const unsigned long WARMUP_MS = 20000UL;

void setup() {
  pinMode(PIN_DIGITAL, INPUT);
  Serial.begin(9600);
  Serial.println("MQ-2 Gas Sensor warming up...");
  delay(WARMUP_MS);
  Serial.println("Warm-up complete. Monitoring gas levels.");
}

void loop() {
  int gasLevel = analogRead(PIN_ANALOG);
  int alarmPin = digitalRead(PIN_DIGITAL);  // LOW = alarm triggered

  Serial.print("Gas level: ");
  Serial.print(gasLevel);
  Serial.print("/1023  |  Alarm: ");
  Serial.print(alarmPin == LOW ? "TRIGGERED" : "clear");

  if (gasLevel > GAS_THRESHOLD) {
    Serial.print("  *** HIGH GAS DETECTED ***");
  }

  Serial.println();
  delay(500);
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Flame Sensor (IR)
// ---------------------------------------------------------------------------

const SVG_FLAME_MODULE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="IR flame sensor module">
  <!-- PCB body -->
  <rect x="60" y="40" width="200" height="120" rx="6" ry="6" fill="#2d6a2d" stroke="#1a4a1a" stroke-width="2"/>
  <!-- IR phototransistor -->
  <ellipse cx="215" cy="100" rx="14" ry="18" fill="#1a1a2e" stroke="#555" stroke-width="2"/>
  <ellipse cx="215" cy="100" rx="8" ry="10" fill="#3a3a6a"/>
  <line x1="210" y1="118" x2="210" y2="135" stroke="#888" stroke-width="2"/>
  <line x1="220" y1="118" x2="220" y2="135" stroke="#888" stroke-width="2"/>
  <text x="215" y="152" font-family="sans-serif" font-size="8" fill="#aaffaa" text-anchor="middle">IR RX</text>
  <!-- Flame (decorative) -->
  <path d="M240 85 C245 75, 255 78, 252 68 C260 78, 258 90, 250 88 C255 95, 248 102, 240 95 C235 102, 228 96, 230 88 C224 90, 222 78, 230 68 C227 78, 238 74, 240 85Z" fill="#ff6600" opacity="0.8"/>
  <!-- LM393 comparator -->
  <rect x="120" y="78" width="50" height="28" rx="3" ry="3" fill="#1a1a2e" stroke="#444" stroke-width="1.5"/>
  <text x="145" y="96" font-family="monospace" font-size="8" fill="#aaa" text-anchor="middle">LM393</text>
  <!-- Potentiometer -->
  <rect x="78" y="80" width="26" height="26" rx="3" ry="3" fill="#4a3a00" stroke="#777" stroke-width="1.5"/>
  <circle cx="91" cy="93" r="7" fill="#222" stroke="#888" stroke-width="1"/>
  <line x1="91" y1="86" x2="91" y2="81" stroke="#aaa" stroke-width="2"/>
  <!-- LEDs -->
  <circle cx="155" cy="57" r="5" fill="#ff4444" opacity="0.9"/>
  <text x="155" y="49" font-family="sans-serif" font-size="7" fill="#ff8888" text-anchor="middle">PWR</text>
  <circle cx="170" cy="57" r="5" fill="#44ff44" opacity="0.9"/>
  <text x="170" y="49" font-family="sans-serif" font-size="7" fill="#88ff88" text-anchor="middle">DO</text>
  <!-- Pin header (4 pins) -->
  <rect x="62" y="66" width="14" height="60" rx="2" ry="2" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
  <circle cx="69" cy="79" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="95" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="111" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <circle cx="69" cy="127" r="4" fill="#c0a000" stroke="#888" stroke-width="1"/>
  <!-- Pin labels -->
  <text x="84" y="82" font-family="monospace" font-size="10" fill="#ffe082">VCC</text>
  <text x="84" y="98" font-family="monospace" font-size="10" fill="#ffe082">GND</text>
  <text x="84" y="114" font-family="monospace" font-size="10" fill="#ffe082">DO</text>
  <text x="84" y="130" font-family="monospace" font-size="10" fill="#ffe082">AO</text>
  <text x="160" y="180" font-family="sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="bold">Flame Sensor (IR Phototransistor Module)</text>
</svg>`;

const SVG_FLAME_WIRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" role="img" aria-label="Flame sensor wiring diagram to Arduino Uno">
  <!-- Arduino Uno outline -->
  <rect x="20" y="30" width="140" height="190" rx="8" ry="8" fill="#007fc8" stroke="#005a8e" stroke-width="2"/>
  <text x="90" y="52" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Arduino UNO</text>
  <!-- Arduino pins -->
  <rect x="30" y="60" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="71" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">5V</text>
  <rect x="30" y="80" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="91" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">GND</text>
  <rect x="30" y="100" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="111" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">D6</text>
  <rect x="30" y="120" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="131" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">A0</text>
  <!-- Sensor module -->
  <rect x="250" y="50" width="120" height="140" rx="6" ry="6" fill="#2d6a2d" stroke="#1a4a1a" stroke-width="2"/>
  <text x="310" y="68" font-family="sans-serif" font-size="9" fill="white" text-anchor="middle" font-weight="bold">Flame Sensor</text>
  <!-- Sensor pins -->
  <rect x="260" y="78" width="40" height="13" rx="2" fill="#1a4a1a"/>
  <text x="280" y="88" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">VCC</text>
  <rect x="260" y="96" width="40" height="13" rx="2" fill="#1a4a1a"/>
  <text x="280" y="106" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">GND</text>
  <rect x="260" y="114" width="40" height="13" rx="2" fill="#1a4a1a"/>
  <text x="280" y="124" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">DO</text>
  <rect x="260" y="132" width="40" height="13" rx="2" fill="#1a4a1a"/>
  <text x="280" y="142" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">AO</text>
  <!-- Wires -->
  <line x1="70" y1="67" x2="260" y2="84" stroke="#ff4444" stroke-width="2"/>
  <line x1="70" y1="87" x2="260" y2="102" stroke="#333333" stroke-width="2"/>
  <line x1="70" y1="107" x2="260" y2="120" stroke="#44aa44" stroke-width="2"/>
  <line x1="70" y1="127" x2="260" y2="138" stroke="#4a90e2" stroke-width="2"/>
  <!-- Wire labels -->
  <text x="155" y="63" font-family="monospace" font-size="8" fill="#ff4444">5V</text>
  <text x="155" y="83" font-family="monospace" font-size="8" fill="#555">GND</text>
  <text x="155" y="103" font-family="monospace" font-size="8" fill="#44aa44">DO → D6</text>
  <text x="155" y="123" font-family="monospace" font-size="8" fill="#4a90e2">AO → A0</text>
</svg>`;

const SKETCH_FLAME = `// Flame Sensor (IR phototransistor module)
// The sensor detects infrared light emitted by a flame (candle, lighter, fire).
// DO goes LOW when a flame is detected (comparison to pot threshold).
// AO gives analog proximity — lower value means a stronger flame signal.

const int PIN_DIGITAL = 6;   // DO → D6
const int PIN_ANALOG  = A0;  // AO → A0

// Analog values below this suggest a flame is close.
// The exact threshold depends on your module; calibrate in a dark room.
const int FLAME_ANALOG_THRESHOLD = 500;

void setup() {
  pinMode(PIN_DIGITAL, INPUT);
  Serial.begin(9600);
  Serial.println("Flame sensor ready. Keep away from open flames during testing!");
}

void loop() {
  int digitalState = digitalRead(PIN_DIGITAL);   // LOW = flame detected
  int analogValue  = analogRead(PIN_ANALOG);     // lower = brighter IR

  Serial.print("Analog IR: ");
  Serial.print(analogValue);
  Serial.print("  |  Flame: ");

  if (digitalState == LOW) {
    Serial.print("DETECTED via DO pin !");
  } else if (analogValue < FLAME_ANALOG_THRESHOLD) {
    Serial.print("DETECTED via analog threshold !");
  } else {
    Serial.print("none");
  }

  Serial.println();
  delay(200);
}`;

// ---------------------------------------------------------------------------
// Lesson 5 — Soil Moisture Sensor
// ---------------------------------------------------------------------------

const SVG_SOIL_MODULE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" role="img" aria-label="Soil moisture sensor with probe and control board">
  <!-- Control board -->
  <rect x="55" y="30" width="150" height="100" rx="6" ry="6" fill="#1a3a6b" stroke="#0f2245" stroke-width="2"/>
  <text x="130" y="50" font-family="sans-serif" font-size="10" fill="white" text-anchor="middle" font-weight="bold">Control Board</text>
  <!-- LM393 on board -->
  <rect x="75" y="60" width="50" height="25" rx="3" fill="#1a1a2e" stroke="#444" stroke-width="1.5"/>
  <text x="100" y="76" font-family="monospace" font-size="8" fill="#aaa" text-anchor="middle">LM393</text>
  <!-- Potentiometer on board -->
  <rect x="140" y="60" width="22" height="22" rx="3" fill="#4a3a00" stroke="#777" stroke-width="1.5"/>
  <circle cx="151" cy="71" r="6" fill="#222" stroke="#888" stroke-width="1"/>
  <!-- LEDs on board -->
  <circle cx="120" cy="45" r="4" fill="#ff4444"/>
  <circle cx="133" cy="45" r="4" fill="#44ff44"/>
  <!-- Pin header (4 pins) -->
  <rect x="57" y="55" width="12" height="55" rx="2" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
  <circle cx="63" cy="67" r="3.5" fill="#c0a000"/>
  <circle cx="63" cy="80" r="3.5" fill="#c0a000"/>
  <circle cx="63" cy="93" r="3.5" fill="#c0a000"/>
  <circle cx="63" cy="106" r="3.5" fill="#c0a000"/>
  <text x="43" y="70" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">VCC</text>
  <text x="43" y="83" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">GND</text>
  <text x="43" y="96" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">DO</text>
  <text x="43" y="109" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">AO</text>
  <!-- Wire to probe -->
  <line x1="205" y1="80" x2="225" y2="80" stroke="#888" stroke-width="2"/>
  <!-- Soil probe (two parallel electrodes) -->
  <rect x="225" y="35" width="12" height="130" rx="3" fill="#b8860b" stroke="#888" stroke-width="1.5"/>
  <rect x="245" y="35" width="12" height="130" rx="3" fill="#b8860b" stroke="#888" stroke-width="1.5"/>
  <!-- Soil (suggestive) -->
  <rect x="215" y="110" width="55" height="60" rx="0" fill="#5c3d1a" opacity="0.6"/>
  <text x="242" y="185" font-family="sans-serif" font-size="8" fill="#c8a870" text-anchor="middle">soil</text>
  <text x="242" y="195" font-family="sans-serif" font-size="8" fill="#c8a870" text-anchor="middle">probe</text>
  <text x="130" y="155" font-family="sans-serif" font-size="10" fill="#ffffff" text-anchor="middle" font-weight="bold">Soil Moisture Sensor</text>
</svg>`;

const SVG_SOIL_WIRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" role="img" aria-label="Soil moisture sensor wiring diagram to Arduino Uno">
  <!-- Arduino Uno outline -->
  <rect x="20" y="30" width="140" height="190" rx="8" ry="8" fill="#007fc8" stroke="#005a8e" stroke-width="2"/>
  <text x="90" y="52" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Arduino UNO</text>
  <!-- Arduino pins -->
  <rect x="30" y="60" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="71" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">3.3V</text>
  <rect x="30" y="80" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="91" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">GND</text>
  <rect x="30" y="100" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="111" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">D5</text>
  <rect x="30" y="120" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="131" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">A0</text>
  <!-- Sensor module -->
  <rect x="250" y="50" width="120" height="140" rx="6" ry="6" fill="#1a3a6b" stroke="#0f2245" stroke-width="2"/>
  <text x="310" y="68" font-family="sans-serif" font-size="9" fill="white" text-anchor="middle" font-weight="bold">Soil Sensor</text>
  <!-- Sensor pins -->
  <rect x="260" y="78" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="88" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">VCC</text>
  <rect x="260" y="96" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="106" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">GND</text>
  <rect x="260" y="114" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="124" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">DO</text>
  <rect x="260" y="132" width="40" height="13" rx="2" fill="#0f2245"/>
  <text x="280" y="142" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">AO</text>
  <!-- Wires -->
  <line x1="70" y1="67" x2="260" y2="84" stroke="#ff8800" stroke-width="2"/>
  <line x1="70" y1="87" x2="260" y2="102" stroke="#333333" stroke-width="2"/>
  <line x1="70" y1="107" x2="260" y2="120" stroke="#44aa44" stroke-width="2"/>
  <line x1="70" y1="127" x2="260" y2="138" stroke="#4a90e2" stroke-width="2"/>
  <!-- Wire labels -->
  <text x="155" y="63" font-family="monospace" font-size="8" fill="#ff8800">3.3V (orng)</text>
  <text x="155" y="83" font-family="monospace" font-size="8" fill="#555">GND</text>
  <text x="155" y="103" font-family="monospace" font-size="8" fill="#44aa44">DO → D5</text>
  <text x="155" y="123" font-family="monospace" font-size="8" fill="#4a90e2">AO → A0</text>
  <!-- Note -->
  <rect x="20" y="200" width="360" height="22" rx="4" fill="#d4edda" stroke="#28a745" stroke-width="1"/>
  <text x="30" y="215" font-family="sans-serif" font-size="9" fill="#155724">Tip: Use 3.3 V to power the probe — it slows electrode corrosion vs 5 V.</text>
</svg>`;

const SKETCH_SOIL = `// Soil Moisture Sensor
// The two-prong probe acts as a variable resistor: dry soil = high resistance,
// wet soil = lower resistance. The control board outputs an analog voltage and
// a digital alert when moisture drops below the potentiometer threshold.

const int PIN_DIGITAL = 5;   // DO → D5 (LOW = soil too dry)
const int PIN_ANALOG  = A0;  // AO → A0

// Calibration constants — adjust by reading sensor in dry air and in water.
// Typical resistive module values (your module may differ):
const int RAW_DRY = 880;   // analogRead when probe is in dry air
const int RAW_WET = 340;   // analogRead when probe is submerged in water

void setup() {
  pinMode(PIN_DIGITAL, INPUT);
  Serial.begin(9600);
  Serial.println("Soil Moisture Sensor ready.");
  Serial.print("Calibration — dry: ");
  Serial.print(RAW_DRY);
  Serial.print("  wet: ");
  Serial.println(RAW_WET);
}

void loop() {
  int raw = analogRead(PIN_ANALOG);
  int drySig = digitalRead(PIN_DIGITAL);  // LOW = dry alarm (pot threshold)

  // Map raw ADC to 0–100 % moisture (clamp to valid range)
  int moisture = map(raw, RAW_DRY, RAW_WET, 0, 100);
  moisture = constrain(moisture, 0, 100);

  Serial.print("Raw: ");
  Serial.print(raw);
  Serial.print("  |  Moisture: ");
  Serial.print(moisture);
  Serial.print("%  |  Dry alarm: ");
  Serial.println(drySig == LOW ? "YES — water me!" : "ok");

  delay(1000);
}`;

// ---------------------------------------------------------------------------
// Lesson 6 — Rain / Water Level Sensor
// ---------------------------------------------------------------------------

const SVG_RAIN_MODULE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" role="img" aria-label="Rain and water level sensor module">
  <!-- Sensing board (long comb PCB) -->
  <rect x="170" y="30" width="50" height="160" rx="4" ry="4" fill="#1a4a1a" stroke="#0a2a0a" stroke-width="2"/>
  <!-- Interdigitated copper traces (comb pattern) -->
  <!-- Left side traces -->
  <rect x="178" y="50" width="8" height="120" rx="1" fill="#c8a000" opacity="0.8"/>
  <rect x="178" y="50" width="8" height="8" rx="1" fill="#c8a000"/>
  <rect x="178" y="68" width="8" height="8" rx="1" fill="#c8a000"/>
  <rect x="178" y="86" width="8" height="8" rx="1" fill="#c8a000"/>
  <rect x="178" y="104" width="8" height="8" rx="1" fill="#c8a000"/>
  <rect x="178" y="122" width="8" height="8" rx="1" fill="#c8a000"/>
  <rect x="178" y="140" width="8" height="8" rx="1" fill="#c8a000"/>
  <!-- Right side traces -->
  <rect x="204" y="50" width="8" height="120" rx="1" fill="#c8a000" opacity="0.8"/>
  <!-- Cross bridges -->
  <rect x="186" y="55" width="18" height="5" rx="1" fill="#c8a000"/>
  <rect x="186" y="73" width="18" height="5" rx="1" fill="#c8a000"/>
  <rect x="186" y="91" width="18" height="5" rx="1" fill="#c8a000"/>
  <rect x="186" y="109" width="18" height="5" rx="1" fill="#c8a000"/>
  <rect x="186" y="127" width="18" height="5" rx="1" fill="#c8a000"/>
  <rect x="186" y="145" width="18" height="5" rx="1" fill="#c8a000"/>
  <text x="195" y="205" font-family="sans-serif" font-size="8" fill="#aaffaa" text-anchor="middle">Sensing PCB</text>
  <!-- Water droplets -->
  <path d="M240 70 C240 60, 248 60, 248 70 C248 78, 240 82, 240 70Z" fill="#4a90e2" opacity="0.7"/>
  <path d="M255 90 C255 80, 263 80, 263 90 C263 98, 255 102, 255 90Z" fill="#4a90e2" opacity="0.7"/>
  <path d="M248 55 C248 46, 255 46, 255 55 C255 63, 248 67, 248 55Z" fill="#4a90e2" opacity="0.6"/>
  <!-- Control board (smaller, connected via leads) -->
  <rect x="55" y="70" width="110" height="80" rx="6" ry="6" fill="#2d2d6a" stroke="#1a1a4a" stroke-width="2"/>
  <text x="110" y="88" font-family="sans-serif" font-size="9" fill="white" text-anchor="middle" font-weight="bold">Control Board</text>
  <!-- Connector wires from sensing board to control board -->
  <line x1="170" y1="95" x2="165" y2="115" stroke="#aaa" stroke-width="2"/>
  <line x1="170" y1="105" x2="165" y2="125" stroke="#aaa" stroke-width="2"/>
  <!-- Control board pins -->
  <rect x="57" y="96" width="10" height="46" rx="2" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
  <circle cx="62" cy="105" r="3.5" fill="#c0a000"/>
  <circle cx="62" cy="117" r="3.5" fill="#c0a000"/>
  <circle cx="62" cy="129" r="3.5" fill="#c0a000"/>
  <circle cx="62" cy="141" r="3.5" fill="#c0a000"/>
  <text x="40" y="108" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">VCC</text>
  <text x="40" y="120" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">GND</text>
  <text x="40" y="132" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">DO</text>
  <text x="40" y="144" font-family="monospace" font-size="8" fill="#ffe082" text-anchor="end">AO</text>
  <text x="140" y="205" font-family="sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="bold">Rain / Water Level Sensor</text>
</svg>`;

const SVG_RAIN_WIRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" role="img" aria-label="Rain sensor wiring diagram to Arduino Uno">
  <!-- Arduino Uno outline -->
  <rect x="20" y="30" width="140" height="190" rx="8" ry="8" fill="#007fc8" stroke="#005a8e" stroke-width="2"/>
  <text x="90" y="52" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">Arduino UNO</text>
  <!-- Arduino pins -->
  <rect x="30" y="60" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="71" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">5V</text>
  <rect x="30" y="80" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="91" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">GND</text>
  <rect x="30" y="100" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="111" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">D4</text>
  <rect x="30" y="120" width="40" height="14" rx="2" fill="#003d66"/>
  <text x="50" y="131" font-family="monospace" font-size="9" fill="#ffcc00" text-anchor="middle">A0</text>
  <!-- Sensor module -->
  <rect x="250" y="50" width="120" height="140" rx="6" ry="6" fill="#2d2d6a" stroke="#1a1a4a" stroke-width="2"/>
  <text x="310" y="68" font-family="sans-serif" font-size="9" fill="white" text-anchor="middle" font-weight="bold">Rain Sensor</text>
  <!-- Sensor pins -->
  <rect x="260" y="78" width="40" height="13" rx="2" fill="#1a1a4a"/>
  <text x="280" y="88" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">VCC</text>
  <rect x="260" y="96" width="40" height="13" rx="2" fill="#1a1a4a"/>
  <text x="280" y="106" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">GND</text>
  <rect x="260" y="114" width="40" height="13" rx="2" fill="#1a1a4a"/>
  <text x="280" y="124" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">DO</text>
  <rect x="260" y="132" width="40" height="13" rx="2" fill="#1a1a4a"/>
  <text x="280" y="142" font-family="monospace" font-size="9" fill="#ffe082" text-anchor="middle">AO</text>
  <!-- Wires -->
  <line x1="70" y1="67" x2="260" y2="84" stroke="#ff4444" stroke-width="2"/>
  <line x1="70" y1="87" x2="260" y2="102" stroke="#333333" stroke-width="2"/>
  <line x1="70" y1="107" x2="260" y2="120" stroke="#44aa44" stroke-width="2"/>
  <line x1="70" y1="127" x2="260" y2="138" stroke="#4a90e2" stroke-width="2"/>
  <!-- Wire labels -->
  <text x="155" y="63" font-family="monospace" font-size="8" fill="#ff4444">5V</text>
  <text x="155" y="83" font-family="monospace" font-size="8" fill="#555">GND</text>
  <text x="155" y="103" font-family="monospace" font-size="8" fill="#44aa44">DO → D4</text>
  <text x="155" y="123" font-family="monospace" font-size="8" fill="#4a90e2">AO → A0</text>
</svg>`;

const SKETCH_RAIN = `// Rain / Water Level Sensor
// The sensing PCB has interdigitated copper traces. When water bridges the traces,
// electrical resistance drops, and the analog output voltage rises.
// More water = lower resistance = higher analogRead value.
// DO fires LOW when water level exceeds the potentiometer threshold.

const int PIN_DIGITAL = 4;   // DO → D4 (LOW = rain/water detected)
const int PIN_ANALOG  = A0;  // AO → A0

// Threshold for "significant rain" on the analog channel.
// Dry board ≈ 0, fully submerged ≈ 800–1000 (calibrate yours).
const int RAIN_THRESHOLD = 300;

void setup() {
  pinMode(PIN_DIGITAL, INPUT);
  Serial.begin(9600);
  Serial.println("Rain / Water Level Sensor ready.");
}

void loop() {
  int waterLevel = analogRead(PIN_ANALOG);
  int digitalTrig = digitalRead(PIN_DIGITAL);   // LOW = threshold exceeded

  // Convert to a rough percentage: 0 = dry, 100 = very wet
  int wetPct = map(waterLevel, 0, 950, 0, 100);
  wetPct = constrain(wetPct, 0, 100);

  Serial.print("Raw: ");
  Serial.print(waterLevel);
  Serial.print("  |  Wet: ");
  Serial.print(wetPct);
  Serial.print("%  |  Rain alert: ");
  Serial.println(digitalTrig == LOW ? "YES" : "no");

  delay(500);
}`;

// ---------------------------------------------------------------------------
// Exported lessons array
// ---------------------------------------------------------------------------

export const sensorsPart2: LessonDef[] = [
  // -----------------------------------------------------------------------
  // 1. BH1750 — Digital Light (Lux)
  // -----------------------------------------------------------------------
  {
    title: "BH1750 — Digital Light (Lux)",
    slug: "sensor-bh1750",
    estMinutes: 18,
    contentType: "markdown",
    body: body(
      md(`## What is the BH1750?

The **BH1750FVI** is a 16-bit ambient-light sensor from ROHM Semiconductor. Unlike simple photoresistors that give a raw voltage, the BH1750 outputs a calibrated measurement in **lux** — the SI unit of illuminance — directly over an I²C bus. This means you get a real-world number (100 lux for a dark corridor, 500 lux for a well-lit office, 50 000+ lux on a sunny day) without any maths or manual calibration.

### How it works

Inside the sensor IC is a photodiode array paired with an analog-to-digital converter and an I²C interface. You send it a command (e.g., "start one measurement at high resolution") and it returns two bytes that encode the result in lux. The sensor can be set to three resolution modes:

| Mode | Resolution | Measurement time |
|------|-----------|-----------------|
| High-resolution | 1 lux | ~120 ms |
| High-resolution 2 | 0.5 lux | ~120 ms |
| Low-resolution | 4 lux | ~16 ms |

### Uses

Weather stations, automatic brightness control for displays, greenhouse monitoring, photography light meters, and any project that needs calibrated light intensity.

### Pins and interface

The BH1750 module has five pins:

| Pin | Connect to |
|-----|-----------|
| VCC | 3.3 V or 5 V |
| GND | GND |
| SCL | A5 on the Arduino Uno (I²C clock) |
| SDA | A4 on the Arduino Uno (I²C data) |
| ADDR | GND for address 0x23; VCC for address 0x5C |

On the **Arduino Uno**, I²C lives on **A4 (SDA)** and **A5 (SCL)**. The I²C bus is shared, so you can connect multiple I²C devices on the same two wires.`),
      svg(SVG_BH1750_MODULE, "BH1750 digital light sensor module — five-pin I²C breakout board"),
      svg(SVG_BH1750_WIRING, "Wiring the BH1750 to an Arduino Uno: VCC→5V, GND→GND, SDA→A4, SCL→A5, ADDR→GND"),
      md(`## Code

You need the **BH1750** library by Christopher Laws. In the Arduino IDE go to *Sketch → Include Library → Manage Libraries*, search for "BH1750", and install it.

The sketch below initialises the sensor, checks it is reachable, then prints the lux reading every 500 ms.`),
      code("arduino", SKETCH_BH1750, { filename: "bh1750_lux.ino", openInStudio: true }),
      callout("tip", "Point the sensor at different light sources — phone screen, window, lamp — and compare the lux values. A candle at arm's length is about 10 lux; a phone screen on full brightness is roughly 300–500 lux. Covering the sensor with your hand should drop it close to zero."),
    ),
  },

  // -----------------------------------------------------------------------
  // 2. Sound / Microphone KY-038
  // -----------------------------------------------------------------------
  {
    title: "Sound / Microphone (KY-038)",
    slug: "sensor-sound",
    estMinutes: 15,
    contentType: "markdown",
    body: body(
      md(`## What is the KY-038?

The **KY-038** is a sound-detection module built around an electret microphone capsule and an LM393 dual-comparator IC. It gives you two outputs simultaneously:

- **AO (Analog Out)** — a 0–5 V voltage that rises and falls with sound amplitude. Quieter = lower number; louder = higher number.
- **DO (Digital Out)** — goes LOW when the sound level exceeds a threshold set by the blue trimmer potentiometer on the board. Perfect for simple clap detectors or sound-activated alerts.

### How it works

The electret microphone converts sound pressure waves into a tiny AC voltage. The on-board op-amp amplifies this signal and feeds it to two outputs: the raw amplified signal on AO, and the LM393 comparator's decision (above/below threshold) on DO. The potentiometer sets the voltage reference for the comparator — turning it clockwise raises the threshold, making the sensor less sensitive.

### Uses

Clap-on/clap-off switches, voice-activated robots, noise-level monitors, drum-beat detectors, and burglar alarms that respond to breaking glass.

### Pins

| Pin | Function |
|-----|---------|
| VCC | 3.3–5 V |
| GND | Ground |
| DO | Digital output (LOW when loud) |
| AO | Analog output (0–1023 via ADC) |

> The DO pin is **active LOW**: it goes LOW when triggered and returns HIGH when quiet.`),
      svg(SVG_KY038_MODULE, "KY-038 sound sensor module with electret microphone, LM393 comparator, potentiometer and status LEDs"),
      svg(SVG_KY038_WIRING, "Wiring the KY-038 to Arduino Uno: VCC→5V, GND→GND, DO→D7, AO→A0"),
      md(`## Code

No extra library is needed — the KY-038 is read with plain \`digitalRead()\` and \`analogRead()\`. The sketch prints both channels to Serial so you can observe the difference between a quiet room and a loud clap.`),
      code("arduino", SKETCH_KY038, { filename: "ky038_sound.ino", openInStudio: true }),
      callout("tip", "Start with the potentiometer turned fully counter-clockwise (maximum sensitivity). Clap your hands and watch DO go LOW and the green LED on the module light up. Then turn the pot clockwise until clapping no longer triggers it — you have found the edge of the threshold. Back off slightly for reliable detection."),
    ),
  },

  // -----------------------------------------------------------------------
  // 3. MQ-2 Gas & Smoke
  // -----------------------------------------------------------------------
  {
    title: "MQ-2 — Gas & Smoke",
    slug: "sensor-mq2",
    estMinutes: 20,
    contentType: "markdown",
    body: body(
      md(`## What is the MQ-2?

The **MQ-2** is a chemo-resistive gas sensor that detects combustible gases and smoke. It is sensitive to:

- LPG (liquefied petroleum gas)
- Natural gas (methane)
- Propane
- Butane
- Hydrogen
- Smoke from burning organic materials

Inside the metal dome is a tin-dioxide (SnO₂) semiconductor heated by a small coil of nichrome wire. In clean air, SnO₂ has high resistance. When combustible gases are present, they react with oxygen on the surface, reducing the resistance. The module measures this resistance change and outputs an analog voltage proportional to gas concentration.

### The warm-up period

The heater coil must reach operating temperature before measurements are stable. **Allow at least 20 seconds** after powering on before trusting readings. For production safety systems the MQ-2 datasheet recommends a full 24-hour pre-heat for first use (or after long storage), but 20 seconds is fine for classroom experiments.

### Uses

Gas leak detectors, smoke alarms, air-quality monitors, and safety interlocks in robotic systems that operate near fuel lines.

### Pins

| Pin | Function |
|-----|---------|
| VCC | 5 V (the heater draws ~150 mA — use the Arduino's 5V pin) |
| GND | Ground |
| DO | Digital alarm output (LOW = threshold exceeded) |
| AO | Analog concentration level (0 = clean, higher = more gas) |`),
      svg(SVG_MQ2_MODULE, "MQ-2 gas and smoke sensor module with metal dome sensing element, LM393 comparator and trimmer potentiometer"),
      svg(SVG_MQ2_WIRING, "Wiring the MQ-2 to Arduino Uno: VCC→5V, GND→GND, DO→D8, AO→A0. Allow 20 s warm-up."),
      md(`## Code

The sketch waits for the 20-second warm-up, then continuously reads both channels. A simple threshold check on the analog channel provides a second level of alarm independent of the potentiometer.`),
      code("arduino", SKETCH_MQ2, { filename: "mq2_gas.ino", openInStudio: true }),
      callout("warning", "The MQ-2 heater runs warm — the metal dome will be hot to the touch after a few seconds. Do not touch it. Only test with small, controlled gas sources (a cigarette lighter held nearby, not lit). Never operate near an open flame or in a confined space with real gas. The sensor is a learning tool, not a certified safety device."),
    ),
  },

  // -----------------------------------------------------------------------
  // 4. Flame Sensor (IR)
  // -----------------------------------------------------------------------
  {
    title: "Flame Sensor (IR)",
    slug: "sensor-flame",
    estMinutes: 15,
    contentType: "markdown",
    body: body(
      md(`## What is the flame sensor?

A **flame sensor module** uses an infrared (IR) phototransistor tuned to the 760–1100 nm wavelength range — the near-infrared band where flames emit strongly. A candle, lighter, or fire radiates a distinctive spectrum of IR light; regular room lighting and sunlight produce far less in this specific band, so the sensor can distinguish a flame from background illumination.

The module pairs the phototransistor with an LM393 comparator and a trimmer potentiometer — the same circuit topology as the KY-038. You get:

- **DO** — digital output, goes LOW when a flame is detected (when IR exceeds the threshold set by the pot).
- **AO** — analog output, lower value = stronger IR signal = closer or brighter flame.

### How it works

Infrared photons from a flame strike the base-emitter junction of the phototransistor, causing it to conduct. The collector current creates a voltage drop across a resistor, which the LM393 compares against a reference voltage set by the potentiometer. If the phototransistor current exceeds the threshold, DO goes LOW and the green indicator LED on the board lights up.

### Uses

Fire-fighting robots, candle-following robots, kiln monitors, camp stove ignition detection, and industrial burner supervision.

### Pins

| Pin | Function |
|-----|---------|
| VCC | 3.3–5 V |
| GND | Ground |
| DO | Digital output (LOW = flame detected) |
| AO | Analog output (0–1023; lower = stronger flame IR) |

> On the analog channel, a **lower** reading means **more** infrared — the opposite of the soil moisture sensor. The phototransistor allows more current when it sees more IR, which pulls the output voltage down.`),
      svg(SVG_FLAME_MODULE, "Flame sensor module with IR phototransistor, LM393 comparator and a stylised flame illustration"),
      svg(SVG_FLAME_WIRING, "Wiring the flame sensor to Arduino Uno: VCC→5V, GND→GND, DO→D6, AO→A0"),
      md(`## Code

The sketch watches both channels. The digital channel is reliable for simple detection; the analog channel lets you estimate relative proximity — useful for a robot trying to navigate toward (or away from) a flame.`),
      code("arduino", SKETCH_FLAME, { filename: "flame_sensor.ino", openInStudio: true }),
      callout("tip", "Test with a candle or lighter flame held 10–30 cm from the sensor in a slightly darkened room. Sunlight through a window can saturate the sensor and cause false readings; point the module away from direct sunlight when calibrating. The effective detection range is typically 20–100 cm depending on flame size and ambient light."),
    ),
  },

  // -----------------------------------------------------------------------
  // 5. Soil Moisture Sensor
  // -----------------------------------------------------------------------
  {
    title: "Soil Moisture Sensor",
    slug: "sensor-soil",
    estMinutes: 16,
    contentType: "markdown",
    body: body(
      md(`## What is a soil moisture sensor?

A **soil moisture sensor** measures how much water is in soil. The most common low-cost type uses **resistive sensing**: two metal (usually nickel-plated) prongs are inserted into the soil. Dry soil is a poor conductor; wet soil conducts electricity far more easily. The sensor measures this resistance and converts it to a voltage.

A second type — **capacitive sensors** — measures the dielectric constant of the soil without passing current through it, which avoids electrode corrosion. The principle is the same from the Arduino's perspective: analogRead returns a value that changes with water content.

### Interpreting the values

The relationship between ADC reading and moisture percentage is non-linear and depends on:
- Soil type (clay holds water differently from sandy soil)
- Probe insertion depth
- Dissolved minerals in the water

The best approach is **two-point calibration**:
1. Read the sensor in dry air or completely dry soil → this is your "dry" baseline (e.g., 880).
2. Read the sensor submerged in water → this is your "wet" maximum (e.g., 340).
3. Map any reading between those two extremes to 0–100 %.

### Uses

Automated plant watering systems, greenhouse humidity management, agricultural monitoring, weather station soil loggers.

### Pins

| Pin | Function |
|-----|---------|
| VCC | 3.3 V (recommended to slow corrosion) or 5 V |
| GND | Ground |
| DO | Digital output (LOW = soil too dry, based on pot) |
| AO | Analog reading (higher = drier on resistive modules) |

> **Resistive vs capacitive direction**: on a typical **resistive** module, drier soil = higher ADC value (more resistance = less current = higher output voltage). If you have a capacitive module the direction may be reversed — check your calibration readings.`),
      svg(SVG_SOIL_MODULE, "Soil moisture sensor: control board with LM393 and potentiometer connected to a two-prong sensing probe"),
      svg(SVG_SOIL_WIRING, "Wiring soil moisture sensor to Arduino Uno: VCC→3.3V, GND→GND, DO→D5, AO→A0"),
      md(`## Code

The sketch maps raw ADC values to a 0–100 % moisture percentage using the two calibration constants. Update \`RAW_DRY\` and \`RAW_WET\` after running your own calibration.`),
      code("arduino", SKETCH_SOIL, { filename: "soil_moisture.ino", openInStudio: true }),
      callout("tip", "Run the sensor in dry air first and note the raw value — write it in as RAW_DRY. Then dip just the prongs in a glass of water and note that value — write it in as RAW_WET. Your percentage readings will then be accurate for your specific module. Recalibrate if you switch to a different type of soil."),
    ),
  },

  // -----------------------------------------------------------------------
  // 6. Rain / Water Level Sensor
  // -----------------------------------------------------------------------
  {
    title: "Rain / Water Level Sensor",
    slug: "sensor-rain",
    estMinutes: 14,
    contentType: "markdown",
    body: body(
      md(`## What is a rain / water level sensor?

A **rain and water level sensor** is a two-part module: a **sensing PCB** covered in interdigitated (interlocking comb-pattern) copper traces, and a small **control board** with an LM393 comparator. Unlike the soil moisture sensor, the sensing PCB sits flat — it is designed to collect rain droplets or measure the depth of water in a container.

### How it works

The comb traces alternate between two electrical nets. In dry conditions the two nets are isolated, so resistance is essentially infinite. When a water droplet bridges adjacent traces, it creates a conductive path, lowering the resistance between the nets. More droplets (or deeper water) = more parallel conductive paths = lower total resistance = higher output voltage from the module. The Arduino ADC then reads this voltage.

### Reading convention

- **Dry board** → analogRead ≈ 0 (no current path, output pulled to GND)
- **Partially covered** → analogRead in the middle range (100–600)
- **Submerged** → analogRead ≈ 800–950 (maximum conductance)

So unlike many sensors, **a higher value means more water**.

### Uses

Rain detection for automatic window closers, irrigation control (stop watering if it rains), water tank overflow alarms, puddle depth gauges, and flood early-warning systems.

### Pins

| Pin | Function |
|-----|---------|
| VCC | 5 V |
| GND | Ground |
| DO | Digital output (LOW = water detected above pot threshold) |
| AO | Analog reading (0 = dry, higher = more water) |`),
      svg(SVG_RAIN_MODULE, "Rain sensor: sensing PCB with interdigitated copper traces receiving water droplets, plus the control board with LM393 and potentiometer"),
      svg(SVG_RAIN_WIRING, "Wiring the rain sensor to Arduino Uno: VCC→5V, GND→GND, DO→D4, AO→A0"),
      md(`## Code

The sketch reads both channels and maps the analog value to a rough wet-percentage. Adjust the \`RAIN_THRESHOLD\` constant to match your module's response.`),
      code("arduino", SKETCH_RAIN, { filename: "rain_sensor.ino", openInStudio: true }),
      callout("tip", "Try dripping water one drop at a time onto the sensing board and watch the analogRead value climb. When you wipe the board dry, the value should return close to zero within a second or two. If it stays high, there may be mineral deposits on the traces — clean gently with isopropyl alcohol and a cotton swab."),
    ),
  },
];
