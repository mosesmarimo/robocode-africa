import { type LessonDef, md, code, mermaid, svg, callout, body } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1: HC-SR04 Ultrasonic Distance Sensor
// ---------------------------------------------------------------------------

const HCSR04_SKETCH = `const int TRIG = 9;    // Trigger pin — sends the 10 µs pulse
const int ECHO = 10;   // Echo pin — measures the return time

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.begin(9600);
  Serial.println("HC-SR04 ready");
}

void loop() {
  // 1. Ensure TRIG is LOW before we start
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);

  // 2. Fire a 10-microsecond HIGH pulse on TRIG
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  // 3. pulseIn() waits for ECHO to go HIGH, then times how long it stays HIGH
  long duration = pulseIn(ECHO, HIGH);

  // 4. Convert time to distance
  //    Speed of sound ≈ 0.034 cm per microsecond
  //    Divide by 2 because the sound travels there AND back
  float distanceCm = duration * 0.034 / 2.0;

  Serial.print("Distance: ");
  Serial.print(distanceCm, 1);   // 1 decimal place
  Serial.println(" cm");

  delay(300);
}`;

const SVG_HCSR04_MODULE = `<svg viewBox="0 0 320 200" role="img" aria-label="HC-SR04 ultrasonic sensor module diagram" xmlns="http://www.w3.org/2000/svg">
  <!-- Module body -->
  <rect x="40" y="50" width="240" height="100" rx="6" fill="#1a6b1a" stroke="#0d400d" stroke-width="2"/>
  <!-- Left transducer (emitter) -->
  <circle cx="90" cy="100" r="28" fill="#e8e0c0" stroke="#888" stroke-width="2"/>
  <circle cx="90" cy="100" r="20" fill="#c8b870" stroke="#888" stroke-width="1.5"/>
  <circle cx="90" cy="100" r="10" fill="#555"/>
  <text x="90" y="148" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif">T</text>
  <!-- Right transducer (receiver) -->
  <circle cx="230" cy="100" r="28" fill="#e8e0c0" stroke="#888" stroke-width="2"/>
  <circle cx="230" cy="100" r="20" fill="#c8b870" stroke="#888" stroke-width="1.5"/>
  <circle cx="230" cy="100" r="10" fill="#555"/>
  <text x="230" y="148" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif">R</text>
  <!-- Pin header row at bottom -->
  <rect x="95" y="155" width="130" height="18" rx="3" fill="#2a2a2a"/>
  <rect x="100" y="157" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="118" y="157" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="136" y="157" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="154" y="157" width="10" height="14" rx="1" fill="#d4a017"/>
  <!-- Pin labels -->
  <text x="105" y="185" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">VCC</text>
  <text x="123" y="185" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">TRIG</text>
  <text x="141" y="185" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">ECHO</text>
  <text x="159" y="185" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">GND</text>
  <!-- Module label -->
  <text x="160" y="80" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">HC-SR04</text>
  <text x="160" y="95" text-anchor="middle" font-size="9" fill="#aaffaa" font-family="sans-serif">Ultrasonic Distance</text>
</svg>`;

const SVG_HCSR04_WIRING = `<svg viewBox="0 0 420 260" role="img" aria-label="HC-SR04 wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="40" width="160" height="180" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="62" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <!-- Arduino pins -->
  <rect x="18" y="75" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="85" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="95" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="105" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="115" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="125" font-size="9" fill="#fff" font-family="sans-serif">Pin 9</text>
  <rect x="18" y="135" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="145" font-size="9" fill="#fff" font-family="sans-serif">Pin 10</text>
  <!-- HC-SR04 module -->
  <rect x="270" y="60" width="130" height="80" rx="6" fill="#1a6b1a" stroke="#0d400d" stroke-width="2"/>
  <text x="335" y="80" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif" font-weight="bold">HC-SR04</text>
  <circle cx="300" cy="110" r="16" fill="#c8b870" stroke="#888" stroke-width="1.5"/>
  <circle cx="370" cy="110" r="16" fill="#c8b870" stroke="#888" stroke-width="1.5"/>
  <!-- Sensor pins -->
  <rect x="277" y="143" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="295" y="143" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="313" y="143" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="331" y="143" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="282" y="168" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="300" y="168" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">TRIG</text>
  <text x="318" y="168" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">ECHO</text>
  <text x="336" y="168" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <!-- Wires -->
  <!-- 5V -> VCC (red) -->
  <polyline points="48,81 200,81 200,149 277,149" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <!-- GND -> GND (black) -->
  <polyline points="48,101 210,101 210,155 331,155" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <!-- Pin 9 -> TRIG (yellow) -->
  <polyline points="48,121 220,121 220,149 295,149" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Pin 10 -> ECHO (blue) -->
  <polyline points="48,141 230,141 230,152 313,152" fill="none" stroke="#2980b9" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="230" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="238" font-size="9" fill="#333" font-family="sans-serif">5V → VCC</text>
  <rect x="100" y="230" width="12" height="8" fill="#2c3e50"/>
  <text x="116" y="238" font-size="9" fill="#333" font-family="sans-serif">GND → GND</text>
  <rect x="200" y="230" width="12" height="8" fill="#f39c12"/>
  <text x="216" y="238" font-size="9" fill="#333" font-family="sans-serif">Pin 9 → TRIG</text>
  <rect x="300" y="230" width="12" height="8" fill="#2980b9"/>
  <text x="316" y="238" font-size="9" fill="#333" font-family="sans-serif">Pin 10 → ECHO</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2: PIR Motion Sensor HC-SR501
// ---------------------------------------------------------------------------

const PIR_SKETCH = `const int PIR_PIN = 7;   // Digital output from the PIR sensor

void setup() {
  pinMode(PIR_PIN, INPUT);
  Serial.begin(9600);

  // The HC-SR501 needs about 30–60 seconds to "warm up" after power-on.
  // During this time it may fire false readings — we wait it out.
  Serial.println("Warming up PIR sensor (30 s)...");
  delay(30000);
  Serial.println("PIR ready — watching for motion.");
}

void loop() {
  int state = digitalRead(PIR_PIN);

  if (state == HIGH) {
    // Motion detected — the output pin is HIGH
    Serial.println("Motion DETECTED!");
    // Keep printing as long as motion is present
  } else {
    // No motion — the output pin is LOW
    Serial.println("No motion.");
  }

  delay(500);   // Check every 500 ms
}`;

const SVG_PIR_MODULE = `<svg viewBox="0 0 280 220" role="img" aria-label="HC-SR501 PIR motion sensor module" xmlns="http://www.w3.org/2000/svg">
  <!-- PCB body -->
  <rect x="50" y="80" width="180" height="90" rx="6" fill="#3a2060" stroke="#1a0040" stroke-width="2"/>
  <!-- White Fresnel lens dome -->
  <ellipse cx="140" cy="100" rx="50" ry="50" fill="#f0f0f0" stroke="#aaa" stroke-width="2"/>
  <ellipse cx="140" cy="100" rx="42" ry="42" fill="none" stroke="#ccc" stroke-width="1"/>
  <ellipse cx="140" cy="100" rx="30" ry="30" fill="none" stroke="#ccc" stroke-width="1"/>
  <ellipse cx="140" cy="100" rx="18" ry="18" fill="none" stroke="#ccc" stroke-width="1"/>
  <!-- Potentiometers -->
  <circle cx="80" cy="148" r="9" fill="#e67e22" stroke="#a04000" stroke-width="1.5"/>
  <line x1="80" y1="139" x2="84" y2="148" stroke="#333" stroke-width="2"/>
  <circle cx="200" cy="148" r="9" fill="#e67e22" stroke="#a04000" stroke-width="1.5"/>
  <line x1="200" y1="139" x2="204" y2="148" stroke="#333" stroke-width="2"/>
  <!-- Pot labels -->
  <text x="80" y="170" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">Sensitivity</text>
  <text x="200" y="170" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">Time delay</text>
  <!-- Pin header -->
  <rect x="118" y="172" width="44" height="18" rx="2" fill="#2a2a2a"/>
  <rect x="122" y="174" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="136" y="174" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="150" y="174" width="10" height="14" rx="1" fill="#d4a017"/>
  <text x="127" y="200" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="141" y="200" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">OUT</text>
  <text x="155" y="200" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <!-- Label -->
  <text x="140" y="215" text-anchor="middle" font-size="10" fill="#555" font-family="sans-serif">HC-SR501 PIR</text>
</svg>`;

const SVG_PIR_WIRING = `<svg viewBox="0 0 420 240" role="img" aria-label="HC-SR501 PIR sensor wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="40" width="160" height="160" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="62" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="75" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="85" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="95" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="105" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="115" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="125" font-size="9" fill="#fff" font-family="sans-serif">Pin 7</text>
  <!-- PIR module -->
  <rect x="280" y="60" width="110" height="100" rx="6" fill="#3a2060" stroke="#1a0040" stroke-width="2"/>
  <text x="335" y="80" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif" font-weight="bold">HC-SR501</text>
  <ellipse cx="335" cy="115" rx="30" ry="30" fill="#f0f0f0" stroke="#aaa" stroke-width="1.5"/>
  <!-- Sensor pins -->
  <rect x="295" y="163" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="330" y="163" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="365" y="163" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="300" y="185" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="335" y="185" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">OUT</text>
  <text x="370" y="185" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <!-- Wires -->
  <polyline points="48,81 200,81 200,169 295,169" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,101 210,101 210,175 365,175" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <polyline points="48,121 220,121 220,169 330,169" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="215" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="223" font-size="9" fill="#333" font-family="sans-serif">5V → VCC</text>
  <rect x="110" y="215" width="12" height="8" fill="#2c3e50"/>
  <text x="126" y="223" font-size="9" fill="#333" font-family="sans-serif">GND → GND</text>
  <rect x="230" y="215" width="12" height="8" fill="#f39c12"/>
  <text x="246" y="223" font-size="9" fill="#333" font-family="sans-serif">Pin 7 → OUT</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 3: DHT11 / DHT22 Temperature & Humidity
// ---------------------------------------------------------------------------

const DHT_SKETCH = `// You need the "DHT sensor library" by Adafruit (install via Library Manager).
// Also install "Adafruit Unified Sensor" when prompted.
#include <DHT.h>

#define DHTPIN  2       // The data pin is connected to Arduino pin 2
#define DHTTYPE DHT11   // Change to DHT22 if you have the DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  Serial.println("DHT sensor ready");
}

void loop() {
  // Wait at least 2 seconds between readings — the sensor is slow
  delay(2000);

  float humidity    = dht.readHumidity();      // Relative humidity in %
  float temperature = dht.readTemperature();   // Celsius (pass true for Fahrenheit)

  // Check that the reads actually succeeded
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("ERROR: Could not read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature, 1);
  Serial.println(" °C");

  Serial.print("Humidity:    ");
  Serial.print(humidity, 1);
  Serial.println(" %");
}`;

const SVG_DHT_MODULE = `<svg viewBox="0 0 260 200" role="img" aria-label="DHT11 temperature and humidity sensor module" xmlns="http://www.w3.org/2000/svg">
  <!-- Sensor body -->
  <rect x="80" y="40" width="100" height="110" rx="8" fill="#1560bd" stroke="#0a3a80" stroke-width="2"/>
  <!-- Perforated front (humidity mesh) -->
  <rect x="88" y="50" width="84" height="70" rx="4" fill="#0a3a80"/>
  <!-- Dot grid for mesh effect -->
  <circle cx="100" cy="62" r="2" fill="#3a8ad4"/>
  <circle cx="115" cy="62" r="2" fill="#3a8ad4"/>
  <circle cx="130" cy="62" r="2" fill="#3a8ad4"/>
  <circle cx="145" cy="62" r="2" fill="#3a8ad4"/>
  <circle cx="160" cy="62" r="2" fill="#3a8ad4"/>
  <circle cx="100" cy="76" r="2" fill="#3a8ad4"/>
  <circle cx="115" cy="76" r="2" fill="#3a8ad4"/>
  <circle cx="130" cy="76" r="2" fill="#3a8ad4"/>
  <circle cx="145" cy="76" r="2" fill="#3a8ad4"/>
  <circle cx="160" cy="76" r="2" fill="#3a8ad4"/>
  <circle cx="100" cy="90" r="2" fill="#3a8ad4"/>
  <circle cx="115" cy="90" r="2" fill="#3a8ad4"/>
  <circle cx="130" cy="90" r="2" fill="#3a8ad4"/>
  <circle cx="145" cy="90" r="2" fill="#3a8ad4"/>
  <circle cx="160" cy="90" r="2" fill="#3a8ad4"/>
  <circle cx="100" cy="104" r="2" fill="#3a8ad4"/>
  <circle cx="115" cy="104" r="2" fill="#3a8ad4"/>
  <circle cx="130" cy="104" r="2" fill="#3a8ad4"/>
  <circle cx="145" cy="104" r="2" fill="#3a8ad4"/>
  <circle cx="160" cy="104" r="2" fill="#3a8ad4"/>
  <!-- Label on body -->
  <text x="130" y="138" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif" font-weight="bold">DHT11</text>
  <!-- Pin header -->
  <rect x="90" y="152" width="80" height="16" rx="2" fill="#2a2a2a"/>
  <rect x="95" y="154" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="115" y="154" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="135" y="154" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="155" y="154" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="100" y="180" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="120" y="180" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">DATA</text>
  <text x="140" y="180" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">NC</text>
  <text x="160" y="180" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
</svg>`;

const SVG_DHT_WIRING = `<svg viewBox="0 0 420 240" role="img" aria-label="DHT11 wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="40" width="160" height="160" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="62" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="75" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="85" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="95" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="105" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="115" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="125" font-size="9" fill="#fff" font-family="sans-serif">Pin 2</text>
  <!-- DHT11 sensor -->
  <rect x="280" y="60" width="110" height="100" rx="6" fill="#1560bd" stroke="#0a3a80" stroke-width="2"/>
  <text x="335" y="82" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif" font-weight="bold">DHT11</text>
  <rect x="290" y="90" width="90" height="50" rx="4" fill="#0a3a80"/>
  <!-- Sensor pins -->
  <rect x="290" y="163" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="320" y="163" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="370" y="163" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="295" y="185" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="325" y="185" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">DATA</text>
  <text x="375" y="185" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <!-- Pull-up resistor symbol -->
  <rect x="230" y="108" width="30" height="10" rx="3" fill="#d4a017" stroke="#a07000" stroke-width="1"/>
  <text x="245" y="104" text-anchor="middle" font-size="8" fill="#555" font-family="sans-serif">10kΩ</text>
  <!-- Wires -->
  <polyline points="48,81 200,81 200,169 290,169" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,101 210,101 210,175 370,175" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <polyline points="48,121 230,121 320,169" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Pull-up: 5V to DATA line via resistor -->
  <polyline points="200,81 245,81 245,108" fill="none" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="4,2"/>
  <polyline points="245,118 245,127 325,127 325,163" fill="none" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="4,2"/>
  <!-- Legend -->
  <rect x="10" y="215" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="223" font-size="9" fill="#333" font-family="sans-serif">5V → VCC</text>
  <rect x="110" y="215" width="12" height="8" fill="#2c3e50"/>
  <text x="126" y="223" font-size="9" fill="#333" font-family="sans-serif">GND → GND</text>
  <rect x="230" y="215" width="12" height="8" fill="#f39c12"/>
  <text x="246" y="223" font-size="9" fill="#333" font-family="sans-serif">Pin 2 → DATA</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 4: LM35 / TMP36 Analog Temperature Sensor
// ---------------------------------------------------------------------------

const LM35_SKETCH = `// LM35 wired to Arduino analog pin A0
// No library needed — pure math!

const int SENSOR_PIN = A0;   // Analog pin connected to LM35 Vout

void setup() {
  Serial.begin(9600);
  Serial.println("LM35 analog temperature sensor ready");
}

void loop() {
  // analogRead() returns a value 0–1023 representing 0–5 V
  int rawValue = analogRead(SENSOR_PIN);

  // Convert the raw ADC value to millivolts
  // 5000 mV full scale / 1024 steps = 4.8828 mV per step
  float millivolts = rawValue * (5000.0 / 1024.0);

  // LM35 outputs 10 mV per °C (0 °C → 0 mV, 100 °C → 1000 mV)
  float temperatureC = millivolts / 10.0;

  // TMP36 note: if you have a TMP36 instead, use:
  //   float temperatureC = (millivolts - 500.0) / 10.0;
  // because TMP36 has a 500 mV offset at 0 °C.

  Serial.print("Temperature: ");
  Serial.print(temperatureC, 1);
  Serial.println(" °C");

  delay(1000);
}`;

const SVG_LM35_MODULE = `<svg viewBox="0 0 260 180" role="img" aria-label="LM35 analog temperature sensor TO-92 package" xmlns="http://www.w3.org/2000/svg">
  <!-- TO-92 package body (D-shape cross-section) -->
  <path d="M100,40 L160,40 Q200,40 200,100 Q200,140 130,140 Q60,140 60,100 Q60,40 100,40 Z" fill="#1a1a1a" stroke="#444" stroke-width="2"/>
  <!-- Flat face indicator -->
  <rect x="100" y="40" width="60" height="100" rx="0" fill="#2a2a2a"/>
  <!-- Marking text on flat face -->
  <text x="130" y="78" text-anchor="middle" font-size="9" fill="#aaffaa" font-family="monospace">LM35</text>
  <text x="130" y="92" text-anchor="middle" font-size="7" fill="#88cc88" font-family="monospace">NATIONAL</text>
  <text x="130" y="104" text-anchor="middle" font-size="7" fill="#88cc88" font-family="monospace">SEMI</text>
  <!-- Three legs -->
  <rect x="100" y="140" width="6" height="30" fill="#aaa"/>
  <rect x="127" y="140" width="6" height="30" fill="#aaa"/>
  <rect x="154" y="140" width="6" height="30" fill="#aaa"/>
  <!-- Pin labels -->
  <text x="103" y="182" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">VCC</text>
  <text x="130" y="182" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">Vout</text>
  <text x="157" y="182" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">GND</text>
  <!-- Label above -->
  <text x="130" y="28" text-anchor="middle" font-size="11" fill="#555" font-family="sans-serif">TO-92 Package (viewed from flat face)</text>
</svg>`;

const SVG_LM35_WIRING = `<svg viewBox="0 0 420 230" role="img" aria-label="LM35 wiring to Arduino Uno analog pin" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="40" width="160" height="160" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="62" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="75" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="85" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="95" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="105" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="115" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="125" font-size="9" fill="#fff" font-family="sans-serif">A0</text>
  <!-- LM35 TO-92 body -->
  <rect x="300" y="80" width="80" height="70" rx="30" fill="#1a1a1a" stroke="#444" stroke-width="2"/>
  <text x="340" y="115" text-anchor="middle" font-size="11" fill="#aaffaa" font-family="monospace">LM35</text>
  <!-- Legs -->
  <rect x="313" y="150" width="6" height="30" fill="#aaa"/>
  <rect x="337" y="150" width="6" height="30" fill="#aaa"/>
  <rect x="361" y="150" width="6" height="30" fill="#aaa"/>
  <!-- Pin labels -->
  <text x="316" y="192" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="340" y="192" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">Vout</text>
  <text x="364" y="192" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <!-- Wires -->
  <polyline points="48,81 200,81 200,165 313,165" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,101 210,101 210,175 361,175" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <polyline points="48,121 230,121 230,162 337,162" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="210" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="218" font-size="9" fill="#333" font-family="sans-serif">5V → VCC</text>
  <rect x="110" y="210" width="12" height="8" fill="#2c3e50"/>
  <text x="126" y="218" font-size="9" fill="#333" font-family="sans-serif">GND → GND</text>
  <rect x="230" y="210" width="12" height="8" fill="#f39c12"/>
  <text x="246" y="218" font-size="9" fill="#333" font-family="sans-serif">A0 → Vout</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 5: DS18B20 1-Wire Digital Temperature
// ---------------------------------------------------------------------------

const DS18B20_SKETCH = `// Install via Library Manager:
//   "OneWire" by Jim Studt et al.
//   "DallasTemperature" by Miles Burton
#include <OneWire.h>
#include <DallasTemperature.h>

const int ONE_WIRE_PIN = 4;   // Data wire connected to Arduino pin 4

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  sensors.begin();
  Serial.print("Found ");
  Serial.print(sensors.getDeviceCount());
  Serial.println(" DS18B20 sensor(s)");
}

void loop() {
  // Tell all sensors on the bus to take a reading
  sensors.requestTemperatures();

  // Get the reading from the first sensor (index 0)
  float tempC = sensors.getTempCByIndex(0);

  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("ERROR: sensor not connected!");
  } else {
    Serial.print("Temperature: ");
    Serial.print(tempC, 2);
    Serial.println(" °C");
  }

  delay(1000);
}`;

const SVG_DS18B20_MODULE = `<svg viewBox="0 0 300 200" role="img" aria-label="DS18B20 waterproof temperature probe and TO-92 package" xmlns="http://www.w3.org/2000/svg">
  <!-- Probe cable -->
  <rect x="20" y="95" width="130" height="10" rx="5" fill="#333"/>
  <!-- Probe tip (stainless steel) -->
  <ellipse cx="150" cy="100" rx="18" ry="12" fill="#aaa" stroke="#888" stroke-width="1.5"/>
  <ellipse cx="165" cy="100" rx="6" ry="12" fill="#999" stroke="#888" stroke-width="1"/>
  <!-- Three wires at end of cable -->
  <line x1="20" y1="92" x2="5" y2="85" stroke="#e74c3c" stroke-width="3"/>
  <line x1="20" y1="100" x2="5" y2="100" stroke="#e8e8e8" stroke-width="3"/>
  <line x1="20" y1="108" x2="5" y2="115" stroke="#e8e8e8" stroke-width="3"/>
  <!-- Wire labels -->
  <text x="2" y="82" font-size="9" fill="#e74c3c" font-family="sans-serif">Red = VCC</text>
  <text x="2" y="97" font-size="9" fill="#555" font-family="sans-serif">Yellow = DATA</text>
  <text x="2" y="118" font-size="9" fill="#555" font-family="sans-serif">Black = GND</text>
  <!-- Pull-up resistor notation -->
  <rect x="195" y="80" width="70" height="14" rx="4" fill="#d4a017" stroke="#a07000" stroke-width="1"/>
  <text x="230" y="90" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">4.7 kΩ pull-up</text>
  <text x="230" y="104" text-anchor="middle" font-size="8" fill="#555" font-family="sans-serif">VCC → DATA</text>
  <!-- Label -->
  <text x="150" y="135" text-anchor="middle" font-size="11" fill="#333" font-family="sans-serif" font-weight="bold">DS18B20 Waterproof Probe</text>
  <text x="150" y="150" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Works from −55 °C to +125 °C</text>
</svg>`;

const SVG_DS18B20_WIRING = `<svg viewBox="0 0 440 260" role="img" aria-label="DS18B20 wiring to Arduino Uno with 4.7k pull-up resistor" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="40" width="160" height="180" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="62" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="75" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="85" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="95" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="105" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="115" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="125" font-size="9" fill="#fff" font-family="sans-serif">Pin 4</text>
  <!-- DS18B20 probe cable end -->
  <rect x="310" y="90" width="100" height="60" rx="6" fill="#333"/>
  <text x="360" y="115" text-anchor="middle" font-size="10" fill="#ccc" font-family="sans-serif">DS18B20</text>
  <text x="360" y="130" text-anchor="middle" font-size="9" fill="#aaa" font-family="sans-serif">Probe</text>
  <!-- Probe wires extending -->
  <line x1="310" y1="100" x2="290" y2="100" stroke="#e74c3c" stroke-width="3"/>
  <line x1="310" y1="117" x2="290" y2="117" stroke="#e8e8e8" stroke-width="3"/>
  <line x1="310" y1="134" x2="290" y2="134" stroke="#1a1a1a" stroke-width="3"/>
  <!-- Wire labels -->
  <text x="292" y="98" font-size="8" fill="#e74c3c" text-anchor="end" font-family="sans-serif">Red(VCC)</text>
  <text x="292" y="115" font-size="8" fill="#555" text-anchor="end" font-family="sans-serif">Yellow(DATA)</text>
  <text x="292" y="132" font-size="8" fill="#333" text-anchor="end" font-family="sans-serif">Black(GND)</text>
  <!-- 4.7k pull-up resistor -->
  <rect x="218" y="80" width="50" height="12" rx="4" fill="#d4a017" stroke="#a07000" stroke-width="1"/>
  <text x="243" y="89" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">4.7 kΩ</text>
  <!-- Wires -->
  <!-- 5V → Red(VCC) -->
  <polyline points="48,81 200,81 200,100 290,100" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <!-- GND → Black(GND) -->
  <polyline points="48,101 210,101 210,134 290,134" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <!-- Pin 4 → Yellow(DATA) -->
  <polyline points="48,121 218,121 290,117" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Pull-up: 5V to DATA via 4.7k -->
  <polyline points="200,81 218,81 218,80" fill="none" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="4,2"/>
  <polyline points="218,92 218,117" fill="none" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="4,2"/>
  <!-- Legend -->
  <rect x="10" y="235" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="243" font-size="9" fill="#333" font-family="sans-serif">5V → Red</text>
  <rect x="100" y="235" width="12" height="8" fill="#2c3e50"/>
  <text x="116" y="243" font-size="9" fill="#333" font-family="sans-serif">GND → Black</text>
  <rect x="210" y="235" width="12" height="8" fill="#f39c12"/>
  <text x="226" y="243" font-size="9" fill="#333" font-family="sans-serif">Pin 4 → Yellow + 4.7kΩ pull-up</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 6: LDR Photoresistor Light Level
// ---------------------------------------------------------------------------

const LDR_SKETCH = `// LDR (Light Dependent Resistor) voltage-divider circuit
// Wired as: 5V → 10kΩ fixed resistor → junction → LDR → GND
//                                           ↑
//                                          A0 (reads junction voltage)

const int LDR_PIN = A0;

void setup() {
  Serial.begin(9600);
  Serial.println("LDR light sensor ready");
}

void loop() {
  // analogRead returns 0–1023 (0 = 0V, 1023 = 5V)
  int rawValue = analogRead(LDR_PIN);

  // Map to a 0–100 % "brightness" scale for display
  // In the divider as wired, MORE light → lower LDR resistance → HIGHER voltage → HIGHER rawValue
  int brightness = map(rawValue, 0, 1023, 0, 100);

  Serial.print("Raw ADC: ");
  Serial.print(rawValue);
  Serial.print("  |  Brightness: ");
  Serial.print(brightness);
  Serial.println(" %");

  // Example: turn on an LED (pin 13) when it gets dark
  if (rawValue < 400) {
    digitalWrite(13, HIGH);  // Dark — switch on
    Serial.println("  → Dark: LED ON");
  } else {
    digitalWrite(13, LOW);   // Bright — switch off
  }

  delay(500);
}`;

const SVG_LDR_MODULE = `<svg viewBox="0 0 260 200" role="img" aria-label="LDR photoresistor component" xmlns="http://www.w3.org/2000/svg">
  <!-- LDR body (round disc) -->
  <circle cx="130" cy="90" r="50" fill="#e8d890" stroke="#b8a840" stroke-width="2.5"/>
  <!-- Squiggle pattern (resistance element) -->
  <path d="M90,90 Q95,75 105,90 Q115,105 125,90 Q135,75 145,90 Q155,105 165,90 Q170,75 175,90" fill="none" stroke="#8b4513" stroke-width="2.5"/>
  <path d="M90,90 Q95,105 105,90" fill="none" stroke="#8b4513" stroke-width="2.5"/>
  <!-- Light rays illustration -->
  <line x1="130" y1="30" x2="130" y2="45" stroke="#f1c40f" stroke-width="2" stroke-dasharray="3,2"/>
  <line x1="100" y1="35" x2="110" y2="48" stroke="#f1c40f" stroke-width="2" stroke-dasharray="3,2"/>
  <line x1="160" y1="35" x2="150" y2="48" stroke="#f1c40f" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="130" y="25" text-anchor="middle" font-size="9" fill="#f1c40f" font-family="sans-serif">☀ light</text>
  <!-- Two legs -->
  <rect x="110" y="140" width="5" height="30" fill="#aaa"/>
  <rect x="145" y="140" width="5" height="30" fill="#aaa"/>
  <!-- Leg labels -->
  <text x="112" y="182" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">Leg 1</text>
  <text x="147" y="182" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">Leg 2</text>
  <text x="130" y="196" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">(no polarity)</text>
  <!-- Label above -->
  <text x="130" y="160" text-anchor="middle" font-size="10" fill="#555" font-family="sans-serif">GL5528 LDR</text>
</svg>`;

const SVG_LDR_WIRING = `<svg viewBox="0 0 450 260" role="img" aria-label="LDR voltage divider wiring to Arduino Uno analog pin A0" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="40" width="160" height="180" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="62" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="75" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="85" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="95" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="105" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="115" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="125" font-size="9" fill="#fff" font-family="sans-serif">A0</text>
  <!-- Voltage divider: 5V → fixed R → junction → LDR → GND -->
  <!-- Fixed resistor (10kΩ) -->
  <rect x="250" y="80" width="50" height="14" rx="4" fill="#d4a017" stroke="#a07000" stroke-width="1.5"/>
  <text x="275" y="90" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">10 kΩ</text>
  <!-- LDR disc -->
  <circle cx="350" cy="145" r="25" fill="#e8d890" stroke="#b8a840" stroke-width="2"/>
  <text x="350" y="148" text-anchor="middle" font-size="9" fill="#8b4513" font-family="sans-serif">LDR</text>
  <!-- Junction node -->
  <circle cx="350" cy="100" r="4" fill="#e74c3c"/>
  <text x="358" y="99" font-size="8" fill="#555" font-family="sans-serif">A0 junction</text>
  <!-- Wires -->
  <!-- 5V → top of fixed resistor -->
  <polyline points="48,81 200,81 200,87 250,87" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <!-- Fixed resistor → junction -->
  <polyline points="300,87 350,87 350,100" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <!-- Junction → LDR top -->
  <line x1="350" y1="100" x2="350" y2="120" stroke="#888" stroke-width="2"/>
  <!-- LDR bottom → GND -->
  <polyline points="350,170 350,200 210,200 210,101 48,101" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <!-- Junction → A0 -->
  <polyline points="350,100 380,100 380,230 230,230 230,121 48,121" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="238" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="246" font-size="9" fill="#333" font-family="sans-serif">5V → 10kΩ → LDR top</text>
  <rect x="180" y="238" width="12" height="8" fill="#2c3e50"/>
  <text x="196" y="246" font-size="9" fill="#333" font-family="sans-serif">LDR bottom → GND</text>
  <rect x="340" y="238" width="12" height="8" fill="#f39c12"/>
  <text x="356" y="246" font-size="9" fill="#333" font-family="sans-serif">Junction → A0</text>
</svg>`;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const sensorsPart1: LessonDef[] = [
  // -------------------------------------------------------------------------
  // Lesson 1 — HC-SR04 Ultrasonic Distance
  // -------------------------------------------------------------------------
  {
    title: "HC-SR04 — Ultrasonic Distance",
    slug: "sensor-ultrasonic",
    estMinutes: 18,
    contentType: "markdown",
    body: body(
      md(`## Measuring distance with sound waves

The **HC-SR04** is one of the most popular sensors in robotics. It measures how far away an object is by bouncing an ultrasonic sound pulse off it — exactly like a bat navigating in the dark, or the parking sensor beeping when you reverse toward a wall.

The sensor has four pins:

| Pin | Function |
|-----|----------|
| **VCC** | Power — connect to the Arduino's 5 V pin |
| **GND** | Ground — connect to GND |
| **TRIG** | Trigger — you pull this HIGH for 10 µs to fire a burst |
| **ECHO** | Echo — goes HIGH for the exact duration of the round-trip |

### How it works

1. You send a 10-microsecond HIGH pulse on the **TRIG** pin.
2. The sensor fires 8 bursts of ultrasonic sound at 40 kHz (far too high for human ears).
3. The sound bounces off the nearest object and returns to the sensor.
4. The **ECHO** pin goes HIGH for precisely as many microseconds as the round trip took.
5. You measure that time with Arduino's built-in \`pulseIn()\` function.
6. You convert time → distance using the formula:

\`\`\`
distance (cm) = duration (µs) × 0.034 / 2
\`\`\`

The 0.034 is the speed of sound in centimetres per microsecond. We divide by 2 because the pulse travels *to* the object and *back* again.

**Typical range:** 2 cm to 400 cm. Objects closer than 2 cm may give unreliable readings.

**Common uses:** obstacle-avoiding robots, liquid-level measuring, door-activated alarms, interactive art installations.`),
      svg(SVG_HCSR04_MODULE, "HC-SR04 sensor module — front view showing the two transducer cans and the four-pin header"),
      mermaid(
        `sequenceDiagram
  participant A as Arduino (TRIG)
  participant S as HC-SR04
  participant O as Object
  A->>S: TRIG HIGH for 10 µs
  S->>O: 🔊 40 kHz burst (8 pulses)
  O-->>S: 🔊 echo returns
  S->>A: ECHO HIGH for T µs
  Note over A: distance = T × 0.034 / 2 cm`,
        "Signal timing: TRIG fires the burst, ECHO stays HIGH for the travel time",
      ),
      md(`## Wiring the HC-SR04 to the Arduino UNO

Connect VCC to **5V**, GND to **GND**, TRIG to digital pin **9**, and ECHO to digital pin **10**. The sensor draws about 15 mA — well within the Arduino's 5V rail limit.`),
      svg(SVG_HCSR04_WIRING, "Wiring diagram: HC-SR04 connected to Arduino UNO pins 9 (TRIG), 10 (ECHO), 5V, and GND"),
      md(`## Reading distance in code

Open the sketch below in RoboCode Studio. Upload it, then open the Serial Monitor. Wave your hand in front of the sensor and watch the distance update every 300 ms.`),
      code("arduino", HCSR04_SKETCH, { filename: "hcsr04_distance.ino", openInStudio: true }),
      callout("tip", "If you consistently get 0 cm or very large readings, the most likely cause is swapped TRIG and ECHO wires. They look identical — double-check your connections. Also, the HC-SR04 cannot measure objects closer than 2 cm."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 2 — PIR Motion Sensor HC-SR501
  // -------------------------------------------------------------------------
  {
    title: "PIR Motion Sensor (HC-SR501)",
    slug: "sensor-pir",
    estMinutes: 15,
    contentType: "markdown",
    body: body(
      md(`## Detecting motion with infrared

A **PIR sensor** (Passive InfraRed) detects movement by measuring tiny changes in the infrared heat radiation emitted by living bodies. "Passive" means it *receives* IR — it does not emit any light or radio waves itself.

The classic module you will use is the **HC-SR501**. Beneath its white dome (called a Fresnel lens) sits a pair of tiny IR-sensitive cells. When a warm body (human, animal) moves across the field of view, one cell becomes warmer than the other and the electronics fire the output pin HIGH.

The module has two small orange **potentiometers** on the back:

| Pot | What it adjusts |
|-----|----------------|
| **Sensitivity** | Detection range — roughly 3 m to 7 m |
| **Time delay** | How long the output stays HIGH after motion — 3 s to 300 s |

There is also a jumper that controls **retrigger mode**:
- **H (repeat / retrigger):** the output restarts the timer every time motion is detected while it is already HIGH. Good for lights that should stay on while you are in the room.
- **L (single trigger):** the output goes LOW after the timer expires, then waits before triggering again. Good for counting events.

**Pins:** VCC (5–12 V), OUT (digital HIGH/LOW), GND.

**Common uses:** automatic lights, security alarms, people counters, sleep detectors.`),
      svg(SVG_PIR_MODULE, "HC-SR501 PIR motion sensor — Fresnel lens dome on top, two adjustment potentiometers, three-pin header"),
      md(`## Warm-up time

After you power on the HC-SR501, it needs **30 to 60 seconds** to stabilise. During this period it may produce random HIGH pulses — your code should ignore them by adding a startup delay. This is completely normal.

## Wiring the HC-SR501

Three wires only: VCC → 5V, GND → GND, OUT → digital pin **7**.`),
      svg(SVG_PIR_WIRING, "Wiring diagram: HC-SR501 connected to Arduino UNO pin 7 (OUT), 5V, and GND"),
      md(`## Reading motion in code

The code is simple — just \`digitalRead()\` the output pin. HIGH means motion is currently detected. LOW means nothing is moving (or the sensor is between triggers).`),
      code("arduino", PIR_SKETCH, { filename: "pir_motion.ino", openInStudio: true }),
      callout("warning", "The 30-second warm-up delay in setup() is intentional. Remove it and your code will show false motion alerts every time the board powers on. If you need a shorter startup in demos, reduce it to 10 s but expect some false triggers."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 3 — DHT11 / DHT22 Temperature & Humidity
  // -------------------------------------------------------------------------
  {
    title: "DHT11 / DHT22 — Temperature & Humidity",
    slug: "sensor-dht",
    estMinutes: 18,
    contentType: "markdown",
    body: body(
      md(`## Reading temperature and humidity together

The **DHT11** (blue) and **DHT22** (white) are among the most widely used environmental sensors in hobby electronics. Both measure **temperature** and **relative humidity** using a single digital data wire — only one signal pin needed.

### DHT11 vs DHT22 — which one should you use?

| Feature | DHT11 | DHT22 |
|---------|-------|-------|
| Humidity range | 20 – 90 % | 0 – 100 % |
| Humidity accuracy | ± 5 % | ± 2–5 % |
| Temperature range | 0 – 50 °C | −40 – 80 °C |
| Temperature accuracy | ± 2 °C | ± 0.5 °C |
| Minimum sample interval | 1 second | 2 seconds |
| Price | Cheaper | About 2× more expensive |

For most school projects the DHT11 is perfectly fine. If you need outdoor accuracy or temperatures below 0 °C, choose the DHT22.

### How the single-wire protocol works

The sensor contains a capacitive humidity element and a thermistor. When the Arduino pulls the data line LOW for at least 18 ms, the sensor wakes up and sends back 40 bits of data (humidity integer + decimal + temperature integer + decimal + checksum). The Adafruit DHT library handles all this for you.

**Pins on a breakout board:** VCC (3.3–5.5 V), DATA, NC (not connected), GND. Some 3-pin breakout boards omit NC entirely.

**Common uses:** indoor weather stations, plant watering systems, incubator controllers, air quality monitors.`),
      svg(SVG_DHT_MODULE, "DHT11 sensor module — perforated housing for air flow, four-pin header with VCC, DATA, NC, and GND"),
      md(`## Installing the library

Before uploading the sketch, install two libraries via the Arduino IDE Library Manager (Sketch → Include Library → Manage Libraries):

1. Search for **DHT sensor library** by Adafruit → Install
2. When prompted, also install **Adafruit Unified Sensor**

You only need to do this once.

## Wiring the DHT11

VCC → **5V**, DATA → digital pin **2**, GND → **GND**.

The sketch below also shows how to add a 10 kΩ pull-up resistor from DATA to VCC. Many breakout modules already have this resistor built in — check the PCB for a small component labelled 10K near the data pin.`),
      svg(SVG_DHT_WIRING, "Wiring diagram: DHT11 connected to Arduino UNO pin 2 (DATA) with optional 10 kΩ pull-up, 5V and GND"),
      md(`## Reading temperature and humidity

The library's API is very straightforward: \`dht.readTemperature()\` and \`dht.readHumidity()\`. Always check for \`isnan()\` — if the sensor is not wired correctly the functions return NaN rather than crashing.`),
      code("arduino", DHT_SKETCH, { filename: "dht_sensor.ino", openInStudio: true }),
      callout("tip", "The DHT11/22 needs at least 2 seconds between readings — it updates its internal reading only once a second (DHT11) or once every 2 seconds (DHT22). If you call readTemperature() faster than that, you will keep getting the same old value. Use delay(2000) or a non-blocking timer."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 4 — LM35 / TMP36 Analog Temperature
  // -------------------------------------------------------------------------
  {
    title: "LM35 / TMP36 — Analog Temperature",
    slug: "sensor-lm35",
    estMinutes: 14,
    contentType: "markdown",
    body: body(
      md(`## Temperature sensing without a library

The **LM35** and **TMP36** are simple analog temperature sensors that need *no library at all* — just a bit of arithmetic. They output a voltage directly proportional to temperature, and you read that voltage with \`analogRead()\` on any of the Arduino's analog pins.

### LM35

- Output voltage = **10 mV per °C**
- At 25 °C the output is 250 mV
- At 0 °C the output is 0 mV (note: the LM35 cannot measure below 0 °C without a negative supply voltage)
- Range: 0 °C to 100 °C (standard package)

### TMP36

- Output voltage = **10 mV per °C** *plus a 500 mV offset*
- At 0 °C the output is 500 mV; at 25 °C it is 750 mV
- This offset means it works below 0 °C without a negative supply
- Range: −40 °C to +125 °C

Both come in a **TO-92** package — the same small black half-cylinder shape as a common transistor, with three legs.

### Converting ADC counts to temperature

The Arduino's ADC measures 0–5 V in 1024 steps (10 bits). Each step is therefore 5000 / 1024 ≈ **4.88 mV**.

For the LM35:
\`\`\`
millivolts  = rawADC × (5000 / 1024)
temperature = millivolts / 10
\`\`\`

For the TMP36, subtract the 500 mV offset:
\`\`\`
temperature = (millivolts − 500) / 10
\`\`\`

**Common uses:** room thermometers, fan controllers, over-temperature alarms, battery monitors.`),
      svg(SVG_LM35_MODULE, "LM35 in TO-92 package — flat face forward, three pins: VCC (left), Vout (centre), GND (right)"),
      md(`## Wiring the LM35

Three wires only: the leftmost pin (viewed from the flat face) → **5V**, centre pin → **A0**, rightmost pin → **GND**.

No pull-up resistors are needed — this is a pure analog output.`),
      svg(SVG_LM35_WIRING, "Wiring diagram: LM35 connected to Arduino Uno analog pin A0, 5V, and GND"),
      md(`## Reading temperature in code

The sketch below works for the LM35. If you have a TMP36, just change the one line noted in the comments.`),
      code("arduino", LM35_SKETCH, { filename: "lm35_temperature.ino", openInStudio: true }),
      callout("info", "The Arduino's 5 V rail is not perfectly regulated — it wobbles slightly depending on the USB power supply. If you need better accuracy, power the Arduino from a stable 5 V source and/or use the AREF pin with a precision 5.00 V reference. For school projects the standard 5 V is more than accurate enough."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 5 — DS18B20 1-Wire Digital Temperature
  // -------------------------------------------------------------------------
  {
    title: "DS18B20 — 1-Wire Digital Temperature",
    slug: "sensor-ds18b20",
    estMinutes: 20,
    contentType: "markdown",
    body: body(
      md(`## A digital temperature sensor for harsh environments

The **DS18B20** is a digital temperature sensor that communicates over Maxim's **1-Wire** protocol — just one signal wire carries data, power, and clock. It is famous in the robotics and maker world for two reasons:

1. **You can chain multiple sensors on the same wire.** Each DS18B20 has a unique 64-bit address burned in at the factory, so an Arduino can talk to 10, 20, or even 100 sensors on a single pin.
2. **It comes in a waterproof stainless-steel probe form factor.** You can push the probe into soil, dip it in water, or bury it in compost — it survives temperatures from −55 °C to +125 °C.

### Specifications

| Feature | Value |
|---------|-------|
| Temperature range | −55 °C to +125 °C |
| Accuracy | ± 0.5 °C (−10 °C to +85 °C) |
| Resolution | 9 to 12 bits (configurable) |
| Interface | 1-Wire (single data pin) |
| Supply voltage | 3.0 – 5.5 V |

### The mandatory pull-up resistor

The 1-Wire bus requires a **4.7 kΩ pull-up resistor** connected between the data wire and VCC. This is not optional — without it the sensor cannot send data reliably. Most bare DS18B20 breakout boards do *not* include this resistor; you must add it yourself.

Waterproof probe wires are typically colour-coded: **Red = VCC**, **Yellow (or White) = DATA**, **Black = GND**.

**Common uses:** soil temperature in smart gardens, aquarium water temperature monitors, weather stations, fermentation temperature loggers.`),
      svg(SVG_DS18B20_MODULE, "DS18B20 waterproof probe — three wires (red VCC, yellow DATA, black GND) and the 4.7 kΩ pull-up between VCC and DATA"),
      md(`## Installing the libraries

You need two libraries (Sketch → Include Library → Manage Libraries):

1. **OneWire** by Jim Studt et al. → Install
2. **DallasTemperature** by Miles Burton → Install

## Wiring the DS18B20

Connect the **red** wire → 5V, **black** wire → GND, **yellow/white** wire → digital pin **4**. Then place a **4.7 kΩ resistor** between the DATA wire and 5V.`),
      svg(SVG_DS18B20_WIRING, "Wiring diagram: DS18B20 probe connected to Arduino Uno pin 4 (DATA) with 4.7 kΩ pull-up from 5V to DATA, red to 5V, black to GND"),
      md(`## Reading temperature in code

The DallasTemperature library makes things easy. You first call \`sensors.requestTemperatures()\` to tell all sensors on the bus to take a measurement, then fetch the result with \`sensors.getTempCByIndex(0)\` for the first sensor.`),
      code("arduino", DS18B20_SKETCH, { filename: "ds18b20_temperature.ino", openInStudio: true }),
      callout("warning", "Never skip the 4.7 kΩ pull-up resistor between DATA and VCC. Without it the OneWire communication will fail and you will always get DEVICE_DISCONNECTED_C (−127 °C). If you see that value in the Serial Monitor, the pull-up is the first thing to check."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 6 — LDR Photoresistor Light Level
  // -------------------------------------------------------------------------
  {
    title: "LDR Photoresistor — Light Level",
    slug: "sensor-ldr",
    estMinutes: 14,
    contentType: "markdown",
    body: body(
      md(`## Measuring light with a resistor

An **LDR** (Light Dependent Resistor), also called a photoresistor or photocell, is one of the simplest electronic sensors. It is a resistor whose resistance decreases when more light falls on it. In the dark it can have a resistance of several megaohms; in bright sunlight it drops to just a few hundred ohms.

Because the Arduino cannot measure resistance directly (only voltage), we use a trick called a **voltage divider**: we put the LDR in series with a fixed 10 kΩ resistor, connecting the two together between 5V and GND. The voltage at the junction between them depends on the ratio of the two resistances — and therefore on how bright the light is.

### Voltage divider formula

\`\`\`
V_out = 5V × R_fixed / (R_LDR + R_fixed)
\`\`\`

When the LDR is in **bright light** → R_LDR drops → V_out rises → analogRead gives a HIGH value.
When the LDR is in **darkness** → R_LDR rises → V_out falls → analogRead gives a LOW value.

The exact crossover point depends on your specific LDR and the fixed resistor value. You will need to observe the raw ADC values in the Serial Monitor and pick a threshold that works in your environment.

### LDR polarity

LDRs have **no polarity** — you can connect either leg to either side of the circuit. They are just resistors.

**Common uses:** automatic night lights, solar trackers, photography light meters, plant grow-light controllers, window blinds that close in sunlight.`),
      svg(SVG_LDR_MODULE, "LDR photoresistor — round disc component with squiggle resistance element visible through the clear epoxy, light rays shown above"),
      md(`## Wiring the voltage divider

The divider is: **5V → 10 kΩ fixed resistor → junction node → LDR → GND**. The junction node connects to **A0**.

This means:
- The top of the fixed resistor connects to 5V.
- The bottom of the fixed resistor and the top of the LDR connect together at the junction.
- The bottom of the LDR connects to GND.
- A wire from the junction goes to A0.`),
      svg(SVG_LDR_WIRING, "Wiring diagram: voltage divider with 10 kΩ fixed resistor and LDR, junction connected to Arduino Uno A0"),
      md(`## Reading light level in code

The sketch reads the ADC value, converts it to a 0–100 % brightness scale using \`map()\`, and demonstrates turning an LED on when the room gets dark — a classic night-light project.`),
      code("arduino", LDR_SKETCH, { filename: "ldr_light_level.ino", openInStudio: true }),
      callout("tip", "The threshold value (400 in the example) will be different for every LDR and lighting environment. Open the Serial Monitor, cover the LDR with your hand and note the raw ADC value, then uncover it and note the bright value. Set your threshold somewhere between the two. Some makers add a small potentiometer in place of the fixed resistor to make the threshold adjustable — a nice extra feature for a project."),
    ),
  },
];
