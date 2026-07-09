import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Meet the Raspberry Pi
// ---------------------------------------------------------------------------

const SVG_PI_BOARD = `<svg viewBox="0 0 640 380" role="img" aria-label="Raspberry Pi 4 board with labelled ports: USB, HDMI, Ethernet, microSD, 40-pin GPIO header, and USB-C power" xmlns="http://www.w3.org/2000/svg">
  <!-- Board body -->
  <rect x="60" y="40" width="520" height="300" rx="14" fill="#1a7c3e" stroke="#155a2c" stroke-width="3"/>
  <!-- PCB texture lines -->
  <line x1="70" y1="80" x2="570" y2="80" stroke="#1d8f47" stroke-width="0.5" opacity="0.5"/>
  <line x1="70" y1="180" x2="570" y2="180" stroke="#1d8f47" stroke-width="0.5" opacity="0.5"/>
  <line x1="70" y1="280" x2="570" y2="280" stroke="#1d8f47" stroke-width="0.5" opacity="0.5"/>
  <!-- SoC chip (Broadcom) -->
  <rect x="240" y="130" width="100" height="100" rx="4" fill="#1a1a2e" stroke="#aaaaaa" stroke-width="1.5"/>
  <text x="290" y="178" font-family="monospace" font-size="11" fill="#aaaaaa" text-anchor="middle">Broadcom</text>
  <text x="290" y="194" font-family="monospace" font-size="11" fill="#aaaaaa" text-anchor="middle">BCM2711</text>
  <!-- 40-pin GPIO header (top edge) -->
  <rect x="90" y="42" width="200" height="22" rx="3" fill="#2d2d2d" stroke="#888" stroke-width="1.5"/>
  <text x="190" y="57" font-family="sans-serif" font-size="10" fill="#f0f0f0" text-anchor="middle">40-pin GPIO Header</text>
  <!-- Draw individual pins (2 rows of 20) -->
  <g fill="#d4af37">
    <!-- Row 1 -->
    <rect x="95" y="43" width="6" height="10" rx="1"/><rect x="105" y="43" width="6" height="10" rx="1"/>
    <rect x="115" y="43" width="6" height="10" rx="1"/><rect x="125" y="43" width="6" height="10" rx="1"/>
    <rect x="135" y="43" width="6" height="10" rx="1"/><rect x="145" y="43" width="6" height="10" rx="1"/>
    <rect x="155" y="43" width="6" height="10" rx="1"/><rect x="165" y="43" width="6" height="10" rx="1"/>
    <rect x="175" y="43" width="6" height="10" rx="1"/><rect x="185" y="43" width="6" height="10" rx="1"/>
    <rect x="195" y="43" width="6" height="10" rx="1"/><rect x="205" y="43" width="6" height="10" rx="1"/>
    <rect x="215" y="43" width="6" height="10" rx="1"/><rect x="225" y="43" width="6" height="10" rx="1"/>
    <rect x="235" y="43" width="6" height="10" rx="1"/><rect x="245" y="43" width="6" height="10" rx="1"/>
    <rect x="255" y="43" width="6" height="10" rx="1"/><rect x="265" y="43" width="6" height="10" rx="1"/>
    <rect x="275" y="43" width="6" height="10" rx="1"/>
    <!-- Row 2 -->
    <rect x="95" y="53" width="6" height="10" rx="1"/><rect x="105" y="53" width="6" height="10" rx="1"/>
    <rect x="115" y="53" width="6" height="10" rx="1"/><rect x="125" y="53" width="6" height="10" rx="1"/>
    <rect x="135" y="53" width="6" height="10" rx="1"/><rect x="145" y="53" width="6" height="10" rx="1"/>
    <rect x="155" y="53" width="6" height="10" rx="1"/><rect x="165" y="53" width="6" height="10" rx="1"/>
    <rect x="175" y="53" width="6" height="10" rx="1"/><rect x="185" y="53" width="6" height="10" rx="1"/>
    <rect x="195" y="53" width="6" height="10" rx="1"/><rect x="205" y="53" width="6" height="10" rx="1"/>
    <rect x="215" y="53" width="6" height="10" rx="1"/><rect x="225" y="53" width="6" height="10" rx="1"/>
    <rect x="235" y="53" width="6" height="10" rx="1"/><rect x="245" y="53" width="6" height="10" rx="1"/>
    <rect x="255" y="53" width="6" height="10" rx="1"/><rect x="265" y="53" width="6" height="10" rx="1"/>
    <rect x="275" y="53" width="6" height="10" rx="1"/>
  </g>
  <!-- USB-C Power (left edge) -->
  <rect x="42" y="60" width="22" height="32" rx="3" fill="#3b3b3b" stroke="#777" stroke-width="1.5"/>
  <text x="53" y="50" font-family="sans-serif" font-size="9" fill="#f0f0f0" text-anchor="middle">USB-C</text>
  <text x="53" y="104" font-family="sans-serif" font-size="9" fill="#facc15" text-anchor="middle">Power</text>
  <!-- Micro HDMI x2 (left edge) -->
  <rect x="42" y="104" width="18" height="22" rx="2" fill="#1a1a2e" stroke="#888" stroke-width="1.5"/>
  <rect x="42" y="132" width="18" height="22" rx="2" fill="#1a1a2e" stroke="#888" stroke-width="1.5"/>
  <text x="35" y="100" font-family="sans-serif" font-size="8" fill="#f0f0f0">HDMI0</text>
  <text x="35" y="160" font-family="sans-serif" font-size="8" fill="#f0f0f0">HDMI1</text>
  <!-- 3.5mm audio (left edge) -->
  <circle cx="51" cy="175" r="9" fill="#111" stroke="#888" stroke-width="1.5"/>
  <text x="35" y="193" font-family="sans-serif" font-size="8" fill="#f0f0f0">Audio</text>
  <!-- USB 3.0 ports (right edge) -->
  <rect x="576" y="60" width="22" height="52" rx="3" fill="#1a53a0" stroke="#3b82f6" stroke-width="1.5"/>
  <rect x="576" y="120" width="22" height="52" rx="3" fill="#3b3b3b" stroke="#777" stroke-width="1.5"/>
  <text x="608" y="84" font-family="sans-serif" font-size="8" fill="#93c5fd">USB 3.0</text>
  <text x="608" y="98" font-family="sans-serif" font-size="8" fill="#93c5fd">(x2)</text>
  <text x="608" y="144" font-family="sans-serif" font-size="8" fill="#d1d5db">USB 2.0</text>
  <text x="608" y="158" font-family="sans-serif" font-size="8" fill="#d1d5db">(x2)</text>
  <!-- Ethernet (right edge) -->
  <rect x="576" y="192" width="22" height="40" rx="3" fill="#d97706" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="610" y="212" font-family="sans-serif" font-size="8" fill="#fde68a">Ethernet</text>
  <text x="610" y="224" font-family="sans-serif" font-size="8" fill="#fde68a">Gigabit</text>
  <!-- microSD slot (bottom edge) -->
  <rect x="240" y="337" width="60" height="8" rx="2" fill="#888" stroke="#555" stroke-width="1"/>
  <text x="270" y="360" font-family="sans-serif" font-size="9" fill="#d1d5db" text-anchor="middle">microSD</text>
  <!-- RAM chip -->
  <rect x="370" y="160" width="75" height="60" rx="3" fill="#111" stroke="#aaa" stroke-width="1"/>
  <text x="408" y="188" font-family="monospace" font-size="10" fill="#e5e7eb" text-anchor="middle">LPDDR4X</text>
  <text x="408" y="202" font-family="monospace" font-size="10" fill="#e5e7eb" text-anchor="middle">4 GB RAM</text>
  <!-- Label title -->
  <text x="320" y="25" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Raspberry Pi 4 Model B</text>
</svg>`;

const SVG_PI_STACK = `<svg viewBox="0 0 500 240" role="img" aria-label="Software stack: Linux OS at the base, Python in the middle, GPIO library above Python, and hardware devices at the top" xmlns="http://www.w3.org/2000/svg">
  <!-- Hardware layer -->
  <rect x="60" y="20" width="380" height="44" rx="8" fill="#065f46" stroke="#34d399" stroke-width="2"/>
  <text x="250" y="39" font-family="sans-serif" font-size="13" fill="#d1fae5" text-anchor="middle" font-weight="bold">Hardware</text>
  <text x="250" y="56" font-family="sans-serif" font-size="11" fill="#6ee7b7" text-anchor="middle">LEDs · Buttons · Motors · Sensors</text>
  <!-- GPIO library layer -->
  <rect x="60" y="82" width="380" height="44" rx="8" fill="#1e3a5f" stroke="#60a5fa" stroke-width="2"/>
  <text x="250" y="101" font-family="sans-serif" font-size="13" fill="#bfdbfe" text-anchor="middle" font-weight="bold">GPIO Library</text>
  <text x="250" y="118" font-family="sans-serif" font-size="11" fill="#93c5fd" text-anchor="middle">gpiozero · RPi.GPIO · pigpio</text>
  <!-- Python layer -->
  <rect x="60" y="144" width="380" height="44" rx="8" fill="#3776ab" stroke="#ffd343" stroke-width="2"/>
  <text x="250" y="163" font-family="sans-serif" font-size="13" fill="#ffd343" text-anchor="middle" font-weight="bold">Python</text>
  <text x="250" y="180" font-family="sans-serif" font-size="11" fill="#fffbeb" text-anchor="middle">Your script · Standard library · pip packages</text>
  <!-- Linux OS layer -->
  <rect x="60" y="206" width="380" height="28" rx="8" fill="#374151" stroke="#9ca3af" stroke-width="2"/>
  <text x="250" y="225" font-family="sans-serif" font-size="12" fill="#f9fafb" text-anchor="middle">Linux OS (Raspberry Pi OS / Debian)</text>
  <!-- Arrows -->
  <path d="M250 66 L250 82" stroke="#a3e635" stroke-width="2" marker-end="url(#arr)"/>
  <path d="M250 126 L250 144" stroke="#a3e635" stroke-width="2" marker-end="url(#arr)"/>
  <path d="M250 188 L250 206" stroke="#a3e635" stroke-width="2" marker-end="url(#arr)"/>
  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <path d="M0,0 L0,8 L8,4 Z" fill="#a3e635"/>
    </marker>
  </defs>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Blink an LED with gpiozero
// ---------------------------------------------------------------------------

const BLINK_PY = `from gpiozero import LED
from time import sleep

# BCM pin 17 → physical pin 11 on the 40-pin header
led = LED(17)

print("Blinking — Ctrl+C to stop")

while True:
    led.on()          # set GPIO 17 HIGH (3.3 V)
    sleep(0.5)        # wait half a second
    led.off()         # set GPIO 17 LOW (0 V)
    sleep(0.5)`;

const BLINK_PY_RPIGPIO = `import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)      # use BCM numbering
GPIO.setup(17, GPIO.OUT)    # pin 17 is an output

try:
    while True:
        GPIO.output(17, GPIO.HIGH)   # LED on
        time.sleep(0.5)
        GPIO.output(17, GPIO.LOW)    # LED off
        time.sleep(0.5)
finally:
    GPIO.cleanup()           # always reset pins on exit`;

const SVG_LED_WIRING = `<svg viewBox="0 0 520 280" role="img" aria-label="Wiring diagram: Raspberry Pi GPIO 17 (pin 11) connected through a 330 ohm resistor to LED anode, LED cathode to GND (pin 6)" xmlns="http://www.w3.org/2000/svg">
  <!-- Pi header block -->
  <rect x="20" y="60" width="100" height="180" rx="6" fill="#1a7c3e" stroke="#155a2c" stroke-width="2"/>
  <text x="70" y="52" font-family="sans-serif" font-size="10" fill="#d1fae5" text-anchor="middle">40-pin header</text>
  <!-- Pin labels (subset) -->
  <rect x="110" y="80" width="8" height="8" rx="1" fill="#d4af37"/>
  <text x="100" y="88" font-family="monospace" font-size="9" fill="#f0f0f0" text-anchor="end">3.3V (1)</text>
  <rect x="110" y="96" width="8" height="8" rx="1" fill="#d4af37"/>
  <text x="100" y="104" font-family="monospace" font-size="9" fill="#f0f0f0" text-anchor="end">5V (2)</text>
  <rect x="110" y="112" width="8" height="8" rx="1" fill="#d4af37"/>
  <text x="100" y="120" font-family="monospace" font-size="9" fill="#f0f0f0" text-anchor="end">5V (4)</text>
  <rect x="110" y="128" width="8" height="8" rx="1" fill="#4ade80"/>
  <text x="100" y="136" font-family="monospace" font-size="9" fill="#4ade80" text-anchor="end">GPIO17 (11)</text>
  <rect x="110" y="144" width="8" height="8" rx="1" fill="#d4af37"/>
  <text x="100" y="152" font-family="monospace" font-size="9" fill="#f0f0f0" text-anchor="end">...</text>
  <rect x="110" y="160" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="100" y="168" font-family="monospace" font-size="9" fill="#ef4444" text-anchor="end">GND (6)</text>
  <!-- Wire from GPIO17 -->
  <line x1="118" y1="132" x2="260" y2="132" stroke="#4ade80" stroke-width="2.5"/>
  <!-- Resistor (330Ω) -->
  <rect x="260" y="124" width="60" height="16" rx="4" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
  <text x="290" y="136" font-family="monospace" font-size="9" fill="#fff" text-anchor="middle">330Ω</text>
  <!-- Wire from resistor to LED anode -->
  <line x1="320" y1="132" x2="370" y2="132" stroke="#4ade80" stroke-width="2.5"/>
  <!-- LED body -->
  <polygon points="370,118 370,146 400,132" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="400" y1="118" x2="400" y2="146" stroke="#ca8a04" stroke-width="2"/>
  <!-- LED flat lead (cathode) -->
  <line x1="400" y1="132" x2="450" y2="132" stroke="#ef4444" stroke-width="2.5"/>
  <!-- Wire from GND pin down and across to cathode -->
  <polyline points="118,164 450,164 450,132" stroke="#ef4444" stroke-width="2.5" fill="none"/>
  <!-- Labels -->
  <text x="290" y="118" font-family="sans-serif" font-size="9" fill="#d1fae5" text-anchor="middle">330 Ω resistor</text>
  <text x="385" y="110" font-family="sans-serif" font-size="9" fill="#fde68a">LED</text>
  <text x="370" y="170" font-family="sans-serif" font-size="9" fill="#fca5a5">anode (+) → cathode (–) → GND</text>
  <text x="180" y="125" font-family="sans-serif" font-size="9" fill="#86efac">GPIO 17 (BCM)</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 3 — Reading inputs
// ---------------------------------------------------------------------------

const BUTTON_CODE = `from gpiozero import Button, LED
from signal import pause

# BCM pin 27 → physical pin 13
button = Button(27, pull_up=True)   # internal pull-up: pin reads HIGH when open
led = LED(17)

def on_press():
    print("Button pressed!")
    led.on()

def on_release():
    print("Button released.")
    led.off()

button.when_pressed = on_press
button.when_released = on_release

print("Waiting for button press… (Ctrl+C to quit)")
pause()   # keep the script alive and listening`;

const PIR_CODE = `from gpiozero import MotionSensor, LED
from signal import pause

pir = MotionSensor(4)    # PIR OUT pin → BCM 4 (physical pin 7)
led = LED(17)

pir.when_motion    = lambda: (led.on(),  print("Motion detected!"))
pir.when_no_motion = lambda: (led.off(), print("All quiet."))

print("PIR sensor active — move in front of it!")
pause()`;

const SVG_BUTTON_WIRING = `<svg viewBox="0 0 540 300" role="img" aria-label="Wiring diagram: button between GPIO 27 and GND with internal pull-up, LED on GPIO 17 through 330 ohm resistor to GND" xmlns="http://www.w3.org/2000/svg">
  <!-- Pi header block -->
  <rect x="20" y="50" width="110" height="210" rx="6" fill="#1a7c3e" stroke="#155a2c" stroke-width="2"/>
  <text x="75" y="42" font-family="sans-serif" font-size="10" fill="#d1fae5" text-anchor="middle">Pi GPIO Header</text>
  <!-- Pins -->
  <rect x="120" y="70" width="8" height="8" rx="1" fill="#4ade80"/>
  <text x="112" y="78" font-family="monospace" font-size="9" fill="#4ade80" text-anchor="end">GPIO17 (11)</text>
  <rect x="120" y="90" width="8" height="8" rx="1" fill="#60a5fa"/>
  <text x="112" y="98" font-family="monospace" font-size="9" fill="#60a5fa" text-anchor="end">GPIO27 (13)</text>
  <rect x="120" y="110" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="112" y="118" font-family="monospace" font-size="9" fill="#ef4444" text-anchor="end">GND (6)</text>
  <rect x="120" y="130" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="112" y="138" font-family="monospace" font-size="9" fill="#ef4444" text-anchor="end">GND (14)</text>
  <!-- LED path: GPIO17 → resistor → LED → GND(6) -->
  <line x1="128" y1="74" x2="220" y2="74" stroke="#4ade80" stroke-width="2"/>
  <rect x="220" y="66" width="50" height="16" rx="4" fill="#d97706" stroke="#92400e" stroke-width="1"/>
  <text x="245" y="78" font-family="monospace" font-size="8" fill="#fff" text-anchor="middle">330Ω</text>
  <line x1="270" y1="74" x2="310" y2="74" stroke="#4ade80" stroke-width="2"/>
  <polygon points="310,62 310,86 335,74" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="335" y1="62" x2="335" y2="86" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="335" y1="74" x2="380" y2="74" stroke="#ef4444" stroke-width="2"/>
  <polyline points="128,114 380,114 380,74" stroke="#ef4444" stroke-width="2" fill="none"/>
  <!-- Button path: GPIO27 → button → GND(14) -->
  <line x1="128" y1="94" x2="220" y2="94" stroke="#60a5fa" stroke-width="2"/>
  <!-- Button symbol -->
  <line x1="220" y1="94" x2="250" y2="94" stroke="#60a5fa" stroke-width="2"/>
  <circle cx="256" cy="94" r="6" fill="none" stroke="#60a5fa" stroke-width="2"/>
  <line x1="262" y1="94" x2="300" y2="94" stroke="#60a5fa" stroke-width="2"/>
  <polyline points="128,134 300,134 300,94" stroke="#ef4444" stroke-width="2" fill="none"/>
  <!-- Labels -->
  <text x="256" y="82" font-family="sans-serif" font-size="9" fill="#93c5fd" text-anchor="middle">BUTTON</text>
  <text x="322" y="62" font-family="sans-serif" font-size="9" fill="#fde68a">LED</text>
  <text x="245" y="60" font-family="sans-serif" font-size="9" fill="#fbbf24">330Ω</text>
  <text x="250" y="155" font-family="sans-serif" font-size="9" fill="#d1fae5">pull_up=True: pin reads HIGH when button open, LOW when pressed</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 4 — Mini project: motion light
// ---------------------------------------------------------------------------

const MOTION_LIGHT_CODE = `from gpiozero import MotionSensor, LED
from time import sleep

# --- Hardware connections ---
# PIR OUT  → BCM 4  (physical pin 7)
# LED anode→ 330Ω  → BCM 17 (physical pin 11)
# LED cathode → GND

pir = MotionSensor(4)
led = LED(17)

ON_DURATION = 5   # seconds the light stays on after motion

print("Motion-activated light ready.")

while True:
    pir.wait_for_motion()          # block until PIR fires
    print("Motion detected — light ON")
    led.on()
    sleep(ON_DURATION)             # keep light on
    # Only turn off if no more motion detected
    if not pir.motion_detected:
        led.off()
        print("No motion — light OFF")`;

const SVG_FULL_CIRCUIT = `<svg viewBox="0 0 600 340" role="img" aria-label="Full circuit: Raspberry Pi connected to PIR sensor on GPIO 4 and LED on GPIO 17 through 330 ohm resistor, both sharing a common GND" xmlns="http://www.w3.org/2000/svg">
  <!-- Pi board -->
  <rect x="20" y="60" width="130" height="220" rx="8" fill="#1a7c3e" stroke="#155a2c" stroke-width="2"/>
  <text x="85" y="52" font-family="sans-serif" font-size="10" fill="#d1fae5" text-anchor="middle" font-weight="bold">Raspberry Pi</text>
  <!-- GPIO pins -->
  <rect x="140" y="80" width="8" height="8" rx="1" fill="#a3e635"/>
  <text x="132" y="88" font-family="monospace" font-size="8" fill="#a3e635" text-anchor="end">GPIO4 (7)</text>
  <rect x="140" y="100" width="8" height="8" rx="1" fill="#4ade80"/>
  <text x="132" y="108" font-family="monospace" font-size="8" fill="#4ade80" text-anchor="end">GPIO17 (11)</text>
  <rect x="140" y="120" width="8" height="8" rx="1" fill="#fbbf24"/>
  <text x="132" y="128" font-family="monospace" font-size="8" fill="#fbbf24" text-anchor="end">5V (2)</text>
  <rect x="140" y="140" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="132" y="148" font-family="monospace" font-size="8" fill="#ef4444" text-anchor="end">GND (6)</text>
  <!-- PIR sensor block -->
  <rect x="350" y="60" width="100" height="80" rx="6" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2"/>
  <text x="400" y="82" font-family="sans-serif" font-size="11" fill="#bfdbfe" text-anchor="middle" font-weight="bold">PIR Sensor</text>
  <text x="400" y="100" font-family="monospace" font-size="9" fill="#93c5fd" text-anchor="middle">HC-SR501</text>
  <!-- PIR pins -->
  <rect x="350" y="112" width="8" height="8" rx="1" fill="#fbbf24"/>
  <text x="360" y="120" font-family="monospace" font-size="8" fill="#fbbf24">VCC</text>
  <rect x="380" y="112" width="8" height="8" rx="1" fill="#a3e635"/>
  <text x="390" y="120" font-family="monospace" font-size="8" fill="#a3e635">OUT</text>
  <rect x="410" y="112" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="420" y="120" font-family="monospace" font-size="8" fill="#ef4444">GND</text>
  <!-- LED + resistor group -->
  <rect x="350" y="190" width="100" height="80" rx="6" fill="#422006" stroke="#d97706" stroke-width="2"/>
  <text x="400" y="212" font-family="sans-serif" font-size="10" fill="#fde68a" text-anchor="middle">LED + 330Ω</text>
  <polygon points="370,230 370,258 400,244" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="400" y1="230" x2="400" y2="258" stroke="#ca8a04" stroke-width="1.5"/>
  <rect x="410" y="238" width="36" height="12" rx="3" fill="#d97706" stroke="#92400e" stroke-width="1"/>
  <text x="428" y="248" font-family="monospace" font-size="7" fill="#fff" text-anchor="middle">330Ω</text>
  <!-- Wires: GPIO4 → PIR OUT -->
  <polyline points="148,84 220,84 220,116 380,116" stroke="#a3e635" stroke-width="2" fill="none"/>
  <!-- Wires: 5V → PIR VCC -->
  <polyline points="148,124 240,124 240,116 350,116" stroke="#fbbf24" stroke-width="2" fill="none"/>
  <!-- Wires: GPIO17 → LED anode (via resistor top of LED group) -->
  <polyline points="148,104 200,104 200,244 350,244" stroke="#4ade80" stroke-width="2" fill="none"/>
  <!-- Wires: GND → PIR GND and LED cathode (common ground bus) -->
  <polyline points="148,144 170,144 170,290 450,290 450,116 418,116" stroke="#ef4444" stroke-width="2" fill="none"/>
  <line x1="446" y1="290" x2="446" y2="250" stroke="#ef4444" stroke-width="2"/>
  <line x1="446" y1="250" x2="446" y2="250" stroke="#ef4444" stroke-width="2"/>
  <!-- Labels -->
  <text x="300" y="76" font-family="sans-serif" font-size="8" fill="#86efac">GPIO 4</text>
  <text x="160" y="98" font-family="sans-serif" font-size="8" fill="#4ade80">GPIO 17</text>
  <text x="160" y="286" font-family="sans-serif" font-size="8" fill="#fca5a5">GND (common)</text>
</svg>`;

// ---------------------------------------------------------------------------
// The module
// ---------------------------------------------------------------------------

export const roboRaspberryPi: CourseModule = {
  meta: {
    title: "Raspberry Pi — A Linux Computer that Controls Hardware",
    slug: "robo-raspberry-pi",
    track: "robotics",
    level: "high",
    description: "The single-board Linux computer: GPIO with Python, sensors, and real projects.",
    coverImage: "/covers/robotics.svg",
    order: 33,
  },
  lessons: [
    // -------------------------------------------------------------------------
    // Lesson 1 — Meet the Raspberry Pi
    // -------------------------------------------------------------------------
    {
      title: "Meet the Raspberry Pi",
      slug: "rpi-intro",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## What is the Raspberry Pi?

The **Raspberry Pi** is a credit-card-sized computer that runs a full Linux operating system. Unlike a microcontroller such as an Arduino or Pico — which runs a single program in a tight loop — the Raspberry Pi can run an entire operating system, open multiple applications at once, connect to a network, play videos, and still talk directly to electronic hardware through its **GPIO header**.

That combination — real OS power *plus* hardware control — makes the Pi the go-to platform for robotics projects that need more than simple on/off logic: computer vision, web servers, speech recognition, machine-learning inference, and multi-process control.

### Pi vs Microcontroller — a quick comparison

| Feature | Raspberry Pi 4 | Arduino UNO | RP2040 (Pico) |
|---------|---------------|-------------|---------------|
| **CPU** | Quad-core ARM Cortex-A72 @ 1.5 GHz | AVR ATmega328P @ 16 MHz | Dual-core ARM Cortex-M0+ @ 133 MHz |
| **RAM** | 1–8 GB LPDDR4 | 2 KB SRAM | 264 KB SRAM |
| **Operating system** | Linux (Raspberry Pi OS) | None (bare metal) | None (MicroPython/C SDK) |
| **GPIO pins** | 40-pin header (26 usable GPIO) | 14 digital + 6 analog | 26 multi-function GPIO |
| **Real-time** | Not guaranteed (Linux scheduler) | Yes — deterministic timing | Yes — PIO state machines |
| **Analog input** | No (needs external ADC) | 6 × 10-bit ADC built-in | 3 × 12-bit ADC built-in |
| **Price (approx.)** | ~$35–55 USD | ~$25 USD | ~$4 USD |
| **Good for** | Vision, AI, networking, complex logic | Simple motor/sensor timing | Low-latency, power-sensitive I/O |

The Pi is *not* always the right choice — if you need precise microsecond timing or ultra-low power consumption, a microcontroller wins. But when your robot needs to think, connect, and act, the Pi shines.

### The 40-pin GPIO header

The header at the top edge of the board provides **40 pins** arranged in two rows of 20. They include:

- **Power rails** — 3.3 V, 5 V, and multiple GND pins.
- **General Purpose I/O (GPIO)** — 26 pins you can configure as digital inputs or outputs. Several also support SPI, I²C, UART, and PWM.
- All logic signals operate at **3.3 V** — never apply 5 V directly to a GPIO pin.

The annotated board below shows the key connectors you will use.`),
        svg(SVG_PI_BOARD, "Raspberry Pi 4 board with USB, HDMI, Ethernet, microSD, and 40-pin GPIO header labelled"),
        md(`### What can you build with a Raspberry Pi?

The combination of Linux, Python, and GPIO unlocks a huge range of projects:

- **Motion-activated security camera** — capture images with the Camera Module and send email alerts.
- **Weather station** — read temperature, humidity, and pressure over I²C and log to a database.
- **Voice-controlled robot** — use speech-to-text to interpret commands, then drive motors over GPIO.
- **Retro gaming console** — run emulators for classic game systems using the HDMI output.
- **Smart home hub** — read sensors around the house and expose a web dashboard over Wi-Fi.

### How Python talks to hardware

On the Pi, a Python script sits between the Linux OS (which manages files, networking, and processes) and the GPIO hardware. The diagram below shows the layers.`),
        mermaid(
          `flowchart BT
  H["Hardware (LEDs, sensors, motors)"]
  G["GPIO Library (gpiozero / RPi.GPIO)"]
  P["Python script"]
  L["Linux OS + kernel GPIO driver"]
  H --> G
  G --> P
  P --> L
  L --> H`,
          "Linux OS and GPIO library bridge Python code to physical hardware",
        ),
        callout("warning", "All Raspberry Pi GPIO pins operate at 3.3 V logic. Never connect a 5 V signal directly to a GPIO input — it will permanently damage the BCM2711 SoC. Use a voltage-divider or level-shifter when interfacing with 5 V devices."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 2 — Blink an LED with gpiozero
    // -------------------------------------------------------------------------
    {
      title: "Blink an LED with Python (gpiozero)",
      slug: "rpi-gpio-led",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Your first GPIO output

The classic "Hello, World!" of hardware is blinking an LED. On the Raspberry Pi, the easiest way to control GPIO from Python is **gpiozero** — a beginner-friendly library that comes pre-installed on Raspberry Pi OS. It wraps the underlying \`RPi.GPIO\` C library in clean, readable Python classes.

### Wiring the circuit

Connect your components as shown in the diagram:

1. A **330 Ω resistor** between GPIO 17 (BCM numbering, physical pin 11) and the LED anode (the longer leg).
2. The LED **cathode** (shorter leg, with flat spot on the plastic dome) to any GND pin (physical pin 6 is right below pin 11 — convenient).

Always use a current-limiting resistor. At 3.3 V, a 330 Ω resistor keeps the current to about 10 mA — safe for both the GPIO pin and a standard red/green LED.`),
        svg(SVG_LED_WIRING, "Wiring: GPIO 17 through 330 Ω resistor to LED anode, cathode to GND"),
        md(`### Blinking with gpiozero

The code below uses gpiozero's \`LED\` class. The library talks to the kernel GPIO driver for you, so all you write is clean Python.

Line by line:
- \`LED(17)\` — creates an LED object attached to BCM GPIO 17.
- \`led.on()\` — drives the pin HIGH (3.3 V), current flows through the resistor and LED lights up.
- \`led.off()\` — drives the pin LOW (0 V), no current, LED off.
- \`led.blink()\` — shortcut that toggles on and off on a background thread (non-blocking). You can pass \`on_time=\` and \`off_time=\` in seconds.`),
        code("python", BLINK_PY, { filename: "blink.py", openInStudio: true }),
        md(`### The RPi.GPIO equivalent

gpiozero is a higher-level wrapper. Under the hood (and in older tutorials) you will see \`RPi.GPIO\`. Here is the same blink in that lower-level style so you can recognise it:`),
        code("python", BLINK_PY_RPIGPIO, { filename: "blink_rpigpio.py", openInStudio: true }),
        md(`The key differences:
- You must call \`GPIO.setmode()\` to choose **BCM** (Broadcom chip numbers) or **BOARD** (physical pin numbers) and \`GPIO.setup()\` to configure each pin direction.
- A \`try/finally\` block with \`GPIO.cleanup()\` is important — it resets all pins to inputs when the script exits, preventing accidental stuck-HIGH or stuck-LOW states.
- gpiozero handles all of this automatically when the object is garbage-collected.

Most new projects use gpiozero for its clarity, but knowing RPi.GPIO helps you read the huge amount of older documentation online.`),
        callout("info", "BCM vs BOARD numbering: BCM refers to the Broadcom chip's GPIO numbering (GPIO17, GPIO27, etc.), which is what gpiozero and most modern code uses. BOARD refers to the physical position of the pin in the 40-pin header (pin 11, pin 13, etc.). They are different numbers for the same pins — always confirm which system a tutorial uses before wiring up."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 3 — Reading inputs
    // -------------------------------------------------------------------------
    {
      title: "Reading Inputs: Button and PIR Sensor",
      slug: "rpi-button-sensor",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Inputs: reading the world

So far we have been *sending* signals outward. Now we read signals coming *in* — from a button a person presses, or from a motion sensor that fires when it detects infra-red body heat.

### Wiring a push-button

Connect a standard momentary push-button between GPIO 27 (BCM, physical pin 13) and any GND pin. That is all — no external resistor needed, because we enable the Pi's **internal pull-up resistor** in software. The pull-up holds the pin firmly at 3.3 V when the button is open; pressing the button pulls it down to 0 V (GND).`),
        svg(SVG_BUTTON_WIRING, "Button between GPIO 27 and GND (internal pull-up), LED on GPIO 17 through 330 Ω resistor"),
        md(`### Button + LED with gpiozero

The gpiozero \`Button\` class takes care of debouncing (filtering the electrical bounce that happens when a physical button makes contact) and lets you attach callback functions with \`when_pressed\` and \`when_released\`.`),
        code("python", BUTTON_CODE, { filename: "button_led.py", openInStudio: true }),
        md(`Key points:
- \`pull_up=True\` — enables the internal 50 kΩ pull-up. The pin reads 1 (True) when the button is open and 0 (False) when pressed.
- \`button.when_pressed\` — gpiozero calls this function the moment a falling edge is detected on the pin.
- \`pause()\` — imported from \`signal\`, this keeps the main thread alive so the gpiozero background thread can fire the callbacks. Without it the script would exit immediately.

### Reading a PIR motion sensor

A **Passive Infra-Red (PIR)** sensor — such as the HC-SR501 — detects changes in infra-red radiation caused by a warm moving body. Its **OUT** pin goes HIGH for several seconds when motion is detected. This is already a clean digital signal, so no resistor is needed; just connect OUT to a GPIO input.`),
        code("python", PIR_CODE, { filename: "pir_sensor.py", openInStudio: true }),
        md(`gpiozero's \`MotionSensor\` class works exactly like \`Button\`: \`when_motion\` fires when the OUT pin goes HIGH, \`when_no_motion\` fires when it falls back LOW. The sensor's built-in potentiometers let you tune sensitivity and hold-time.

### What about analog sensors?

The Raspberry Pi's GPIO pins are purely **digital** — they can only distinguish HIGH from LOW. They have no built-in Analog-to-Digital Converter (ADC). If you want to read an analog signal (a temperature thermistor, a potentiometer, a light-dependent resistor), you need an external ADC chip wired over SPI or I²C.`),
        callout("info", "The most popular analog interface for the Raspberry Pi is the MCP3008 — an 8-channel, 10-bit SPI ADC. Connect it to the Pi's SPI pins (MOSI, MISO, SCLK, CE), then use the gpiozero MCP3008 class or the spidev library to read 0–1023 values from up to 8 analog sensors. The Pico or Arduino UNO are often simpler choices if your project is mostly analog."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 4 — Mini project: motion light
    // -------------------------------------------------------------------------
    {
      title: "Mini Project: Motion-Activated Light",
      slug: "rpi-project",
      contentType: "markdown",
      estMinutes: 18,
      body: body(
        md(`## Putting it all together: motion-activated light

In this project you combine what you have learned — a PIR sensor (input) and an LED (output) — into a practical, real-world circuit: a light that switches on automatically when someone walks in and turns itself off after a few seconds of inactivity.

You have probably seen this in a corridor, a bathroom, or a stairwell. The same logic runs here on a few grams of hardware and a handful of lines of Python.

### Component list

| Component | Qty | Purpose |
|-----------|-----|---------|
| Raspberry Pi (any model with 40-pin GPIO) | 1 | The brain |
| PIR sensor (HC-SR501 or similar) | 1 | Detects motion |
| LED (any colour) | 1 | Represents the light |
| 330 Ω resistor | 1 | Limits current through LED |
| Breadboard + jumper wires | — | Connects everything |

### Circuit diagram

Wire the components as shown below. The PIR and LED share the Pi's 3.3 V / GND rails. Note that the HC-SR501 actually runs on 5 V (it has an internal 3.3 V regulator) — use the Pi's 5 V pin for VCC, but its OUT signal is 3.3 V logic, safe to connect directly to a GPIO input.`),
        svg(SVG_FULL_CIRCUIT, "Full circuit: Pi GPIO 4 to PIR OUT, GPIO 17 through 330 Ω to LED, shared GND bus"),
        md(`### The program

The logic is deliberately simple:

1. Wait until the PIR fires (\`wait_for_motion()\` blocks the thread).
2. Turn the LED on and print a message.
3. Sleep for \`ON_DURATION\` seconds.
4. If there is no longer any motion, turn the LED off.
5. Loop back and wait again.

This means the light extends its on-time automatically if you keep moving in front of the sensor — it only turns off once you have been still for the full \`ON_DURATION\`.`),
        code("python", MOTION_LIGHT_CODE, { filename: "motion_light.py", openInStudio: true }),
        md(`### Program flow

The flowchart below shows the decision the program makes every cycle.`),
        mermaid(
          `flowchart TD
  A([Start]) --> B[Wait for motion\\npir.wait_for_motion]
  B --> C[Turn LED on\\nled.on]
  C --> D[Sleep ON_DURATION seconds]
  D --> E{Still detecting\\nmotion?}
  E -- No --> F[Turn LED off\\nled.off]
  E -- Yes --> D
  F --> B`,
          "Motion light flowchart: wait → LED on → sleep → check motion → LED off → repeat",
        ),
        md(`### Extensions to try

Once you have the basic circuit working, here are some ways to extend it:

- **Adjustable on-time** — read a potentiometer via MCP3008 and map the 0–1023 value to 1–30 seconds.
- **Log to a file** — open a CSV file and write a timestamp every time motion is detected.
- **Email alert** — use Python's \`smtplib\` to send yourself an email when the light switches on.
- **Web dashboard** — run a tiny Flask server that shows how many times motion was detected today.
- **Multiple zones** — add a second PIR on a different GPIO pin and track which room has activity.`),
        callout("tip", "Keep your wiring neat and test one component at a time. Wire and test the LED first (run blink.py), then add the PIR and test it alone (pir_sensor.py), and only then combine them. Debugging two untested components at once is far harder than debugging one."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 5 — Connecting a Raspberry Pi to an Arduino Uno
    // -------------------------------------------------------------------------
    {
      title: "Connecting a Raspberry Pi to an Arduino Uno",
      slug: "rpi-connect-arduino",
      contentType: "markdown",
      estMinutes: 20,
      body: body(
        md(`## Why pair a Raspberry Pi with an Arduino Uno?

The Raspberry Pi and the Arduino Uno are a classic pairing — not because either one is insufficient on its own, but because they each excel at very different things.

| Capability | Raspberry Pi 4 | Arduino UNO |
|-----------|---------------|-------------|
| **Operating System** | Full Linux | None (bare-metal) |
| **Networking** | Wi-Fi, Ethernet, Bluetooth | None (without shield) |
| **Real-time I/O** | No (Linux scheduler adds jitter) | Yes — deterministic microsecond timing |
| **Analog inputs** | None (needs external ADC) | 6 × 10-bit ADC built-in |
| **Logic voltage** | 3.3 V | 5 V |
| **Best for** | Brains, networking, computation, vision | Low-level motor timing, analog sensors |

The idea is simple: let the Pi handle the "thinking" — run the Python logic, talk to the internet, store data — while the Uno handles the "sensing and actuating" — read analog sensors at precise intervals, drive servos, keep a PID loop ticking without interruption.

To connect them you need a **communication link**. There are two main options, and the easiest one costs you nothing extra.

---

## Option 1 — USB Serial (recommended for beginners)

Plug the Uno's USB-B cable into any USB port on the Pi. The Linux kernel immediately recognises the Uno's CH340 or FTDI USB-serial chip and creates a **virtual serial port** at \`/dev/ttyACM0\` (sometimes \`/dev/ttyUSB0\` depending on the chip). No soldering, no level-shifting, no extra hardware.

Both devices communicate by exchanging lines of text (or raw bytes) at a fixed **baud rate** — both sides must agree on the same speed or you get garbage. 9600 baud is universal and reliable for low-volume sensor data; bump it to 115200 for more throughput.

### Arduino sketch — read a command, stream a sensor value

The Uno waits for a single character command from the Pi over USB Serial. If it receives \`'R'\` it reads the analog pin A0 and sends back the value as an ASCII decimal number followed by a newline. This pattern keeps the protocol simple: the Pi is always the requester, the Uno is always the responder.`),
        code("arduino", `// rpi_serial_sensor.ino
// Arduino Uno side: wait for 'R' command, reply with A0 reading.
// Connect the Uno to the Pi via the standard USB cable.

const int SENSOR_PIN = A0;    // potentiometer or any analog sensor
const long BAUD = 9600;       // must match the Pi's pyserial baud rate

void setup() {
  Serial.begin(BAUD);
  // Briefly flash the built-in LED so we know the sketch is running
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(200);
  digitalWrite(LED_BUILTIN, LOW);
}

void loop() {
  // Block until a byte arrives from the Pi
  if (Serial.available() > 0) {
    char cmd = (char)Serial.read();

    if (cmd == 'R') {
      // Read the 10-bit ADC value (0–1023) from A0
      int value = analogRead(SENSOR_PIN);

      // Send the value back as decimal text, terminated by newline
      // Python's readline() will block until it sees the '\\n'
      Serial.println(value);    // println() appends \\r\\n automatically
    }

    if (cmd == 'L') {
      // Bonus: toggle the built-in LED and acknowledge
      static bool ledState = false;
      ledState = !ledState;
      digitalWrite(LED_BUILTIN, ledState ? HIGH : LOW);
      Serial.println(ledState ? "led:on" : "led:off");
    }
  }
}`, { filename: "rpi_serial_sensor.ino", openInStudio: true }),
        md(`### Raspberry Pi script — send a command, read the response

On the Pi, install pyserial if it is not already present:

\`\`\`bash
pip install pyserial
\`\`\`

Then run the script below. It opens \`/dev/ttyACM0\` at 9600 baud, sends an \`'R'\` byte every second, and prints the value it receives back.`),
        code("python", `# pi_serial_reader.py
# Raspberry Pi side: send 'R' command to the Uno and read the sensor value.
# Requires: pip install pyserial

import serial
import time

# /dev/ttyACM0 is the standard path for an Uno connected over USB.
# If you have multiple USB-serial devices, it might be /dev/ttyACM1 or
# /dev/ttyUSB0.  See the callout below for how to find the right port.
PORT = "/dev/ttyACM0"
BAUD = 9600          # must match Serial.begin() in the Arduino sketch

# timeout=2 means readline() will give up after 2 seconds if no newline arrives
ser = serial.Serial(PORT, BAUD, timeout=2)

# The Uno's bootloader resets the chip when a serial connection is opened.
# Wait 2 seconds for the reset to complete before sending commands.
time.sleep(2)
print(f"Connected to {PORT} at {BAUD} baud")

try:
    while True:
        # Send the single-character command 'R' (as bytes)
        ser.write(b"R")

        # Read one line from the Uno.  readline() blocks until '\\n' or timeout.
        raw = ser.readline()        # bytes, e.g. b'742\\r\\n'

        if raw:
            # Decode the bytes and strip trailing whitespace / \\r\\n
            value_str = raw.decode("utf-8", errors="replace").strip()
            try:
                value = int(value_str)
                # Convert 10-bit ADC (0–1023) to a 0–100 % percentage
                percent = round(value / 1023 * 100, 1)
                print(f"A0 raw={value}  ({percent} %)")
            except ValueError:
                # The Uno sent something that is not a plain integer
                print(f"Unexpected response: {value_str!r}")
        else:
            print("Timeout — no response from Uno")

        time.sleep(1)   # poll once per second

except KeyboardInterrupt:
    print("\\nStopped by user.")
finally:
    ser.close()
    print("Serial port closed.")`, { filename: "pi_serial_reader.py", openInStudio: true }),
        md(`---

## Option 2 — GPIO UART (hardware serial, no USB)

The Pi exposes a hardware UART on its GPIO header: **TX on GPIO 14 (pin 8)** and **RX on GPIO 15 (pin 10)**. The Uno also has hardware serial on its **TX (pin 1)** and **RX (pin 0)** lines.

You can wire them together directly — Pi TX → Uno RX, Pi RX → Uno TX, common GND — and they will communicate exactly like USB Serial, but without needing a USB connection.

### The critical voltage warning

The Raspberry Pi GPIO pins are **3.3 V** logic. The Arduino Uno's TX line can swing to **5 V**. Connecting 5 V directly to the Pi's RX pin risks damaging the BCM2711 SoC permanently.

The safe fix is a simple **voltage divider** on the Uno TX → Pi RX path: two resistors drop the 5 V signal to ~3.3 V.

\`\`\`
Uno TX (5 V) ─── 1 kΩ ──┬── Pi RX (GPIO 15)
                         │
                        2 kΩ
                         │
                        GND
\`\`\`

The Pi TX (3.3 V) → Uno RX direction is safe without any divider: Uno RX will accept 3.3 V as a valid HIGH.

Before using the UART you must also enable it in Raspberry Pi OS:
1. Run \`sudo raspi-config\` → *Interface Options* → *Serial Port*.
2. Choose **No** for "login shell over serial" and **Yes** for "serial port hardware enabled".
3. Reboot — the port appears as \`/dev/ttyAMA0\` (Pi 4) or \`/dev/serial0\`.

The Python code is identical to the USB example — just change \`PORT = "/dev/ttyAMA0"\`.`),
        svg(`<svg viewBox="0 0 700 420" role="img" aria-label="Wiring diagram showing two connection options between Raspberry Pi and Arduino Uno: USB cable link and UART GPIO link with voltage divider on Uno TX to Pi RX" xmlns="http://www.w3.org/2000/svg">
  <!-- ===== Pi board ===== -->
  <rect x="20" y="60" width="140" height="300" rx="8" fill="#1a7c3e" stroke="#155a2c" stroke-width="2"/>
  <text x="90" y="50" font-family="sans-serif" font-size="12" fill="#d1fae5" text-anchor="middle" font-weight="bold">Raspberry Pi</text>
  <!-- Pi USB port -->
  <rect x="150" y="90" width="30" height="22" rx="3" fill="#3b3b3b" stroke="#888" stroke-width="1.5"/>
  <text x="165" y="104" font-family="sans-serif" font-size="8" fill="#d1d5db" text-anchor="middle">USB</text>
  <!-- Pi GPIO pins -->
  <rect x="152" y="160" width="8" height="8" rx="1" fill="#d4af37"/>
  <text x="148" y="168" font-family="monospace" font-size="8" fill="#d4af37" text-anchor="end">TX GPIO14 (8)</text>
  <rect x="152" y="182" width="8" height="8" rx="1" fill="#d4af37"/>
  <text x="148" y="190" font-family="monospace" font-size="8" fill="#d4af37" text-anchor="end">RX GPIO15 (10)</text>
  <rect x="152" y="204" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="148" y="212" font-family="monospace" font-size="8" fill="#ef4444" text-anchor="end">GND (6)</text>

  <!-- ===== Arduino Uno board ===== -->
  <rect x="520" y="60" width="150" height="300" rx="8" fill="#1a53a0" stroke="#1e3a8a" stroke-width="2"/>
  <text x="595" y="50" font-family="sans-serif" font-size="12" fill="#bfdbfe" text-anchor="middle" font-weight="bold">Arduino Uno</text>
  <!-- Uno USB-B port -->
  <rect x="496" y="90" width="30" height="22" rx="3" fill="#3b3b3b" stroke="#888" stroke-width="1.5"/>
  <text x="511" y="104" font-family="sans-serif" font-size="8" fill="#d1d5db" text-anchor="middle">USB-B</text>
  <!-- Uno serial pins -->
  <rect x="516" y="160" width="8" height="8" rx="1" fill="#f97316"/>
  <text x="527" y="168" font-family="monospace" font-size="8" fill="#f97316">TX (pin 1)</text>
  <rect x="516" y="182" width="8" height="8" rx="1" fill="#f97316"/>
  <text x="527" y="190" font-family="monospace" font-size="8" fill="#f97316">RX (pin 0)</text>
  <rect x="516" y="204" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="527" y="212" font-family="monospace" font-size="8" fill="#ef4444">GND</text>

  <!-- ===== Option 1: USB cable ===== -->
  <!-- Cable body -->
  <path d="M180 101 Q350 40 496 101" stroke="#94a3b8" stroke-width="6" fill="none" stroke-linecap="round"/>
  <text x="350" y="34" font-family="sans-serif" font-size="11" fill="#e2e8f0" text-anchor="middle" font-weight="bold">Option 1 — USB Cable</text>
  <text x="350" y="48" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">(plug Uno USB-B into Pi USB-A port)</text>

  <!-- ===== Option 2: UART wires ===== -->
  <text x="350" y="148" font-family="sans-serif" font-size="11" fill="#e2e8f0" text-anchor="middle" font-weight="bold">Option 2 — GPIO UART</text>

  <!-- Pi TX (3.3V) → Uno RX  (safe, no divider) -->
  <line x1="160" y1="164" x2="516" y2="186" stroke="#a3e635" stroke-width="2" stroke-dasharray="6,3"/>
  <text x="340" y="170" font-family="sans-serif" font-size="8" fill="#a3e635" text-anchor="middle">Pi TX → Uno RX (3.3 V safe, no divider)</text>

  <!-- Pi RX ← Uno TX  (needs voltage divider, 5V!) -->
  <!-- Wire from Uno TX to divider mid-point -->
  <line x1="516" y1="164" x2="420" y2="200" stroke="#f97316" stroke-width="2"/>
  <!-- Resistor 1k (top leg of divider) -->
  <rect x="360" y="194" width="40" height="12" rx="3" fill="#d97706" stroke="#92400e" stroke-width="1.2"/>
  <text x="380" y="204" font-family="monospace" font-size="7" fill="#fff" text-anchor="middle">1 kΩ</text>
  <!-- Junction point -->
  <circle cx="340" cy="206" r="4" fill="#fbbf24"/>
  <!-- Resistor 2k (bottom leg to GND) -->
  <rect x="318" y="212" width="44" height="12" rx="3" fill="#d97706" stroke="#92400e" stroke-width="1.2"/>
  <text x="340" y="222" font-family="monospace" font-size="7" fill="#fff" text-anchor="middle">2 kΩ</text>
  <!-- GND leg -->
  <line x1="340" y1="224" x2="340" y2="250" stroke="#ef4444" stroke-width="1.5"/>
  <line x1="325" y1="250" x2="355" y2="250" stroke="#ef4444" stroke-width="1.5"/>
  <line x1="330" y1="255" x2="350" y2="255" stroke="#ef4444" stroke-width="1.5"/>
  <line x1="335" y1="260" x2="345" y2="260" stroke="#ef4444" stroke-width="1.5"/>
  <!-- Junction to Pi RX -->
  <line x1="340" y1="206" x2="160" y2="186" stroke="#fbbf24" stroke-width="2"/>
  <text x="248" y="210" font-family="sans-serif" font-size="8" fill="#fbbf24" text-anchor="middle">~3.3 V after divider → Pi RX</text>
  <text x="460" y="190" font-family="sans-serif" font-size="8" fill="#f97316" text-anchor="middle">5 V Uno TX</text>
  <!-- Divider label -->
  <text x="395" y="246" font-family="sans-serif" font-size="8" fill="#fde68a">voltage</text>
  <text x="395" y="256" font-family="sans-serif" font-size="8" fill="#fde68a">divider</text>

  <!-- Common GND wire -->
  <line x1="160" y1="208" x2="516" y2="208" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2"/>
  <text x="340" y="236" font-family="sans-serif" font-size="8" fill="#fca5a5" text-anchor="middle">Common GND</text>

  <!-- ===== Legend ===== -->
  <rect x="20" y="380" width="660" height="30" rx="4" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <line x1="30" y1="395" x2="60" y2="395" stroke="#94a3b8" stroke-width="5"/>
  <text x="65" y="399" font-family="sans-serif" font-size="9" fill="#cbd5e1">USB cable</text>
  <line x1="130" y1="395" x2="160" y2="395" stroke="#a3e635" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="165" y="399" font-family="sans-serif" font-size="9" fill="#cbd5e1">UART safe (3.3V)</text>
  <line x1="280" y1="395" x2="310" y2="395" stroke="#fbbf24" stroke-width="2"/>
  <text x="315" y="399" font-family="sans-serif" font-size="9" fill="#cbd5e1">After divider (~3.3V)</text>
  <line x1="440" y1="395" x2="470" y2="395" stroke="#f97316" stroke-width="2"/>
  <text x="475" y="399" font-family="sans-serif" font-size="9" fill="#cbd5e1">Uno TX (5V — needs divider!)</text>
</svg>`, "Wiring diagram: USB cable link between Pi and Uno (Option 1) and UART GPIO link with 1kΩ/2kΩ voltage divider on Uno TX to Pi RX (Option 2)"),
        mermaid(`sequenceDiagram
  participant Pi as Raspberry Pi<br/>(pyserial)
  participant Uno as Arduino Uno<br/>(USB Serial)
  Pi->>Uno: send byte 'R'
  Uno->>Uno: analogRead(A0) → 742
  Uno-->>Pi: "742\\r\\n"
  Pi->>Pi: parse → 72.5 %
  Note over Pi: sleep 1 s
  Pi->>Uno: send byte 'L'
  Uno->>Uno: toggle LED_BUILTIN
  Uno-->>Pi: "led:on\\r\\n"`,
          "Sequence: Pi sends command byte, Uno reads sensor or toggles LED and replies over USB serial",
        ),
        callout("info", "Finding the right serial port: run `ls /dev/tty*` before and after plugging in the Uno — the new entry is your port. It is usually /dev/ttyACM0 for genuine Unos (ATmega16U2 USB chip) and /dev/ttyUSB0 for clones with a CH340 chip. If you get a 'Permission denied' error, add your user to the dialout group: `sudo usermod -aG dialout $USER` and log out/in. The baud rates on both ends must be identical — a mismatch produces garbled garbage characters, not an error message."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 6 — Connecting a Raspberry Pi to an ESP32
    // -------------------------------------------------------------------------
    {
      title: "Connecting a Raspberry Pi to an ESP32",
      slug: "rpi-connect-esp32",
      contentType: "markdown",
      estMinutes: 22,
      body: body(
        md(`## Raspberry Pi + ESP32: two very compatible partners

The **ESP32** is Espressif's dual-core, Wi-Fi-and-Bluetooth capable microcontroller. Like the Arduino Uno it excels at real-time I/O and analog sensing, but it brings two major upgrades that change how you design a system:

1. **3.3 V logic** — the ESP32 runs entirely at 3.3 V, the same as the Raspberry Pi. There is no 5 V mismatch, so you can wire the UART lines together directly without any voltage divider.
2. **Built-in Wi-Fi** — the ESP32 can reach the network on its own. That means it can POST sensor data to a server running on the Pi over the local Wi-Fi network, completely eliminating the need for a physical serial wire in many use-cases.

You have two clean choices for this link:

| Approach | Wires needed | Latency | Best for |
|----------|-------------|---------|---------|
| **UART serial (GPIO)** | 3 (TX, RX, GND) | ~1 ms | Continuous streaming, simple commands |
| **Wi-Fi HTTP/UDP** | 0 (wireless) | 5–50 ms | Occasional updates, prototyping, range |

---

## Option 1 — Wired UART (no level shifter required)

Because both devices are 3.3 V, this is as simple as it gets: connect Pi TX → ESP32 RX, ESP32 TX → Pi RX, and share a common GND. Both sides must use the same baud rate.

### ESP32 sketch — UART over Serial2

The ESP32 has three hardware UARTs. **Serial** (UART0) is typically occupied by the USB debug console. **Serial2** (UART2) maps by default to GPIO 16 (RX) and GPIO 17 (TX) on most ESP32 dev boards, leaving the USB debug channel free for diagnostics.

The sketch below reads commands from the Pi on Serial2, reads an internal temperature estimate from the built-in hall-effect sensor, and streams the value back.`),
        code("arduino", `// pi_esp32_uart.ino
// ESP32 side: respond to commands from the Raspberry Pi over UART2.
// Default Serial2 pins on most 38-pin ESP32 dev boards:
//   RX2 = GPIO 16   →  connect to Pi TX (GPIO 14, pin 8)
//   TX2 = GPIO 17   →  connect to Pi RX (GPIO 15, pin 10)
// Common GND between ESP32 and Pi is mandatory.

#include <Arduino.h>

// Serial2 uses GPIO 16 (RX) and GPIO 17 (TX) by default.
// Both ESP32 and Pi are 3.3 V — no level shifter needed.
const long UART_BAUD = 115200;

// Hall-effect sensor is built into the ESP32 SoC (measures ~magnetic field).
// We use it here as a convenient analog source; swap for any analogRead(pin).
int readSensor() {
  return hallRead();   // returns a small signed integer, typically -80 to +80
}

void setup() {
  Serial.begin(115200);         // USB debug console
  Serial2.begin(UART_BAUD);     // Pi link on GPIO 16/17
  Serial.println("ESP32 UART bridge ready");
}

void loop() {
  if (Serial2.available() > 0) {
    char cmd = (char)Serial2.read();

    if (cmd == 'R') {
      // Read the sensor and reply with a decimal string + newline
      int value = readSensor();
      Serial2.println(value);

      // Also echo to USB so you can watch in the Arduino IDE Serial Monitor
      Serial.print("Sent: ");
      Serial.println(value);
    }

    if (cmd == 'P') {
      // Ping — useful to test connectivity before starting a data loop
      Serial2.println("pong");
    }
  }
}`, { filename: "pi_esp32_uart.ino", openInStudio: true }),
        md(`### Raspberry Pi script — pyserial over UART GPIO

On the Pi, enable the hardware UART via \`sudo raspi-config\` → Interface Options → Serial Port (disable the login shell, enable the hardware port). After reboot the port is available as \`/dev/ttyAMA0\` on a Pi 4, or check \`/dev/serial0\` which is a symlink to the active primary UART.`),
        code("python", `# pi_esp32_reader.py
# Raspberry Pi side: communicate with an ESP32 over hardware UART GPIO.
# Hardware UART on Pi 4: TX = GPIO14 (pin 8), RX = GPIO15 (pin 10).
# Connect:  Pi GPIO14 (TX) → ESP32 GPIO16 (RX2)
#           Pi GPIO15 (RX) → ESP32 GPIO17 (TX2)
#           Pi GND         → ESP32 GND
# No voltage divider needed — both run at 3.3 V.
#
# Requires: pip install pyserial
# Enable UART first: sudo raspi-config → Interface Options → Serial Port
#   "Login shell over serial?" → No
#   "Serial port hardware enabled?" → Yes
# Reboot, then the port appears as /dev/ttyAMA0 (or /dev/serial0).

import serial
import time

PORT = "/dev/ttyAMA0"   # hardware UART on Pi 4; try /dev/serial0 if not found
BAUD = 115200            # must match Serial2.begin() in the ESP32 sketch

ser = serial.Serial(PORT, BAUD, timeout=2)
time.sleep(0.5)          # brief settle — no bootloader reset on UART GPIO
print(f"Opened {PORT} at {BAUD} baud")

# Quick ping to verify the link is alive before entering the data loop
ser.write(b"P")
pong = ser.readline().decode("utf-8", errors="replace").strip()
if pong == "pong":
    print("ESP32 responded — link is good!")
else:
    print(f"Unexpected ping response: {pong!r}  (check wiring and baud rate)")

try:
    while True:
        ser.write(b"R")                          # request a reading
        raw = ser.readline()                     # wait for newline-terminated reply
        if raw:
            text = raw.decode("utf-8", errors="replace").strip()
            try:
                value = int(text)
                print(f"Sensor value: {value}")
            except ValueError:
                print(f"Non-integer response: {text!r}")
        else:
            print("Timeout — check ESP32 is running and baud rates match")
        time.sleep(0.5)   # 2 readings per second

except KeyboardInterrupt:
    print("\\nStopped.")
finally:
    ser.close()`, { filename: "pi_esp32_reader.py", openInStudio: true }),
        svg(`<svg viewBox="0 0 680 360" role="img" aria-label="Wiring diagram: Raspberry Pi GPIO UART connected directly to ESP32 UART2 with no voltage divider, both at 3.3V. TX to RX, RX to TX, common GND." xmlns="http://www.w3.org/2000/svg">
  <!-- ===== Pi board ===== -->
  <rect x="20" y="60" width="150" height="260" rx="8" fill="#1a7c3e" stroke="#155a2c" stroke-width="2"/>
  <text x="95" y="48" font-family="sans-serif" font-size="12" fill="#d1fae5" text-anchor="middle" font-weight="bold">Raspberry Pi</text>
  <text x="95" y="330" font-family="sans-serif" font-size="9" fill="#6ee7b7" text-anchor="middle">3.3 V logic</text>
  <!-- Pi GPIO pins -->
  <rect x="162" y="130" width="8" height="8" rx="1" fill="#a3e635"/>
  <text x="158" y="138" font-family="monospace" font-size="8" fill="#a3e635" text-anchor="end">TX GPIO14 (pin 8)</text>
  <rect x="162" y="160" width="8" height="8" rx="1" fill="#60a5fa"/>
  <text x="158" y="168" font-family="monospace" font-size="8" fill="#60a5fa" text-anchor="end">RX GPIO15 (pin 10)</text>
  <rect x="162" y="190" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="158" y="198" font-family="monospace" font-size="8" fill="#ef4444" text-anchor="end">GND (pin 6)</text>

  <!-- ===== "No level shifter" annotation ===== -->
  <rect x="270" y="100" width="140" height="30" rx="6" fill="#14532d" stroke="#4ade80" stroke-width="1.5"/>
  <text x="340" y="113" font-family="sans-serif" font-size="9" fill="#86efac" text-anchor="middle" font-weight="bold">No level shifter</text>
  <text x="340" y="125" font-family="sans-serif" font-size="9" fill="#6ee7b7" text-anchor="middle">Both are 3.3 V</text>

  <!-- ===== ESP32 board ===== -->
  <rect x="500" y="60" width="160" height="260" rx="8" fill="#7c2d12" stroke="#b45309" stroke-width="2"/>
  <text x="580" y="48" font-family="sans-serif" font-size="12" fill="#fed7aa" text-anchor="middle" font-weight="bold">ESP32</text>
  <text x="580" y="330" font-family="sans-serif" font-size="9" fill="#fdba74" text-anchor="middle">3.3 V logic</text>
  <!-- ESP32 UART2 pins -->
  <rect x="498" y="130" width="8" height="8" rx="1" fill="#60a5fa"/>
  <text x="510" y="138" font-family="monospace" font-size="8" fill="#60a5fa">RX2 GPIO16</text>
  <rect x="498" y="160" width="8" height="8" rx="1" fill="#a3e635"/>
  <text x="510" y="168" font-family="monospace" font-size="8" fill="#a3e635">TX2 GPIO17</text>
  <rect x="498" y="190" width="8" height="8" rx="1" fill="#ef4444"/>
  <text x="510" y="198" font-family="monospace" font-size="8" fill="#ef4444">GND</text>

  <!-- ===== Wires ===== -->
  <!-- Pi TX → ESP32 RX2 (green) -->
  <line x1="170" y1="134" x2="498" y2="134" stroke="#a3e635" stroke-width="2.5"/>
  <text x="334" y="128" font-family="sans-serif" font-size="8" fill="#a3e635" text-anchor="middle">Pi TX → ESP32 RX2</text>

  <!-- Pi RX ← ESP32 TX2 (blue) -->
  <line x1="170" y1="164" x2="498" y2="164" stroke="#60a5fa" stroke-width="2.5"/>
  <text x="334" y="178" font-family="sans-serif" font-size="8" fill="#60a5fa" text-anchor="middle">Pi RX ← ESP32 TX2</text>

  <!-- Common GND (red) -->
  <line x1="170" y1="194" x2="498" y2="194" stroke="#ef4444" stroke-width="2.5"/>
  <text x="334" y="210" font-family="sans-serif" font-size="8" fill="#fca5a5" text-anchor="middle">Common GND</text>

  <!-- 3.3V supply note -->
  <line x1="498" y1="230" x2="350" y2="230" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="170" y1="230" x2="350" y2="230" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="334" y="246" font-family="sans-serif" font-size="8" fill="#fbbf24" text-anchor="middle">3.3 V power from Pi (optional — ESP32 can use its own USB)</text>

  <!-- Legend -->
  <rect x="20" y="340" width="640" height="14" rx="3" fill="#1e293b"/>
  <line x1="30" y1="347" x2="55" y2="347" stroke="#a3e635" stroke-width="2.5"/>
  <text x="60" y="351" font-family="sans-serif" font-size="8" fill="#cbd5e1">TX line</text>
  <line x1="110" y1="347" x2="135" y2="347" stroke="#60a5fa" stroke-width="2.5"/>
  <text x="140" y="351" font-family="sans-serif" font-size="8" fill="#cbd5e1">RX line</text>
  <line x1="190" y1="347" x2="215" y2="347" stroke="#ef4444" stroke-width="2.5"/>
  <text x="220" y="351" font-family="sans-serif" font-size="8" fill="#cbd5e1">GND</text>
  <text x="400" y="351" font-family="sans-serif" font-size="8" fill="#86efac">No voltage divider needed — direct 3.3 V to 3.3 V connection</text>
</svg>`, "Direct UART wiring: Pi GPIO14 TX to ESP32 GPIO16 RX2, Pi GPIO15 RX to ESP32 GPIO17 TX2, common GND, no voltage divider"),
        md(`---

## Option 2 — Wi-Fi HTTP (no wires at all)

The ESP32's most powerful feature is its built-in Wi-Fi radio. Instead of a serial cable, the ESP32 can connect to the local network and send sensor data to a small HTTP server running on the Raspberry Pi — the two boards only need to be on the same Wi-Fi network, with no physical link between them.

**How it works:**

1. The Pi runs a tiny Python HTTP server (using Flask or the built-in \`http.server\`) and listens on, say, port 5000.
2. The ESP32 connects to Wi-Fi, reads its sensor, and periodically sends an HTTP POST request with the sensor data as JSON.
3. The Pi server receives and logs the data — from any ESP32 on the network, from any room, through walls and across floors.

This is a fundamentally different architecture: you go from a point-to-point cable to a network topology. Multiple ESP32 nodes can report to one Pi server. The Pi can also send commands back as the HTTP response body.

The mermaid diagram below shows the flow.`),
        mermaid(`sequenceDiagram
  participant E as ESP32<br/>(Wi-Fi client)
  participant R as Pi<br/>(Flask server :5000)
  E->>E: connect to Wi-Fi SSID
  E->>E: read sensor (hallRead)
  E->>R: HTTP POST /data<br/>{"node":"esp01","value":42}
  R->>R: log value, update state
  R-->>E: HTTP 200 OK<br/>{"ack":true,"cmd":"none"}
  Note over E: sleep 5 s, then repeat
  E->>R: HTTP POST /data<br/>{"node":"esp01","value":38}
  R-->>E: HTTP 200 OK<br/>{"ack":true,"cmd":"reset"}
  E->>E: execute "reset" command`,
          "Wi-Fi flow: ESP32 POSTs sensor data to Flask server on the Pi, Pi responds with acknowledgement and optional command",
        ),
        callout("warning", "UART vs Wi-Fi — choose by latency and reliability needs. Wired UART is deterministic: data arrives in under a millisecond and works even if your Wi-Fi router is rebooting. Wi-Fi HTTP adds 5–50 ms of network latency and depends on your router being up. For tight control loops (motor PID, servo steering) use UART. For telemetry and monitoring where occasional missed packets are fine, Wi-Fi is more convenient and cable-free."),
      ),
    },
  ],

  // ---------------------------------------------------------------------------
  // Task / challenge
  // ---------------------------------------------------------------------------
  tasks: [
    {
      title: "Challenge: GPIO pin plan",
      slug: "challenge-rpi",
      description:
        "Print the BCM numbers you'd use for an LED on GPIO 17 and a button on GPIO 27 — print 17 then 27, one per line.",
      track: "robotics",
      difficulty: "beginner",
      points: 50,
      language: "python",
      starterCode:
        "# Print 17 then 27, one per line\nled_pin = 0   # set to 17\nbutton_pin = 0  # set to 27\nprint(led_pin)\nprint(button_pin)\n",
      checks: {
        rules: [
          { type: "stdout_contains", value: "17" },
          { type: "stdout_contains", value: "27" },
        ],
      },
    },
  ],
};
