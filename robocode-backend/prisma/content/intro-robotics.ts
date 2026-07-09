import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";
import { SVG_ARDUINO_BOARD, SVG_LED_CIRCUIT } from "./_assets";

// ---------------------------------------------------------------------------
// Lesson 1: What is a microcontroller?
// ---------------------------------------------------------------------------

const BLINK_SKETCH = `void setup() {
  // pinMode tells the Arduino which pin to use and whether it is an output or input.
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("ready");
}

void loop() {
  // Turn the LED on (HIGH = 5V)
  digitalWrite(13, HIGH);
  delay(1000);   // Wait 1 second

  // Turn the LED off (LOW = 0V)
  digitalWrite(13, LOW);
  delay(1000);   // Wait 1 second
}`;

const ULTRASONIC_SKETCH = `const int TRIG = 9;    // Trigger pin sends the sound pulse
const int ECHO = 10;   // Echo pin listens for the reflection

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.begin(9600);
  Serial.println("Ultrasonic sensor ready");
}

void loop() {
  // Send a 10-microsecond pulse on TRIG
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  // Measure how long the echo takes to return
  long duration = pulseIn(ECHO, HIGH);

  // Convert time to distance in centimetres
  // Speed of sound ≈ 0.034 cm/µs, divided by 2 (there and back)
  float distance = duration * 0.034 / 2.0;

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  delay(300);
}`;

export const introRobotics: CourseModule = {
  meta: {
    title: "Intro to Robotics",
    slug: "intro-robotics",
    track: "robotics",
    level: "primary",
    description: "Meet the Arduino, light an LED, and read your first sensor.",
    coverImage: "/covers/robotics.svg",
    order: 1,
  },
  lessons: [
    {
      title: "What is a microcontroller?",
      slug: "what-is-mcu",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## Meet the Microcontroller

A **microcontroller** is a tiny computer that lives on a single chip. Unlike the laptop or phone you might be reading this on, a microcontroller is designed to do *one job* — over and over again, very reliably. You find them everywhere: inside washing machines, traffic lights, medical devices, and of course, robots.

The one we use most in RoboCode is called the **Arduino UNO**. It has a small brain (a chip called the ATmega328P) that runs at 16 million instructions per second. It also has 14 *digital pins* and 6 *analogue input pins* that you can wire up to lights, motors, buttons, sensors — whatever you like.

Power comes in through the USB cable (the same cable used for charging) or through the round power jack. When you plug in via USB, you can also send your program to the board and watch messages from it appear in the **Serial Monitor**.`),
        svg(SVG_ARDUINO_BOARD, "The Arduino UNO and its pins"),
        md(`## How an Arduino program works

Every Arduino sketch (that's what we call a program) has exactly **two special functions**:

- \`setup()\` — runs **once** when the board powers on. You use it to configure your pins and start the serial connection.
- \`loop()\` — runs **forever** afterwards, like a wheel that never stops spinning. Your main logic goes here.

This means you never need a "main" function or an exit condition. The Arduino just keeps looping until you unplug the power.`),
        mermaid(
          `flowchart TD
  A([Power on]) --> B[setup\\nruns once]
  B --> C[loop]
  C --> D[your code]
  D --> C`,
          "The Arduino program lifecycle: setup runs once, then loop repeats forever",
        ),
        callout("tip", "You can open the Serial Monitor inside RoboCode Studio to see messages your Arduino sends with Serial.println(). It is one of the most useful tools for debugging your code."),
      ),
    },
    {
      title: "Your first LED",
      slug: "first-led",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Lighting up an LED

An **LED** (Light-Emitting Diode) is a tiny light that only lets electricity flow in one direction. It has two legs:

- The **longer leg** is the **anode (+)** — connect this toward your power source (through a resistor).
- The **shorter leg** is the **cathode (–)** — connect this toward GND (ground, 0 V).

You always need a **resistor** in series with an LED. Without it, too much current flows through the LED and it burns out almost instantly. For a standard red LED on an Arduino's 5 V pin, a **220 Ω** resistor works perfectly.

Pin **13** on the Arduino UNO is special: it has a tiny built-in LED on the board itself, so you can blink it without wiring anything at all. That's exactly what we will do first.`),
        svg(SVG_LED_CIRCUIT, "LED wired in series with a 220 Ω resistor to pin 13 and GND"),
        md(`## The blink sketch

Open the sketch below in RoboCode Studio and click Run. The on-board LED should flash once per second.

Line by line:
- \`pinMode(13, OUTPUT)\` — tells the Arduino that pin 13 should send voltage out (not read it in).
- \`Serial.begin(9600)\` — starts the serial connection at 9600 baud so we can see messages.
- \`Serial.println("ready")\` — sends the word "ready" to the Serial Monitor.
- \`digitalWrite(13, HIGH)\` — sets pin 13 to 5 V, turning the LED on.
- \`delay(1000)\` — pauses the program for 1000 milliseconds (one second).
- \`digitalWrite(13, LOW)\` — sets pin 13 to 0 V, turning the LED off.`),
        code("arduino", BLINK_SKETCH, { filename: "sketch.ino", openInStudio: true }),
        callout("warning", "Always use a resistor between the Arduino pin and the LED anode. Connecting an LED directly to a pin without a resistor can permanently damage both the LED and the pin."),
      ),
    },
    {
      title: "Reading a sensor",
      slug: "reading-sensor",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## The HC-SR04 ultrasonic sensor

So far we have been *sending* signals out from the Arduino. Now let's *receive* signals from the world. The **HC-SR04** is an ultrasonic distance sensor — it measures how far away objects are using sound waves, just like a bat or a parking sensor.

It has four pins:

| Pin | What it does |
|-----|-------------|
| VCC | Power (connect to 5V) |
| GND | Ground (connect to GND) |
| TRIG | You pulse this HIGH for 10 µs to fire a sound burst |
| ECHO | Goes HIGH for exactly as long as it takes the sound to return |

The sensor fires a burst of ultrasonic sound at 40 000 Hz (far too high for humans to hear). The sound bounces off the nearest object and comes back. The ECHO pin stays HIGH for the exact number of microseconds the round trip took. We use the formula:

\`\`\`
distance (cm) = duration (µs) × 0.034 / 2
\`\`\`

The 0.034 is the speed of sound in cm/µs. We divide by 2 because the sound travels *there and back*.`),
        mermaid(
          `sequenceDiagram
  participant A as Arduino
  participant S as HC-SR04
  participant O as Object
  A->>S: TRIG HIGH for 10 µs
  S->>O: 🔊 sound burst (40 kHz)
  O-->>S: 🔊 echo returns
  S->>A: ECHO HIGH for T microseconds
  Note over A: distance = T × 0.034 / 2 cm`,
          "How the HC-SR04 measures distance using sound",
        ),
        md(`## Reading distance in code

Upload the sketch below. Open the Serial Monitor in RoboCode Studio — you should see the distance in centimetres update every 300 ms. Wave your hand in front of the sensor and watch the number change!`),
        code("arduino", ULTRASONIC_SKETCH, { filename: "sketch.ino", openInStudio: true }),
        callout("tip", "If you get wild readings (like 0 cm or 400 cm), check that TRIG and ECHO are not swapped. It is an easy mistake! Also make sure there is nothing closer than 2 cm to the sensor — that is its minimum range."),
      ),
    },
  ],
};
