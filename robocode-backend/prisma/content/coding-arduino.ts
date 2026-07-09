import { md, code, mermaid, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Variables & types
// ---------------------------------------------------------------------------

const VARIABLES_SKETCH = `// Variables & data types in Arduino C++

int age = 15;           // whole numbers (–32,768 to 32,767)
float temperature = 23.5; // decimal numbers
bool lightsOn = true;   // true or false
char grade = 'A';       // a single character
String name = "Tariro"; // text (multiple characters)

void setup() {
  Serial.begin(9600);

  Serial.print("Name: ");
  Serial.println(name);

  Serial.print("Age: ");
  Serial.println(age);

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Lights on? ");
  Serial.println(lightsOn ? "yes" : "no");

  Serial.print("Grade: ");
  Serial.println(grade);
}

void loop() {
  // Nothing to repeat in this example
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Loops
// ---------------------------------------------------------------------------

const COUNTDOWN_SKETCH = `// Countdown from 10 to 0 using a for loop

void setup() {
  Serial.begin(9600);

  // for loop: starts at 10, counts down to 0, step -1
  for (int i = 10; i >= 0; i--) {
    Serial.print("Countdown: ");
    Serial.println(i);
    delay(500);           // wait half a second between numbers
  }

  Serial.println("Blast off!");
}

void loop() {
  // The countdown only runs once, in setup()
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Functions
// ---------------------------------------------------------------------------

const FUNCTIONS_SKETCH = `// Functions: defining and calling blinkTimes()

// This function blinks pin 13 exactly n times
void blinkTimes(int n) {
  for (int i = 0; i < n; i++) {
    digitalWrite(13, HIGH);
    delay(300);
    digitalWrite(13, LOW);
    delay(300);
  }
}

// This function returns the number of milliseconds for a given number of blinks
int blinkDuration(int n) {
  return n * 600; // each blink = 300ms on + 300ms off
}

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);

  Serial.println("Blinking 3 times...");
  blinkTimes(3);

  Serial.print("That took about ");
  Serial.print(blinkDuration(3));
  Serial.println(" ms");

  Serial.println("Blinking 5 times...");
  blinkTimes(5);
}

void loop() {
  // Blink once every 2 seconds
  blinkTimes(1);
  delay(2000);
}`;

export const codingArduino: CourseModule = {
  meta: {
    title: "Coding with Arduino",
    slug: "coding-arduino",
    track: "coding",
    level: "high",
    description: "Variables, loops and functions — applied to real hardware.",
    coverImage: "/covers/coding.svg",
    order: 2,
  },
  lessons: [
    {
      title: "Variables & types",
      slug: "variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Storing values in variables

A **variable** is a named box in memory where your program can store a value. Every variable has a **type** that tells the Arduino how much space to reserve and what kind of data it holds.

Arduino programs are written in C++ (a programming language), which requires you to declare the type of every variable before you use it. This might feel different from some other languages, but it makes the code faster and less error-prone on a tiny chip.

| Type | What it stores | Example |
|------|---------------|---------|
| \`int\` | Whole numbers (−32 768 to 32 767) | \`int count = 0;\` |
| \`long\` | Bigger whole numbers (±2 billion) | \`long distance = 150000;\` |
| \`float\` | Decimal numbers | \`float temp = 23.5;\` |
| \`bool\` | True or false | \`bool on = true;\` |
| \`char\` | A single character | \`char letter = 'A';\` |
| \`String\` | Text (many characters) | \`String name = "RoboCode";\` |

Run the sketch below and watch the Serial Monitor to see each variable printed out.`),
        code("arduino", VARIABLES_SKETCH, { filename: "sketch.ino", openInStudio: true }),
        callout("info", "On a desktop computer, an int is usually 32 bits (about ±2 billion). On an Arduino UNO, int is only 16 bits (±32 767). If you need bigger numbers, use long. This is a common source of bugs when moving code between platforms!"),
      ),
    },
    {
      title: "Loops",
      slug: "loops",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Repeating actions with loops

Loops let you run the same block of code many times without writing it out over and over. There are two main types of loops in Arduino:

### The \`for\` loop
Use a \`for\` loop when you know **how many times** you want to repeat:

\`\`\`arduino
for (int i = 0; i < 5; i++) {
  // This runs 5 times: i = 0, 1, 2, 3, 4
}
\`\`\`

The three parts in the parentheses are:
1. **Initialise** — \`int i = 0\` (create a counter, start at 0)
2. **Condition** — \`i < 5\` (keep going while this is true)
3. **Update** — \`i++\` (add 1 to i after each loop)

### The \`while\` loop
Use a \`while\` loop when you want to keep going **until some condition is false**:

\`\`\`arduino
while (buttonPressed == true) {
  // Keep running as long as the button is held
}
\`\`\``),
        mermaid(
          `flowchart TD
  A([Start]) --> B[i = 10]
  B --> C{i >= 0?}
  C -- Yes --> D[print i]
  D --> E[i = i - 1]
  E --> C
  C -- No --> F[print Blast off!]
  F --> G([Done])`,
          "Flowchart of the countdown for-loop",
        ),
        md(`## Countdown program

The sketch below counts from 10 down to 0, printing each number to the Serial Monitor half a second apart. Notice we use \`i--\` to decrement (subtract 1) instead of the usual \`i++\`.`),
        code("arduino", COUNTDOWN_SKETCH, { filename: "sketch.ino", openInStudio: true }),
        md(`Once you have tried the countdown, see if you can change it to count **up** from 0 to 10 instead. You will need to change the initial value, the condition, and the update step.`),
      ),
    },
    {
      title: "Functions",
      slug: "functions",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Breaking code into functions

A **function** is a reusable block of code that you give a name. Instead of writing the same blink sequence twenty times in your program, you write it once inside a function and *call* that function whenever you need it.

### Declaring a function

\`\`\`arduino
void blinkTimes(int n) {
  // code that blinks n times
}
\`\`\`

- \`void\` means the function **does not return a value** — it just does something.
- \`blinkTimes\` is the **name** we chose (descriptive names make code easier to read).
- \`int n\` is a **parameter** — a value we pass in when we call the function.

### Returning a value

If you want a function to **calculate and return a value**, replace \`void\` with the return type:

\`\`\`arduino
int blinkDuration(int n) {
  return n * 600; // each blink is 600 ms
}
\`\`\`

Then call it like this: \`int ms = blinkDuration(3);\` — the variable \`ms\` will hold 1800.

### Calling a function

\`\`\`arduino
blinkTimes(3);  // blink 3 times
blinkTimes(5);  // blink 5 times
\`\`\`

Each call is independent — the function starts fresh each time.`),
        code("arduino", FUNCTIONS_SKETCH, { filename: "sketch.ino", openInStudio: true }),
        callout("tip", "Name your functions with verbs that describe what they do: blinkTimes, readDistance, playNote. This makes your code read almost like English and is far easier to debug later."),
      ),
    },
  ],
};
