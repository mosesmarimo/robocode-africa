import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Why combine a Pi and a microcontroller?
// ---------------------------------------------------------------------------

const L1_ARCH_DIAGRAM = `flowchart LR
  subgraph Pi["Raspberry Pi (Linux)"]
    direction TB
    PY["Python / OpenCV / Node"]
    NET["Wi-Fi / Ethernet"]
    GPU["GPU / Camera"]
  end
  subgraph MCU["Microcontroller (Arduino / ESP32)"]
    direction TB
    ADC["Analog inputs (ADC)"]
    PWM["PWM / motor drivers"]
    RT["Real-time timing (µs)"]
  end
  subgraph World["Physical World"]
    SENS["Sensors\n(temp, light, distance)"]
    MOT["Motors / servos"]
  end
  Pi <-->|"USB serial / I2C / UART"| MCU
  MCU --> SENS
  MCU --> MOT`;

// ---------------------------------------------------------------------------
// Lesson 2 — Talking over USB serial
// ---------------------------------------------------------------------------

const L2_ARDUINO_SERIAL = `// Arduino side: read a command char from the Pi and respond.
// Also stream an analog sensor reading every second.

const int LED_PIN = 13;
const int SENSOR_PIN = A0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);          // Must match the Pi's baud rate
  Serial.println("arduino:ready");
}

void loop() {
  // ---- Receive commands from the Pi ----
  if (Serial.available() > 0) {
    char cmd = Serial.read();   // Read one character
    if (cmd == '1') {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("led:on");
    } else if (cmd == '0') {
      digitalWrite(LED_PIN, LOW);
      Serial.println("led:off");
    }
  }

  // ---- Send sensor reading every 1 000 ms ----
  static unsigned long lastMs = 0;
  if (millis() - lastMs >= 1000) {
    lastMs = millis();
    int value = analogRead(SENSOR_PIN);   // 0–1023
    Serial.print("sensor:");
    Serial.println(value);
  }
}`;

const L2_PI_SERIAL = `#!/usr/bin/env python3
"""Raspberry Pi side: open the Arduino's serial port, send a command,
and print every line it sends back."""

import serial
import time

# The device path is usually /dev/ttyACM0 for a USB Arduino Uno.
# Use 'ls /dev/tty*' before and after plugging in to find the right one.
PORT = "/dev/ttyACM0"
BAUD = 9600   # Must match Serial.begin() in the Arduino sketch

ser = serial.Serial(PORT, BAUD, timeout=1)
time.sleep(2)   # Give the Arduino ~2 s to reset after the port opens

print("Connected. Sending LED ON command...")
ser.write(b"1")   # Send a single character '1' — turns the LED on

time.sleep(1)

print("Sending LED OFF command...")
ser.write(b"0")   # '0' turns the LED off

# Read and print whatever the Arduino sends for the next 5 seconds
deadline = time.time() + 5
while time.time() < deadline:
    line = ser.readline()   # Blocks up to 'timeout' seconds
    if line:
        print("Arduino says:", line.decode("utf-8").strip())

ser.close()`;

const L2_SEQ = `sequenceDiagram
  participant Pi as Raspberry Pi (Python)
  participant Ard as Arduino

  Pi->>Ard: serial.write(b"1")
  Note over Ard: cmd == '1' → LED on
  Ard-->>Pi: "led:on\\n"

  Pi->>Ard: serial.write(b"0")
  Note over Ard: cmd == '0' → LED off
  Ard-->>Pi: "led:off\\n"

  loop every 1 000 ms
    Ard-->>Pi: "sensor:537\\n"
  end`;

// ---------------------------------------------------------------------------
// Lesson 3 — UART pins & I2C
// ---------------------------------------------------------------------------

// SVG: Pi GPIO14(TX)/GPIO15(RX) ⇄ MCU RX/TX with a voltage divider on the
// Uno's TX→Pi RX line. Shows Pi (green), Uno (blue), resistors (grey).
const L3_SVG_WIRING = `<svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="UART wiring between Raspberry Pi and Arduino Uno with voltage divider">
  <!-- Background -->
  <rect width="520" height="280" fill="#f8f9fa" rx="8"/>

  <!-- Pi board -->
  <rect x="20" y="60" width="140" height="160" fill="#2d6a4f" rx="6"/>
  <text x="90" y="82" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="11" font-weight="bold">Raspberry Pi</text>
  <!-- Pi pins -->
  <rect x="130" y="100" width="30" height="16" fill="#52b788" rx="3"/>
  <text x="145" y="112" text-anchor="middle" fill="#fff" font-family="monospace" font-size="9">TX</text>
  <text x="115" y="112" text-anchor="end" fill="#d8f3dc" font-family="monospace" font-size="9">GPIO14</text>

  <rect x="130" y="126" width="30" height="16" fill="#52b788" rx="3"/>
  <text x="145" y="138" text-anchor="middle" fill="#fff" font-family="monospace" font-size="9">RX</text>
  <text x="115" y="138" text-anchor="end" fill="#d8f3dc" font-family="monospace" font-size="9">GPIO15</text>

  <rect x="130" y="152" width="30" height="16" fill="#1b4332" rx="3"/>
  <text x="145" y="164" text-anchor="middle" fill="#fff" font-family="monospace" font-size="9">GND</text>

  <!-- Arduino board -->
  <rect x="360" y="60" width="140" height="160" fill="#1565c0" rx="6"/>
  <text x="430" y="82" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="11" font-weight="bold">Arduino Uno</text>
  <!-- Arduino pins -->
  <rect x="360" y="100" width="30" height="16" fill="#42a5f5" rx="3"/>
  <text x="375" y="112" text-anchor="middle" fill="#fff" font-family="monospace" font-size="9">RX</text>
  <text x="398" y="112" fill="#bbdefb" font-family="monospace" font-size="9">pin 0</text>

  <rect x="360" y="126" width="30" height="16" fill="#42a5f5" rx="3"/>
  <text x="375" y="138" text-anchor="middle" fill="#fff" font-family="monospace" font-size="9">TX</text>
  <text x="398" y="138" fill="#bbdefb" font-family="monospace" font-size="9">pin 1</text>

  <rect x="360" y="152" width="30" height="16" fill="#0d47a1" rx="3"/>
  <text x="375" y="164" text-anchor="middle" fill="#fff" font-family="monospace" font-size="9">GND</text>

  <!-- Direct wire: Pi TX → Arduino RX (3.3V → 5V ok, Arduino inputs are tolerant) -->
  <line x1="160" y1="108" x2="360" y2="108" stroke="#52b788" stroke-width="2.5"/>
  <text x="260" y="103" text-anchor="middle" fill="#2d6a4f" font-family="monospace" font-size="9">direct (3.3V safe)</text>

  <!-- Voltage divider: Arduino TX (5V) → Pi RX (3.3V max) -->
  <!-- Wire from Arduino TX pin -->
  <line x1="360" y1="134" x2="290" y2="134" stroke="#ef9a9a" stroke-width="2.5"/>
  <!-- Resistor R1 (1kΩ) -->
  <rect x="265" y="128" width="30" height="12" fill="#e0e0e0" stroke="#757575" stroke-width="1.5" rx="2"/>
  <text x="280" y="137" text-anchor="middle" fill="#212121" font-family="monospace" font-size="8">1kΩ</text>
  <!-- Wire to midpoint -->
  <line x1="265" y1="134" x2="240" y2="134" stroke="#ef9a9a" stroke-width="2.5"/>
  <!-- Resistor R2 (2kΩ) to GND -->
  <rect x="234" y="134" width="12" height="30" fill="#e0e0e0" stroke="#757575" stroke-width="1.5" rx="2"/>
  <text x="255" y="153" fill="#212121" font-family="monospace" font-size="8">2kΩ</text>
  <line x1="240" y1="164" x2="240" y2="185" stroke="#424242" stroke-width="2"/>
  <text x="240" y="196" text-anchor="middle" fill="#424242" font-family="monospace" font-size="9">GND</text>
  <!-- Wire from midpoint to Pi RX -->
  <line x1="234" y1="134" x2="160" y2="134" stroke="#ef9a9a" stroke-width="2.5"/>
  <text x="205" y="129" text-anchor="middle" fill="#b71c1c" font-family="monospace" font-size="9">≈3.3V</text>

  <!-- Common GND wire -->
  <line x1="160" y1="160" x2="360" y2="160" stroke="#424242" stroke-width="2"/>
  <text x="260" y="156" text-anchor="middle" fill="#424242" font-family="monospace" font-size="9">common GND</text>

  <!-- Legend -->
  <text x="20" y="250" fill="#555" font-family="monospace" font-size="9">Green = Pi 3.3V logic  |  Blue = Arduino 5V logic  |  Divider: Vout = 5V × 2/(1+2) ≈ 3.33V</text>
</svg>`;

const L3_ARDUINO_SLAVE = `// Arduino I2C slave — address 0x08.
// Responds to a read request by sending the current analog reading (2 bytes).

#include <Wire.h>

const int SENSOR_PIN = A0;
const int I2C_ADDR   = 0x08;

void setup() {
  Wire.begin(I2C_ADDR);          // Join I2C bus as a slave
  Wire.onRequest(handleRequest); // Register callback
  Serial.begin(9600);
  Serial.println("I2C slave ready at 0x08");
}

void loop() {
  // Nothing here — the Wire ISR handles everything
  delay(10);
}

// Called when the Pi master requests data from this slave
void handleRequest() {
  int val = analogRead(SENSOR_PIN);  // 0–1023
  // Send two bytes: high byte first, then low byte
  Wire.write((val >> 8) & 0xFF);
  Wire.write(val & 0xFF);
}`;

const L3_PI_I2C = `#!/usr/bin/env python3
"""Raspberry Pi I2C master: read a 2-byte analog value from the Arduino slave."""

import smbus2   # pip install smbus2
import time

BUS_NUM  = 1        # /dev/i2c-1 on all modern Pi models
ADDR     = 0x08     # Must match Wire.begin() in the Arduino sketch

bus = smbus2.SMBus(BUS_NUM)
time.sleep(0.5)

print("Reading from I2C slave 0x08 ...")
for _ in range(10):
    # Request 2 bytes from slave address 0x08
    data = bus.read_i2c_block_data(ADDR, 0, 2)
    high, low = data[0], data[1]
    value = (high << 8) | low   # Reconstruct the 10-bit ADC value
    voltage = value * 3.3 / 1023
    print(f"ADC raw={value:4d}  voltage={voltage:.3f} V")
    time.sleep(0.5)

bus.close()`;

// ---------------------------------------------------------------------------
// Lesson 4 — Project: Pi dashboard + Arduino sensor node
// ---------------------------------------------------------------------------

const L4_ARDUINO_STREAM = `// Arduino sensor node: read A0 every 500 ms and stream over USB serial.

const int SENSOR_PIN = A0;

void setup() {
  Serial.begin(9600);
  Serial.println("sensor_node:ready");
}

void loop() {
  int raw = analogRead(SENSOR_PIN);         // 0–1023
  float voltage = raw * (5.0 / 1023.0);    // Convert to volts (5V reference)

  // Print as "value:<number>" so the Pi can parse it easily
  Serial.print("value:");
  Serial.println(raw);

  delay(500);   // Send two readings per second
}`;

const L4_PI_DASHBOARD = `#!/usr/bin/env python3
"""Raspberry Pi dashboard: read Arduino sensor values and print a running average."""

import serial
import time

PORT  = "/dev/ttyACM0"
BAUD  = 9600
WINDOW = 10   # How many readings to average

ser = serial.Serial(PORT, BAUD, timeout=2)
time.sleep(2)   # Wait for Arduino reset

readings: list[int] = []

print(f"{'Reading':>8}  {'Samples':>7}  {'Avg':>6}  {'Min':>6}  {'Max':>6}")
print("-" * 44)

try:
    while True:
        raw_line = ser.readline()
        if not raw_line:
            continue

        text = raw_line.decode("utf-8").strip()

        # Only process lines that match our protocol: "value:<int>"
        if not text.startswith("value:"):
            continue

        try:
            value = int(text.split(":")[1])
        except ValueError:
            continue

        readings.append(value)
        if len(readings) > WINDOW:
            readings.pop(0)   # Keep a rolling window

        avg = sum(readings) / len(readings)
        print(
            f"{value:>8d}  {len(readings):>7d}  {avg:>6.1f}"
            f"  {min(readings):>6d}  {max(readings):>6d}"
        )

except KeyboardInterrupt:
    print("\\nDone.")
    ser.close()`;

const L4_FLOWCHART = `flowchart TD
  A([Arduino powers on]) --> B[Read A0 every 500 ms]
  B --> C["Serial.println('value:NNN')"]
  C -->|USB cable| D[Pi reads serial line]
  D --> E{Starts with 'value:'?}
  E -- No --> D
  E -- Yes --> F[Parse integer]
  F --> G[Append to rolling window]
  G --> H[Print avg / min / max]
  H --> D`;

// SVG: full system overview — Pi + Arduino + sensor + USB cable
const L4_SVG_SYSTEM = `<svg viewBox="0 0 560 220" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="System overview: Arduino reads analog sensor and streams data to Raspberry Pi over USB">
  <!-- Background -->
  <rect width="560" height="220" fill="#f1f3f5" rx="10"/>

  <!-- Sensor block -->
  <rect x="20" y="70" width="100" height="80" fill="#fff3e0" stroke="#e65100" stroke-width="1.5" rx="6"/>
  <text x="70" y="94" text-anchor="middle" fill="#e65100" font-family="sans-serif" font-size="11" font-weight="bold">Analog</text>
  <text x="70" y="109" text-anchor="middle" fill="#e65100" font-family="sans-serif" font-size="11" font-weight="bold">Sensor</text>
  <text x="70" y="128" text-anchor="middle" fill="#bf360c" font-family="monospace" font-size="10">(pot / LDR)</text>
  <text x="70" y="143" text-anchor="middle" fill="#bf360c" font-family="monospace" font-size="10">→ pin A0</text>

  <!-- Wire: sensor → Arduino -->
  <line x1="120" y1="110" x2="160" y2="110" stroke="#e65100" stroke-width="2.5"/>
  <polygon points="157,106 165,110 157,114" fill="#e65100"/>

  <!-- Arduino block -->
  <rect x="160" y="50" width="130" height="120" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5" rx="6"/>
  <text x="225" y="74" text-anchor="middle" fill="#1565c0" font-family="sans-serif" font-size="12" font-weight="bold">Arduino Uno</text>
  <text x="225" y="93" text-anchor="middle" fill="#1565c0" font-family="monospace" font-size="10">analogRead(A0)</text>
  <text x="225" y="110" text-anchor="middle" fill="#1565c0" font-family="monospace" font-size="10">every 500 ms</text>
  <text x="225" y="129" text-anchor="middle" fill="#0d47a1" font-family="monospace" font-size="10">Serial.println(</text>
  <text x="225" y="143" text-anchor="middle" fill="#0d47a1" font-family="monospace" font-size="10">"value:NNN")</text>
  <text x="225" y="161" text-anchor="middle" fill="#0d47a1" font-family="monospace" font-size="10">@ 9600 baud</text>

  <!-- USB cable -->
  <rect x="296" y="95" width="70" height="30" fill="#eeeeee" stroke="#9e9e9e" stroke-width="1.5" rx="4"/>
  <text x="331" y="115" text-anchor="middle" fill="#424242" font-family="sans-serif" font-size="10">USB cable</text>
  <line x1="290" y1="110" x2="296" y2="110" stroke="#9e9e9e" stroke-width="2.5"/>
  <line x1="366" y1="110" x2="372" y2="110" stroke="#9e9e9e" stroke-width="2.5"/>
  <polygon points="363,106 371,110 363,114" fill="#9e9e9e"/>

  <!-- Pi block -->
  <rect x="372" y="50" width="160" height="120" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5" rx="6"/>
  <text x="452" y="74" text-anchor="middle" fill="#2e7d32" font-family="sans-serif" font-size="12" font-weight="bold">Raspberry Pi</text>
  <text x="452" y="93" text-anchor="middle" fill="#2e7d32" font-family="monospace" font-size="10">pyserial reads</text>
  <text x="452" y="110" text-anchor="middle" fill="#2e7d32" font-family="monospace" font-size="10">/dev/ttyACM0</text>
  <text x="452" y="129" text-anchor="middle" fill="#1b5e20" font-family="monospace" font-size="10">parse "value:NNN"</text>
  <text x="452" y="145" text-anchor="middle" fill="#1b5e20" font-family="monospace" font-size="10">rolling average</text>
  <text x="452" y="161" text-anchor="middle" fill="#1b5e20" font-family="monospace" font-size="10">print dashboard</text>

  <!-- Caption -->
  <text x="280" y="205" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="10">
    Arduino measures the analog world; the Pi handles the data and the display.
  </text>
</svg>`;

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------

export const roboPiArduino: CourseModule = {
  meta: {
    title: "Integrating Raspberry Pi with Arduino & ESP32",
    slug: "robo-pi-mcu",
    track: "robotics",
    level: "high",
    description:
      "Combine the Pi's brains with a microcontroller's real-time I/O — over USB serial and I2C.",
    coverImage: "/covers/robotics.svg",
    order: 34,
  },

  lessons: [
    // -------------------------------------------------------------------------
    // Lesson 1: Why combine a Pi and a microcontroller?
    // -------------------------------------------------------------------------
    {
      title: "Why combine a Pi and a microcontroller?",
      slug: "integ-why",
      estMinutes: 10,
      body: body(
        md(`## The right tool for each job

A **Raspberry Pi** is a full Linux computer. It has a multi-core CPU, hundreds of megabytes of RAM, a GPU, Wi-Fi, Bluetooth, USB ports, and can run Python, Node.js, OpenCV — anything you would normally run on a desktop. What it *cannot* do well is talk directly to the physical world with tight timing:

- Its GPIO pins are controlled by the operating system through a general-purpose kernel driver. A high-priority process, a garbage-collection pause, or a Wi-Fi interrupt can stall your code by *milliseconds* — long enough to miss a pulse-width measurement or jitter a servo.
- It has **no built-in analogue-to-digital converter (ADC)**. You cannot plug a potentiometer or a light sensor directly into a Pi GPIO pin and read a voltage — you get only digital HIGH or LOW.

A **microcontroller** (Arduino Uno, ESP32, …) is the opposite. It runs a bare-metal loop with no operating system, no scheduler, no surprises. It can measure a pulse to the *microsecond*, run a servo at exactly 50 Hz, and read ten analogue inputs simultaneously. What it *cannot* do is run heavy Python libraries, open a network socket, or display a web page.

The solution is simple: **use both**. Let the microcontroller own everything that touches the physical world — reading sensors, driving motors, generating precise PWM — and let the Pi own everything that requires compute, networking, or a user interface. A single USB cable (or a pair of wires) links them.

### Strengths at a glance

| Capability | Raspberry Pi | Arduino / ESP32 |
|---|---|---|
| Linux / Python / Node | ✅ | ❌ |
| Wi-Fi / Ethernet | ✅ | ESP32 only |
| Camera / OpenCV | ✅ | ❌ |
| Real-time timing (µs) | ❌ | ✅ |
| Analogue inputs (ADC) | ❌ | ✅ |
| PWM / motor drivers | limited | ✅ |
| Low power sleep | limited | ✅ |
| Cost | ~$35–$75 | ~$5–$20 |

### Architecture overview

The diagram below shows how the two boards work together. The Pi sends high-level commands ("move forward at 40%"); the MCU translates them into precise motor signals and sends sensor data back.`),
        mermaid(L1_ARCH_DIAGRAM, "Architecture: the Pi handles compute and networking; the MCU handles real-time I/O"),
        callout(
          "warning",
          "Voltage mismatch — golden rule: the Raspberry Pi's GPIO pins run at **3.3 V** logic. The Arduino Uno runs at **5 V**. Connecting the Uno's TX pin directly to the Pi's RX pin will eventually damage the Pi. Always add a voltage divider (two resistors) or a level-shifter module on the Uno→Pi signal line. The ESP32 runs at 3.3 V and is directly compatible with the Pi.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 2: Talking over USB serial
    // -------------------------------------------------------------------------
    {
      title: "Talking over USB serial",
      slug: "integ-usb-serial",
      estMinutes: 18,
      body: body(
        md(`## The simplest link: USB serial

The easiest way to connect an Arduino to a Raspberry Pi is with the same USB cable you already use to upload sketches. When you plug the Arduino into the Pi's USB port, it shows up as a *serial device* — typically \`/dev/ttyACM0\` on Linux (the Pi's OS). No extra wiring, no voltage-level worries; the USB chip on the Arduino board handles everything.

Under the hood this is an ordinary **UART serial** connection tunnelled over USB. Both sides agree on a **baud rate** (bits per second). The Arduino calls \`Serial.begin(9600)\`; the Pi opens the port at 9600 baud with Python's **pyserial** library.

You can:
- Send *commands* from the Pi to the Arduino (e.g., single characters like \`'1'\` to turn an LED on).
- Stream *data* from the Arduino to the Pi (e.g., sensor readings printed with \`Serial.println()\`).

This is exactly the same protocol the Arduino IDE's Serial Monitor uses — which means you can test the Arduino side first, with the Serial Monitor open, before writing any Pi code.

### Install pyserial on the Pi

\`\`\`bash
pip install pyserial
\`\`\`

### Arduino side

The sketch below listens for a command character (\`'1'\` or \`'0'\`) and also streams an analog reading from A0 every second.`),
        code("arduino", L2_ARDUINO_SERIAL, { filename: "serial_demo.ino", openInStudio: true }),
        md(`### Raspberry Pi side

The Python script opens the serial port, sends one command, and then reads and prints everything the Arduino sends for five seconds.`),
        code("python", L2_PI_SERIAL, { filename: "serial_demo.py", openInStudio: true }),
        md(`### How the exchange looks`),
        mermaid(L2_SEQ, "Sequence diagram: the Pi sends a command character; the Arduino responds and streams data"),
        callout(
          "tip",
          "Finding the right port: run `ls /dev/tty*` in a Pi terminal *before* plugging in the Arduino, then again *after*. The new entry is your port. Common values are `/dev/ttyACM0`, `/dev/ttyACM1`, or `/dev/ttyUSB0`. Also make sure the baud rate in `Serial.begin()` and `serial.Serial()` match exactly — a mismatch produces garbled characters or silence.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 3: UART pins & I2C
    // -------------------------------------------------------------------------
    {
      title: "UART pins & I2C",
      slug: "integ-uart-i2c",
      estMinutes: 22,
      body: body(
        md(`## Two more ways to connect

USB serial is convenient, but sometimes you want a direct wire-to-wire connection — no USB hub, no ACM driver — or you want to talk to *multiple* devices on the same two wires. The Pi supports both options natively on its 40-pin GPIO header.

---

### (a) Direct UART on GPIO pins

The Pi exposes a hardware UART on:
- **GPIO 14** — TX (data *from* the Pi)
- **GPIO 15** — RX (data *into* the Pi)

On the Arduino Uno these map to pins **0 (RX)** and **1 (TX)**. The wires cross: Pi TX → Uno RX, and Uno TX → Pi RX.

**Voltage warning (again):** Pi GPIO = 3.3 V. Uno digital output = 5 V. The Pi TX → Uno RX direction is fine — the Uno treats 3.3 V as a valid HIGH. The Uno TX → Pi RX direction *is dangerous*: 5 V will damage the Pi. You must add a resistor voltage divider on that one wire. The wiring diagram below shows exactly how.

On an **ESP32** this problem disappears — it also runs at 3.3 V — so you can connect the wires directly.

To enable the UART on the Pi run:

\`\`\`bash
sudo raspi-config   # Interface Options → Serial Port → disable login shell, enable hardware
\`\`\`

The device will appear as \`/dev/serial0\`.`),
        svg(L3_SVG_WIRING, "UART wiring: Pi GPIO14/15 ↔ Arduino Uno RX/TX with a 1 kΩ / 2 kΩ voltage divider on the Uno TX→Pi RX line"),
        md(`---

### (b) I2C — one bus, many devices

**I2C** (Inter-Integrated Circuit) uses just two signal wires:
- **SDA** — data (Pi GPIO 2, Arduino A4)
- **SCL** — clock (Pi GPIO 3, Arduino A5)

The Pi acts as the **master** (it initiates every transaction). Each slave device has a 7-bit **address** (0x00–0x7F) so you can connect many slaves to the same two wires. Both lines need **pull-up resistors** (typically 4.7 kΩ to 3.3 V) — the Pi's built-in pull-ups are often sufficient for short cables.

The Arduino sketch below uses the \`Wire\` library to register as a slave at address \`0x08\` and sends back the current A0 reading when the Pi requests it.`),
        code("arduino", L3_ARDUINO_SLAVE, { filename: "i2c_slave.ino", openInStudio: true }),
        md(`The Pi script uses the **smbus2** library (a clean Python wrapper around the Linux I2C kernel driver).

\`\`\`bash
pip install smbus2
\`\`\``),
        code("python", L3_PI_I2C, { filename: "i2c_master.py", openInStudio: true }),
        callout(
          "info",
          "Serial vs I2C — how to choose: USB serial is the easiest starting point and works out of the box. Choose direct UART GPIO when you need to save a USB port or want a permanent wired link. Choose I2C when you need to connect multiple slave devices (sensors, displays, real-time clocks) on the same two wires — one Pi can talk to dozens of I2C slaves simultaneously by addressing each one individually.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 4: Project — Pi dashboard + Arduino sensor node
    // -------------------------------------------------------------------------
    {
      title: "Project: Pi dashboard + Arduino sensor node",
      slug: "integ-project",
      estMinutes: 30,
      body: body(
        md(`## Build it: a real-time sensor dashboard

In this project you will assemble everything from the previous lessons into a working system:

1. The **Arduino** reads an analogue sensor (connect a potentiometer to A0, or any sensor you have — an LDR, a temperature sensor, a joystick axis) and streams the raw 0–1023 value over USB serial at 9600 baud, twice per second.
2. The **Raspberry Pi** reads those values with pyserial, maintains a rolling window of the last 10 readings, and prints a live table showing the current value, sample count, running average, minimum, and maximum.

This is the foundation of any data-logging system, a robot's sensor monitor, or a science experiment dashboard. Once you can print the numbers, adding a web server (Flask / FastAPI) or writing to a CSV is just a few more lines.

### Hardware needed

| Item | Quantity |
|---|---|
| Arduino Uno (or compatible) | 1 |
| Raspberry Pi (any model with USB) | 1 |
| USB A→B cable | 1 |
| Potentiometer 10 kΩ (or any analogue sensor) | 1 |
| Breadboard + jumper wires | as needed |

Connect the potentiometer: one outer leg to 5 V, the other outer leg to GND, the wiper (middle) to A0.

### Arduino — sensor node`),
        code("arduino", L4_ARDUINO_STREAM, { filename: "sensor_node.ino", openInStudio: true }),
        md(`### Raspberry Pi — dashboard`),
        code("python", L4_PI_DASHBOARD, { filename: "dashboard.py", openInStudio: true }),
        md(`### Data flow`),
        mermaid(L4_FLOWCHART, "Flowchart: Arduino reads A0 and streams; the Pi parses and shows a running average"),
        svg(L4_SVG_SYSTEM, "System overview: sensor → Arduino → USB → Raspberry Pi running average dashboard"),
        callout(
          "tip",
          "Next steps: (1) Log to a file — open a CSV with Python's built-in `csv` module and write each row. (2) Show on a web page — serve a Flask endpoint that returns the latest average as JSON; add a tiny JavaScript chart with Chart.js on the frontend. (3) Add alerts — send a Telegram message or sound a buzzer when the value crosses a threshold. Each of these is less than 20 extra lines of Python.",
        ),
      ),
    },
  ],

  tasks: [
    {
      title: "Challenge: Running average",
      slug: "challenge-integ",
      description:
        "Given the readings 10, 20, 30, print their average (20).",
      track: "robotics",
      difficulty: "beginner",
      points: 50,
      language: "python",
      starterCode: [
        "# Compute and print the average of these readings",
        "readings = [10, 20, 30]",
        "average = 0  # fix me",
        "print(average)",
      ].join("\n"),
      checks: {
        rules: [{ type: "stdout_contains", value: "20" }],
      },
    },
  ],
};
