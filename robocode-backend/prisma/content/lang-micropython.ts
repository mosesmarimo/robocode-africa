import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";
import { SVG_ARDUINO_BOARD } from "./_assets";

// ---------------------------------------------------------------------------
// MicroPython-specific SVG: ESP32 / Pico board overview
// ---------------------------------------------------------------------------

const SVG_MICROPYTHON_BOARD = `<svg viewBox="0 0 600 260" role="img" aria-label="Raspberry Pi Pico board with labelled GPIO pins and MicroPython logo" xmlns="http://www.w3.org/2000/svg">
  <!-- Board body -->
  <rect x="30" y="40" width="340" height="180" rx="10" ry="10" fill="#2d7d32" stroke="#1b5e20" stroke-width="2"/>
  <!-- Board label -->
  <text x="70" y="68" font-family="monospace" font-size="13" fill="#ffffff" font-weight="bold">Raspberry Pi Pico</text>
  <!-- USB connector -->
  <rect x="30" y="108" width="26" height="44" rx="4" fill="#c0c0c0" stroke="#888" stroke-width="1.5"/>
  <text x="22" y="166" font-family="monospace" font-size="9" fill="#ffffff">USB</text>
  <!-- RP2040 chip -->
  <rect x="160" y="110" width="80" height="60" rx="6" fill="#1a1a1a" stroke="#374151" stroke-width="1.5"/>
  <text x="167" y="134" font-family="monospace" font-size="9" fill="#9ca3af">RP2040</text>
  <text x="170" y="148" font-family="monospace" font-size="8" fill="#6b7280">133 MHz</text>
  <text x="167" y="162" font-family="monospace" font-size="8" fill="#6b7280">Dual-core</text>
  <!-- GPIO pins top -->
  <rect x="70" y="40" width="260" height="10" rx="2" fill="#1a1a1a"/>
  <text x="70" y="32" font-family="monospace" font-size="10" fill="#e5e7eb">GPIO (GP0 – GP15)</text>
  <circle cx="85"  cy="45" r="4" fill="#eab308"/>
  <circle cx="105" cy="45" r="4" fill="#eab308"/>
  <circle cx="125" cy="45" r="4" fill="#eab308"/>
  <circle cx="145" cy="45" r="4" fill="#eab308"/>
  <circle cx="165" cy="45" r="4" fill="#2563ff"/>
  <circle cx="185" cy="45" r="4" fill="#2563ff"/>
  <circle cx="205" cy="45" r="4" fill="#2563ff"/>
  <circle cx="225" cy="45" r="4" fill="#ef4444"/>
  <circle cx="245" cy="45" r="4" fill="#ef4444"/>
  <circle cx="265" cy="45" r="4" fill="#16a34a"/>
  <!-- GP25 LED label -->
  <line x1="265" y1="50" x2="265" y2="80" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="250" y="92" font-family="monospace" font-size="10" fill="#16a34a">GP25 (LED)</text>
  <!-- GPIO pins bottom -->
  <rect x="70" y="210" width="220" height="10" rx="2" fill="#1a1a1a"/>
  <text x="70" y="236" font-family="monospace" font-size="10" fill="#e5e7eb">GP16 – GP28 + ADC</text>
  <circle cx="85"  cy="215" r="4" fill="#a855f7"/>
  <circle cx="105" cy="215" r="4" fill="#a855f7"/>
  <circle cx="125" cy="215" r="4" fill="#a855f7"/>
  <circle cx="145" cy="215" r="4" fill="#a855f7"/>
  <circle cx="165" cy="215" r="4" fill="#f97316"/>
  <circle cx="185" cy="215" r="4" fill="#f97316"/>
  <circle cx="205" cy="215" r="4" fill="#f97316"/>
  <!-- Power pins -->
  <rect x="300" y="210" width="80" height="10" rx="2" fill="#1a1a1a"/>
  <circle cx="310" cy="215" r="4" fill="#ef4444"/>
  <text x="298" y="202" font-family="monospace" font-size="9" fill="#ef4444">3.3V</text>
  <circle cx="330" cy="215" r="4" fill="#1f2937"/>
  <text x="320" y="202" font-family="monospace" font-size="9" fill="#9ca3af">GND</text>
  <!-- On-board LED circle -->
  <circle cx="430" cy="90" r="10" fill="#16a34a" stroke="#15803d" stroke-width="1.5"/>
  <text x="445" y="86" font-family="monospace" font-size="10" fill="#16a34a">Built-in</text>
  <text x="445" y="100" font-family="monospace" font-size="10" fill="#16a34a">LED (GP25)</text>
  <!-- MicroPython logo area -->
  <rect x="400" y="130" width="140" height="70" rx="8" fill="#1a1a1a" stroke="#374151" stroke-width="1.5"/>
  <text x="415" y="155" font-family="monospace" font-size="11" fill="#ffd343" font-weight="bold">MicroPython</text>
  <text x="420" y="172" font-family="monospace" font-size="10" fill="#6b7280">Python on a chip</text>
  <text x="420" y="188" font-family="monospace" font-size="9" fill="#4b5563">≈ 256 KB RAM</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, MicroPython
// ---------------------------------------------------------------------------

const HELLO_WORLD = `from machine import Pin
import time

# GP25 is the built-in LED on the Raspberry Pi Pico
led = Pin(2, Pin.OUT)   # use Pin(25) on Pico, Pin(2) on ESP32

# Print our greeting to the REPL (serial console)
print("Hello, RoboCode!")
print("MicroPython is running!")

# Blink forever
while True:
    led.value(1)        # LED on
    time.sleep(0.5)     # wait half a second
    led.value(0)        # LED off
    time.sleep(0.5)`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Pins
// ---------------------------------------------------------------------------

const VARIABLES_PINS_CODE = `from machine import Pin, ADC
import time

# --- Pin objects ---
led      = Pin(2, Pin.OUT)      # output: drives the LED
button   = Pin(15, Pin.IN, Pin.PULL_UP)  # input with pull-up resistor
adc      = ADC(Pin(26))         # analogue input (Pico: GP26 = ADC0)

# --- Python variables with clear types ---
blink_count: int   = 0
threshold:   int   = 35000      # raw ADC value (~1.6 V on 3.3 V rail)
led_on:      bool  = False

print("Starting sensor read loop...")
print(f"ADC threshold: {threshold}")

for i in range(10):
    # Read the analogue sensor (0 – 65535)
    raw: int = adc.read_u16()

    # Toggle LED if sensor reading exceeds threshold
    if raw > threshold:
        led_on = not led_on
        led.value(1 if led_on else 0)

    blink_count += 1
    print(f"Reading {blink_count:2d}: raw ADC = {raw:5d}  LED = {led_on}")
    time.sleep(0.3)

print("Done.")`;

// ---------------------------------------------------------------------------
// Lesson 3 — Conditionals & Loops
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `from machine import Pin
import time

led     = Pin(2, Pin.OUT)
button  = Pin(15, Pin.IN, Pin.PULL_UP)

DOT_MS  = 150   # short flash (milliseconds)
DASH_MS = 450   # long flash
GAP_MS  = 100   # gap between flashes
PAUSE_MS = 800  # gap between letters

def flash(duration_ms):
    """Flash the LED for duration_ms milliseconds."""
    led.value(1)
    time.sleep_ms(duration_ms)
    led.value(0)
    time.sleep_ms(GAP_MS)

def morse_letter(pattern):
    """Blink a Morse letter. Pattern is a string of dots '.' and dashes '-'."""
    for symbol in pattern:
        if symbol == '.':
            flash(DOT_MS)
        elif symbol == '-':
            flash(DASH_MS)
    time.sleep_ms(PAUSE_MS)

print("SOS blinker starting — press Ctrl+C to stop")

try:
    while True:
        # S = ...   O = ---   S = ...
        for letter in ['...', '---', '...']:
            morse_letter(letter)
        time.sleep_ms(2000)   # pause between full SOS sequences
except KeyboardInterrupt:
    led.value(0)
    print("Stopped.")`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `from machine import Pin, ADC
import time

# ---- Hardware setup ----
led       = Pin(2, Pin.OUT)
green_led = Pin(3, Pin.OUT)   # "all clear" indicator
adc       = ADC(Pin(26))      # temperature sensor or potentiometer on ADC0

# ---- Thresholds ----
WARN_LEVEL  = 45000           # raw ADC value ~ mid-range
ALERT_LEVEL = 55000           # raw ADC value ~ high

def read_percent(adc_pin):
    """Convert raw 16-bit ADC reading to a percentage 0–100."""
    raw = adc_pin.read_u16()
    return raw * 100 // 65535, raw

def blink_led(pin, times, on_ms=80, off_ms=80):
    """Blink a pin a given number of times."""
    for _ in range(times):
        pin.value(1)
        time.sleep_ms(on_ms)
        pin.value(0)
        time.sleep_ms(off_ms)

print("=== RoboCode Environment Monitor ===")
print("Sensor  | Level  | Status")
print("--------|--------|--------")

for reading_num in range(15):
    pct, raw = read_percent(adc)

    if raw > ALERT_LEVEL:
        status = "ALERT!"
        blink_led(led, 3, on_ms=60, off_ms=60)
        green_led.value(0)
    elif raw > WARN_LEVEL:
        status = "WARNING"
        blink_led(led, 1, on_ms=200)
        green_led.value(0)
    else:
        status = "OK     "
        led.value(0)
        green_led.value(1)

    print(f"  {reading_num + 1:2d}    |  {pct:3d}%  | {status}")
    time.sleep_ms(500)

# Turn off all LEDs at the end
led.value(0)
green_led.value(0)
print("\\nMonitoring complete.")`;

export const langMicropython: CourseModule = {
  meta: {
    title: "MicroPython Basics",
    slug: "lang-micropython",
    track: "robotics",
    level: "high",
    description: "Run real Python on a microcontroller — blink LEDs, read sensors, and build an environment monitor using MicroPython on the Raspberry Pi Pico or ESP32.",
    coverImage: "/covers/robotics.svg",
    order: 21,
  },
  lessons: [
    {
      title: "Hello, MicroPython",
      slug: "hello-micropython",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is MicroPython?

**MicroPython** is a lean version of Python 3 designed to run on microcontrollers — tiny computers with very limited memory (sometimes as little as 256 KB of RAM). It lets you write real Python code that talks directly to hardware: LEDs, motors, sensors, displays, and more.

The two most popular boards for MicroPython are:
- **Raspberry Pi Pico** — uses the RP2040 chip, runs at 133 MHz, costs about $4.
- **ESP32** — has built-in Wi-Fi and Bluetooth, great for connected projects.

MicroPython feels almost identical to regular Python. The main difference is the \`machine\` module, which gives you direct control over the board's pins.

### Board overview`),
        svg(SVG_MICROPYTHON_BOARD, "Raspberry Pi Pico with labelled GPIO pins and MicroPython"),
        md(`### Your first MicroPython program

The code below:
1. Imports \`Pin\` from the \`machine\` module and \`time\` for delays.
2. Creates a \`Pin\` object configured as an output.
3. Prints a greeting to the serial console (REPL).
4. Blinks the LED forever in a \`while True\` loop.

Open it in RoboCode Studio and watch the LED blink!`),
        code("micropython", HELLO_WORLD, { filename: "main.py", openInStudio: true }),
        callout("tip", "On the Raspberry Pi Pico the built-in LED is on GP25. On an ESP32 it is usually on pin 2. If your LED does not blink, try changing Pin(2) to Pin(25) in the first line — RoboCode Studio will pick the right one for your virtual board automatically."),
      ),
    },
    {
      title: "Variables & Pins",
      slug: "micropython-variables-pins",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Variables and hardware pins in MicroPython

### Creating Pin objects

In MicroPython, every physical pin on the board is represented by a \`Pin\` object. You create one by specifying the pin number and its direction:

\`\`\`python
from machine import Pin

led    = Pin(2, Pin.OUT)   # output: we will drive this pin
button = Pin(15, Pin.IN, Pin.PULL_UP)  # input with pull-up resistor
\`\`\`

\`Pin.PULL_UP\` connects an internal resistor to 3.3 V, so the pin reads \`1\` (HIGH) by default and \`0\` (LOW) when a button pulls it to GND. This means you do not need an external resistor for a button.

### Analogue inputs

Digital pins are either on or off. **Analogue pins** can read a range of voltages (0 – 3.3 V), which the ADC (Analogue-to-Digital Converter) converts to a number from 0 to 65535:

\`\`\`python
from machine import ADC, Pin
adc = ADC(Pin(26))
raw = adc.read_u16()   # 0 (0 V) to 65535 (3.3 V)
\`\`\`

### Common MicroPython types

| Type | Example | Notes |
|------|---------|-------|
| \`int\` | \`count = 0\` | Same as regular Python |
| \`float\` | \`voltage = 3.14\` | Decimal numbers |
| \`bool\` | \`led_on = False\` | \`True\` / \`False\` |
| \`str\` | \`name = "Pico"\` | Text |

You can add type hints (like \`raw: int = 0\`) to make your code clearer — MicroPython accepts them but does not enforce them.

Run the example below to see pins, variables, and ADC readings all working together.`),
        code("micropython", VARIABLES_PINS_CODE, { filename: "sensor_read.py", openInStudio: true }),
        callout("info", "read_u16() returns a 16-bit unsigned integer — a number from 0 to 65535 (2¹⁶ − 1). To convert it to a voltage, multiply by 3.3 / 65535. For example, a reading of 32768 is about 1.65 V, right in the middle of the range."),
      ),
    },
    {
      title: "Conditionals & Loops",
      slug: "micropython-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Conditionals and loops — Morse code blinker

MicroPython uses exactly the same Python syntax for control flow: \`if/elif/else\`, \`for\`, and \`while\`. Two useful MicroPython-specific additions are:

- **\`time.sleep_ms(n)\`** — sleeps for *n* milliseconds (more precise than \`time.sleep()\` for short delays).
- **\`try / except KeyboardInterrupt\`** — catches Ctrl+C so you can cleanly stop an infinite loop and turn off the LEDs.

### Functions in MicroPython

Functions work exactly as in Python. Defining helper functions keeps your code readable and avoids repetition:

\`\`\`python
def flash(duration_ms):
    led.value(1)
    time.sleep_ms(duration_ms)
    led.value(0)
    time.sleep_ms(GAP_MS)
\`\`\`

### Flowchart: SOS Morse loop`),
        mermaid(
          `flowchart TD
  A([while True]) --> B[morse_letter '...'\nS = 3 dots]
  B --> C[morse_letter '---'\nO = 3 dashes]
  C --> D[morse_letter '...'\nS = 3 dots]
  D --> E[sleep 2 s]
  E --> A
  A -- Ctrl+C --> F[KeyboardInterrupt]
  F --> G[led off]
  G --> H([Stop])`,
          "SOS Morse blinker: loops forever until Ctrl+C",
        ),
        md(`The sketch iterates over the string \`'...'\` with a \`for symbol in pattern\` loop — each character is a single dot or dash. This is a great example of how Python treats strings as sequences you can loop over.`),
        code("micropython", CONTROL_FLOW_CODE, { filename: "sos_morse.py", openInStudio: true }),
        callout("tip", "When your MicroPython program is saved as main.py on the board, it runs automatically every time the board powers on — no computer needed. That is what makes MicroPython perfect for standalone sensor projects and wearables."),
      ),
    },
    {
      title: "Put It Together",
      slug: "micropython-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build an environment monitor

Let's combine everything — Pin objects, ADC readings, variables, conditionals, loops, and functions — into a real-world project: an environment monitor with three alert levels.

### How it works

1. An analogue sensor (potentiometer or temperature sensor) is connected to ADC pin GP26.
2. Every 500 ms the program reads the sensor and converts the raw ADC value to a percentage.
3. Based on the percentage, the program sets one of three states:

| Raw ADC value | Status | LED behaviour |
|---------------|--------|--------------|
| ≤ 45 000 | OK | Green LED stays on |
| 45 001 – 55 000 | WARNING | Red LED blinks once |
| > 55 000 | ALERT | Red LED blinks 3× fast |

4. All readings are printed as a formatted table to the serial console.

### New ideas

- **\`//\` integer division** — \`raw * 100 // 65535\` gives a percentage without needing \`int()\`.
- **f-string format codes** — \`:3d\` pads an integer to 3 characters wide; \`:2d\` pads to 2 characters. This keeps the printed table neatly aligned.
- **Helper functions** — \`read_percent()\` and \`blink_led()\` each do one job, making the main loop short and easy to read.

Twist the potentiometer (or adjust the simulated sensor in RoboCode Studio) and watch the status change in real time.`),
        code("micropython", PUT_TOGETHER_CODE, { filename: "env_monitor.py", openInStudio: true }),
        callout("tip", "This pattern — read sensor, compare to thresholds, act on result — is at the heart of almost every IoT device and robot controller. The same logic runs in air-quality monitors, smart thermostats, and industrial safety systems. You now know how to build one from scratch!"),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Seven times table",
      slug: "challenge-micropython",
      description: "Print the 7 times table up to 7 × 5, i.e. 7, 14, 21, 28 and 35 (one per line).",
      track: "robotics", difficulty: "beginner", points: 50, language: "micropython",
      starterCode: "# Print 7, 14, 21, 28, 35 (the 7 times table up to 7x5)\nfor i in range(1, 6):\n    print(0)  # print 7 * i instead\n",
      checks: { rules: [{ type: "stdout_contains", value: "35" }, { type: "stdout_contains", value: "28" }] },
    },
  ],
};
