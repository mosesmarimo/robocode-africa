import { md, code, mermaid, svg, callout, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// SVG: Pico board overview (compact)
// ---------------------------------------------------------------------------

const SVG_PICO_OVERVIEW = `<svg viewBox="0 0 600 220" role="img" aria-label="Raspberry Pi Pico board with labeled GP25 built-in LED, GP14, GP15, GP26 ADC0, 3V3 and GND pins" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="360" height="180" rx="12" ry="12" fill="#1e7e34" stroke="#145a22" stroke-width="2.5"/>
  <text x="55" y="46" font-family="monospace" font-size="13" fill="#ffffff" font-weight="bold">Raspberry Pi Pico</text>
  <rect x="20" y="90" width="26" height="44" rx="4" fill="#bdbdbd" stroke="#757575" stroke-width="1.5"/>
  <text x="6" y="150" font-family="monospace" font-size="9" fill="#e0e0e0">USB</text>
  <rect x="150" y="90" width="90" height="60" rx="6" fill="#121212" stroke="#37474f" stroke-width="1.5"/>
  <text x="158" y="114" font-family="monospace" font-size="10" fill="#b0bec5">RP2040</text>
  <text x="158" y="130" font-family="monospace" font-size="9" fill="#546e7a">133 MHz</text>
  <text x="158" y="144" font-family="monospace" font-size="9" fill="#546e7a">dual-core</text>
  <circle cx="90" cy="34" r="5" fill="#fdd835"/>
  <text x="60" y="18" font-family="monospace" font-size="9" fill="#fdd835">GP14</text>
  <circle cx="120" cy="34" r="5" fill="#fdd835"/>
  <text x="105" y="18" font-family="monospace" font-size="9" fill="#fdd835">GP15</text>
  <line x1="120" y1="34" x2="120" y2="55" stroke="#fdd835" stroke-width="1" stroke-dasharray="3,2"/>
  <circle cx="280" cy="34" r="5" fill="#ff7043"/>
  <text x="255" y="18" font-family="monospace" font-size="9" fill="#ff7043">GP26/ADC0</text>
  <circle cx="320" cy="186" r="5" fill="#e53935"/>
  <text x="308" y="204" font-family="monospace" font-size="9" fill="#e53935">3V3</text>
  <circle cx="345" cy="186" r="5" fill="#263238"/>
  <text x="335" y="204" font-family="monospace" font-size="9" fill="#90a4ae">GND</text>
  <circle cx="430" cy="70" r="11" fill="#66bb6a" stroke="#388e3c" stroke-width="1.5"/>
  <text x="450" y="66" font-family="monospace" font-size="10" fill="#66bb6a">Built-in LED</text>
  <text x="450" y="80" font-family="monospace" font-size="10" fill="#66bb6a">GP25 (Pin(25))</text>
  <rect x="410" y="110" width="170" height="80" rx="8" fill="#0d0d0d" stroke="#37474f" stroke-width="1.5"/>
  <text x="424" y="130" font-family="monospace" font-size="10" fill="#ffd54f" font-weight="bold">Pico key facts</text>
  <text x="424" y="146" font-family="monospace" font-size="9" fill="#90a4ae">GP0-GP22, GP26-GP28 usable</text>
  <text x="424" y="160" font-family="monospace" font-size="9" fill="#90a4ae">3.3 V logic (not 5 V!)</text>
  <text x="424" y="174" font-family="monospace" font-size="9" fill="#90a4ae">REPL over USB serial</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 1 — Blink
// ---------------------------------------------------------------------------

const BLINK_PY = `from machine import Pin
import utime

# On the Raspberry Pi Pico, the built-in LED is on GP25.
# (On a Pico W, use Pin("LED", Pin.OUT) instead.)
led = Pin(25, Pin.OUT)

while True:
    led.value(1)        # turn the LED on (3.3 V on the pin)
    utime.sleep(1)       # wait 1 second
    led.value(0)        # turn the LED off (0 V on the pin)
    utime.sleep(1)       # wait 1 second`;

const BLINK_FAST_TRYIT = `from machine import Pin
import utime

led = Pin(25, Pin.OUT)

while True:
    led.value(1)
    utime.sleep(0.15)   # <- try changing this number
    led.value(0)
    utime.sleep(0.15)   # <- and this one`;

const BLINK_EXERCISE_STARTER = `from machine import Pin
import utime

led = Pin(25, Pin.OUT)

while True:
    led.value(1)
    utime.sleep(1)   # make the LED stay on for 2 seconds instead
    led.value(0)
    utime.sleep(1)   # make the LED stay off for 2 seconds instead`;

const BLINK_EXERCISE_SOLUTION = `from machine import Pin
import utime

led = Pin(25, Pin.OUT)

while True:
    led.value(1)
    utime.sleep(2)   # LED on for 2 seconds
    led.value(0)
    utime.sleep(2)   # LED off for 2 seconds`;

// ---------------------------------------------------------------------------
// Lesson 2 — print() to the REPL
// ---------------------------------------------------------------------------

const PRINT_PY = `import utime

count = 0

print("Pico ready!")

while True:
    print(f"Count: {count}")
    count += 1
    utime.sleep(1)`;

const PRINT_EXERCISE_STARTER = `import utime

count = 10

while True:
    # TODO: print count, then decrease it by 1 each time round the loop.
    # When count reaches 0, print "liftoff!" once and then stop
    # (a plain 'break' will exit the while loop).
    pass`;

const PRINT_EXERCISE_SOLUTION = `import utime

count = 10

while True:
    print(count)
    count -= 1

    if count < 0:
        print("liftoff!")
        break

    utime.sleep(0.5)`;

// ---------------------------------------------------------------------------
// Lesson 3 — Button input (Pin.IN)
// ---------------------------------------------------------------------------

const BUTTON_PY = `from machine import Pin
import utime

# PULL_DOWN keeps the pin at 0 V (LOW) when the button is open.
# Pressing the button connects the pin to 3.3 V -> reads 1 (HIGH).
button = Pin(14, Pin.IN, Pin.PULL_DOWN)
led = Pin(25, Pin.OUT)

while True:
    if button.value() == 1:   # 1 means the button IS pressed
        led.value(1)
        print("Button pressed - LED on")
    else:
        led.value(0)

    utime.sleep_ms(50)   # small pause keeps the REPL output readable`;

const BUTTON_EXERCISE_STARTER = `# This board wires the button with an internal PULL_UP resistor instead:
# the pin reads 1 (HIGH) normally, and 0 (LOW) when pressed to GND.
#
# Rewrite the code so the LED turns on when button.value() is 0.

from machine import Pin
import utime

button = Pin(14, Pin.IN, Pin.PULL_DOWN)  # fix me: should be Pin.PULL_UP
led = Pin(25, Pin.OUT)

while True:
    if button.value() == 1:   # fix me: pressed now reads 0, not 1
        led.value(1)
    else:
        led.value(0)

    utime.sleep_ms(50)`;

const BUTTON_EXERCISE_SOLUTION = `from machine import Pin
import utime

button = Pin(14, Pin.IN, Pin.PULL_UP)
led = Pin(25, Pin.OUT)

while True:
    if button.value() == 0:   # pressed now reads 0 with a pull-up
        led.value(1)
        print("Button pressed - LED on")
    else:
        led.value(0)

    utime.sleep_ms(50)`;

// ---------------------------------------------------------------------------
// Lesson 4 — Analog input (ADC)
// ---------------------------------------------------------------------------

const ADC_PY = `from machine import ADC, Pin
import utime

# GP26 is one of three ADC-capable pins on the Pico (GP26/27/28 = ADC0/1/2)
pot = ADC(Pin(26))

while True:
    raw = pot.read_u16()          # 0 (0 V) to 65535 (3.3 V)
    voltage = raw * 3.3 / 65535   # convert to volts

    print(f"Raw: {raw}  Voltage: {voltage:.2f} V")
    utime.sleep_ms(200)   # read 5 times per second`;

const ADC_PERCENT_TRYIT = `from machine import ADC, Pin
import utime

pot = ADC(Pin(26))

while True:
    raw = pot.read_u16()
    percent = raw * 100 // 65535   # <- map to 0-100 instead of volts

    print(f"Percent: {percent}%")
    utime.sleep_ms(200)`;

const ADC_EXERCISE_STARTER = `# A light sensor (LDR + resistor divider) is wired to GP27, not GP26.
# Fix the pin, then print "DARK" when the raw reading is below 20000,
# otherwise print "BRIGHT".

from machine import ADC, Pin
import utime

ldr = ADC(Pin(26))   # fix me: should be Pin(27)

while True:
    raw = ldr.read_u16()
    # TODO: print "DARK" if raw < 20000, else print "BRIGHT"
    print(raw)
    utime.sleep_ms(300)`;

const ADC_EXERCISE_SOLUTION = `from machine import ADC, Pin
import utime

ldr = ADC(Pin(27))

while True:
    raw = ldr.read_u16()

    if raw < 20000:
        print("DARK")
    else:
        print("BRIGHT")

    utime.sleep_ms(300)`;

// ---------------------------------------------------------------------------
// Lesson 5 — PWM (fade)
// ---------------------------------------------------------------------------

const PWM_PY = `from machine import Pin, PWM
import utime

led_pwm = PWM(Pin(15))
led_pwm.freq(1000)   # 1 kHz - fast enough that the eye sees a steady glow

while True:
    # Fade IN: 0 up to 65535 (full brightness)
    for duty in range(0, 65536, 512):
        led_pwm.duty_u16(duty)
        utime.sleep_ms(5)

    # Fade OUT: 65535 back down to 0
    for duty in range(65535, -1, -512):
        led_pwm.duty_u16(duty)
        utime.sleep_ms(5)`;

const PWM_EXERCISE_STARTER = `from machine import Pin, PWM
import utime

led_pwm = PWM(Pin(15))
led_pwm.freq(1000)

while True:
    for duty in range(0, 65536, 512):
        led_pwm.duty_u16(duty)
        utime.sleep_ms(5)

    # TODO: once the LED reaches full brightness, hold it there
    # for 500 milliseconds before fading back out.

    for duty in range(65535, -1, -512):
        led_pwm.duty_u16(duty)
        utime.sleep_ms(5)`;

const PWM_EXERCISE_SOLUTION = `from machine import Pin, PWM
import utime

led_pwm = PWM(Pin(15))
led_pwm.freq(1000)

while True:
    for duty in range(0, 65536, 512):
        led_pwm.duty_u16(duty)
        utime.sleep_ms(5)

    utime.sleep_ms(500)   # hold at full brightness for half a second

    for duty in range(65535, -1, -512):
        led_pwm.duty_u16(duty)
        utime.sleep_ms(5)`;

// ---------------------------------------------------------------------------
// Lesson 6 — Project: button-controlled lamp
// ---------------------------------------------------------------------------

const PROJECT_PY = `from machine import Pin
import utime

# Project: a "push-button lamp"
# Each press TOGGLES the LED - it stays on (or off) until pressed again.

button = Pin(14, Pin.IN, Pin.PULL_DOWN)
led = Pin(25, Pin.OUT)

led_on = False
last_button_state = 0   # 0 = not pressed, thanks to PULL_DOWN

print("Press the button to toggle the lamp")

while True:
    button_state = button.value()

    # Only react the MOMENT the button goes from not-pressed to pressed
    # (this stops one press from toggling the lamp many times per second)
    if button_state == 1 and last_button_state == 0:
        led_on = not led_on
        led.value(1 if led_on else 0)
        print("Lamp ON" if led_on else "Lamp OFF")
        utime.sleep_ms(200)   # simple debounce

    last_button_state = button_state`;

const PROJECT_EXERCISE_STARTER = `# Add a second LED on GP13 that is lit whenever the lamp (GP25) is OFF,
# so exactly one of the two LEDs is on at all times.

from machine import Pin
import utime

button = Pin(14, Pin.IN, Pin.PULL_DOWN)
led = Pin(25, Pin.OUT)
night_led = Pin(13, Pin.OUT)   # TODO: use this pin

led_on = False
last_button_state = 0

while True:
    button_state = button.value()

    if button_state == 1 and last_button_state == 0:
        led_on = not led_on
        led.value(1 if led_on else 0)
        # TODO: set night_led to the opposite of led_on
        utime.sleep_ms(200)

    last_button_state = button_state`;

const PROJECT_EXERCISE_SOLUTION = `from machine import Pin
import utime

button = Pin(14, Pin.IN, Pin.PULL_DOWN)
led = Pin(25, Pin.OUT)
night_led = Pin(13, Pin.OUT)

led_on = False
last_button_state = 0

while True:
    button_state = button.value()

    if button_state == 1 and last_button_state == 0:
        led_on = not led_on
        led.value(1 if led_on else 0)
        night_led.value(0 if led_on else 1)
        utime.sleep_ms(200)

    last_button_state = button_state`;

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------

export const micropythonTutorialCourse: CourseModule = {
  meta: {
    title: "MicroPython Tutorial",
    slug: "tutorial-micropython",
    track: "robotics",
    level: "primary",
    description:
      "Learn MicroPython step by step on the Raspberry Pi Pico: blink an LED, print to the REPL, read buttons and sensors, and fade LEDs with PWM — every example runs live on a simulated board in RoboCode Studio.",
    coverImage: "/covers/robotics.svg",
    order: 61,
    language: "micropython",
  },

  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1 — Blink
    // -----------------------------------------------------------------------
    {
      title: "MicroPython Blink",
      slug: "tut-micropython-blink",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## Your first MicroPython program

**MicroPython** is a lean version of Python 3 that runs directly on a microcontroller — no operating system needed. The **Raspberry Pi Pico** is one of the most popular boards for it, built around the **RP2040** chip.

MicroPython talks to hardware through the \`machine\` module. The most important class is **\`Pin\`**, which represents one GPIO pin on the board:

\`\`\`python
from machine import Pin

led = Pin(25, Pin.OUT)   # GP25 is the Pico's built-in LED, configured as an output
\`\`\`

There is no \`setup()\` / \`loop()\` split like Arduino — a MicroPython script just runs from top to bottom, and \`while True:\` is how you keep a program running forever.`),
        svg(SVG_PICO_OVERVIEW, "Raspberry Pi Pico board with the built-in LED on GP25, plus GP14, GP15, GP26/ADC0, 3V3 and GND pins"),
        md(`## The Blink example

Three things do all the work:

| Code | What it does |
|---|---|
| \`Pin(25, Pin.OUT)\` | Creates a Pin object for GP25, configured as an output |
| \`led.value(1)\` | Drives the pin to 3.3 V (LED on) |
| \`led.value(0)\` | Drives the pin to 0 V (LED off) |
| \`utime.sleep(seconds)\` | Pauses the program for a number of seconds |

Open the program below in RoboCode Studio and press **Run** — the built-in LED on the simulated Pico will blink once per second.`),
        code("micropython", BLINK_PY, { filename: "blink.py", openInStudio: true }),
        callout("tip", "utime is MicroPython's built-in timing module. utime.sleep(seconds) accepts decimals (0.5 = 500 ms), while utime.sleep_ms(ms) and utime.sleep_us(us) let you specify milliseconds or microseconds directly — handy for more precise timing later on."),
        md(`## Try it yourself

Edit the sleep durations below and click **Open in Studio** to see the effect on the simulated LED.`),
        tryit("micropython", BLINK_FAST_TRYIT, {
          caption: "Change both utime.sleep(0.15) calls and click Open in Studio to make the LED blink faster or slower on the simulated board.",
        }),
        exercise(
          "micropython",
          "The LED currently blinks once per second (on 1s, off 1s). Change the code so it blinks once every 4 seconds instead — on for 2 seconds, off for 2 seconds.",
          BLINK_EXERCISE_STARTER,
          BLINK_EXERCISE_SOLUTION,
          { caption: "Hint: utime.sleep() takes a number of seconds, and accepts decimals too." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2 — print() to the REPL
    // -----------------------------------------------------------------------
    {
      title: "print() to the REPL",
      slug: "tut-micropython-print",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## The REPL

The **REPL** (Read-Eval-Print Loop) is MicroPython's live serial console — every \`print()\` call in your script shows up here, in real time, over the same USB connection used to run your code.

\`print()\` works exactly like regular Python:

\`\`\`python
print("Pico ready!")          # prints text
print(count)                  # prints a number
print(f"Count: {count}")      # an f-string mixes text and values together
\`\`\`

An **f-string** (the \`f\` before the opening quote) lets you drop variables straight into a string using \`{curly braces}\` — no manual conversion or string-concatenation needed.`),
        md(`## Example: a counting program

The program below prints a ready message, then counts upward forever — printing a new value every second.`),
        code("micropython", PRINT_PY, { filename: "counter.py", openInStudio: true }),
        callout("info", "print() automatically converts numbers, booleans, and most other values to readable text for you. You only need f-strings (or str()) when you want to mix a value into a larger sentence."),
        md(`## Reference

| Code | Result on the REPL |
|---|---|
| \`print("hello")\` | \`hello\` |
| \`print(42)\` | \`42\` |
| \`print(f"x = {x}")\` | \`x = 7\` (if x is 7) |`),
        exercise(
          "micropython",
          "Rewrite the program so it counts DOWN from 10 to 0 (printing each number), and once it passes 0, prints 'liftoff!' exactly once and then stops.",
          PRINT_EXERCISE_STARTER,
          PRINT_EXERCISE_SOLUTION,
          { caption: "Hint: the break statement immediately exits a while loop." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3 — Button input
    // -----------------------------------------------------------------------
    {
      title: "Button Input — Pin.IN",
      slug: "tut-micropython-button",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## From output to input

So far every pin has been an **output**. Now let's make the board **listen**: read whether a button is pressed, using \`Pin.IN\`.

\`button.value()\` returns one of two numbers:
- \`1\` — the pin is reading close to 3.3 V
- \`0\` — the pin is reading close to 0 V

### Pull resistors

A pin that is not connected to anything definite can read randomly, picking up electrical noise. MicroPython lets you enable an internal pull resistor right when you create the \`Pin\`:

- **\`Pin.PULL_DOWN\`** — the pin reads \`0\` normally; pressing the button connects it to 3.3 V, so it reads \`1\`.
- **\`Pin.PULL_UP\`** — the pin reads \`1\` normally; pressing the button connects it to GND, so it reads \`0\`.

\`\`\`python
button = Pin(14, Pin.IN, Pin.PULL_DOWN)

state = button.value()   # returns 0 or 1
\`\`\``),
        md(`## Example: LED follows the button

Wire a pushbutton between GP14 and 3.3 V (or use the simulated button in RoboCode Studio). While the button is held down, the built-in LED lights up and a message prints to the REPL.`),
        code("micropython", BUTTON_PY, { filename: "button_led.py", openInStudio: true }),
        callout("warning", "Never leave a digital input pin electrically unconnected while reading it on real hardware — always configure Pin.PULL_UP, Pin.PULL_DOWN, or wire an external pull resistor. A floating pin can flicker between 0 and 1 unpredictably."),
        md(`## Reference

| Pin setup | Pin reads normally | Pin reads when button pressed |
|---|---|---|
| \`Pin.PULL_DOWN\` | \`0\` | \`1\` |
| \`Pin.PULL_UP\` | \`1\` | \`0\` |`),
        exercise(
          "micropython",
          "This board wires the button with an internal PULL_UP resistor instead — pressed reads 0, not 1. Change Pin.PULL_DOWN to Pin.PULL_UP, and flip the condition so the LED turns on when button.value() is 0.",
          BUTTON_EXERCISE_STARTER,
          BUTTON_EXERCISE_SOLUTION,
          { caption: "Hint: with a pull-up resistor, 'pressed' now means 0, not 1." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4 — Analog input (ADC)
    // -----------------------------------------------------------------------
    {
      title: "Analog Input — ADC",
      slug: "tut-micropython-adc",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Reading a range of voltages

A \`Pin\` can only be HIGH or LOW. But the real world is analog — light, sound, and turning a knob all vary *smoothly*. The Pico has three **ADC** (Analog-to-Digital Converter) pins — **GP26, GP27, GP28** — that read a continuous voltage instead.

\`\`\`python
from machine import ADC, Pin

pot = ADC(Pin(26))
raw = pot.read_u16()   # 0 (0 V) to 65535 (3.3 V)
\`\`\`

The RP2040's ADC is 12-bit internally, but MicroPython's \`read_u16()\` method always scales the result to a **16-bit** range: **0 to 65535**.

| Voltage on the pin | \`read_u16()\` result |
|---|---|
| 0 V | 0 |
| 1.65 V | ~32768 |
| 3.3 V | 65535 |

A **potentiometer** (a knob-adjustable resistor) is the classic way to test this: wire its two outer legs to 3V3 and GND, and its middle leg (the wiper) to GP26. Turning the knob sweeps the reading from 0 to 65535.`),
        code("micropython", ADC_PY, { filename: "adc_read.py", openInStudio: true }),
        callout("tip", "To convert a raw ADC reading to volts, multiply by 3.3 and divide by 65535 (raw * 3.3 / 65535). This works because read_u16() scales linearly across the Pico's 0-3.3V input range."),
        md(`## Try it yourself

The snippet below maps the same raw reading to a 0–100 percentage instead of volts.`),
        tryit("micropython", ADC_PERCENT_TRYIT, {
          caption: "Turn the simulated potentiometer in RoboCode Studio and watch the percentage change from 0% to 100%.",
        }),
        exercise(
          "micropython",
          "A light sensor (LDR) is wired to GP27, not GP26. Fix the pin, then print 'DARK' when the raw reading is below 20000, otherwise print 'BRIGHT'.",
          ADC_EXERCISE_STARTER,
          ADC_EXERCISE_SOLUTION,
          { caption: "Hint: use an if / else on raw < 20000." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 5 — PWM (fade)
    // -----------------------------------------------------------------------
    {
      title: "PWM — Fading an LED",
      slug: "tut-micropython-pwm",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Faking an "in-between" brightness

A GPIO pin can only be fully ON (3.3 V) or fully OFF (0 V) — there is no dial in between. **PWM** (Pulse-Width Modulation) fakes an in-between brightness by switching the pin on and off very fast and changing *how long* it stays on during each cycle.

MicroPython's \`PWM\` class wraps this up neatly:

\`\`\`python
from machine import PWM, Pin

pwm = PWM(Pin(15))     # attach PWM to GP15
pwm.freq(1000)         # set the switching frequency in Hz
pwm.duty_u16(32768)    # set duty cycle: 0 (always off) to 65535 (always on)
\`\`\`

\`duty_u16(32768)\` is roughly 50% — the pin spends about half of each cycle HIGH — which looks like half brightness to your eye.`),
        md(`## Example: fading an LED

The program below ramps an LED smoothly from off to full brightness, then back down again, using two \`for\` loops with \`range()\`.`),
        code("micropython", PWM_PY, { filename: "fade.py", openInStudio: true }),
        callout("info", "The RP2040 has 8 independent PWM slices, each shared by a pair of pins (GP0/GP1 share slice 0, GP2/GP3 share slice 1, and so on). Pins that share a slice must use the same frequency, but each can still have its own duty cycle."),
        exercise(
          "micropython",
          "Add a 500 millisecond pause once the LED reaches full brightness, before it starts fading back out.",
          PWM_EXERCISE_STARTER,
          PWM_EXERCISE_SOLUTION,
          { caption: "Hint: a single utime.sleep_ms(500) call between the two for loops is all you need." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 6 — Project: button-controlled lamp
    // -----------------------------------------------------------------------
    {
      title: "Project: Button-Controlled Lamp",
      slug: "tut-micropython-project",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Put it all together

Time to combine everything from this tutorial — digital output, digital input, and variables — into a small real project: a **push-button lamp**. Unlike the button lesson earlier (LED lit only while held), this lamp should **toggle**: one press turns it on, the next press turns it off, and it stays that way in between.

### The trick: edge detection

If you just check "is the button pressed right now?" on every loop iteration, the lamp will flicker on and off many times during a single press (the loop runs far faster than a human can press a button). Instead, remember the **previous** reading and only react at the exact moment it changes from not-pressed to pressed:

\`\`\`python
if button_state == 1 and last_button_state == 0:
    # this is the FIRST loop iteration where we noticed the press
    led_on = not led_on
last_button_state = button_state
\`\`\`

This pattern — detecting a *change*, not just a *state* — is one of the most useful ideas in embedded programming.`),
        mermaid(
          `flowchart TD
  A([loop iteration]) --> B{button 1 now\nAND was 0 last time?}
  B -- yes --> C[flip led_on]
  C --> D[led.value]
  D --> E[print state]
  E --> F[sleep 200ms debounce]
  B -- no --> G[remember button_state]
  F --> G
  G --> A`,
          "Toggle-lamp logic: only react on the moment the button transitions from released to pressed",
        ),
        code("micropython", PROJECT_PY, { filename: "toggle_lamp.py", openInStudio: true }),
        callout("tip", "This press-once-to-toggle pattern is exactly how real light switches, power buttons, and menu selectors work in countless consumer devices. Once you have digital input plus a remembered state, you can build almost any interactive gadget."),
        exercise(
          "micropython",
          "Add a second LED on GP13 that lights up whenever the lamp (GP25) is OFF, so exactly one of the two LEDs is lit at all times.",
          PROJECT_EXERCISE_STARTER,
          PROJECT_EXERCISE_SOLUTION,
          { caption: "Hint: night_led.value(0 if led_on else 1) sets the opposite state in one line." },
        ),
      ),
    },
  ],
};
