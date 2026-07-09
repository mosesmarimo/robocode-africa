import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// SVG: Pico board overview — USB, BOOTSEL, 40 pins, GP labels, 3V3, GND
// ---------------------------------------------------------------------------

const SVG_PICO_BOARD = `<svg viewBox="0 0 640 300" role="img" aria-label="Raspberry Pi Pico board with labelled GPIO pins, USB connector, BOOTSEL button, 3V3 and GND" xmlns="http://www.w3.org/2000/svg">
  <!-- Board outline -->
  <rect x="40" y="30" width="380" height="240" rx="12" ry="12" fill="#1e7e34" stroke="#145a22" stroke-width="2.5"/>
  <!-- Board title -->
  <text x="85" y="58" font-family="monospace" font-size="13" fill="#ffffff" font-weight="bold">Raspberry Pi Pico</text>
  <!-- USB micro-B connector -->
  <rect x="40" y="110" width="28" height="48" rx="4" fill="#bdbdbd" stroke="#757575" stroke-width="1.5"/>
  <rect x="44" y="117" width="20" height="34" rx="2" fill="#616161"/>
  <text x="14" y="145" font-family="monospace" font-size="10" fill="#e0e0e0">USB</text>
  <!-- BOOTSEL button -->
  <rect x="130" y="35" width="40" height="16" rx="4" fill="#1565c0" stroke="#0d47a1" stroke-width="1.5"/>
  <text x="131" y="47" font-family="monospace" font-size="8" fill="#ffffff">BOOTSEL</text>
  <line x1="150" y1="51" x2="150" y2="65" stroke="#90caf9" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="110" y="76" font-family="monospace" font-size="9" fill="#90caf9">Hold + USB → flash mode</text>
  <!-- RP2040 chip -->
  <rect x="170" y="115" width="90" height="70" rx="6" fill="#121212" stroke="#37474f" stroke-width="1.5"/>
  <text x="177" y="140" font-family="monospace" font-size="10" fill="#b0bec5">RP2040</text>
  <text x="177" y="155" font-family="monospace" font-size="9" fill="#546e7a">Dual-core ARM</text>
  <text x="177" y="169" font-family="monospace" font-size="9" fill="#546e7a">133 MHz · 264KB</text>
  <text x="177" y="183" font-family="monospace" font-size="9" fill="#546e7a">2 MB Flash</text>
  <!-- Top pin row label -->
  <text x="80" y="26" font-family="monospace" font-size="10" fill="#e0e0e0">GP0 – GP15 (top row)</text>
  <!-- Top pins GP0-GP9 yellow, GP10-GP14 blue, GP15 red -->
  <circle cx="95"  cy="34" r="5" fill="#fdd835"/>
  <text x="91"  cy="30" font-family="monospace" font-size="8" fill="#fdd835" y="28">0</text>
  <circle cx="115" cy="34" r="5" fill="#fdd835"/>
  <text x="111" cy="30" font-family="monospace" font-size="8" fill="#fdd835" y="28">1</text>
  <circle cx="135" cy="34" r="5" fill="#fdd835"/>
  <circle cx="175" cy="34" r="5" fill="#fdd835"/>
  <circle cx="195" cy="34" r="5" fill="#fdd835"/>
  <circle cx="215" cy="34" r="5" fill="#29b6f6"/>
  <circle cx="235" cy="34" r="5" fill="#29b6f6"/>
  <circle cx="255" cy="34" r="5" fill="#29b6f6"/>
  <circle cx="275" cy="34" r="5" fill="#29b6f6"/>
  <circle cx="295" cy="34" r="5" fill="#29b6f6"/>
  <circle cx="315" cy="34" r="5" fill="#ef5350"/>
  <!-- GP25 LED callout -->
  <circle cx="475" cy="90" r="11" fill="#66bb6a" stroke="#388e3c" stroke-width="1.5"/>
  <text x="490" y="86" font-family="monospace" font-size="10" fill="#66bb6a">Built-in LED</text>
  <text x="490" y="100" font-family="monospace" font-size="10" fill="#66bb6a">GP25 (Pico)</text>
  <text x="490" y="114" font-family="monospace" font-size="10" fill="#66bb6a">"LED" (Pico W)</text>
  <!-- Bottom pin row label -->
  <text x="80" y="288" font-family="monospace" font-size="10" fill="#e0e0e0">GP16 – GP28 + ADC + Power (bottom row)</text>
  <!-- Bottom pins GP16-GP22 purple, GP26-GP28 orange (ADC), 3V3 red, GND dark -->
  <circle cx="95"  cy="266" r="5" fill="#ab47bc"/>
  <circle cx="115" cy="266" r="5" fill="#ab47bc"/>
  <circle cx="135" cy="266" r="5" fill="#ab47bc"/>
  <circle cx="155" cy="266" r="5" fill="#ab47bc"/>
  <circle cx="175" cy="266" r="5" fill="#ab47bc"/>
  <circle cx="195" cy="266" r="5" fill="#ab47bc"/>
  <circle cx="215" cy="266" r="5" fill="#ab47bc"/>
  <circle cx="245" cy="266" r="5" fill="#ff7043"/>
  <text x="238" cy="280" font-family="monospace" font-size="8" fill="#ff7043" y="280">ADC0</text>
  <circle cx="265" cy="266" r="5" fill="#ff7043"/>
  <text x="258" cy="280" font-family="monospace" font-size="8" fill="#ff7043" y="280">ADC1</text>
  <circle cx="285" cy="266" r="5" fill="#ff7043"/>
  <text x="278" cy="280" font-family="monospace" font-size="8" fill="#ff7043" y="280">ADC2</text>
  <!-- 3V3 and GND -->
  <circle cx="340" cy="266" r="5" fill="#e53935"/>
  <text x="328" y="257" font-family="monospace" font-size="9" fill="#e53935">3V3</text>
  <circle cx="360" cy="266" r="5" fill="#263238"/>
  <text x="349" y="257" font-family="monospace" font-size="9" fill="#90a4ae">GND</text>
  <!-- VSYS / VBUS -->
  <circle cx="390" cy="266" r="5" fill="#e53935"/>
  <text x="378" y="257" font-family="monospace" font-size="9" fill="#ef9a9a">VSYS</text>
  <!-- Info panel -->
  <rect x="430" y="130" width="165" height="100" rx="8" fill="#0d0d0d" stroke="#37474f" stroke-width="1.5"/>
  <text x="445" y="152" font-family="monospace" font-size="11" fill="#ffd54f" font-weight="bold">Pico key facts</text>
  <text x="445" y="170" font-family="monospace" font-size="9" fill="#90a4ae">GP0–GP22, GP26–GP28 usable</text>
  <text x="445" y="184" font-family="monospace" font-size="9" fill="#90a4ae">GP26/27/28 = ADC0/1/2</text>
  <text x="445" y="198" font-family="monospace" font-size="9" fill="#90a4ae">3.3 V logic (not 5 V!)</text>
  <text x="445" y="212" font-family="monospace" font-size="9" fill="#90a4ae">No Wi-Fi; Pico W has Wi-Fi</text>
  <text x="445" y="226" font-family="monospace" font-size="9" fill="#90a4ae">USB-serial REPL built-in</text>
</svg>`;

// ---------------------------------------------------------------------------
// SVG: Lesson 2 — external LED + 330 Ω resistor wired to GP15
// ---------------------------------------------------------------------------

const SVG_LED_CIRCUIT = `<svg viewBox="0 0 520 220" role="img" aria-label="External LED with 330-ohm resistor wired from GP15 on the Pico to GND" xmlns="http://www.w3.org/2000/svg">
  <!-- Pico stub -->
  <rect x="20" y="70" width="110" height="80" rx="8" fill="#1e7e34" stroke="#145a22" stroke-width="2"/>
  <text x="35" y="100" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Pico</text>
  <!-- GP15 pin -->
  <circle cx="130" cy="100" r="6" fill="#fdd835"/>
  <text x="36" y="118" font-family="monospace" font-size="10" fill="#fdd835">GP15</text>
  <!-- GND pin -->
  <circle cx="130" cy="135" r="6" fill="#263238" stroke="#90a4ae" stroke-width="1.5"/>
  <text x="40" y="148" font-family="monospace" font-size="10" fill="#90a4ae">GND</text>
  <!-- Wire from GP15 to resistor -->
  <line x1="136" y1="100" x2="220" y2="100" stroke="#fdd835" stroke-width="2.5"/>
  <!-- Resistor body -->
  <rect x="220" y="90" width="60" height="20" rx="4" fill="#d4a017" stroke="#8b6914" stroke-width="1.5"/>
  <text x="228" y="104" font-family="monospace" font-size="9" fill="#1a1a1a">330 Ω</text>
  <!-- Wire between resistor and LED anode -->
  <line x1="280" y1="100" x2="340" y2="100" stroke="#fdd835" stroke-width="2.5"/>
  <!-- LED body (anode on left, cathode on right) -->
  <polygon points="340,85 340,115 370,100" fill="#ff5252" stroke="#b71c1c" stroke-width="1.5"/>
  <line x1="370" y1="86" x2="370" y2="114" stroke="#b71c1c" stroke-width="2.5"/>
  <!-- LED light rays -->
  <line x1="374" y1="88" x2="388" y2="76" stroke="#ff8a80" stroke-width="1.5" stroke-dasharray="3,2"/>
  <line x1="374" y1="100" x2="392" y2="94" stroke="#ff8a80" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Wire from cathode to GND rail -->
  <line x1="370" y1="100" x2="420" y2="100" stroke="#90a4ae" stroke-width="2.5"/>
  <line x1="420" y1="100" x2="420" y2="135" stroke="#90a4ae" stroke-width="2.5"/>
  <!-- GND wire back to Pico -->
  <line x1="136" y1="135" x2="420" y2="135" stroke="#90a4ae" stroke-width="2.5"/>
  <!-- GND symbol -->
  <line x1="420" y1="148" x2="420" y2="155" stroke="#90a4ae" stroke-width="2"/>
  <line x1="410" y1="155" x2="430" y2="155" stroke="#90a4ae" stroke-width="2"/>
  <line x1="413" y1="160" x2="427" y2="160" stroke="#90a4ae" stroke-width="1.5"/>
  <line x1="416" y1="165" x2="424" y2="165" stroke="#90a4ae" stroke-width="1"/>
  <!-- Labels -->
  <text x="222" y="76" font-family="monospace" font-size="10" fill="#d4a017">330 Ω resistor</text>
  <text x="336" y="76" font-family="monospace" font-size="10" fill="#ff5252">LED</text>
  <text x="398" y="80" font-family="monospace" font-size="10" fill="#90a4ae">GND</text>
  <!-- Anode/Cathode labels -->
  <text x="334" y="125" font-family="monospace" font-size="9" fill="#ff8a80">+</text>
  <text x="368" y="125" font-family="monospace" font-size="9" fill="#90a4ae">−</text>
</svg>`;

// ---------------------------------------------------------------------------
// SVG: Lesson 3 — button + potentiometer wiring
// ---------------------------------------------------------------------------

const SVG_BUTTON_ADC = `<svg viewBox="0 0 620 260" role="img" aria-label="Button wired to GP14 with pull-down, and potentiometer wired to GP26 ADC on the Pico" xmlns="http://www.w3.org/2000/svg">
  <!-- Pico -->
  <rect x="20" y="60" width="120" height="140" rx="8" fill="#1e7e34" stroke="#145a22" stroke-width="2"/>
  <text x="38" y="90" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Pico</text>
  <!-- Pins on Pico -->
  <circle cx="140" cy="100" r="6" fill="#fdd835"/>
  <text x="28" y="112" font-family="monospace" font-size="9" fill="#fdd835">GP14 (button)</text>
  <circle cx="140" cy="125" r="6" fill="#ff7043"/>
  <text x="35" y="137" font-family="monospace" font-size="9" fill="#ff7043">GP26/ADC0</text>
  <circle cx="140" cy="150" r="6" fill="#e53935"/>
  <text x="48" y="162" font-family="monospace" font-size="9" fill="#e53935">3V3 OUT</text>
  <circle cx="140" cy="175" r="6" fill="#263238" stroke="#90a4ae" stroke-width="1.5"/>
  <text x="55" y="187" font-family="monospace" font-size="9" fill="#90a4ae">GND</text>

  <!-- === BUTTON SECTION === -->
  <text x="195" y="55" font-family="monospace" font-size="11" fill="#e0e0e0" font-weight="bold">Tactile button</text>
  <!-- Wire GP14 to button -->
  <line x1="146" y1="100" x2="230" y2="100" stroke="#fdd835" stroke-width="2"/>
  <!-- Button body -->
  <rect x="230" y="85" width="36" height="30" rx="4" fill="#37474f" stroke="#546e7a" stroke-width="2"/>
  <line x1="248" y1="85" x2="248" y2="75" stroke="#90a4ae" stroke-width="1.5"/>
  <line x1="240" y1="75" x2="256" y2="75" stroke="#cfd8dc" stroke-width="2"/>
  <text x="232" y="130" font-family="monospace" font-size="9" fill="#cfd8dc">BTN</text>
  <!-- Button to GND -->
  <line x1="266" y1="100" x2="310" y2="100" stroke="#fdd835" stroke-width="2"/>
  <line x1="310" y1="100" x2="310" y2="175" stroke="#90a4ae" stroke-width="2"/>
  <line x1="146" y1="175" x2="310" y2="175" stroke="#90a4ae" stroke-width="2"/>
  <!-- Pull-down label -->
  <text x="270" y="90" font-family="monospace" font-size="9" fill="#90a4ae">→ GND (pull-down)</text>

  <!-- === POTENTIOMETER SECTION === -->
  <text x="380" y="55" font-family="monospace" font-size="11" fill="#e0e0e0" font-weight="bold">Potentiometer</text>
  <!-- Pot body -->
  <rect x="390" y="80" width="70" height="80" rx="8" fill="#4a148c" stroke="#7b1fa2" stroke-width="2"/>
  <circle cx="425" cy="120" r="22" fill="#2d1b4e" stroke="#9c27b0" stroke-width="1.5"/>
  <line x1="425" y1="100" x2="425" y2="108" stroke="#e1bee7" stroke-width="2"/>
  <!-- 3 terminals -->
  <circle cx="395" cy="170" r="5" fill="#e53935"/>
  <circle cx="425" cy="170" r="5" fill="#ff7043"/>
  <circle cx="455" cy="170" r="5" fill="#263238" stroke="#90a4ae" stroke-width="1.5"/>
  <!-- Labels -->
  <text x="383" y="188" font-family="monospace" font-size="9" fill="#e53935">VCC</text>
  <text x="413" y="188" font-family="monospace" font-size="9" fill="#ff7043">Wiper</text>
  <text x="443" y="188" font-family="monospace" font-size="9" fill="#90a4ae">GND</text>
  <!-- Wire 3V3 to pot VCC -->
  <line x1="146" y1="150" x2="370" y2="150" stroke="#e53935" stroke-width="2"/>
  <line x1="370" y1="150" x2="370" y2="170" stroke="#e53935" stroke-width="2"/>
  <line x1="370" y1="170" x2="390" y2="170" stroke="#e53935" stroke-width="2"/>
  <!-- Wire GP26 ADC to wiper -->
  <line x1="146" y1="125" x2="350" y2="125" stroke="#ff7043" stroke-width="2"/>
  <line x1="350" y1="125" x2="350" y2="195" stroke="#ff7043" stroke-width="2"/>
  <line x1="350" y1="195" x2="425" y2="195" stroke="#ff7043" stroke-width="2"/>
  <line x1="425" y1="195" x2="425" y2="175" stroke="#ff7043" stroke-width="2"/>
  <!-- Wire pot GND to GND bus -->
  <line x1="455" y1="170" x2="480" y2="170" stroke="#90a4ae" stroke-width="2"/>
  <line x1="480" y1="170" x2="480" y2="210" stroke="#90a4ae" stroke-width="2"/>
  <line x1="146" y1="175" x2="480" y2="210" stroke="#90a4ae" stroke-width="1" stroke-dasharray="4,3"/>
</svg>`;

// ---------------------------------------------------------------------------
// SVG: Lesson 4 — servo wired to GP0 + 5V / GND
// ---------------------------------------------------------------------------

const SVG_SERVO_WIRING = `<svg viewBox="0 0 560 230" role="img" aria-label="Hobby servo motor wired to GP0 (signal), VSYS 5V (power) and GND on the Raspberry Pi Pico" xmlns="http://www.w3.org/2000/svg">
  <!-- Pico -->
  <rect x="20" y="50" width="120" height="130" rx="8" fill="#1e7e34" stroke="#145a22" stroke-width="2"/>
  <text x="38" y="80" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Pico</text>
  <!-- Pins -->
  <circle cx="140" cy="95" r="6" fill="#ff7043"/>
  <text x="32" y="107" font-family="monospace" font-size="9" fill="#ff7043">VSYS (5V)</text>
  <circle cx="140" cy="120" r="6" fill="#263238" stroke="#90a4ae" stroke-width="1.5"/>
  <text x="50" y="132" font-family="monospace" font-size="9" fill="#90a4ae">GND</text>
  <circle cx="140" cy="145" r="6" fill="#fdd835"/>
  <text x="33" y="157" font-family="monospace" font-size="9" fill="#fdd835">GP0 (PWM)</text>

  <!-- Servo body -->
  <rect x="330" y="70" width="130" height="90" rx="8" fill="#455a64" stroke="#263238" stroke-width="2"/>
  <rect x="360" y="65" width="70" height="20" rx="6" fill="#37474f" stroke="#546e7a" stroke-width="1.5"/>
  <text x="372" y="79" font-family="monospace" font-size="9" fill="#b0bec5">output shaft</text>
  <circle cx="395" cy="115" r="20" fill="#263238" stroke="#546e7a" stroke-width="2"/>
  <circle cx="395" cy="115" r="6" fill="#607d8b"/>
  <text x="344" y="175" font-family="monospace" font-size="11" fill="#e0e0e0" font-weight="bold">Hobby Servo</text>
  <!-- Servo wires (3-wire connector) -->
  <line x1="330" y1="105" x2="290" y2="105" stroke="#e53935" stroke-width="2.5"/>
  <text x="260" y="100" font-family="monospace" font-size="9" fill="#e53935">Red</text>
  <text x="255" y="112" font-family="monospace" font-size="9" fill="#e53935">+5V</text>
  <line x1="330" y1="120" x2="290" y2="120" stroke="#37474f" stroke-width="2.5" stroke-linecap="round"/>
  <text x="254" y="124" font-family="monospace" font-size="9" fill="#90a4ae">Brown=GND</text>
  <line x1="330" y1="135" x2="290" y2="135" stroke="#ff9800" stroke-width="2.5"/>
  <text x="253" y="139" font-family="monospace" font-size="9" fill="#ff9800">Orange=Signal</text>

  <!-- Wires to Pico -->
  <!-- VSYS → Red servo wire -->
  <line x1="146" y1="95" x2="290" y2="105" stroke="#e53935" stroke-width="2"/>
  <!-- GND → Brown servo wire -->
  <line x1="146" y1="120" x2="290" y2="120" stroke="#90a4ae" stroke-width="2"/>
  <!-- GP0 → Orange signal wire -->
  <line x1="146" y1="145" x2="290" y2="135" stroke="#ff9800" stroke-width="2"/>

  <!-- Caption box -->
  <rect x="30" y="195" width="500" height="28" rx="6" fill="#1a237e" stroke="#283593" stroke-width="1.5"/>
  <text x="42" y="213" font-family="monospace" font-size="10" fill="#90caf9">Note: servo power draws up to 500 mA — power from VSYS (USB 5V), not 3V3.</text>
</svg>`;

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const BLINK_CODE = `from machine import Pin
import utime

# On the Raspberry Pi Pico the built-in LED is on GP25.
# On the Pico W use the string "LED" instead of a number:
#   led = Pin("LED", Pin.OUT)
led = Pin(25, Pin.OUT)

print("Blink demo starting — Ctrl+C to stop")

try:
    while True:
        led.value(1)        # turn LED on (HIGH = 3.3 V on the pin)
        utime.sleep(0.5)    # wait 500 ms
        led.value(0)        # turn LED off
        utime.sleep(0.5)    # wait 500 ms
except KeyboardInterrupt:
    led.value(0)            # make sure LED is off when we stop
    print("Stopped.")
`;

export const BUTTON_ADC_CODE = `from machine import Pin, ADC
import utime

# --- Digital input: tactile button ---
# PULL_DOWN keeps the pin at 0 V when the button is open.
# Pressing the button connects the pin to 3.3 V → reads 1 (HIGH).
button = Pin(14, Pin.IN, Pin.PULL_DOWN)

# --- Analogue input: potentiometer or LDR wired to GP26 (ADC0) ---
# The ADC returns a 16-bit value: 0 (0 V) to 65535 (3.3 V).
pot = ADC(Pin(26))

print("Button + ADC demo — press button or turn the pot")
print("Ctrl+C to stop")
print()

try:
    while True:
        btn_state = button.value()          # 0 = not pressed, 1 = pressed
        raw_adc   = pot.read_u16()          # 0 – 65535
        voltage   = raw_adc * 3.3 / 65535  # convert to volts

        # Show a friendly label for the button state
        label = "PRESSED " if btn_state else "released"

        print(f"Button: {label}  |  ADC raw: {raw_adc:5d}  |  {voltage:.2f} V")
        utime.sleep_ms(200)                 # update 5 times per second

except KeyboardInterrupt:
    print("Stopped.")
`;

export const PWM_SERVO_CODE = `from machine import Pin, PWM
import utime

# -----------------------------------------------------------------------
# 1. Fade a LED on GP15 using PWM
# -----------------------------------------------------------------------
# PWM on the RP2040 runs at up to 125 MHz divided by a 16-bit counter.
# We use 1000 Hz which is fast enough that the LED appears steady.
led_pwm = PWM(Pin(15))
led_pwm.freq(1000)          # 1 kHz PWM frequency

print("Fading LED on GP15...")
for step in range(0, 65536, 512):     # ramp up from 0 % to 100 %
    led_pwm.duty_u16(step)
    utime.sleep_ms(5)
for step in range(65535, -1, -512):   # ramp back down
    led_pwm.duty_u16(step)
    utime.sleep_ms(5)
led_pwm.duty_u16(0)

# -----------------------------------------------------------------------
# 2. Buzzer tone on GP16 — play a simple two-tone beep
# -----------------------------------------------------------------------
buzzer = PWM(Pin(16))

def beep(frequency_hz, duration_ms):
    """Drive the buzzer at frequency_hz for duration_ms milliseconds."""
    buzzer.freq(frequency_hz)
    buzzer.duty_u16(32768)          # 50 % duty cycle = loudest square wave
    utime.sleep_ms(duration_ms)
    buzzer.duty_u16(0)              # silence
    utime.sleep_ms(50)

print("Beeping buzzer on GP16...")
beep(440, 300)   # A4 note
beep(523, 300)   # C5 note
beep(660, 500)   # E5 note
buzzer.deinit()  # release the PWM peripheral

# -----------------------------------------------------------------------
# 3. Control a hobby servo on GP0
# -----------------------------------------------------------------------
# Standard hobby servos expect:
#   - 50 Hz PWM signal (period = 20 ms)
#   - Pulse width 0.5 ms (0°) to 2.5 ms (180°)
# The RP2040 duty_u16 value for a given pulse width (in ms):
#   duty = int(pulse_ms / 20 * 65535)
SERVO_PIN = 0
servo = PWM(Pin(SERVO_PIN))
servo.freq(50)              # 50 Hz = 20 ms period

def set_angle(degrees):
    """Move servo to an angle between 0 and 180 degrees."""
    # Map degrees (0–180) to pulse width (0.5 ms – 2.5 ms)
    pulse_ms = 0.5 + (degrees / 180) * 2.0
    duty     = int(pulse_ms / 20.0 * 65535)
    servo.duty_u16(duty)

print("Sweeping servo on GP0: 0° → 90° → 180° → 0°")
for angle in [0, 45, 90, 135, 180, 90, 0]:
    set_angle(angle)
    print(f"  Servo at {angle}°")
    utime.sleep_ms(600)

servo.deinit()
print("Done.")
`;

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------

export const roboPico: CourseModule = {
  meta: {
    title: "Raspberry Pi Pico — MicroPython & Hardware",
    slug: "robo-pico",
    track: "robotics",
    level: "high",
    description:
      "The tiny RP2040 board: blink, buttons, sensors and PWM with MicroPython.",
    coverImage: "/covers/robotics.svg",
    order: 32,
  },

  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1: Meet the Pico
    // -----------------------------------------------------------------------
    {
      title: "Meet the Pico",
      slug: "pico-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## The Raspberry Pi Pico and the RP2040 chip

The **Raspberry Pi Pico** is a microcontroller board built around the **RP2040** — a custom chip designed by the Raspberry Pi Foundation. Unlike the Raspberry Pi 4 (which runs Linux), the Pico is a bare-metal microcontroller: it runs a single program at a time, directly on the hardware. This makes it fast, predictable, and ideal for robotics and sensor work.

### Inside the RP2040

| Feature | Detail |
|---------|--------|
| CPU | Dual-core ARM Cortex-M0+ |
| Clock speed | Up to 133 MHz (overclockable) |
| SRAM | 264 KB on-chip |
| Flash | 2 MB external (on Pico board) |
| GPIO | 26 usable pins (GP0–GP22, GP26–GP28) |
| ADC channels | 3 × 12-bit ADC (GP26, GP27, GP28) + temp sensor |
| PWM channels | 16 (8 independent slices) |
| Interfaces | 2 × UART, 2 × SPI, 2 × I²C, USB 1.1 |
| Price | ~$4 USD (Pico) / ~$6 (Pico W with Wi-Fi) |

The **dual-core** design means you can run two programs simultaneously — for example, one core handles sensor reading while the other drives a motor. In MicroPython you can use the \`_thread\` module to take advantage of this.

### GPIO layout

The board has **40 pins** in two rows of 20. Here is what you need to know:
- **GP0–GP22**: General-purpose digital I/O (input or output, your choice).
- **GP26–GP28**: Digital I/O *and* analogue input (ADC0, ADC1, ADC2).
- **GP25**: Connected to the **built-in green LED** (on Pico W, use the string \`"LED"\`).
- **3V3 (OUT)**: 3.3 V power rail for sensors and modules.
- **VSYS**: Voltage from the USB power supply (nominally 5 V) — use this to power servos.
- **GND**: Common ground — every circuit must share a ground with the Pico.
- **BOOTSEL button**: Hold while plugging USB to enter flash mode (drag-and-drop firmware).

The board diagram below shows the full layout.`),

        svg(SVG_PICO_BOARD, "Raspberry Pi Pico — USB, BOOTSEL, GPIO rows, ADC pins, 3V3 and GND"),

        md(`### MicroPython vs C/C++

The Pico supports two main programming environments:

**MicroPython** — A lean Python 3 interpreter that runs directly on the chip. It includes a REPL (Read-Eval-Print Loop) accessible over USB, so you can type commands and see results instantly. Great for learning, prototyping, and projects where development speed matters more than raw performance.

**C/C++ (Pico SDK)** — Compiles native machine code for maximum speed. Best for projects requiring high-frequency interrupts or real-time audio processing.

For robotics and educational projects, **MicroPython is the recommended choice** — you will write far less boilerplate and can iterate quickly.

### Getting started with Thonny

**Thonny** is the recommended IDE for MicroPython beginners:

1. Download and install [Thonny](https://thonny.org/) (free, Windows / macOS / Linux).
2. Open **Tools → Options → Interpreter**, select *MicroPython (Raspberry Pi Pico)*.
3. Plug in the Pico. Thonny will connect automatically.
4. Type code in the top editor pane and press the green **Run** button to execute it.
5. To make a script run on power-up, save it to the Pico as \`main.py\`.

In **RoboCode Studio** the workflow is identical — write your code, hit Run, and the virtual Pico executes it immediately.`),

        mermaid(
          `flowchart LR
  A([Write .py in Editor]) --> B[Save to Pico as main.py]
  B --> C{Power cycle or reset}
  C --> D[main.py runs automatically]
  D --> E[Hardware responds]
  A2([Quick test via REPL]) --> E`,
          "MicroPython workflow: write → flash → run on Pico",
        ),

        callout("tip", "You do not have to save to main.py every time during development. In Thonny or RoboCode Studio you can run code directly from the editor — it executes from RAM without touching the flash. Only save as main.py when you want the program to run stand-alone."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2: Blink with MicroPython
    // -----------------------------------------------------------------------
    {
      title: "Blink with MicroPython",
      slug: "pico-blink",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Your first hardware program: blink an LED

"Blink" is the "Hello, World!" of microcontrollers — it proves that your code runs, your board is working, and you understand the basic tools. Let's break down exactly what happens.

### The \`machine\` module

MicroPython uses the \`machine\` module to interact with hardware. The most important class is **\`Pin\`**, which represents one GPIO pin on the board:

\`\`\`python
from machine import Pin

led = Pin(25, Pin.OUT)
\`\`\`

This creates a \`Pin\` object for **GP25** (the built-in LED) and configures it as an **output** (we drive the pin; the board does not read it).

### \`utime.sleep\` vs \`time.sleep\`

MicroPython ships a module called \`utime\` (micro-time) that mirrors Python's standard \`time\` module:
- \`utime.sleep(seconds)\` — wait for a number of seconds (accepts decimals: \`0.5\` = 500 ms).
- \`utime.sleep_ms(ms)\` — wait in milliseconds (more precise for short delays).
- \`utime.sleep_us(us)\` — wait in microseconds (for very tight timing).

### The blink loop

The pattern is always the same:
1. Set the pin HIGH (\`led.value(1)\`) — this sends 3.3 V to the pin, turning the LED on.
2. Wait.
3. Set the pin LOW (\`led.value(0)\`) — this pulls the pin to 0 V, turning the LED off.
4. Wait.
5. Repeat forever.

Open the code below in RoboCode Studio and run it. You should see the built-in LED blinking at 1 Hz (once per second).`),

        code("micropython", BLINK_CODE, { filename: "blink.py", openInStudio: true }),

        md(`### Connecting an external LED

The built-in LED is convenient, but you will usually wire external LEDs to your own circuits. The wiring below shows an LED connected from **GP15** through a **330 Ω resistor** to **GND**.

The resistor is **mandatory** — an LED is not a resistor. Without it, the current through the LED is limited only by the pin driver (about 12 mA max on RP2040). Too much current burns out the LED *and* can damage the GPIO pin. A 330 Ω resistor limits current to about 10 mA at 3.3 V — a safe, bright level.`),

        svg(SVG_LED_CIRCUIT, "External LED with 330-ohm resistor connected from GP15 to GND"),

        md(`To blink this external LED instead of the built-in one, change the pin number in the code:

\`\`\`python
led = Pin(15, Pin.OUT)   # external LED on GP15 via 330 Ω resistor
\`\`\`

Everything else in the program stays the same — this is the power of abstraction.`),

        callout("info", "On the original Pico the built-in LED is on GP25. On the Pico W it is connected through a Wi-Fi chip, so you must use Pin(\"LED\", Pin.OUT) instead of Pin(25, Pin.OUT). RoboCode Studio sets the correct board type for you automatically."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3: Reading inputs — button + ADC
    // -----------------------------------------------------------------------
    {
      title: "Reading Inputs: Button & ADC",
      slug: "pico-button-adc",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Listening to the outside world

So far the Pico has only been *talking* (driving an LED). Now let's make it *listen* — reading a button press and an analogue sensor.

### Digital input: the button

A digital input pin can be in one of two states: HIGH (3.3 V) or LOW (0 V). We read those states with \`pin.value()\`.

The tricky part is what happens when nothing is driving the pin. A floating input can read random values as it picks up electrical noise from the environment. We fix this with a **pull resistor**:

- **\`Pin.PULL_UP\`** — connects an internal ~50 kΩ resistor from the pin to 3.3 V. The pin reads HIGH by default. Press the button to pull it LOW.
- **\`Pin.PULL_DOWN\`** — connects an internal ~50 kΩ resistor from the pin to GND. The pin reads LOW by default. Press the button to pull it HIGH.

In our wiring we use \`PULL_DOWN\`, so the logic is intuitive: **0 = not pressed, 1 = pressed**.

\`\`\`python
button = Pin(14, Pin.IN, Pin.PULL_DOWN)

state = button.value()   # returns 0 or 1
\`\`\`

### Analogue input: the ADC

The Pico has three **Analogue-to-Digital Converter (ADC)** inputs on GP26, GP27, and GP28 (labelled ADC0, ADC1, ADC2). An ADC converts a voltage (0 – 3.3 V) into a digital number.

The RP2040 ADC is **12-bit** internally, but MicroPython's \`read_u16()\` method scales the result to **16 bits**: 0 to 65535. This gives higher usable precision when doing arithmetic.

\`\`\`python
from machine import ADC, Pin

pot = ADC(Pin(26))           # potentiometer or LDR on ADC0
raw = pot.read_u16()         # 0 (0 V) – 65535 (3.3 V)
volts = raw * 3.3 / 65535    # convert to actual voltage
\`\`\`

Common analogue sensors you can connect directly to an ADC pin:
- **Potentiometer** — variable voltage divider; great for manual control.
- **LDR (light-dependent resistor)** — resistance changes with light; use in a voltage divider.
- **NTC thermistor** — resistance changes with temperature; same voltage divider trick.

### Wiring diagram`),

        svg(SVG_BUTTON_ADC, "Button wired to GP14 with pull-down, and potentiometer wired to GP26 ADC"),

        md(`Run the program below. Turn the potentiometer (or use the simulated slider in RoboCode Studio) and press the button — you will see both values printed every 200 ms.`),

        code("micropython", BUTTON_ADC_CODE, { filename: "button_adc.py", openInStudio: true }),

        callout("warning", "The Pico GPIO pins are 3.3 V logic — they are NOT 5 V tolerant. Never connect a 5 V sensor output directly to a GPIO pin. Use a level-shifter or a voltage divider (two resistors) to bring the signal down to 3.3 V first, otherwise you risk permanently damaging the RP2040."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4: PWM — LED fade, buzzer, servo
    // -----------------------------------------------------------------------
    {
      title: "PWM: Buzzer, LED Fade & Servo",
      slug: "pico-pwm-servo",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Pulse-Width Modulation (PWM)

A GPIO pin can only be fully ON (3.3 V) or fully OFF (0 V) — it has no in-between. **PWM** gets around this by switching the pin ON and OFF very rapidly and varying *how long* it stays on each cycle.

### Key concepts

| Term | Meaning |
|------|---------|
| **Frequency (Hz)** | How many on/off cycles happen per second. 1000 Hz = 1000 cycles/second. |
| **Period** | Time for one complete cycle. Period = 1 / frequency. 50 Hz → 20 ms period. |
| **Duty cycle** | The fraction of the period the pin is HIGH. 50 % duty = on for half the time. |
| **duty_u16** | MicroPython value 0–65535 representing duty cycle (0 = always off, 65535 = always on). |

### Three uses of PWM

**1. Fading an LED**
Run PWM at 1 kHz or higher. The LED flickers so fast your eye sees it as a continuous brightness level. Increasing the duty cycle increases perceived brightness.

**2. Buzzer tones**
A piezoelectric buzzer is simply a thin disc that vibrates when driven with an alternating signal. Drive it with PWM at an audio frequency (e.g. 440 Hz = A4 note) and it produces a tone. Changing the frequency changes the pitch.

**3. Hobby servo position**
Hobby servos expect a **50 Hz** PWM signal with a pulse width between **0.5 ms** (0°) and **2.5 ms** (180°). The servo's internal circuit measures the pulse width and rotates its output shaft to the corresponding angle. The duty cycle math:

\`\`\`
pulse_ms = 0.5 + (angle / 180) * 2.0   # maps 0–180° to 0.5–2.5 ms
duty_u16 = int(pulse_ms / 20.0 * 65535) # 20 ms period at 50 Hz
\`\`\`

### MicroPython \`PWM\` usage

\`\`\`python
from machine import PWM, Pin

pwm = PWM(Pin(15))     # attach PWM to GP15
pwm.freq(1000)         # set frequency in Hz
pwm.duty_u16(32768)    # set duty cycle (50 %)
pwm.deinit()           # release the PWM channel when done
\`\`\`

### Servo wiring`),

        svg(SVG_SERVO_WIRING, "Hobby servo wired to GP0 (signal), VSYS 5V (power) and GND on the Pico"),

        md(`**Important**: Servo motors draw significant current — a typical micro-servo peaks at 300–500 mA when stalling. Do NOT power a servo from the **3V3** pin (limited to ~300 mA total). Use **VSYS** which connects directly to the USB 5 V bus and can supply up to 1 A or more depending on your USB power source.

The complete program below demonstrates all three PWM uses in sequence: fade the LED, play a short melody on the buzzer, then sweep the servo through its full range.`),

        code("micropython", PWM_SERVO_CODE, { filename: "pwm_servo.py", openInStudio: true }),

        callout("tip", "The RP2040 has 8 independent PWM slices, each shared by two pins. GP0 and GP1 share slice 0, GP2 and GP3 share slice 1, and so on. If you need two truly independent PWM frequencies on different pins, pick pins from different slices (e.g. GP0 and GP2). Picking GP0 and GP1 for two servos with different positions works because they share a frequency but can have independent duty cycles."),
      ),
    },
  ],

  tasks: [
    {
      title: "Challenge: Pico countdown",
      slug: "challenge-pico",
      description:
        "Print the numbers 5, 4, 3, 2, 1 then 'go' — one per line.",
      track: "robotics",
      difficulty: "beginner",
      points: 50,
      language: "micropython",
      starterCode:
        "# Print 5,4,3,2,1 then go (one per line)\nfor i in range(5, 0, -1):\n    print(0)  # fix me\n",
      checks: {
        rules: [
          { type: "stdout_contains", value: "go" },
          { type: "stdout_contains", value: "5" },
        ],
      },
    },
  ],
};
