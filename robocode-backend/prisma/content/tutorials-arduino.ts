import { md, code, mermaid, svg, callout, tryit, exercise, body, type CourseModule } from "./types";
import { SVG_ARDUINO_BOARD, SVG_LED_CIRCUIT } from "./_assets";

// ---------------------------------------------------------------------------
// Lesson 1 — Blink
// ---------------------------------------------------------------------------

const BLINK_SKETCH = `// Blink — the "Hello, World!" of Arduino.
// Turns the built-in LED on and off, once per second.

const int LED_PIN = 13; // most Arduino boards have an LED wired to pin 13

void setup() {
  // setup() runs ONCE when the board powers on or resets.
  pinMode(LED_PIN, OUTPUT); // tell Arduino this pin will drive something
}

void loop() {
  // loop() runs FOREVER after setup() finishes.
  digitalWrite(LED_PIN, HIGH); // turn the LED on (HIGH = 5V)
  delay(1000);                 // pause for 1000 milliseconds (1 second)
  digitalWrite(LED_PIN, LOW);  // turn the LED off (LOW = 0V)
  delay(1000);                 // pause for 1000 milliseconds
}`;

const BLINK_FAST_TRYIT = `const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(150);   // <- try changing this number
  digitalWrite(LED_PIN, LOW);
  delay(150);   // <- and this one
}`;

const BLINK_EXERCISE_STARTER = `const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(1000); // make the LED stay on for 2 seconds instead
  digitalWrite(LED_PIN, LOW);
  delay(1000); // make the LED stay off for 2 seconds instead
}`;

const BLINK_EXERCISE_SOLUTION = `const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(2000); // LED on for 2 seconds
  digitalWrite(LED_PIN, LOW);
  delay(2000); // LED off for 2 seconds
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Serial.println()
// ---------------------------------------------------------------------------

const SERIAL_SKETCH = `// Talking to your computer over the Serial Monitor

int count = 0;

void setup() {
  Serial.begin(9600); // open the serial connection at 9600 baud
  Serial.println("Arduino ready!");
}

void loop() {
  Serial.print("Count: ");
  Serial.println(count); // println adds a line break after the value

  count++;
  delay(1000);
}`;

const SERIAL_EXERCISE_STARTER = `int count = 10;

void setup() {
  Serial.begin(9600);
}

void loop() {
  // TODO: print count, then decrease it by 1 each time round the loop.
  // When count reaches 0, print "liftoff!" once and then stop
  // (an empty while(true){} loop is a simple way to "stop").
}`;

const SERIAL_EXERCISE_SOLUTION = `int count = 10;

void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println(count);
  count--;

  if (count < 0) {
    Serial.println("liftoff!");
    while (true) { /* do nothing forever */ }
  }

  delay(500);
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Digital input (button)
// ---------------------------------------------------------------------------

const BUTTON_SKETCH = `// Read a pushbutton wired between pin 2 and GND

const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);

  // INPUT_PULLUP turns on Arduino's internal pull-up resistor:
  // the pin reads HIGH normally, and LOW when the button pulls it to GND.
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == LOW) { // LOW means the button IS pressed
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button pressed - LED on");
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(50); // small pause keeps the Serial Monitor readable
}`;

const BUTTON_EXERCISE_STARTER = `// This board is wired with an EXTERNAL pull-down resistor instead:
// the button connects the pin to 5V when pressed, and a resistor
// holds it at 0V (LOW) the rest of the time.
//
// Rewrite the sketch below so the LED turns on when the button
// reads HIGH instead of LOW, using plain INPUT (not INPUT_PULLUP).

const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP); // fix me: should be a plain INPUT
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == LOW) { // fix me: pressed now reads HIGH, not LOW
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(50);
}`;

const BUTTON_EXERCISE_SOLUTION = `const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT); // external pull-down resistor does the work
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == HIGH) { // pressed now reads HIGH
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button pressed - LED on");
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(50);
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Analog input (analogRead)
// ---------------------------------------------------------------------------

const ANALOG_SKETCH = `// Read a potentiometer (or LDR) on analog pin A0

const int POT_PIN = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int rawValue = analogRead(POT_PIN); // Arduino UNO ADC: 0-1023 (10-bit)

  // Convert the 0-1023 range to millivolts (Arduino UNO runs at 5V)
  int voltageMv = map(rawValue, 0, 1023, 0, 5000);

  Serial.print("Raw: ");
  Serial.print(rawValue);
  Serial.print("  Voltage: ");
  Serial.print(voltageMv);
  Serial.println(" mV");

  delay(200); // read 5 times per second
}`;

const ANALOG_PERCENT_TRYIT = `const int POT_PIN = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int rawValue = analogRead(POT_PIN);
  int percent = map(rawValue, 0, 1023, 0, 100); // <- map to 0-100 instead

  Serial.print("Percent: ");
  Serial.print(percent);
  Serial.println(" %");

  delay(200);
}`;

const ANALOG_EXERCISE_STARTER = `// A light sensor (LDR) is wired to A1 instead of a potentiometer on A0.
// Fix the pin, and print "DARK" when the raw reading is below 300,
// otherwise print "BRIGHT".

const int LDR_PIN = A0; // fix me: should read A1

void setup() {
  Serial.begin(9600);
}

void loop() {
  int rawValue = analogRead(LDR_PIN);

  // TODO: print "DARK" if rawValue < 300, else print "BRIGHT"
  Serial.println(rawValue);

  delay(300);
}`;

const ANALOG_EXERCISE_SOLUTION = `const int LDR_PIN = A1;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int rawValue = analogRead(LDR_PIN);

  if (rawValue < 300) {
    Serial.println("DARK");
  } else {
    Serial.println("BRIGHT");
  }

  delay(300);
}`;

// ---------------------------------------------------------------------------
// Lesson 5 — PWM / analogWrite (fade)
// ---------------------------------------------------------------------------

const FADE_SKETCH = `// Fade an LED in and out using PWM

const int LED_PIN = 9; // must be a PWM pin (marked with a ~ on the board)

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // Fade IN: 0 (off) up to 255 (full brightness)
  for (int brightness = 0; brightness <= 255; brightness++) {
    analogWrite(LED_PIN, brightness);
    delay(10);
  }

  // Fade OUT: 255 back down to 0
  for (int brightness = 255; brightness >= 0; brightness--) {
    analogWrite(LED_PIN, brightness);
    delay(10);
  }
}`;

const FADE_EXERCISE_STARTER = `const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  for (int brightness = 0; brightness <= 255; brightness++) {
    analogWrite(LED_PIN, brightness);
    delay(10);
  }

  // TODO: once the LED reaches full brightness (255), hold it there
  // for 500 milliseconds before fading back out.

  for (int brightness = 255; brightness >= 0; brightness--) {
    analogWrite(LED_PIN, brightness);
    delay(10);
  }
}`;

const FADE_EXERCISE_SOLUTION = `const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  for (int brightness = 0; brightness <= 255; brightness++) {
    analogWrite(LED_PIN, brightness);
    delay(10);
  }

  delay(500); // hold at full brightness for half a second

  for (int brightness = 255; brightness >= 0; brightness--) {
    analogWrite(LED_PIN, brightness);
    delay(10);
  }
}`;

// ---------------------------------------------------------------------------
// Lesson 6 — Project: LED + button lamp
// ---------------------------------------------------------------------------

const PROJECT_SKETCH = `// Project: a "push-button lamp"
// Each press TOGGLES the LED - it stays on (or off) until pressed again.

const int BUTTON_PIN = 2;
const int LED_PIN = 13;

bool ledOn = false;
int lastButtonState = HIGH; // HIGH = not pressed, thanks to INPUT_PULLUP

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Press the button to toggle the lamp");
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  // Only react the MOMENT the button goes from not-pressed to pressed
  // (this stops one press from toggling the lamp many times per second)
  if (buttonState == LOW && lastButtonState == HIGH) {
    ledOn = !ledOn; // flip true <-> false
    digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
    Serial.println(ledOn ? "Lamp ON" : "Lamp OFF");
    delay(200); // simple debounce: ignore extra bounces for 200ms
  }

  lastButtonState = buttonState;
}`;

const PROJECT_EXERCISE_STARTER = `// Add a second LED on pin 12 that is lit whenever the lamp (pin 13)
// is OFF - so exactly one of the two LEDs is on at all times.

const int BUTTON_PIN = 2;
const int LED_PIN = 13;
const int NIGHT_LED_PIN = 12; // TODO: configure this pin as an OUTPUT too

bool ledOn = false;
int lastButtonState = HIGH;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == LOW && lastButtonState == HIGH) {
    ledOn = !ledOn;
    digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
    // TODO: set NIGHT_LED_PIN to the opposite of ledOn
    delay(200);
  }

  lastButtonState = buttonState;
}`;

const PROJECT_EXERCISE_SOLUTION = `const int BUTTON_PIN = 2;
const int LED_PIN = 13;
const int NIGHT_LED_PIN = 12;

bool ledOn = false;
int lastButtonState = HIGH;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(NIGHT_LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == LOW && lastButtonState == HIGH) {
    ledOn = !ledOn;
    digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
    digitalWrite(NIGHT_LED_PIN, ledOn ? LOW : HIGH);
    delay(200);
  }

  lastButtonState = buttonState;
}`;

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------

export const arduinoTutorialCourse: CourseModule = {
  meta: {
    title: "Arduino Tutorial",
    slug: "tutorial-arduino",
    track: "robotics",
    level: "primary",
    description:
      "Learn Arduino step by step: blink LEDs, print to Serial, read buttons and sensors, and fade LEDs with PWM — every example runs live on a simulated board in RoboCode Studio.",
    coverImage: "/covers/robotics.svg",
    order: 60,
    language: "arduino",
  },

  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1 — Blink
    // -----------------------------------------------------------------------
    {
      title: "Arduino Blink",
      slug: "tut-arduino-blink",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## Your first Arduino program

**Arduino** is a small microcontroller board you can program with C++ to control LEDs, motors, and sensors. Every Arduino program (called a **sketch**) has exactly two functions:

- **\`setup()\`** — runs **once** when the board powers on. Use it to configure pins.
- **\`loop()\`** — runs **forever**, over and over, after \`setup()\` finishes. Your main logic goes here.

A **pin** is one of the metal connectors on the board. Before you use a pin, you must tell Arduino whether it is an **output** (the board drives a voltage onto it) or an **input** (the board reads a voltage from it) — that is what \`pinMode()\` does.`),
        svg(SVG_ARDUINO_BOARD, "Arduino UNO board with labeled digital pins, analog pins, and the built-in LED on pin 13"),
        md(`## The Blink example

Almost every Arduino board has a small LED already wired to **pin 13**. That means you can run your very first sketch without connecting anything at all.

Four functions do all the work:

| Function | What it does |
|---|---|
| \`pinMode(pin, OUTPUT)\` | Configure a pin to drive voltage out |
| \`digitalWrite(pin, HIGH)\` | Set the pin to 5 V (LED on) |
| \`digitalWrite(pin, LOW)\` | Set the pin to 0 V (LED off) |
| \`delay(ms)\` | Pause the program for \`ms\` milliseconds |

Open the sketch below in RoboCode Studio and press **Run** — the LED on the simulated board will blink once per second.`),
        code("arduino", BLINK_SKETCH, { filename: "blink.ino", openInStudio: true }),
        callout("tip", "delay() pauses your ENTIRE program — nothing else can happen while it waits. That is fine for a simple blink, but later on (buttons, sensors) you will want your board to stay responsive, which needs a different technique called 'millis() timing'. For now, delay() is perfectly fine."),
        md(`## Try it yourself

Small edits like changing a \`delay()\` value are the fastest way to build intuition. Edit the snippet below and click **Open in Studio** to see the effect on the simulated LED.`),
        tryit("arduino", BLINK_FAST_TRYIT, {
          caption: "Change both delay(150) values and click Open in Studio to make the LED blink faster or slower on the simulated board.",
        }),
        exercise(
          "arduino",
          "The LED currently blinks once per second (on 1000 ms, off 1000 ms). Change the sketch so it blinks once every 4 seconds instead — on for 2000 ms, off for 2000 ms.",
          BLINK_EXERCISE_STARTER,
          BLINK_EXERCISE_SOLUTION,
          { caption: "Hint: delay() takes a number of milliseconds. 2 seconds = 2000 ms." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2 — Serial.println()
    // -----------------------------------------------------------------------
    {
      title: "Serial.println() — Talking to Your Computer",
      slug: "tut-arduino-serial",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## The Serial Monitor

Blinking an LED is great, but how do you know what your program is *thinking*? The **Serial Monitor** is a text window in RoboCode Studio that shows messages your sketch sends over a virtual USB connection.

To use it, you need three things:

1. \`Serial.begin(9600)\` in \`setup()\` — opens the connection at 9600 **baud** (bits per second). Both sides must agree on this number.
2. \`Serial.print(value)\` — sends text or a number, and stays on the same line.
3. \`Serial.println(value)\` — sends text or a number, then moves to a new line (the "ln" means "line").

\`\`\`arduino
Serial.print("Count: ");   // no new line after this
Serial.println(count);     // prints count, THEN a new line
\`\`\``),
        md(`## Example: a counting sketch

The sketch below starts the Serial connection, prints a ready message, then counts upward forever — printing a new line every second.`),
        code("arduino", SERIAL_SKETCH, { filename: "serial_counter.ino", openInStudio: true }),
        callout("info", "Serial.print() and Serial.println() both accept numbers (int, float) as well as text in quotes. Arduino automatically converts the number to readable digits for you — you never need to do that conversion yourself."),
        md(`## Reference

| Function | Example | Result on Serial Monitor |
|---|---|---|
| \`Serial.begin(baud)\` | \`Serial.begin(9600);\` | Opens the connection |
| \`Serial.print(x)\` | \`Serial.print("x = ");\` | Prints, stays on the line |
| \`Serial.println(x)\` | \`Serial.println(42);\` | Prints \`42\`, then a new line |`),
        exercise(
          "arduino",
          "Rewrite the counter so it counts DOWN from 10 to 0 (printing each number), and once it passes 0, prints 'liftoff!' exactly once and then stops.",
          SERIAL_EXERCISE_STARTER,
          SERIAL_EXERCISE_SOLUTION,
          { caption: "Hint: an empty while (true) {} loop is a simple way to make loop() stop doing anything further." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3 — Digital input (button)
    // -----------------------------------------------------------------------
    {
      title: "Digital Input — Reading a Button",
      slug: "tut-arduino-digital-input",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## From output to input

So far every pin has been an **output** — the board decided the voltage. Now let's make the board **listen**: read whether a button is pressed.

\`digitalRead(pin)\` returns one of two values:
- \`HIGH\` — the pin is reading close to 5 V
- \`LOW\` — the pin is reading close to 0 V

### The floating-pin problem

An input pin that is not connected to anything definite can pick up electrical noise and read randomly. The fix is a **pull resistor**, which gently holds the pin at a known level until something (like a button press) overrides it.

Arduino has a built-in pull-up resistor you can enable in software — no extra parts required:

\`\`\`arduino
pinMode(BUTTON_PIN, INPUT_PULLUP);
\`\`\`

With \`INPUT_PULLUP\`, the pin reads \`HIGH\` normally, and \`LOW\` the moment the button connects it to GND. This is why "pressed" is checked with \`== LOW\`, which can feel backwards the first time you see it!`),
        md(`## Example: LED follows the button

Wire a pushbutton between pin 2 and GND (or use the simulated button in RoboCode Studio). While the button is held down, the on-board LED lights up and a message prints to Serial.`),
        code("arduino", BUTTON_SKETCH, { filename: "button_led.ino", openInStudio: true }),
        callout("warning", "Never leave a digital input pin unconnected while reading it in a real circuit — always use INPUT_PULLUP, INPUT_PULLDOWN (on boards that support it), or an external resistor. A floating pin can flicker between HIGH and LOW unpredictably."),
        md(`## Reference

| pinMode() value | Pin reads normally | Pin reads when button pressed (to GND) |
|---|---|---|
| \`INPUT_PULLUP\` | \`HIGH\` | \`LOW\` |
| \`INPUT\` + external pull-down resistor | \`LOW\` | \`HIGH\` |`),
        exercise(
          "arduino",
          "This board uses an EXTERNAL pull-down resistor instead of the internal pull-up — the button connects the pin to 5V when pressed. Change pinMode() to a plain INPUT, and flip the condition so the LED turns on when the button reads HIGH.",
          BUTTON_EXERCISE_STARTER,
          BUTTON_EXERCISE_SOLUTION,
          { caption: "Hint: with an external pull-down resistor, 'pressed' now means HIGH, not LOW." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4 — Analog input (analogRead)
    // -----------------------------------------------------------------------
    {
      title: "Analog Input — analogRead()",
      slug: "tut-arduino-analog-input",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Reading a range of voltages

Digital pins only know HIGH or LOW. But the real world is analog — light, sound, and turning a knob all vary *smoothly*. To read these, Arduino UNO has six **analog input pins**, labeled **A0 to A5**, each connected to a **10-bit ADC** (Analog-to-Digital Converter).

"10-bit" means the ADC divides the 0 – 5 V input range into 2¹⁰ = **1024** steps, numbered **0 to 1023**:

| Voltage on the pin | \`analogRead()\` result |
|---|---|
| 0 V | 0 |
| 2.5 V | ~512 |
| 5 V | 1023 |

A **potentiometer** (a knob-adjustable resistor) is the classic way to test this: wire its two outer legs to 5V and GND, and its middle leg (the wiper) to A0. Turning the knob sweeps the reading from 0 to 1023.`),
        code("arduino", ANALOG_SKETCH, { filename: "analog_read.ino", openInStudio: true }),
        callout("tip", "map(value, fromLow, fromHigh, toLow, toHigh) is a handy built-in function that rescales a number from one range to another. Here we use it to turn the raw 0-1023 ADC reading into millivolts (0-5000), but you can map to any range you like — percentages, angles, colors."),
        md(`## Try it yourself

The snippet below maps the same raw reading to a 0–100 percentage instead of millivolts.`),
        tryit("arduino", ANALOG_PERCENT_TRYIT, {
          caption: "Turn the simulated potentiometer in RoboCode Studio and watch the percentage change from 0% to 100%.",
        }),
        md(`## Reference

| Board | ADC resolution | \`analogRead()\` range |
|---|---|---|
| Arduino UNO | 10-bit | 0 – 1023 |
| ESP32 | 12-bit | 0 – 4095 |`),
        exercise(
          "arduino",
          "A light sensor (LDR) is wired to A1, not A0. Fix the pin constant, then print 'DARK' when the raw reading is below 300, otherwise print 'BRIGHT'.",
          ANALOG_EXERCISE_STARTER,
          ANALOG_EXERCISE_SOLUTION,
          { caption: "Hint: use an if / else on rawValue < 300." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 5 — PWM / analogWrite (fade)
    // -----------------------------------------------------------------------
    {
      title: "PWM — analogWrite() & Fading LEDs",
      slug: "tut-arduino-pwm-fade",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Faking an "in-between" voltage

A digital pin can only be fully ON (5 V) or fully OFF (0 V) — there is no dial in between. **PWM** (Pulse-Width Modulation) fakes an in-between brightness by switching the pin on and off very fast and changing *how long* it stays on during each cycle.

\`analogWrite(pin, value)\` takes a \`value\` from **0 to 255**:
- \`0\` — always off (0 % of the time on)
- \`128\` — roughly half brightness (~50 % of the time on)
- \`255\` — always on (100 % of the time on)

Not every pin supports PWM — only the ones marked with a **~** (tilde) next to the number on the board silkscreen. On the Arduino UNO, those are pins **3, 5, 6, 9, 10, and 11**.`),
        svg(SVG_LED_CIRCUIT, "An LED in series with a 220-ohm resistor, wired to a PWM-capable pin and GND"),
        md(`## Example: fading an LED

The sketch below ramps an LED smoothly from off to full brightness, then back down again, using two \`for\` loops.`),
        code("arduino", FADE_SKETCH, { filename: "fade.ino", openInStudio: true }),
        callout("info", "PWM frequency on the Arduino UNO is around 490 Hz or 980 Hz depending on the pin — far too fast for your eye (or most sensors) to notice the flicker, so an LED just looks dimmer or brighter."),
        exercise(
          "arduino",
          "Add a 500 millisecond pause once the LED reaches full brightness (255), before it starts fading back out.",
          FADE_EXERCISE_STARTER,
          FADE_EXERCISE_SOLUTION,
          { caption: "Hint: a single delay(500) call between the two for loops is all you need." },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 6 — Project: LED + button
    // -----------------------------------------------------------------------
    {
      title: "Project: LED + Button Lamp",
      slug: "tut-arduino-project-led-button",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Put it all together

Time to combine everything from this tutorial — digital output, digital input, and variables — into a small real project: a **push-button lamp**. Unlike the button lesson earlier (LED lit only while held), this lamp should **toggle**: one press turns it on, the next press turns it off, and it stays that way in between.

### The trick: edge detection

If you just check "is the button LOW right now?" every loop, the lamp will flicker on and off dozens of times during a single press (\`loop()\` runs thousands of times per second). Instead, we remember the **previous** reading and only react at the exact moment it changes from not-pressed to pressed:

\`\`\`arduino
if (buttonState == LOW && lastButtonState == HIGH) {
  // this is the FIRST loop() where we noticed the press
  ledOn = !ledOn;
}
lastButtonState = buttonState;
\`\`\`

This pattern — detecting a *change*, not just a *state* — is one of the most useful ideas in embedded programming.`),
        mermaid(
          `flowchart TD
  A([loop starts]) --> B{button LOW now\nAND was HIGH last time?}
  B -- yes --> C[flip ledOn]
  C --> D[digitalWrite LED_PIN]
  D --> E[Serial.println state]
  E --> F[delay 200ms debounce]
  B -- no --> G[remember buttonState]
  F --> G
  G --> A`,
          "Toggle-lamp logic: only react on the moment the button transitions from released to pressed",
        ),
        code("arduino", PROJECT_SKETCH, { filename: "toggle_lamp.ino", openInStudio: true }),
        callout("tip", "This press-once-to-toggle pattern is exactly how real light switches, power buttons, and menu selectors work in countless consumer devices. Once you have digital input + a remembered state, you can build almost any interactive gadget."),
        exercise(
          "arduino",
          "Add a second LED on pin 12 that lights up whenever the lamp (pin 13) is OFF, so exactly one of the two LEDs is lit at all times.",
          PROJECT_EXERCISE_STARTER,
          PROJECT_EXERCISE_SOLUTION,
          { caption: "Hint: don't forget to set pinMode(NIGHT_LED_PIN, OUTPUT) in setup() too." },
        ),
      ),
    },
  ],
};
