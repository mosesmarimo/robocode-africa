import { type LessonDef, md, code, svg, callout, body } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1: MPU-6050 Accelerometer + Gyroscope
// ---------------------------------------------------------------------------

const MPU6050_SKETCH = `// Install via Library Manager:
//   "MPU6050" by Electronic Cats  OR  "Adafruit MPU6050" by Adafruit
//   (also install "Adafruit Unified Sensor" and "Adafruit BusIO" when prompted)
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  Wire.begin();   // SDA = A4, SCL = A5 on the Arduino UNO

  if (!mpu.begin()) {
    Serial.println("ERROR: MPU-6050 not found. Check wiring and I2C address.");
    while (true) delay(10);
  }

  // Set measurement ranges — adjust to your application
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);   // ±8 g
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);         // ±500 °/s
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);      // Low-pass filter

  Serial.println("MPU-6050 ready!");
}

void loop() {
  sensors_event_t accelEvent, gyroEvent, tempEvent;
  mpu.getEvent(&accelEvent, &gyroEvent, &tempEvent);

  // Accelerometer — units are m/s²  (1 g ≈ 9.81 m/s²)
  Serial.print("Accel X: "); Serial.print(accelEvent.acceleration.x, 2);
  Serial.print("  Y: ");     Serial.print(accelEvent.acceleration.y, 2);
  Serial.print("  Z: ");     Serial.print(accelEvent.acceleration.z, 2);
  Serial.println(" m/s²");

  // Gyroscope — units are radians per second
  Serial.print("Gyro  X: "); Serial.print(gyroEvent.gyro.x, 3);
  Serial.print("  Y: ");     Serial.print(gyroEvent.gyro.y, 3);
  Serial.print("  Z: ");     Serial.print(gyroEvent.gyro.z, 3);
  Serial.println(" rad/s");

  // On-chip temperature (rough — heats up during use)
  Serial.print("Temp: "); Serial.print(tempEvent.temperature, 1);
  Serial.println(" °C");
  Serial.println("---");

  delay(500);
}`;

const SVG_MPU6050_MODULE = `<svg viewBox="0 0 300 220" role="img" aria-label="MPU-6050 accelerometer and gyroscope breakout board" xmlns="http://www.w3.org/2000/svg">
  <!-- PCB body -->
  <rect x="60" y="40" width="180" height="130" rx="6" fill="#1a1a6e" stroke="#0a0a50" stroke-width="2"/>
  <!-- Main IC chip -->
  <rect x="110" y="65" width="80" height="65" rx="3" fill="#111" stroke="#444" stroke-width="1.5"/>
  <text x="150" y="95" text-anchor="middle" font-size="9" fill="#aaaaff" font-family="monospace">MPU-6050</text>
  <text x="150" y="108" text-anchor="middle" font-size="8" fill="#8888cc" font-family="monospace">InvenSense</text>
  <!-- Axis arrow indicators on chip -->
  <line x1="140" y1="120" x2="155" y2="120" stroke="#ff6666" stroke-width="1.5"/>
  <polygon points="155,117 159,120 155,123" fill="#ff6666"/>
  <text x="161" y="123" font-size="7" fill="#ff6666" font-family="sans-serif">X</text>
  <line x1="140" y1="120" x2="140" y2="105" stroke="#66ff66" stroke-width="1.5"/>
  <polygon points="137,105 140,100 143,105" fill="#66ff66"/>
  <text x="143" y="103" font-size="7" fill="#66ff66" font-family="sans-serif">Y</text>
  <!-- Decoupling capacitors -->
  <rect x="75" y="70" width="16" height="10" rx="2" fill="#555"/>
  <rect x="75" y="90" width="16" height="10" rx="2" fill="#555"/>
  <!-- Pin header -->
  <rect x="62" y="175" width="176" height="18" rx="2" fill="#2a2a2a"/>
  <rect x="67" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="85" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="103" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="121" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="139" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="157" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="175" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="193" y="177" width="10" height="14" rx="1" fill="#d4a017"/>
  <!-- Pin labels -->
  <text x="72" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <text x="90" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="108" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">SCL</text>
  <text x="126" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">SDA</text>
  <text x="144" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">XDA</text>
  <text x="162" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">XCL</text>
  <text x="180" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">AD0</text>
  <text x="198" y="207" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">INT</text>
  <!-- Module label -->
  <text x="150" y="58" text-anchor="middle" font-size="11" fill="#aaaaff" font-family="sans-serif" font-weight="bold">GY-521 / MPU-6050</text>
</svg>`;

const SVG_MPU6050_WIRING = `<svg viewBox="0 0 440 260" role="img" aria-label="MPU-6050 I2C wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="30" width="160" height="200" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="52" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="68" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="78" font-size="9" fill="#fff" font-family="sans-serif">3.3V</text>
  <rect x="18" y="88" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="98" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="108" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="118" font-size="9" fill="#fff" font-family="sans-serif">A4 (SDA)</text>
  <rect x="18" y="128" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="138" font-size="9" fill="#fff" font-family="sans-serif">A5 (SCL)</text>
  <!-- MPU-6050 module -->
  <rect x="280" y="60" width="140" height="110" rx="6" fill="#1a1a6e" stroke="#0a0a50" stroke-width="2"/>
  <text x="350" y="82" text-anchor="middle" font-size="11" fill="#aaaaff" font-family="sans-serif" font-weight="bold">MPU-6050</text>
  <rect x="300" y="90" width="70" height="50" rx="3" fill="#111" stroke="#444" stroke-width="1"/>
  <text x="335" y="118" text-anchor="middle" font-size="9" fill="#aaaaff" font-family="monospace">IC</text>
  <!-- Sensor pins -->
  <rect x="285" y="173" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="303" y="173" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="321" y="173" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="339" y="173" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="290" y="196" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="308" y="196" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <text x="326" y="196" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">SCL</text>
  <text x="344" y="196" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">SDA</text>
  <!-- Wires -->
  <!-- 3.3V → VCC (red) -->
  <polyline points="48,74 200,74 200,179 285,179" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <!-- GND → GND (black) -->
  <polyline points="48,94 210,94 210,185 303,185" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <!-- A4(SDA) → SDA (blue) -->
  <polyline points="48,114 220,114 220,191 339,191" fill="none" stroke="#2980b9" stroke-width="2"/>
  <!-- A5(SCL) → SCL (yellow) -->
  <polyline points="48,134 230,134 230,188 321,188" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="235" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="243" font-size="9" fill="#333" font-family="sans-serif">3.3V→VCC</text>
  <rect x="100" y="235" width="12" height="8" fill="#2c3e50"/>
  <text x="116" y="243" font-size="9" fill="#333" font-family="sans-serif">GND→GND</text>
  <rect x="200" y="235" width="12" height="8" fill="#2980b9"/>
  <text x="216" y="243" font-size="9" fill="#333" font-family="sans-serif">A4→SDA</text>
  <rect x="290" y="235" width="12" height="8" fill="#f39c12"/>
  <text x="306" y="243" font-size="9" fill="#333" font-family="sans-serif">A5→SCL</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2: BMP280 / BME280 Pressure & Temperature
// ---------------------------------------------------------------------------

const BMP280_SKETCH = `// Install via Library Manager:
//   "Adafruit BMP280 Library" by Adafruit
//   (also install "Adafruit Unified Sensor" and "Adafruit BusIO" when prompted)
#include <Wire.h>
#include <Adafruit_BMP280.h>

Adafruit_BMP280 bmp;   // I2C mode (default address 0x76)

// Sea-level pressure at your location (hPa).
// Check a weather app for today's reading; default 1013.25 is standard atmosphere.
const float SEA_LEVEL_HPA = 1013.25;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  if (!bmp.begin(0x76)) {
    // Try address 0x77 if 0x76 fails — some modules use the other address
    if (!bmp.begin(0x77)) {
      Serial.println("ERROR: BMP280 not found. Check wiring and I2C address.");
      while (true) delay(10);
    }
  }

  // Recommended settings from datasheet for weather monitoring
  bmp.setSampling(
    Adafruit_BMP280::MODE_NORMAL,
    Adafruit_BMP280::SAMPLING_X2,    // temperature oversampling
    Adafruit_BMP280::SAMPLING_X16,   // pressure oversampling
    Adafruit_BMP280::FILTER_X16,
    Adafruit_BMP280::STANDBY_MS_500
  );

  Serial.println("BMP280 ready!");
}

void loop() {
  float temperatureC = bmp.readTemperature();         // degrees Celsius
  float pressureHPa  = bmp.readPressure() / 100.0;   // Pa → hPa (hectopascals)
  float altitudeM    = bmp.readAltitude(SEA_LEVEL_HPA); // approx. metres above sea level

  Serial.print("Temperature: "); Serial.print(temperatureC, 1); Serial.println(" °C");
  Serial.print("Pressure:    "); Serial.print(pressureHPa, 2);  Serial.println(" hPa");
  Serial.print("Altitude:    "); Serial.print(altitudeM, 1);    Serial.println(" m");
  Serial.println("---");

  delay(2000);
}`;

const SVG_BMP280_MODULE = `<svg viewBox="0 0 300 210" role="img" aria-label="BMP280 barometric pressure and temperature breakout board" xmlns="http://www.w3.org/2000/svg">
  <!-- PCB body -->
  <rect x="70" y="45" width="160" height="110" rx="6" fill="#2d5a1b" stroke="#1a3a0d" stroke-width="2"/>
  <!-- Main IC (tiny LGA package) -->
  <rect x="120" y="70" width="60" height="50" rx="3" fill="#111" stroke="#444" stroke-width="1.5"/>
  <text x="150" y="93" text-anchor="middle" font-size="9" fill="#aaffaa" font-family="monospace">BMP280</text>
  <text x="150" y="106" text-anchor="middle" font-size="8" fill="#77bb77" font-family="monospace">Bosch</text>
  <!-- Tiny vent hole on chip -->
  <circle cx="150" cy="80" r="3" fill="#333"/>
  <text x="150" y="68" text-anchor="middle" font-size="7" fill="#88cc88" font-family="sans-serif">pressure port</text>
  <!-- Decoupling caps -->
  <rect x="80" y="75" width="14" height="8" rx="2" fill="#888"/>
  <rect x="80" y="95" width="14" height="8" rx="2" fill="#888"/>
  <!-- Pin header -->
  <rect x="72" y="158" width="156" height="18" rx="2" fill="#2a2a2a"/>
  <rect x="77" y="160" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="95" y="160" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="113" y="160" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="131" y="160" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="149" y="160" width="10" height="14" rx="1" fill="#d4a017"/>
  <rect x="167" y="160" width="10" height="14" rx="1" fill="#d4a017"/>
  <!-- Pin labels -->
  <text x="82" y="188" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <text x="100" y="188" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="118" y="188" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">SCL</text>
  <text x="136" y="188" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">SDA</text>
  <text x="154" y="188" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">CSB</text>
  <text x="172" y="188" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">SDO</text>
  <!-- Module label -->
  <text x="150" y="38" text-anchor="middle" font-size="11" fill="#333" font-family="sans-serif" font-weight="bold">BMP280 / BME280</text>
  <text x="150" y="205" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">SDO LOW = addr 0x76 | SDO HIGH = 0x77</text>
</svg>`;

const SVG_BMP280_WIRING = `<svg viewBox="0 0 440 250" role="img" aria-label="BMP280 I2C wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="30" width="160" height="190" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="52" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="68" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="78" font-size="9" fill="#fff" font-family="sans-serif">3.3V</text>
  <rect x="18" y="88" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="98" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="108" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="118" font-size="9" fill="#fff" font-family="sans-serif">A4 (SDA)</text>
  <rect x="18" y="128" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="138" font-size="9" fill="#fff" font-family="sans-serif">A5 (SCL)</text>
  <!-- BMP280 module -->
  <rect x="280" y="55" width="140" height="100" rx="6" fill="#2d5a1b" stroke="#1a3a0d" stroke-width="2"/>
  <text x="350" y="76" text-anchor="middle" font-size="11" fill="#aaffaa" font-family="sans-serif" font-weight="bold">BMP280</text>
  <rect x="305" y="83" width="60" height="40" rx="3" fill="#111" stroke="#444" stroke-width="1"/>
  <text x="335" y="106" text-anchor="middle" font-size="9" fill="#aaffaa" font-family="monospace">IC</text>
  <!-- Sensor pins -->
  <rect x="285" y="158" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="303" y="158" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="321" y="158" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="339" y="158" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="290" y="181" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="308" y="181" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <text x="326" y="181" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">SCL</text>
  <text x="344" y="181" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">SDA</text>
  <!-- Wires -->
  <polyline points="48,74 200,74 200,164 285,164" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,94 210,94 210,170 303,170" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <polyline points="48,134 225,134 225,161 321,161" fill="none" stroke="#f39c12" stroke-width="2"/>
  <polyline points="48,114 235,114 235,164 339,164" fill="none" stroke="#2980b9" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="225" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="233" font-size="9" fill="#333" font-family="sans-serif">3.3V→VCC</text>
  <rect x="105" y="225" width="12" height="8" fill="#2c3e50"/>
  <text x="121" y="233" font-size="9" fill="#333" font-family="sans-serif">GND→GND</text>
  <rect x="200" y="225" width="12" height="8" fill="#f39c12"/>
  <text x="216" y="233" font-size="9" fill="#333" font-family="sans-serif">A5→SCL</text>
  <rect x="290" y="225" width="12" height="8" fill="#2980b9"/>
  <text x="306" y="233" font-size="9" fill="#333" font-family="sans-serif">A4→SDA</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 3: IR Obstacle & IR Remote Receiver
// ---------------------------------------------------------------------------

const IR_SKETCH = `// =====================================================================
// PART A: IR Obstacle Avoidance Module (digital HIGH / LOW output)
// =====================================================================
// The IR obstacle module has a built-in IR LED and detector.
// When an object is close (adjustable via the onboard potentiometer),
// the OUT pin goes LOW; when clear, it stays HIGH.

const int IR_OBS_PIN = 7;    // OUT pin of the IR obstacle module

void setupObstacle() {
  pinMode(IR_OBS_PIN, INPUT);
  Serial.begin(9600);
  Serial.println("IR Obstacle module ready");
}

void loopObstacle() {
  int state = digitalRead(IR_OBS_PIN);
  if (state == LOW) {
    Serial.println("Obstacle DETECTED!");
  } else {
    Serial.println("Path clear.");
  }
  delay(200);
}

// =====================================================================
// PART B: VS1838 / TSOP IR Receiver — decode remote control buttons
// Install: "IRremote" by shirriff, z3t0, ArminJo (Library Manager)
// =====================================================================
#include <IRremote.hpp>

const int IR_RECV_PIN = 11;   // Signal pin of the TSOP/VS1838 receiver

void setup() {
  Serial.begin(9600);
  IrReceiver.begin(IR_RECV_PIN, ENABLE_LED_FEEDBACK);
  Serial.println("IR Remote receiver ready — point remote at sensor and press a button");
}

void loop() {
  if (IrReceiver.decode()) {
    uint32_t rawCode = IrReceiver.decodedIRData.decodedRawData;
    String   protocol = IrReceiver.getProtocolString();
    uint16_t command  = IrReceiver.decodedIRData.command;

    Serial.print("Protocol: "); Serial.print(protocol);
    Serial.print("  Command: 0x"); Serial.print(command, HEX);
    Serial.print("  Raw: 0x");    Serial.println(rawCode, HEX);

    // Example: react to a specific button (learn your remote's code first)
    if (command == 0x45) {
      Serial.println("  → That is the POWER button on a generic NEC remote!");
    }

    IrReceiver.resume();   // IMPORTANT: always call resume() to receive the next code
  }
}`;

const SVG_IR_MODULE = `<svg viewBox="0 0 380 220" role="img" aria-label="IR obstacle module and VS1838 IR receiver module side by side" xmlns="http://www.w3.org/2000/svg">
  <!-- IR Obstacle module -->
  <rect x="20" y="50" width="150" height="110" rx="6" fill="#1a5c1a" stroke="#0d3d0d" stroke-width="2"/>
  <text x="95" y="68" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif" font-weight="bold">IR Obstacle Module</text>
  <!-- IR LED (emitter) -->
  <circle cx="60" cy="110" r="16" fill="#222" stroke="#555" stroke-width="1.5"/>
  <circle cx="60" cy="110" r="8" fill="#333"/>
  <text x="60" y="136" text-anchor="middle" font-size="8" fill="#aaffaa" font-family="sans-serif">IR LED</text>
  <!-- IR detector -->
  <circle cx="130" cy="110" r="16" fill="#222" stroke="#555" stroke-width="1.5"/>
  <circle cx="130" cy="110" r="8" fill="#333"/>
  <text x="130" y="136" text-anchor="middle" font-size="8" fill="#aaffaa" font-family="sans-serif">Detector</text>
  <!-- Potentiometer -->
  <circle cx="95" cy="90" r="8" fill="#e67e22" stroke="#a04000" stroke-width="1.5"/>
  <text x="95" y="82" text-anchor="middle" font-size="7" fill="#fff" font-family="sans-serif">Range</text>
  <!-- Obstacle module pins -->
  <rect x="35" y="162" width="80" height="14" rx="2" fill="#2a2a2a"/>
  <rect x="39" y="164" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="57" y="164" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="75" y="164" width="10" height="10" rx="1" fill="#d4a017"/>
  <text x="44" y="187" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <text x="62" y="187" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="80" y="187" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">OUT</text>
  <!-- VS1838 / TSOP receiver -->
  <rect x="210" y="50" width="150" height="110" rx="6" fill="#2a1a6e" stroke="#1a0a50" stroke-width="2"/>
  <text x="285" y="68" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif" font-weight="bold">VS1838 / TSOP</text>
  <!-- Receiver dome -->
  <ellipse cx="285" cy="110" rx="30" ry="28" fill="#1a1a1a" stroke="#555" stroke-width="2"/>
  <ellipse cx="285" cy="110" rx="18" ry="18" fill="#333"/>
  <circle cx="285" cy="110" r="6" fill="#555"/>
  <text x="285" y="148" text-anchor="middle" font-size="8" fill="#aaaaff" font-family="sans-serif">IR Receiver</text>
  <!-- TSOP pins -->
  <rect x="255" y="162" width="60" height="14" rx="2" fill="#2a2a2a"/>
  <rect x="259" y="164" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="277" y="164" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="295" y="164" width="10" height="10" rx="1" fill="#d4a017"/>
  <text x="264" y="187" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">OUT</text>
  <text x="282" y="187" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="300" y="187" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <!-- Labels under each module -->
  <text x="95" y="207" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">Digital: LOW = detected</text>
  <text x="285" y="207" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">38 kHz demodulated</text>
</svg>`;

const SVG_IR_WIRING = `<svg viewBox="0 0 460 280" role="img" aria-label="IR obstacle module and VS1838 receiver wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="30" width="160" height="200" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="52" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="68" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="78" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="88" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="98" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="108" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="118" font-size="9" fill="#fff" font-family="sans-serif">Pin 7</text>
  <rect x="18" y="128" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="138" font-size="9" fill="#fff" font-family="sans-serif">Pin 11</text>
  <!-- IR Obstacle module -->
  <rect x="270" y="50" width="90" height="70" rx="5" fill="#1a5c1a" stroke="#0d3d0d" stroke-width="2"/>
  <text x="315" y="68" text-anchor="middle" font-size="9" fill="#fff" font-family="sans-serif">IR Obstacle</text>
  <circle cx="295" cy="95" r="10" fill="#222" stroke="#555" stroke-width="1"/>
  <circle cx="335" cy="95" r="10" fill="#222" stroke="#555" stroke-width="1"/>
  <rect x="274" y="122" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="292" y="122" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="310" y="122" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="279" y="145" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <text x="297" y="145" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="315" y="145" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">OUT</text>
  <!-- VS1838 receiver module -->
  <rect x="380" y="50" width="65" height="70" rx="5" fill="#2a1a6e" stroke="#1a0a50" stroke-width="2"/>
  <text x="412" y="68" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">VS1838</text>
  <ellipse cx="412" cy="98" rx="18" ry="16" fill="#111" stroke="#555" stroke-width="1.5"/>
  <rect x="384" y="122" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="402" y="122" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="420" y="122" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="389" y="145" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">OUT</text>
  <text x="407" y="145" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="425" y="145" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <!-- Wires: Obstacle -->
  <polyline points="48,74 200,74 200,128 274,128" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,94 210,94 210,134 292,134" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <polyline points="48,114 220,114 220,131 310,131" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Wires: VS1838 -->
  <polyline points="48,74 200,74 445,74 445,128" fill="none" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="5,3"/>
  <polyline points="48,94 210,94 407,128" fill="none" stroke="#2c3e50" stroke-width="1.5" stroke-dasharray="5,3"/>
  <polyline points="48,134 230,134 230,160 389,155 389,134" fill="none" stroke="#9b59b6" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="255" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="263" font-size="8" fill="#333" font-family="sans-serif">5V→VCC(both)</text>
  <rect x="130" y="255" width="12" height="8" fill="#2c3e50"/>
  <text x="146" y="263" font-size="8" fill="#333" font-family="sans-serif">GND(both)</text>
  <rect x="240" y="255" width="12" height="8" fill="#f39c12"/>
  <text x="256" y="263" font-size="8" fill="#333" font-family="sans-serif">Pin7→Obs.OUT</text>
  <rect x="360" y="255" width="12" height="8" fill="#9b59b6"/>
  <text x="376" y="263" font-size="8" fill="#333" font-family="sans-serif">Pin11→TSOP OUT</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 4: Hall Effect & Reed Switch — Magnetic Sensors
// ---------------------------------------------------------------------------

const MAGNETIC_SKETCH = `// =====================================================================
// PART A: Reed Switch — door / contact sensor
// =====================================================================
// A reed switch is two springy metal reeds inside a glass tube.
// When a magnet comes close they snap together (circuit closed = LOW if pull-up).
// Wire: one leg → digital pin, other leg → GND. Use INPUT_PULLUP.

const int REED_PIN = 4;   // Reed switch leg 1
const int HALL_PIN = 5;   // Hall effect sensor OUT pin

// PART B: Hall Effect sensor (e.g. A3144 / OH090U)
// Digital Hall sensors output LOW when a magnet is present, HIGH otherwise.
// They are great for counting wheel rotations on a robot (one magnet per revolution).

volatile int rotationCount = 0;   // Counts magnet passes; volatile because ISR modifies it

void hallISR() {
  rotationCount++;   // Interrupt fires on each falling edge (magnet arriving)
}

void setup() {
  Serial.begin(9600);
  pinMode(REED_PIN, INPUT_PULLUP);  // Closed circuit → LOW; open → HIGH (pull-up)
  pinMode(HALL_PIN, INPUT_PULLUP);

  // Attach interrupt to Hall pin — triggers when magnet arrives (FALLING edge)
  attachInterrupt(digitalPinToInterrupt(HALL_PIN), hallISR, FALLING);

  Serial.println("Magnetic sensors ready");
}

void loop() {
  // --- Reed switch: contact detection ---
  int reedState = digitalRead(REED_PIN);
  if (reedState == LOW) {
    Serial.println("Reed: MAGNET / CONTACT PRESENT");
  } else {
    Serial.println("Reed: open (no magnet)");
  }

  // --- Hall sensor: rotation counter ---
  // Disable interrupts briefly while reading the shared variable
  noInterrupts();
  int count = rotationCount;
  interrupts();

  Serial.print("Hall rotations: ");
  Serial.println(count);

  delay(500);
}`;

const SVG_MAGNETIC_MODULE = `<svg viewBox="0 0 380 220" role="img" aria-label="Reed switch glass tube and Hall effect sensor TO-92 package" xmlns="http://www.w3.org/2000/svg">
  <!-- Reed switch -->
  <rect x="30" y="85" width="120" height="50" rx="25" fill="#d0e8f0" stroke="#888" stroke-width="2"/>
  <rect x="50" y="100" width="80" height="20" rx="5" fill="#c0d8e0" stroke="#999" stroke-width="1"/>
  <!-- Reed contacts inside -->
  <line x1="55" y1="110" x2="100" y2="108" stroke="#c0a000" stroke-width="3"/>
  <line x1="85" y1="112" x2="125" y2="110" stroke="#c0a000" stroke-width="3"/>
  <!-- Wires from reed -->
  <line x1="30" y1="110" x2="10" y2="110" stroke="#aaa" stroke-width="3"/>
  <line x1="150" y1="110" x2="170" y2="110" stroke="#aaa" stroke-width="3"/>
  <text x="10" y="140" font-size="8" fill="#555" font-family="sans-serif">Leg A</text>
  <text x="155" y="140" font-size="8" fill="#555" font-family="sans-serif">Leg B</text>
  <text x="90" y="160" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif" font-weight="bold">Reed Switch</text>
  <text x="90" y="175" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">(glass tube — no polarity)</text>
  <!-- Magnet symbol -->
  <rect x="60" y="50" width="60" height="22" rx="4" fill="#e74c3c" stroke="#c0392b" stroke-width="1.5"/>
  <text x="90" y="64" text-anchor="middle" font-size="9" fill="#fff" font-family="sans-serif" font-weight="bold">MAGNET</text>
  <line x1="90" y1="72" x2="90" y2="85" stroke="#e74c3c" stroke-width="2" stroke-dasharray="3,2"/>
  <!-- Hall effect sensor (TO-92) -->
  <path d="M240,65 L300,65 Q340,65 340,115 Q340,155 270,155 Q200,155 200,115 Q200,65 240,65 Z" fill="#1a1a1a" stroke="#444" stroke-width="2"/>
  <rect x="240" y="65" width="60" height="90" fill="#2a2a2a"/>
  <text x="270" y="100" text-anchor="middle" font-size="9" fill="#aaffaa" font-family="monospace">A3144</text>
  <text x="270" y="114" text-anchor="middle" font-size="8" fill="#88cc88" font-family="monospace">Hall</text>
  <!-- Three legs -->
  <rect x="245" y="155" width="6" height="30" fill="#aaa"/>
  <rect x="267" y="155" width="6" height="30" fill="#aaa"/>
  <rect x="289" y="155" width="6" height="30" fill="#aaa"/>
  <text x="248" y="198" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="270" y="198" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <text x="292" y="198" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">OUT</text>
  <text x="270" y="215" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif" font-weight="bold">Hall Effect Sensor</text>
</svg>`;

const SVG_MAGNETIC_WIRING = `<svg viewBox="0 0 460 260" role="img" aria-label="Reed switch and Hall effect sensor wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="30" width="160" height="210" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="52" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="68" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="78" font-size="9" fill="#fff" font-family="sans-serif">5V</text>
  <rect x="18" y="88" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="98" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="108" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="118" font-size="9" fill="#fff" font-family="sans-serif">Pin 4 (Reed)</text>
  <rect x="18" y="128" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="138" font-size="9" fill="#fff" font-family="sans-serif">Pin 5 (Hall)</text>
  <!-- Reed switch -->
  <rect x="270" y="55" width="90" height="40" rx="20" fill="#d0e8f0" stroke="#888" stroke-width="2"/>
  <text x="315" y="79" text-anchor="middle" font-size="9" fill="#333" font-family="sans-serif">Reed Switch</text>
  <!-- Reed legs -->
  <line x1="270" y1="75" x2="255" y2="75" stroke="#aaa" stroke-width="3"/>
  <line x1="360" y1="75" x2="375" y2="75" stroke="#aaa" stroke-width="3"/>
  <text x="252" y="90" text-anchor="end" font-size="8" fill="#555" font-family="sans-serif">→ Pin 4</text>
  <text x="378" y="90" font-size="8" fill="#555" font-family="sans-serif">→ GND</text>
  <!-- Hall sensor -->
  <rect x="270" y="150" width="85" height="60" rx="30" fill="#1a1a1a" stroke="#444" stroke-width="2"/>
  <text x="312" y="178" text-anchor="middle" font-size="9" fill="#aaffaa" font-family="monospace">A3144</text>
  <text x="312" y="192" text-anchor="middle" font-size="8" fill="#88cc88" font-family="monospace">Hall</text>
  <!-- Hall legs -->
  <rect x="278" y="210" width="6" height="20" fill="#aaa"/>
  <rect x="299" y="210" width="6" height="20" fill="#aaa"/>
  <rect x="320" y="210" width="6" height="20" fill="#aaa"/>
  <text x="281" y="240" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <text x="302" y="240" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="323" y="240" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">OUT</text>
  <!-- Wires: Reed switch → Pin 4 and GND -->
  <polyline points="48,118 220,118 220,75 255,75" fill="none" stroke="#f39c12" stroke-width="2"/>
  <polyline points="48,94 210,94 210,80 375,80" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <!-- Wires: Hall → 5V, GND, Pin5 -->
  <polyline points="48,74 200,74 200,216 278,216" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,94 210,94 302,220" fill="none" stroke="#2c3e50" stroke-width="1.5" stroke-dasharray="5,3"/>
  <polyline points="48,134 230,134 230,222 320,222" fill="none" stroke="#9b59b6" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="250" width="12" height="8" fill="#f39c12"/>
  <text x="26" y="258" font-size="8" fill="#333" font-family="sans-serif">Pin4→Reed</text>
  <rect x="110" y="250" width="12" height="8" fill="#9b59b6"/>
  <text x="126" y="258" font-size="8" fill="#333" font-family="sans-serif">Pin5→Hall OUT</text>
  <rect x="240" y="250" width="12" height="8" fill="#e74c3c"/>
  <text x="256" y="258" font-size="8" fill="#333" font-family="sans-serif">5V→Hall VCC</text>
  <rect x="360" y="250" width="12" height="8" fill="#2c3e50"/>
  <text x="376" y="258" font-size="8" fill="#333" font-family="sans-serif">GND(both)</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 5: Capacitive Touch TTP223
// ---------------------------------------------------------------------------

const TTP223_SKETCH = `// TTP223 capacitive touch sensor — behaves exactly like a button.
// Touch the metal pad → OUT pin goes HIGH.
// Release → OUT pin goes LOW.
// No debounce needed — the IC already handles that internally.

const int TOUCH_PIN = 6;   // OUT pin of the TTP223 module
const int LED_PIN   = 13;  // Built-in LED

bool ledState = false;   // We will toggle this on each touch

// Track the previous touch state to detect the rising edge (press moment)
int prevTouchState = LOW;

void setup() {
  pinMode(TOUCH_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("TTP223 capacitive touch ready — tap the sensor pad!");
}

void loop() {
  int touchState = digitalRead(TOUCH_PIN);

  // Only react on the rising edge (finger just touched)
  if (touchState == HIGH && prevTouchState == LOW) {
    ledState = !ledState;                // Toggle the LED
    digitalWrite(LED_PIN, ledState);
    Serial.print("Touched! LED is now: ");
    Serial.println(ledState ? "ON" : "OFF");
  }

  prevTouchState = touchState;
  delay(20);   // Small delay reduces CPU thrashing; touch detection still feels instant
}`;

const SVG_TTP223_MODULE = `<svg viewBox="0 0 280 200" role="img" aria-label="TTP223 capacitive touch sensor module" xmlns="http://www.w3.org/2000/svg">
  <!-- PCB body -->
  <rect x="55" y="50" width="170" height="100" rx="6" fill="#4a1a6e" stroke="#2a0a50" stroke-width="2"/>
  <!-- Large touch pad (copper area) -->
  <rect x="80" y="70" width="80" height="60" rx="4" fill="#c8a000" stroke="#a08000" stroke-width="1.5"/>
  <text x="120" y="104" text-anchor="middle" font-size="10" fill="#1a1a1a" font-family="sans-serif" font-weight="bold">TOUCH</text>
  <text x="120" y="118" text-anchor="middle" font-size="8" fill="#555" font-family="sans-serif">copper pad</text>
  <!-- TTP223 IC -->
  <rect x="185" y="75" width="30" height="25" rx="2" fill="#111" stroke="#444" stroke-width="1.5"/>
  <text x="200" y="91" text-anchor="middle" font-size="7" fill="#aaaaff" font-family="monospace">TTP223</text>
  <!-- LED indicator -->
  <circle cx="200" cy="120" r="7" fill="#27ae60" stroke="#1a8040" stroke-width="1.5"/>
  <text x="200" y="140" text-anchor="middle" font-size="7" fill="#fff" font-family="sans-serif">LED</text>
  <!-- Pin header -->
  <rect x="68" y="153" width="50" height="16" rx="2" fill="#2a2a2a"/>
  <rect x="72" y="155" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="90" y="155" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="108" y="155" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="77" y="180" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <text x="95" y="180" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="113" y="180" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">OUT</text>
  <!-- Title -->
  <text x="140" y="42" text-anchor="middle" font-size="11" fill="#333" font-family="sans-serif" font-weight="bold">TTP223 Capacitive Touch</text>
  <text x="140" y="195" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">Touch pad → OUT HIGH | works through thin plastic</text>
</svg>`;

const SVG_TTP223_WIRING = `<svg viewBox="0 0 420 240" role="img" aria-label="TTP223 capacitive touch sensor wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="30" width="160" height="180" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="52" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="68" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="78" font-size="9" fill="#fff" font-family="sans-serif">3.3V</text>
  <rect x="18" y="88" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="98" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="108" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="118" font-size="9" fill="#fff" font-family="sans-serif">Pin 6 (OUT)</text>
  <!-- TTP223 module -->
  <rect x="275" y="60" width="130" height="95" rx="6" fill="#4a1a6e" stroke="#2a0a50" stroke-width="2"/>
  <text x="340" y="80" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif" font-weight="bold">TTP223</text>
  <!-- Touch pad area -->
  <rect x="290" y="88" width="60" height="42" rx="4" fill="#c8a000" stroke="#a08000" stroke-width="1.5"/>
  <text x="320" y="113" text-anchor="middle" font-size="9" fill="#1a1a1a" font-family="sans-serif">TOUCH</text>
  <!-- IC -->
  <rect x="365" y="88" width="28" height="20" rx="2" fill="#111" stroke="#444" stroke-width="1"/>
  <text x="379" y="101" text-anchor="middle" font-size="7" fill="#aaaaff" font-family="monospace">IC</text>
  <!-- Sensor pins -->
  <rect x="283" y="158" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="301" y="158" width="10" height="12" rx="1" fill="#d4a017"/>
  <rect x="319" y="158" width="10" height="12" rx="1" fill="#d4a017"/>
  <text x="288" y="181" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="306" y="181" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <text x="324" y="181" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">OUT</text>
  <!-- Wires -->
  <polyline points="48,74 200,74 200,164 283,164" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,94 210,94 210,170 301,170" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <polyline points="48,114 220,114 220,167 319,167" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="220" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="228" font-size="9" fill="#333" font-family="sans-serif">3.3V→VCC</text>
  <rect x="120" y="220" width="12" height="8" fill="#2c3e50"/>
  <text x="136" y="228" font-size="9" fill="#333" font-family="sans-serif">GND→GND</text>
  <rect x="240" y="220" width="12" height="8" fill="#f39c12"/>
  <text x="256" y="228" font-size="9" fill="#333" font-family="sans-serif">Pin 6→OUT</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 6: Tilt & Vibration SW-520D / SW-420
// ---------------------------------------------------------------------------

const TILT_SKETCH = `// SW-520D tilt switch (ball type) or SW-420 vibration module
// Both output a digital HIGH when tilted/vibrated beyond a threshold,
// LOW when still / level.
// The SW-420 module already has a comparator and potentiometer onboard;
// the bare SW-520D can be read directly with INPUT_PULLUP.

const int TILT_PIN  = 3;   // SW-520D or SW-420 OUT pin
const int LED_PIN   = 13;  // Built-in LED

// ---- Simple debounce variables ----
bool     lastState     = false;
bool     triggered     = false;
unsigned long lastTime = 0;
const unsigned long DEBOUNCE_MS = 50;   // 50 ms debounce window

void setup() {
  pinMode(TILT_PIN, INPUT_PULLUP);   // Pull-up: bare SW-520D reads LOW when tilted
  pinMode(LED_PIN,  OUTPUT);
  Serial.begin(9600);
  Serial.println("Tilt/Vibration sensor ready — tilt or tap!");
}

void loop() {
  // With INPUT_PULLUP, the switch pulls the pin LOW when contacts close (tilted).
  // Invert so "triggered" means LOW (= tilted/vibrated):
  bool currentState = (digitalRead(TILT_PIN) == LOW);

  unsigned long now = millis();

  if (currentState != lastState) {
    lastTime = now;               // Reset debounce timer on any change
  }

  // Only accept the new state if it has been stable for DEBOUNCE_MS
  if ((now - lastTime) > DEBOUNCE_MS) {
    if (currentState && !triggered) {
      triggered = true;
      digitalWrite(LED_PIN, HIGH);
      Serial.println("TILT / VIBRATION detected!");
    } else if (!currentState && triggered) {
      triggered = false;
      digitalWrite(LED_PIN, LOW);
      Serial.println("Back to level / still.");
    }
  }

  lastState = currentState;
}`;

const SVG_TILT_MODULE = `<svg viewBox="0 0 360 220" role="img" aria-label="SW-520D tilt switch capsule and SW-420 vibration module" xmlns="http://www.w3.org/2000/svg">
  <!-- SW-520D tilt switch (cylindrical capsule) -->
  <rect x="30" y="70" width="110" height="60" rx="30" fill="#888" stroke="#555" stroke-width="2"/>
  <!-- Metal ball inside (shown in cross-section) -->
  <circle cx="110" cy="100" r="15" fill="#c0c0c0" stroke="#888" stroke-width="1.5"/>
  <text x="110" y="104" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">ball</text>
  <!-- Contacts at left end -->
  <line x1="30" y1="90" x2="10" y2="90" stroke="#aaa" stroke-width="3"/>
  <line x1="30" y1="110" x2="10" y2="110" stroke="#aaa" stroke-width="3"/>
  <text x="5" y="88" font-size="8" fill="#555" text-anchor="end" font-family="sans-serif">A</text>
  <text x="5" y="114" font-size="8" fill="#555" text-anchor="end" font-family="sans-serif">B</text>
  <!-- Tilt arrow -->
  <path d="M85,60 Q100,45 115,55" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polygon points="115,55 110,48 121,50" fill="#e74c3c"/>
  <text x="95" y="44" text-anchor="middle" font-size="8" fill="#e74c3c" font-family="sans-serif">tilt</text>
  <!-- Label -->
  <text x="85" y="150" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif" font-weight="bold">SW-520D</text>
  <text x="85" y="164" text-anchor="middle" font-size="8" fill="#555" font-family="sans-serif">Ball tilt switch</text>
  <!-- SW-420 module board -->
  <rect x="195" y="55" width="145" height="115" rx="6" fill="#5a1a1a" stroke="#3a0a0a" stroke-width="2"/>
  <text x="267" y="73" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif" font-weight="bold">SW-420 Module</text>
  <!-- Spring vibration element -->
  <rect x="215" y="82" width="50" height="50" rx="4" fill="#222" stroke="#555" stroke-width="1.5"/>
  <path d="M225,105 Q230,95 235,105 Q240,115 245,105 Q250,95 255,105" fill="none" stroke="#c8a000" stroke-width="2"/>
  <text x="240" y="145" text-anchor="middle" font-size="8" fill="#ffbbaa" font-family="sans-serif">spring sensor</text>
  <!-- Comparator IC -->
  <rect x="280" y="82" width="45" height="35" rx="2" fill="#111" stroke="#444" stroke-width="1.5"/>
  <text x="302" y="102" text-anchor="middle" font-size="8" fill="#aaffaa" font-family="monospace">LM393</text>
  <!-- Pot -->
  <circle cx="302" cy="135" r="10" fill="#e67e22" stroke="#a04000" stroke-width="1.5"/>
  <text x="302" y="128" text-anchor="middle" font-size="7" fill="#fff" font-family="sans-serif">Sens.</text>
  <!-- Pins -->
  <rect x="200" y="172" width="60" height="14" rx="2" fill="#2a2a2a"/>
  <rect x="204" y="174" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="222" y="174" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="240" y="174" width="10" height="10" rx="1" fill="#d4a017"/>
  <text x="209" y="196" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">VCC</text>
  <text x="227" y="196" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">GND</text>
  <text x="245" y="196" text-anchor="middle" font-size="7" fill="#333" font-family="sans-serif">OUT</text>
</svg>`;

const SVG_TILT_WIRING = `<svg viewBox="0 0 440 250" role="img" aria-label="SW-420 vibration module wiring to Arduino Uno" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino board -->
  <rect x="10" y="30" width="160" height="190" rx="8" fill="#00878a" stroke="#006066" stroke-width="2"/>
  <text x="90" y="52" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif" font-weight="bold">Arduino UNO</text>
  <rect x="18" y="68" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="78" font-size="9" fill="#fff" font-family="sans-serif">3.3V</text>
  <rect x="18" y="88" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="98" font-size="9" fill="#fff" font-family="sans-serif">GND</text>
  <rect x="18" y="108" width="30" height="12" rx="2" fill="#f5a623"/>
  <text x="52" y="118" font-size="9" fill="#fff" font-family="sans-serif">Pin 3 (OUT)</text>
  <!-- SW-420 module -->
  <rect x="275" y="60" width="140" height="110" rx="6" fill="#5a1a1a" stroke="#3a0a0a" stroke-width="2"/>
  <text x="345" y="80" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif" font-weight="bold">SW-420</text>
  <!-- Vibration element -->
  <rect x="290" y="88" width="50" height="45" rx="4" fill="#222" stroke="#555" stroke-width="1"/>
  <path d="M298,110 Q303,100 308,110 Q313,120 318,110 Q323,100 328,110 Q333,120 338,110" fill="none" stroke="#c8a000" stroke-width="2"/>
  <!-- Comparator IC -->
  <rect x="355" y="88" width="45" height="30" rx="2" fill="#111" stroke="#444" stroke-width="1"/>
  <text x="377" y="105" text-anchor="middle" font-size="8" fill="#aaffaa" font-family="monospace">LM393</text>
  <!-- Pins -->
  <rect x="283" y="173" width="60" height="14" rx="2" fill="#2a2a2a"/>
  <rect x="287" y="175" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="305" y="175" width="10" height="10" rx="1" fill="#d4a017"/>
  <rect x="323" y="175" width="10" height="10" rx="1" fill="#d4a017"/>
  <text x="292" y="198" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">VCC</text>
  <text x="310" y="198" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">GND</text>
  <text x="328" y="198" text-anchor="middle" font-size="8" fill="#333" font-family="sans-serif">OUT</text>
  <!-- Wires -->
  <polyline points="48,74 200,74 200,181 287,181" fill="none" stroke="#e74c3c" stroke-width="2"/>
  <polyline points="48,94 210,94 210,187 305,187" fill="none" stroke="#2c3e50" stroke-width="2"/>
  <polyline points="48,114 220,114 220,184 323,184" fill="none" stroke="#f39c12" stroke-width="2"/>
  <!-- Legend -->
  <rect x="10" y="230" width="12" height="8" fill="#e74c3c"/>
  <text x="26" y="238" font-size="9" fill="#333" font-family="sans-serif">3.3V→VCC</text>
  <rect x="115" y="230" width="12" height="8" fill="#2c3e50"/>
  <text x="131" y="238" font-size="9" fill="#333" font-family="sans-serif">GND→GND</text>
  <rect x="240" y="230" width="12" height="8" fill="#f39c12"/>
  <text x="256" y="238" font-size="9" fill="#333" font-family="sans-serif">Pin 3→OUT</text>
</svg>`;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const sensorsPart3: LessonDef[] = [
  // -------------------------------------------------------------------------
  // Lesson 1 — MPU-6050 Accelerometer + Gyroscope
  // -------------------------------------------------------------------------
  {
    title: "MPU-6050 — Accelerometer + Gyroscope",
    slug: "sensor-mpu6050",
    estMinutes: 22,
    contentType: "markdown",
    body: body(
      md(`## 6-axis motion sensing with the MPU-6050

The **MPU-6050** is a tiny but incredibly powerful chip from InvenSense that packs two sensors into a single 4 × 4 mm package:

- **3-axis accelerometer** — measures linear acceleration in three directions (X, Y, Z). At rest it measures gravity — about 9.81 m/s² pointing downward — which lets you calculate tilt angles.
- **3-axis gyroscope** — measures the rate at which the chip is *rotating* around each axis, in degrees per second. This tells you how fast something is spinning, not where it is pointing.

Combined, the six measurements are used to track orientation in space — this is how drones keep themselves level, how your phone knows which way it is tilted, and how gesture-controlled robots understand arm movements.

The chip also includes a **temperature sensor** and can bus-master a second I2C sensor through its XDA/XCL auxiliary pins (not used in this lesson).

### I2C interface

The MPU-6050 communicates over **I2C**. On the Arduino Uno, I2C uses:

| Arduino pin | I2C role |
|-------------|----------|
| **A4** | SDA (Serial Data) |
| **A5** | SCL (Serial Clock) |

The chip's I2C address is **0x68** by default. If you pull the AD0 pin HIGH, the address changes to **0x69**, allowing two MPU-6050s on the same bus.

The most popular breakout board is the **GY-521**. It is almost always sold as a 3.3 V device — **use the 3.3 V pin on the Arduino, not 5 V** — though some modules include a voltage regulator that accepts 5 V. Check your specific board.

### What accelerometer data means

At rest on a flat table, you will see:
- X ≈ 0 m/s²
- Y ≈ 0 m/s²
- Z ≈ 9.8 m/s²  (gravity!)

Tilt the board 90° and gravity shifts to the X or Y axis. Shake it and all three axes spike.

### Common uses
Balancing robots, gesture detection, flight controllers, step counters, vibration analysis, smartphone-style auto-rotation.`),
      svg(SVG_MPU6050_MODULE, "GY-521 MPU-6050 breakout board — main IC with X/Y axis arrows, decoupling capacitors, and 8-pin header"),
      svg(SVG_MPU6050_WIRING, "Wiring diagram: MPU-6050 connected to Arduino Uno via I2C — 3.3V, GND, A4(SDA), A5(SCL)"),
      md(`## Installing the library and uploading the sketch

Open the Arduino IDE Library Manager (**Sketch → Include Library → Manage Libraries**) and install:

1. **Adafruit MPU6050** by Adafruit
2. Accept all dependency installs (**Adafruit Unified Sensor** and **Adafruit BusIO**)

Then open the sketch below, upload it, and open the **Serial Monitor at 115200 baud**. Tilt and rotate the board to watch the numbers change.`),
      code("arduino", MPU6050_SKETCH, { filename: "mpu6050_motion.ino", openInStudio: true }),
      callout("tip", "The accelerometer Z reading will hover around 9.81 m/s² when the board is flat. If all readings show 0 or large random numbers, the sensor is not being found — double-check that SDA goes to A4 and SCL goes to A5. Also verify you are powering it from 3.3V, not 5V."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 2 — BMP280 / BME280 Pressure & Temperature
  // -------------------------------------------------------------------------
  {
    title: "BMP280 / BME280 — Pressure & Temperature",
    slug: "sensor-bmp280",
    estMinutes: 20,
    contentType: "markdown",
    body: body(
      md(`## Measuring air pressure to find altitude

The **BMP280** from Bosch Sensortec is a high-precision barometric pressure and temperature sensor. Its sibling, the **BME280**, adds a relative humidity measurement — everything else is the same. Both are used in the same way in code.

### Why does pressure change with altitude?

The higher you go, the less air is stacked above you, so the column of air weighs less and the pressure drops. Near sea level, pressure is about **1013 hPa** (hectopascals). Climb to the top of a 1000-metre hill and it drops to roughly **898 hPa**. The sensor can detect elevation changes of just **10 centimetres**.

### Calculating altitude

The Adafruit library provides a convenience function:

\`\`\`
altitude (m) = 44330 × (1 − (pressure / sea_level_pressure)^0.1903)
\`\`\`

You need to supply the current sea-level pressure at your location as a reference. Check a weather app — it is usually labelled "pressure" or "barometer". The standard atmosphere value (1013.25 hPa) works well enough for relative measurements.

### I2C address note

Two hardware addresses are available:
- **SDO pulled LOW (or floating)** → address **0x76** (default on most modules)
- **SDO pulled HIGH** → address **0x77**

Try both if the sensor is not detected.

### Pins

| Pin | Connect to |
|-----|-----------|
| VCC | 3.3 V (BMP280 is a 3.3 V device!) |
| GND | GND |
| SCL | A5 (Arduino Uno) |
| SDA | A4 (Arduino Uno) |
| CSB | Leave floating (selects I2C mode) |
| SDO | GND for address 0x76 |

### Common uses

Weather stations, altitude loggers for model rockets, indoor/outdoor thermometers, drone altitude hold.`),
      svg(SVG_BMP280_MODULE, "BMP280 breakout board — small LGA IC with pressure port, 6-pin header labelled VCC, GND, SCL, SDA, CSB, SDO"),
      svg(SVG_BMP280_WIRING, "Wiring diagram: BMP280 connected to Arduino Uno via I2C — 3.3V, GND, A5(SCL), A4(SDA)"),
      md(`## Installing the library

In the Arduino Library Manager, install:

1. **Adafruit BMP280 Library** by Adafruit
2. Accept the dependency installs (**Adafruit Unified Sensor**, **Adafruit BusIO**)

Upload the sketch and open the Serial Monitor at 9600 baud. Walk up a staircase and watch the altitude rise!`),
      code("arduino", BMP280_SKETCH, { filename: "bmp280_pressure.ino", openInStudio: true }),
      callout("tip", "Altitude readings drift slightly over time as the sensor warms up — wait 30 seconds after power-on for them to stabilise. For accurate absolute altitude, always enter today's actual sea-level pressure from a weather app rather than the standard 1013.25 hPa."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 3 — IR Obstacle & IR Remote Receiver
  // -------------------------------------------------------------------------
  {
    title: "IR Obstacle & IR Remote Receiver",
    slug: "sensor-ir",
    estMinutes: 20,
    contentType: "markdown",
    body: body(
      md(`## Infrared in two flavours

Infrared (IR) light sits just below red in the electromagnetic spectrum — invisible to human eyes but detectable by simple photodiodes. We use IR in two completely different ways in robotics:

---

### Part A — IR Obstacle Module

An **IR obstacle avoidance module** has a built-in IR LED (emitter) and an IR photodiode or phototransistor (detector), plus a comparator circuit. When an object is close enough to reflect the IR beam back to the detector, the comparator fires the **OUT pin LOW**. When the path is clear, OUT is HIGH.

A small **potentiometer** on the board lets you adjust the detection distance — typically from about 2 cm to 30 cm. It is not waterproof and direct sunlight can flood the detector, causing false readings.

**Pins:** VCC (5 V), GND, OUT (digital LOW = obstacle detected).

**Common uses:** line-following robots (detecting white vs. black tape), obstacle-avoiding robots, automatic dispensers.

---

### Part B — VS1838 / TSOP IR Receiver (remote control decoding)

A **TSOP IR receiver** (VS1838B is a common part) is a tiny module that contains a photodiode, a bandpass filter tuned to **38 kHz** (the standard carrier for TV remotes), and a demodulator. It filters out ambient IR and only outputs clean logic pulses that correspond to the data bursts from a remote control.

The **IRremote** library decodes these pulses into the protocol (NEC, Samsung, Sony, RC5, etc.) and the button command code. Different remotes use different protocols — the sketch prints both so you can learn what your remote sends.

**Pins (VS1838):** OUT (signal), GND, VCC (3.3–5 V). The pin order on the physical component reads OUT–GND–VCC from left to right when facing the domed front.

**Common uses:** TV-remote-controlled robots, custom remote controls, IR data transmission between two Arduinos.`),
      svg(SVG_IR_MODULE, "IR obstacle module showing IR LED emitter and detector pair with range pot, and VS1838 TSOP receiver dome"),
      svg(SVG_IR_WIRING, "Wiring diagram: IR obstacle OUT to pin 7, VS1838 OUT to pin 11, both sharing 5V and GND from Arduino Uno"),
      md(`## Installing the IRremote library

In the Library Manager, search for **IRremote** by shirriff / z3t0 / ArminJo and install it. Choose version 4.x or later.

The sketch below covers **Part B only** (remote decoding) in the \`setup()\` and \`loop()\` functions, with Part A shown as comments above them. Run Part B first — hold any IR remote 20–40 cm from the TSOP and press buttons. Note down the command codes; you can use them later to make a remote-controlled robot.`),
      code("arduino", IR_SKETCH, { filename: "ir_sensors.ino", openInStudio: true }),
      callout("tip", "If the IRremote library gives compile errors about 'IrReceiver', make sure you installed version 4.x — the API changed significantly from v2/v3. Also, do not use pin 13 (the built-in LED pin) for the receiver if you have LED feedback enabled, as the library toggles it during reception."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 4 — Hall Effect & Reed Switch — Magnetic Sensors
  // -------------------------------------------------------------------------
  {
    title: "Hall Effect & Reed Switch — Magnetic Sensors",
    slug: "sensor-magnetic",
    estMinutes: 18,
    contentType: "markdown",
    body: body(
      md(`## Detecting magnets — two different technologies

Both sensors in this lesson detect the presence of a magnet. They work on very different physical principles and suit different use cases.

---

### Reed Switch

A reed switch is two thin **ferromagnetic metal reeds** sealed inside a glass capsule filled with inert gas. Normally they do not touch. Bring a magnet close and both reeds magnetise and snap together, completing the circuit. Remove the magnet and they spring apart again.

**Key properties:**
- No external power needed — it is just a mechanical switch
- Works as a normally-open (NO) contact in its common form
- Bounce like any mechanical switch (use a debounce routine or delay)
- No polarity — either leg can go to signal, the other to GND
- Typical switching speed: a few milliseconds

**Common uses:** door/window security sensors (alarm systems use reed switches), liquid level indicators, position switches.

---

### Hall Effect Sensor (A3144, OH090U, etc.)

The **Hall effect** is a quantum phenomenon: when a current flows through a conductor and a magnetic field is applied perpendicular to it, a voltage appears across the conductor's edges. A Hall effect IC amplifies this tiny voltage and outputs a digital LOW when a magnet of the correct polarity is nearby.

Most digital Hall sensors (like the A3144) are **unipolar** — they respond only to the *south pole* of a magnet. **Omnipolar** variants respond to either pole.

**Key properties:**
- Solid-state — no moving parts, no bounce, millions of operations
- Fast switching — great for counting high-speed rotations
- Requires VCC and GND in addition to the signal pin
- Output is LOW (active) when magnet present

**Common uses:** motor speed sensing (one magnet per revolution on the shaft), position detection in printers/3D printers (end-stops), anti-lock braking systems (ABS), brushless motor commutation.`),
      svg(SVG_MAGNETIC_MODULE, "Reed switch glass capsule with two reeds and a nearby magnet, plus an A3144 Hall effect sensor in TO-92 package with three legs labelled VCC, GND, OUT"),
      svg(SVG_MAGNETIC_WIRING, "Wiring diagram: reed switch between pin 4 and GND, Hall sensor VCC to 5V, GND to GND, OUT to pin 5 (interrupt-capable)"),
      md(`## Using interrupts for rotation counting

The sketch uses **\`attachInterrupt()\`** to count Hall sensor pulses — this is more reliable than polling \`digitalRead()\` in a loop, especially at high rotation speeds. On the Arduino Uno, only pins **2 and 3** support external interrupts; pin 5 is used here for compatibility with Uno and Mega boards (both support interrupt on pin 5 on the Mega — adjust to pin 2 or 3 on the Uno if needed).

Upload the sketch and open the Serial Monitor. Wave a magnet past the Hall sensor to increment the counter, and bridge the reed switch legs with a magnet to trigger the door-open/closed message.`),
      code("arduino", MAGNETIC_SKETCH, { filename: "magnetic_sensors.ino", openInStudio: true }),
      callout("tip", "Reed switches bounce like pushbuttons — a single magnet pass can register 3–10 counts. For door sensors (slow events) a 50 ms debounce delay is fine. For rotation counting at speed, use a Hall effect sensor instead; they switch in microseconds with no bounce."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 5 — Capacitive Touch TTP223
  // -------------------------------------------------------------------------
  {
    title: "Capacitive Touch (TTP223)",
    slug: "sensor-touch",
    estMinutes: 15,
    contentType: "markdown",
    body: body(
      md(`## Touch sensing without moving parts

The **TTP223** is a single-channel capacitive touch sensor IC. Unlike a regular push button that requires physical force to close a mechanical contact, a capacitive touch sensor detects the tiny change in electrical capacitance caused by a human finger approaching a metal pad.

### How capacitive sensing works

The copper pad on the module forms one plate of a capacitor. When your finger (which has its own capacitance due to the water and ions in your body) comes close to the pad, it becomes the other plate, increasing the total capacitance. The TTP223 IC continuously measures this capacitance and triggers its output when the value exceeds a threshold.

Because it measures field changes rather than physical contact, it can detect touch through thin materials — your robot chassis wall, a plastic lid, even thin glass. This makes it ideal for touch-sensitive surfaces where you do not want exposed metal contacts.

### Output modes

The TTP223 has two configurable modes (set by solder jumpers on the PCB):

| Mode | Behaviour |
|------|----------|
| **Toggle (default on most modules)** | Output flips HIGH/LOW on each touch |
| **Momentary** | Output is HIGH only while finger is present |

Most breakout modules ship in **momentary mode** — OUT is HIGH while you touch, LOW when you release. The sketch below handles this correctly by detecting the rising edge (moment of touch) to toggle an LED.

### Pins

| Pin | Connect to |
|-----|-----------|
| VCC | 2.0–5.5 V (usually 3.3 V for best sensitivity) |
| GND | GND |
| OUT | Any digital input pin |

### Common uses

Touch-activated lamps, capacitive keyboards, interactive robot panels, liquid level sensing through a container wall.`),
      svg(SVG_TTP223_MODULE, "TTP223 module showing the large copper touch pad, TTP223 IC, indicator LED, and three-pin header (VCC, GND, OUT)"),
      svg(SVG_TTP223_WIRING, "Wiring diagram: TTP223 connected to Arduino Uno — 3.3V to VCC, GND to GND, OUT to pin 6"),
      md(`## Toggling an LED on touch

The sketch below reads the OUT pin and toggles the built-in LED on pin 13 every time you touch the sensor pad. It detects only the **rising edge** of the touch signal — the instant your finger lands — so one touch = one toggle, even if you hold your finger down.

Upload the sketch and open the Serial Monitor, then tap the gold copper pad with your finger.`),
      code("arduino", TTP223_SKETCH, { filename: "ttp223_touch.ino", openInStudio: true }),
      callout("tip", "If the sensor seems too sensitive (triggering without being touched), try reducing the VCC from 3.3 V to a lower voltage, or increase the distance between the pad and nearby metal objects. If it is not sensitive enough, make sure you are using the correct VCC level and that GND is properly connected."),
    ),
  },

  // -------------------------------------------------------------------------
  // Lesson 6 — Tilt & Vibration SW-520D / SW-420
  // -------------------------------------------------------------------------
  {
    title: "Tilt & Vibration (SW-520D / SW-420)",
    slug: "sensor-tilt",
    estMinutes: 16,
    contentType: "markdown",
    body: body(
      md(`## Detecting tilt and physical knocks

This lesson covers two related sensors that share a similar design philosophy: they detect mechanical events — being tilted or being shaken — using simple, passive components rather than complex electronics.

---

### SW-520D — Ball Tilt Switch

The **SW-520D** is a small metal cylinder about 12 mm long. Inside, a tiny metal ball rests against two contact pins when the switch is in a certain orientation. When tilted past a threshold angle (typically 10°–45° depending on orientation), the ball rolls away from the contacts and the circuit opens.

It is basically a gravity-operated toggle. Invert it and it works the other way.

**Key properties:**
- Two leads, no polarity
- Digital — either conducting (ball on contacts) or not
- Very fast to mount on a breakout board or directly on a PCB
- Bouncy! Multiple contact events on each tilt transition

---

### SW-420 — Vibration Module

The **SW-420** uses a **spring-based vibration switch**: a thin coiled wire spring stands vertically on a contact. When the module is shaken, the spring oscillates and repeatedly touches a surrounding contact ring, generating a burst of pulses. A **comparator circuit** (LM393) and **potentiometer** on the module smooth this into a cleaner digital HIGH output when vibration exceeds the adjustable threshold.

Unlike the raw SW-520D, the SW-420 module gives you a nice 3-pin interface (VCC, GND, OUT) and an onboard sensitivity adjustment.

**Pins (SW-420 module):** VCC (3.3–5 V), GND, OUT (HIGH = vibration/tilt detected).

**Bare SW-520D:** two legs, connect one to a digital pin with \`INPUT_PULLUP\`, the other to GND.

---

### Debouncing

Both sensors bounce heavily — a single tilt can produce dozens of signal transitions in a few milliseconds. The sketch implements a standard **software debounce**: it only accepts a state change as valid if the signal has been stable for 50 ms. This turns the noisy burst into a single clean trigger event.

### Common uses

Tilt-activated alarms, knock detection for secret knock locks, inclination sensors for robotic arms, anti-theft motion detectors, self-levelling platforms.`),
      svg(SVG_TILT_MODULE, "SW-520D cylindrical tilt switch showing the metal ball rolling away from contacts when tilted, plus SW-420 module with spring sensor element, LM393 comparator, and sensitivity potentiometer"),
      svg(SVG_TILT_WIRING, "Wiring diagram: SW-420 module connected to Arduino Uno — 3.3V to VCC, GND to GND, OUT to pin 3"),
      md(`## Upload and test

The sketch below works with either sensor:
- **SW-420 module:** wire OUT → pin 3, power it from 3.3 V, adjust the potentiometer for desired sensitivity.
- **Bare SW-520D:** wire one leg → pin 3 (configured \`INPUT_PULLUP\`), other leg → GND.

Upload, open the Serial Monitor, then tap or tilt the sensor. The LED on pin 13 lights up on detection and turns off when the sensor returns to rest.`),
      code("arduino", TILT_SKETCH, { filename: "tilt_vibration.ino", openInStudio: true }),
      callout("tip", "The 50 ms debounce window works well for slow tilt detection. For counting rapid knocks (like a secret knock lock), reduce it to 10–15 ms. If you increase it too much, quick successive knocks will merge into one event. Experiment with the DEBOUNCE_MS constant to suit your project."),
    ),
  },
];
