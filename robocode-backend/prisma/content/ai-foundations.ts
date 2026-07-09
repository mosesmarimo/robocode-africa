import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";
import { SVG_INPUT_PROCESS_OUTPUT } from "./_assets";

// ---------------------------------------------------------------------------
// Lesson 2 — Smart thresholds
// ---------------------------------------------------------------------------

const THRESHOLD_SKETCH = `// Smart threshold: turn LED on when it gets dark
// Sensor: photoresistor (LDR) wired to A0 via a voltage divider

const int LDR_PIN = A0;   // light-dependent resistor
const int LED_PIN = 13;   // built-in LED
const int THRESHOLD = 400; // lower value = darker (tune for your sensor)

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Smart light ready");
}

void loop() {
  int lightLevel = analogRead(LDR_PIN); // 0 (dark) to 1023 (bright)

  Serial.print("Light level: ");
  Serial.println(lightLevel);

  if (lightLevel < THRESHOLD) {
    // It is dark — turn the LED on
    digitalWrite(LED_PIN, HIGH);
    Serial.println("  → LED ON (dark detected)");
  } else {
    // It is bright — turn the LED off
    digitalWrite(LED_PIN, LOW);
    Serial.println("  → LED OFF");
  }

  delay(250);
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Patterns in data
// ---------------------------------------------------------------------------

const MOVING_AVG_CODE = `# Moving average filter in Python
# Smooths out noisy sensor readings

import random  # simulate sensor noise

def moving_average(readings, window=5):
    """Return a list of averages over a sliding window."""
    averages = []
    for i in range(len(readings)):
        start = max(0, i - window + 1)
        window_data = readings[start : i + 1]
        avg = sum(window_data) / len(window_data)
        averages.append(round(avg, 2))
    return averages

# Simulate 20 noisy temperature readings around 25 °C
raw_readings = [25 + random.uniform(-3, 3) for _ in range(20)]

smoothed = moving_average(raw_readings, window=5)

print(f"{'Reading':>8}  {'Raw (°C)':>10}  {'Smoothed (°C)':>14}")
print("-" * 38)
for i, (raw, avg) in enumerate(zip(raw_readings, smoothed)):
    print(f"{i + 1:>8}  {raw:>10.2f}  {avg:>14.2f}")

print()
print("A moving average reduces noise, making trends easier to spot!")
`;

export const aiFoundations: CourseModule = {
  meta: {
    title: "AI Foundations",
    slug: "ai-foundations",
    track: "ai",
    level: "high",
    description: "How machines learn — patterns, data and smart sensors.",
    coverImage: "/covers/ai.svg",
    order: 3,
  },
  lessons: [
    {
      title: "What is AI?",
      slug: "what-is-ai",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Teaching machines to think

**Artificial Intelligence (AI)** is the ability of a computer program to do things that normally require human intelligence — like recognising faces in a photo, understanding spoken language, or deciding when to turn on a fan.

There are two broad ways to make a computer "smart":

### Rules-based systems
You write out every possible situation and tell the computer exactly what to do. For example:
> *If the temperature is above 30 °C, turn on the fan.*

This works well when the rules are clear. But imagine writing rules for every face a camera might see, or every way someone might phrase a question. You quickly end up with millions of rules — impossible to manage.

### Machine learning
Instead of giving the computer rules, you give it **lots of examples** and let it figure out the patterns itself. For example:
> *Here are 50 000 photos of cats and 50 000 of dogs — learn to tell them apart.*

The computer processes all those examples, adjusts thousands of internal numbers (called *weights*), and ends up with a **model** that can classify new photos it has never seen.

Both approaches are useful. In this course we will explore how machines find patterns in data, and how we can apply simple AI ideas with sensors on a real Arduino.`),
        svg(SVG_INPUT_PROCESS_OUTPUT, "Data in → model → decision out"),
        mermaid(
          `flowchart LR
  A[Collect data] --> B[Label examples]
  B --> C[Train model]
  C --> D[Evaluate accuracy]
  D -- Not good enough --> B
  D -- Good enough --> E[Deploy & predict]`,
          "A simple machine learning pipeline",
        ),
        callout("info", "AI is not magic — it is maths. At its heart, most machine learning is about finding the best numbers (weights) to fit a pattern in data. You do not need to understand all the maths yet; understanding the pipeline is a great first step."),
      ),
    },
    {
      title: "Smart thresholds",
      slug: "smart-thresholds",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions from sensor data

The simplest form of AI is a **threshold rule**: pick a number, and make a decision based on whether the sensor reading is above or below it. Thermostats have worked this way for 100 years.

On an Arduino, we can read *analogue* sensors using the \`analogRead()\` function. It returns a number from **0 to 1023** based on the voltage at the pin (0 V → 0, 5 V → 1023).

A **photoresistor (LDR)** changes its resistance depending on how much light hits it. Wired up in a voltage divider with a fixed resistor, \`analogRead(A0)\` gives a low number in the dark and a high number in bright light.

The sketch below reads the light level every 250 ms and turns the built-in LED on when the room gets dark. The line

\`\`\`arduino
const int THRESHOLD = 400;
\`\`\`

is the "AI decision boundary". Above 400 = light enough, below 400 = turn the light on. Changing this constant *calibrates* the system to different environments — a kind of manual "training".`),
        code("arduino", THRESHOLD_SKETCH, { filename: "sketch.ino", openInStudio: true }),
        md(`Open the Serial Monitor after uploading. Cover the sensor with your hand and watch the LED switch on. Uncover it and the LED switches off. That one line of \`if\` logic is the simplest possible AI decision maker.`),
        callout("tip", "Real smart home systems use the same idea, just with more sensors and more complex rules. Before you reach for a neural network, always ask: can a simple threshold solve this? Often the answer is yes."),
      ),
    },
    {
      title: "Patterns in data",
      slug: "patterns-in-data",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Why raw data can be noisy

Real sensors are never perfect. A temperature sensor might read 24.9°C one moment and 25.8°C the next, even when the actual temperature has not changed. This **noise** comes from tiny electrical fluctuations, interference from nearby circuits, and rounding in the analogue-to-digital converter.

If you make decisions directly from noisy data, your program will switch on and off rapidly when the reading hovers near the threshold — called **chattering**. The fix is to look at *patterns* across multiple readings rather than reacting to each one instantly.

### The moving average

A **moving average** looks at the last *N* readings and uses their average as the "current" value. It smooths out short spikes while still tracking genuine changes.

\`\`\`
smoothed = (reading_1 + reading_2 + ... + reading_N) / N
\`\`\`

As each new reading arrives, the oldest one drops out and the newest one joins. The window "moves" forward through time — hence the name.

| Reading # | Raw (°C) | 5-reading average |
|-----------|----------|-------------------|
| 1 | 24.3 | 24.3 |
| 2 | 26.1 | 25.2 |
| 3 | 23.8 | 24.7 |
| 4 | 25.9 | 25.0 |
| 5 | 27.2 | 25.5 |
| 6 | 24.1 | 25.4 |

Notice how the smoothed column changes much more gently than the raw column.`),
        code("python", MOVING_AVG_CODE, { filename: "moving_average.py", openInStudio: true }),
        mermaid(
          `xychart-beta
  title "Raw vs Smoothed temperature readings"
  x-axis [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  y-axis "Temperature (°C)" 20 --> 30
  line [24.3, 26.1, 23.8, 25.9, 27.2, 24.1, 26.5, 23.3, 25.7, 27.0]
  line [24.3, 25.2, 24.7, 25.0, 25.5, 25.4, 25.4, 25.1, 25.1, 25.2]`,
          "Raw sensor readings (blue) are noisy; the moving average (orange) is smooth",
        ),
        callout("tip", "Moving averages are used everywhere — from stock market analysis to phone accelerometers that decide when to rotate your screen. Once you understand the idea, you will spot it in almost every data-driven system."),
      ),
    },
  ],
};
