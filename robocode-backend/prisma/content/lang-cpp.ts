import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, C/C++
// ---------------------------------------------------------------------------

const HELLO_WORLD = `#include <iostream>
int main() {
    std::cout << "Hello, RoboCode!";
    return 0;
}`;

const SVG_CPP_USES = `<svg viewBox="0 0 600 220" role="img" aria-label="C and C++ power operating systems, game engines, robotics, and browsers" xmlns="http://www.w3.org/2000/svg">
  <!-- Central C++ label -->
  <circle cx="300" cy="110" r="52" fill="#004482" stroke="#659ad2" stroke-width="3"/>
  <text x="282" y="104" font-family="monospace" font-size="22" fill="white" font-weight="bold">C/C++</text>
  <text x="271" y="124" font-family="sans-serif" font-size="11" fill="#b3d1f0">Since 1972/1985</text>
  <!-- OS -->
  <rect x="20" y="30" width="110" height="52" rx="8" fill="#1a1a2e" stroke="#4a90d9" stroke-width="2"/>
  <text x="75" y="53" font-family="sans-serif" font-size="11" fill="#90caf9" text-anchor="middle">Operating</text>
  <text x="75" y="69" font-family="sans-serif" font-size="11" fill="#90caf9" text-anchor="middle">Systems</text>
  <line x1="130" y1="56" x2="248" y2="90" stroke="#659ad2" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Game engines -->
  <rect x="20" y="140" width="110" height="52" rx="8" fill="#1a1a2e" stroke="#4a90d9" stroke-width="2"/>
  <text x="75" y="163" font-family="sans-serif" font-size="11" fill="#90caf9" text-anchor="middle">Game Engines</text>
  <text x="75" y="178" font-family="monospace" font-size="10" fill="#64b5f6" text-anchor="middle">Unreal / Unity</text>
  <line x1="130" y1="166" x2="248" y2="130" stroke="#659ad2" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Robotics -->
  <rect x="470" y="30" width="110" height="52" rx="8" fill="#1a1a2e" stroke="#4a90d9" stroke-width="2"/>
  <text x="525" y="53" font-family="sans-serif" font-size="11" fill="#90caf9" text-anchor="middle">Robotics &amp;</text>
  <text x="525" y="69" font-family="sans-serif" font-size="11" fill="#90caf9" text-anchor="middle">Embedded</text>
  <line x1="470" y1="56" x2="352" y2="90" stroke="#659ad2" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Browsers -->
  <rect x="470" y="140" width="110" height="52" rx="8" fill="#1a1a2e" stroke="#4a90d9" stroke-width="2"/>
  <text x="525" y="163" font-family="sans-serif" font-size="11" fill="#90caf9" text-anchor="middle">Browsers &amp;</text>
  <text x="525" y="178" font-family="sans-serif" font-size="11" fill="#90caf9" text-anchor="middle">Databases</text>
  <line x1="470" y1="166" x2="352" y2="130" stroke="#659ad2" stroke-width="2" stroke-dasharray="5,3"/>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Types
// ---------------------------------------------------------------------------

const VARIABLES_CODE = `#include <iostream>
#include <string>

int main() {
    // Integer types
    int age = 15;
    long population = 16000000L;  // Zimbabwe's population (~16 million)

    // Floating-point types
    double pi = 3.14159265358979;
    float temp = 27.5f;             // f suffix = float literal

    // Boolean
    bool isSunny = true;

    // C++ string (from <string> header)
    std::string name = "Tendai";

    // Print with cout
    std::cout << "Name:       " << name       << "\n";
    std::cout << "Age:        " << age        << "\n";
    std::cout << "Population: " << population << "\n";
    std::cout << "Pi:         " << pi         << "\n";
    std::cout << "Temp:       " << temp       << "°C\n";
    std::cout << "Sunny?      " << std::boolalpha << isSunny << "\n";

    // Constants — value can never change
    const double GRAVITY = 9.81;
    std::cout << "Gravity:    " << GRAVITY << " m/s²\n";

    return 0;
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Control Flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `#include <iostream>
#include <string>

std::string grade(int score) {
    if (score >= 80) return "A";
    else if (score >= 60) return "B";
    else if (score >= 50) return "C";
    else return "F";
}

int main() {
    // Array of scores
    int scores[] = {92, 74, 55, 38, 100};
    int count = sizeof(scores) / sizeof(scores[0]);

    for (int i = 0; i < count; i++) {
        std::cout << "Score " << scores[i]
                  << " → Grade " << grade(scores[i]) << "\n";
    }

    // Range-based for loop (C++11 and later)
    std::cout << "\nSame scores with range-for:\n";
    for (int s : scores) {
        std::cout << "  " << s << "\n";
    }

    // while loop
    int countdown = 3;
    std::cout << "\nLaunch countdown:\n";
    while (countdown > 0) {
        std::cout << "  " << countdown << "...\n";
        countdown--;
    }
    std::cout << "  Lift off!\n";

    return 0;
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put It Together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>  // for transform (toLower)

struct Question {
    std::string prompt;
    std::string answer;  // stored in lowercase
};

// Convert a string to lowercase in-place
std::string toLower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), ::tolower);
    return s;
}

bool ask(const Question& q) {
    std::cout << q.prompt << " ";
    std::string input;
    std::getline(std::cin, input);
    std::string guess = toLower(input);

    if (guess == q.answer) {
        std::cout << "  Correct!\n";
        return true;
    } else {
        std::cout << "  Not quite — answer: " << q.answer << "\n";
        return false;
    }
}

int main() {
    std::vector<Question> questions = {
        {"What is the capital of Zimbabwe?", "harare"},
        {"How many bytes in a kilobyte?",    "1024"},
        {"What does CPU stand for?",         "central processing unit"},
    };

    std::cout << "=== RoboCode C++ Quiz ===\n\n";

    int score = 0;
    for (const auto& q : questions) {
        if (ask(q)) score++;
    }

    std::cout << "\nYou scored " << score
              << "/" << questions.size() << ".\n";

    if (score == static_cast<int>(questions.size()))
        std::cout << "Perfect! You're a C++ champion!\n";
    else if (score > 0)
        std::cout << "Good effort — keep practising!\n";
    else
        std::cout << "Don't give up — try again!\n";

    return 0;
}`;

export const langCpp: CourseModule = {
  meta: {
    title: "C/C++ Basics",
    slug: "lang-cpp",
    track: "coding",
    level: "high",
    description: "Learn C/C++ — the foundation of operating systems, game engines, and robotics — and understand how computers really work.",
    coverImage: "/covers/coding.svg",
    order: 17,
  },
  lessons: [
    {
      title: "Hello, C/C++",
      slug: "hello-cpp",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is C/C++?

**C** was created in 1972 by Dennis Ritchie at Bell Labs and quickly became the language that operating systems were built with. The Unix operating system — the ancestor of Linux, macOS, and Android — was rewritten in C, and that choice shaped computing for the next 50 years.

**C++** (pronounced "C plus plus") was created by Bjarne Stroustrup in 1985 as C with *object-oriented programming* added. Today, C++ is one of the most widely used languages in the world, powering everything from game engines (Unreal Engine, Unity's internals) to web browsers (Chrome, Firefox) to financial trading systems.

### Why learn C/C++?

- **Speed** — C/C++ code runs as fast as a computer can possibly go. No garbage collector, no virtual machine.
- **Control** — you manage memory directly, which teaches you how computers actually work.
- **Ubiquity** — robotics, embedded systems, game dev, and operating systems all rely on C/C++.
- **Foundation** — understanding C makes every other language easier to learn.

The diagram below shows the kinds of software that rely on C and C++ today.`),
        svg(SVG_CPP_USES, "C and C++ power operating systems, game engines, robotics, and web browsers"),
        md(`### Your first program

Every C++ program starts in \`main()\`. The \`#include <iostream>\` line brings in the *input/output stream* library, which gives you \`std::cout\` (think: **c**haracter **out**put) for printing.

The \`<<\` operator sends data to the stream — you can chain multiple \`<<\` calls on the same line.

\`return 0;\` tells the operating system the program finished successfully. By convention, any non-zero return value means something went wrong.`),
        code("cpp", HELLO_WORLD, { filename: "hello.cpp", openInStudio: true }),
        callout("tip", "The std:: prefix means we are using something from the C++ Standard Library's std namespace. Many tutorials write using namespace std; at the top to avoid typing std:: everywhere — but explicit std:: is better practice because it makes it clear where each function comes from."),
      ),
    },
    {
      title: "Variables & Types",
      slug: "cpp-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Variables and types in C++

C++ is **statically typed** — every variable must have a declared type, and that type cannot change. The compiler uses this information to catch mistakes early and produce fast machine code.

### Core built-in types

| Type | Size | What it stores | Example |
|---|---|---|---|
| \`int\` | 32 bits | Whole numbers (±2 billion) | \`int age = 15;\` |
| \`long\` | at least 32 bits | Larger whole numbers | \`long pop = 16000000L;\` |
| \`double\` | 64 bits | Decimal numbers (high precision) | \`double pi = 3.14;\` |
| \`float\` | 32 bits | Decimal numbers (less precision, uses less memory) | \`float temp = 27.5f;\` |
| \`bool\` | 1 byte | \`true\` or \`false\` | \`bool sunny = true;\` |
| \`char\` | 1 byte | A single character | \`char grade = 'A';\` |
| \`std::string\` | varies | A sequence of characters | \`std::string name = "Tendai";\` |

### Constants

Prefix a variable with \`const\` to make it immutable — it can never be changed after its first assignment:

\`\`\`cpp
const double GRAVITY = 9.81;
\`\`\`

### Output with cout

\`std::cout\` uses the \`<<\` (insertion) operator to send values to the terminal. You can chain as many \`<<\` calls as you like in a single statement:

\`\`\`cpp
std::cout << "Hello, " << name << "! You are " << age << " years old.\n";
\`\`\`

Run the full example below.`),
        code("cpp", VARIABLES_CODE, { filename: "variables.cpp", openInStudio: true }),
        callout("info", "C++ has more integer types than most languages (int, short, long, long long, and their unsigned variants). For everyday work int and long are enough. When you write firmware for microcontrollers like Arduino, you will use exact-size types like uint8_t (an unsigned 8-bit integer) to control memory precisely."),
      ),
    },
    {
      title: "Control Flow",
      slug: "cpp-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and repeating code

C++ inherits C's control-flow statements — \`if/else\`, \`switch\`, \`for\`, and \`while\` — and adds the modern *range-based for loop* introduced in C++11.

### if / else if / else

\`\`\`cpp
if (score >= 80) {
    std::cout << "A\n";
} else if (score >= 60) {
    std::cout << "B\n";
} else {
    std::cout << "F\n";
}
\`\`\`

Unlike Python, C++ **requires** parentheses around conditions and curly braces for multi-line blocks.

### for loops — two styles

**Classic C-style** — control everything manually:
\`\`\`cpp
for (int i = 0; i < 10; i++) { ... }
\`\`\`

**Range-based** (C++11+) — iterate directly over a collection:
\`\`\`cpp
for (int s : scores) { ... }
\`\`\`

### Flowchart of the grade checker`),
        mermaid(
          `flowchart TD
  A([Start]) --> B[scores array, i=0]
  B --> C{i < count?}
  C -- Yes --> D[s = scores i]
  D --> E{s >= 80?}
  E -- Yes --> F[return A]
  E -- No --> G{s >= 60?}
  G -- Yes --> H[return B]
  G -- No --> I{s >= 50?}
  I -- Yes --> J[return C]
  I -- No --> K[return F]
  F & H & J & K --> L[cout grade]
  L --> M[i++]
  M --> C
  C -- No --> N[while countdown]
  N --> O{countdown > 0?}
  O -- Yes --> P[cout, countdown--]
  P --> O
  O -- No --> Q([Done])`,
          "Control flow: classic for loop → grade function → while countdown",
        ),
        code("cpp", CONTROL_FLOW_CODE, { filename: "control_flow.cpp", openInStudio: true }),
        callout("tip", "sizeof(scores) / sizeof(scores[0]) is the classic C idiom to count the number of elements in a raw array. Modern C++ prefers std::array or std::vector which track their own size — you will see both in real codebases."),
      ),
    },
    {
      title: "Put It Together",
      slug: "cpp-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a quiz game in C++

Let's combine structs, vectors, functions, references, and standard input to build a complete C++ quiz game.

### New ideas in this program

- **\`struct\`** — groups related fields together, like a class without methods. \`Question\` holds a prompt and its correct answer.
- **\`std::vector\`** — a dynamic array that grows automatically. Much safer than raw arrays.
- **References (\`const Question& q\`)** — passing a reference avoids copying the struct every time \`ask\` is called. The \`const\` means \`ask\` promises not to modify it.
- **\`std::getline\`** — reads a whole line including spaces (unlike \`cin >>\` which stops at whitespace).
- **\`std::transform\`** — applies a function to every character in a string; here we use it to convert user input to lowercase so comparisons are case-insensitive.
- **Range-for with \`const auto&\`** — \`for (const auto& q : questions)\` iterates over the vector efficiently without copying each element.

This is a genuine, compilable C++ program — no shortcuts or pseudocode. Give it a run, then add your own questions!`),
        code("cpp", PUT_TOGETHER_CODE, { filename: "quiz.cpp", openInStudio: true }),
        callout("tip", "You will notice return 0 at the end of main. In C++11 and later this is optional — the compiler adds it automatically — but many C++ programmers still write it explicitly as a clear signal that the program succeeded. Returning a non-zero value (like return 1) is the standard way to signal an error to the shell or operating system."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Sum of squares",
      slug: "challenge-cpp",
      description: "Print 1² + 2² + 3² + 4² + 5² (the sum of the first five square numbers).",
      track: "coding", difficulty: "beginner", points: 50, language: "cpp",
      starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int sum = 0;\n    // add each square 1*1 .. 5*5 to sum\n    cout << sum;\n    return 0;\n}\n",
      checks: { rules: [{ type: "stdout_contains", value: "55" }] },
    },
  ],
};
