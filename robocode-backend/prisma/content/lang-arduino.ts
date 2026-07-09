import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";
import { SVG_ARDUINO_BOARD, SVG_LED_CIRCUIT } from "./_assets";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, Arduino
// ---------------------------------------------------------------------------

const HELLO_WORLD = `// Hello, RoboCode! — Arduino blink + serial hello

void setup() {
  // Configure pin 13 as an output (drives the built-in LED)
  pinMode(13, OUTPUT);

  // Start the serial connection at 9600 baud
  Serial.begin(9600);

  // Send our greeting to the Serial Monitor
  Serial.println("Hello, RoboCode!");
  Serial.println("Arduino is ready to blink!");
}

void loop() {
  // Turn the built-in LED ON
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(500);            // wait 500 ms (half a second)

  // Turn the built-in LED OFF
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(500);            // wait 500 ms
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Pins & Variables
// ---------------------------------------------------------------------------

const PINS_VARIABLES_CODE = `// Pins and variables — lighting an external LED with a named constant

// Constants make code readable — change the pin number in ONE place
const int LED_PIN = 13;   // built-in LED on most Arduino UNO boards
const int DELAY_MS = 300; // blink speed in milliseconds

// Variables can change at runtime
int blinkCount = 0;       // how many times we have blinked

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Blink counter starting...");
}

void loop() {
  // Blink the LED
  digitalWrite(LED_PIN, HIGH);
  delay(DELAY_MS);
  digitalWrite(LED_PIN, LOW);
  delay(DELAY_MS);

  // Increment and report the blink count
  blinkCount++;
  Serial.print("Blink #");
  Serial.println(blinkCount);

  // Stop blinking after 10 blinks and go idle
  if (blinkCount >= 10) {
    Serial.println("Done! 10 blinks complete.");
    while (true) { /* do nothing forever */ }
  }
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Conditionals & Loops
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `// Conditionals and loops — SOS blink pattern

const int LED  = 13;
const int DOT  = 150;   // short flash
const int DASH = 450;   // long flash
const int GAP  = 150;   // gap between flashes
const int PAUSE = 1000; // pause between letters

// Helper: flash the LED for a given duration
void flash(int duration) {
  digitalWrite(LED, HIGH);
  delay(duration);
  digitalWrite(LED, LOW);
  delay(GAP);
}

// Send one Morse character: dots then dashes
void morseChar(int dots, int dashes) {
  for (int i = 0; i < dots; i++) {
    flash(DOT);
  }
  for (int i = 0; i < dashes; i++) {
    flash(DASH);
  }
  delay(PAUSE);
}

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  Serial.println("SOS ---");

  // S = 3 dots
  morseChar(3, 0);

  // O = 3 dashes
  morseChar(0, 3);

  // S = 3 dots
  morseChar(3, 0);

  // Pause between full SOS sequences
  delay(2000);
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `// Button-controlled LED with debounce and Serial feedback

const int LED_PIN    = 13;
const int BUTTON_PIN = 2;   // connect a pushbutton between pin 2 and GND

bool ledState       = false; // is the LED currently on?
bool lastButton     = HIGH;  // last raw button reading
unsigned long lastDebounce = 0;
const int DEBOUNCE_MS = 50;  // ignore bounces shorter than 50 ms

void setup() {
  pinMode(LED_PIN, OUTPUT);
  // INPUT_PULLUP enables the internal pull-up resistor:
  // pin reads HIGH normally, LOW when button pressed to GND
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Press the button to toggle the LED.");
}

void loop() {
  bool reading = digitalRead(BUTTON_PIN);

  // Detect a falling edge (HIGH -> LOW) after debounce delay
  if (reading == LOW && lastButton == HIGH &&
      (millis() - lastDebounce) > DEBOUNCE_MS) {
    lastDebounce = millis();

    // Toggle LED state
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);

    if (ledState) {
      Serial.println("LED turned ON");
    } else {
      Serial.println("LED turned OFF");
    }
  }

  lastButton = reading;
}`;

export const langArduino: CourseModule = {
  meta: {
    title: "Arduino Basics",
    slug: "lang-arduino",
    track: "robotics",
    level: "high",
    description: "Program your first Arduino — blink LEDs, read buttons, and learn the C++ code behind every robotics project.",
    coverImage: "/covers/robotics.svg",
    order: 20,
  },
  lessons: [
    {
      title: "Hello, Arduino",
      slug: "hello-arduino",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is Arduino?

**Arduino** is an open-source electronics platform that pairs a small microcontroller board with an easy-to-learn programming language based on **C++**. Since 2005, millions of makers, students, engineers, and artists worldwide have used Arduino to build everything from blinking LEDs and sensor systems to robotic arms and automatic plant waterers.

The most common board is the **Arduino UNO**. It has:
- An **ATmega328P** chip running at 16 MHz
- **14 digital I/O pins** (can be outputs or inputs)
- **6 analogue input pins** (read voltages from 0 – 5 V)
- A USB port for uploading code and communicating with your computer

### Board overview`),
        svg(SVG_ARDUINO_BOARD, "The Arduino UNO board with labelled digital, analogue, and power pins"),
        md(`### The two magic functions

Every Arduino sketch (program) must have exactly two functions:

- **\`setup()\`** — runs **once** when the board powers on. Use it to configure pins and start Serial.
- **\`loop()\`** — runs **forever** after setup finishes. Your main logic goes here.

### Hello, RoboCode!

The sketch below blinks the built-in LED on pin 13 and sends a greeting to the Serial Monitor. Open it in RoboCode Studio, then watch the Serial Monitor for messages.`),
        code("arduino", HELLO_WORLD, { filename: "hello_robocode.ino", openInStudio: true }),
        callout("tip", "Open the Serial Monitor in RoboCode Studio (the icon that looks like a plug) to see the messages your Arduino sends with Serial.println(). You can watch LED ON and LED OFF toggle in real time — it is one of the best ways to understand what your code is doing."),
      ),
    },
    {
      title: "Pins & Variables",
      slug: "arduino-pins-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Working with pins and variables

### Digital pins

A **digital pin** can be in one of two states:
- **HIGH** — 5 V (logical 1, "on")
- **LOW** — 0 V (logical 0, "off")

You must tell the Arduino whether each pin is an **output** (sending voltage) or an **input** (reading voltage) before using it:

\`\`\`arduino
pinMode(13, OUTPUT);   // pin 13 will drive something
pinMode(2, INPUT);     // pin 2 will read something
\`\`\`

### Variables in Arduino (C++)

Arduino uses C++ variable types. The most common ones are:

| Type | Stores | Example |
|------|--------|---------|
| \`int\` | Whole numbers (−32 768 to 32 767) | \`int blinkCount = 0;\` |
| \`long\` | Large whole numbers | \`long timestamp = millis();\` |
| \`float\` | Decimal numbers | \`float voltage = 3.3;\` |
| \`bool\` | true / false | \`bool ledState = false;\` |
| \`const int\` | A constant (cannot change) | \`const int LED = 13;\` |

### Circuit: LED with resistor`),
        svg(SVG_LED_CIRCUIT, "External LED connected to Arduino pin 13 via a 220 Ω resistor"),
        md(`### Named constants keep code readable

Instead of writing \`13\` everywhere, give the pin a name with \`const int\`. If you ever move the LED to a different pin, you change it in one place:

\`\`\`arduino
const int LED_PIN = 13;
digitalWrite(LED_PIN, HIGH);   // much clearer than digitalWrite(13, HIGH)
\`\`\`

Run the sketch below — it blinks 10 times and counts each blink in the Serial Monitor.`),
        code("arduino", PINS_VARIABLES_CODE, { filename: "blink_counter.ino", openInStudio: true }),
        callout("info", "millis() returns the number of milliseconds since the Arduino last powered on. It is the Arduino's built-in clock — very useful for timing things without blocking the rest of your code with delay()."),
      ),
    },
    {
      title: "Conditionals & Loops",
      slug: "arduino-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Conditionals and loops in Arduino (C++)

Arduino uses the same **if/else** and **for loop** syntax as C and C++. Let's put them to work by building an SOS morse-code blinker.

### if / else

\`\`\`arduino
if (blinkCount >= 10) {
  Serial.println("Done!");
} else {
  Serial.println("Keep blinking...");
}
\`\`\`

### for loop

A \`for\` loop repeats a block of code a fixed number of times:

\`\`\`arduino
for (int i = 0; i < 3; i++) {
  flash(DOT);   // flash 3 dots
}
\`\`\`

The three parts inside the parentheses are:
1. **Init**: \`int i = 0\` — create a counter starting at 0.
2. **Condition**: \`i < 3\` — keep going while true.
3. **Update**: \`i++\` — add 1 to the counter after each run.

### Flowchart: SOS loop`),
        mermaid(
          `flowchart TD
  A([loop starts]) --> B[flash S\n3 × DOT]
  B --> C[flash O\n3 × DASH]
  C --> D[flash S\n3 × DOT]
  D --> E[delay 2 s]
  E --> A`,
          "The SOS blink loop: S-O-S repeating with a 2-second pause",
        ),
        md(`The SOS sketch below uses a helper function called \`flash()\` to keep the code clean. Functions let you give a block of code a name and call it whenever you need it — no copy-pasting required.`),
        code("arduino", CONTROL_FLOW_CODE, { filename: "sos_blink.ino", openInStudio: true }),
        callout("tip", "Morse code is a real communication system — S (· · ·) and O (— — —) are internationally recognised. Devices like emergency beacons still use Morse code signals. Now you know how to program one!"),
      ),
    },
    {
      title: "Put It Together",
      slug: "arduino-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a button-controlled LED

Let's combine digital output (LED), digital input (button), variables, conditionals, and a new concept — **debouncing** — into a complete, interactive project.

### The circuit

- **LED** on pin 13 (built-in on most Arduino UNO boards).
- **Button** connected between pin 2 and GND. We use \`INPUT_PULLUP\` so the pin reads \`HIGH\` normally and \`LOW\` when the button is pressed.

### What is debouncing?

Mechanical buttons are not perfect — when you press one, the contacts bounce slightly and generate several rapid HIGH/LOW transitions in just a few milliseconds. Without debouncing, a single press can register as many clicks.

The fix: record the time of the first transition. If another transition arrives within \`DEBOUNCE_MS\` milliseconds (50 ms here), ignore it. Only act when enough time has passed for the signal to settle.

### New ideas in this sketch

| Concept | What it does |
|---------|-------------|
| \`INPUT_PULLUP\` | Enables the Arduino's built-in pull-up resistor so you don't need an external one |
| \`digitalRead(pin)\` | Returns \`HIGH\` or \`LOW\` depending on what voltage is on the pin |
| \`millis()\` | Returns milliseconds since power-on — used here as a timer |
| \`ledState = !ledState\` | Flips a bool: \`true\` becomes \`false\` and vice versa |
| Ternary \`? :\` | \`ledState ? HIGH : LOW\` is a compact if/else in one line |

Wire up the button (or use the simulator in RoboCode Studio), then press it to toggle the LED. Watch the Serial Monitor to see each press logged.`),
        code("arduino", PUT_TOGETHER_CODE, { filename: "button_led.ino", openInStudio: true }),
        callout("tip", "This sketch is the foundation of almost every real Arduino project: read an input, decide what to do, update an output. From here you can swap the button for a sensor and the LED for a motor — the pattern stays the same."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Countdown to liftoff",
      slug: "challenge-arduino",
      description: "On the Serial Monitor, count down from 5 to 1 (one number per line), then print the word liftoff.",
      track: "robotics", difficulty: "beginner", points: 50, boardType: "arduino-uno",
      starterCode: "void setup() {\n  Serial.begin(9600);\n  // Count down 5,4,3,2,1 then print: liftoff\n}\n\nvoid loop() {}\n",
      checks: { rules: [{ type: "serial_contains", value: "liftoff" }] },
    },
  ],
};
