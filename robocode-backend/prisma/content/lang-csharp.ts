import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, C#
// ---------------------------------------------------------------------------

const HELLO_WORLD = `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, RoboCode!");
        Console.WriteLine("C# is running!");
    }
}`;

const SVG_CSHARP_ECOSYSTEM = `<svg viewBox="0 0 600 200" role="img" aria-label="C# powers games, web apps, mobile apps, and Windows desktop software" xmlns="http://www.w3.org/2000/svg">
  <!-- Central C# circle -->
  <circle cx="300" cy="100" r="50" fill="#6a0dad" stroke="#9b59b6" stroke-width="4"/>
  <text x="276" y="94" font-family="monospace" font-size="22" fill="#ffffff" font-weight="bold">C#</text>
  <text x="270" y="116" font-family="monospace" font-size="12" fill="#e9d5ff">.NET</text>
  <!-- Unity / Games -->
  <rect x="20" y="40" width="100" height="60" rx="8" fill="#1a1a1a" stroke="#4ade80" stroke-width="2"/>
  <text x="30" y="65" font-family="sans-serif" font-size="11" fill="#4ade80" font-weight="bold">Unity</text>
  <text x="28" y="82" font-family="monospace" font-size="10" fill="#86efac">Game Dev</text>
  <text x="28" y="96" font-family="monospace" font-size="9" fill="#6b7280">Minecraft EDU</text>
  <line x1="120" y1="70" x2="250" y2="90" stroke="#9b59b6" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- ASP.NET / Web -->
  <rect x="20" y="130" width="110" height="50" rx="8" fill="#1e40af" stroke="#3b82f6" stroke-width="2"/>
  <text x="30" y="153" font-family="sans-serif" font-size="11" fill="#bfdbfe" font-weight="bold">ASP.NET</text>
  <text x="30" y="170" font-family="monospace" font-size="10" fill="#93c5fd">Web &amp; APIs</text>
  <line x1="130" y1="155" x2="250" y2="110" stroke="#9b59b6" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Xamarin / Mobile -->
  <rect x="470" y="40" width="110" height="60" rx="8" fill="#065f46" stroke="#34d399" stroke-width="2"/>
  <text x="480" y="63" font-family="sans-serif" font-size="11" fill="#d1fae5" font-weight="bold">MAUI</text>
  <text x="480" y="80" font-family="monospace" font-size="10" fill="#6ee7b7">iOS &amp; Android</text>
  <text x="480" y="94" font-family="monospace" font-size="9" fill="#6b7280">Cross-Platform</text>
  <line x1="470" y1="70" x2="350" y2="90" stroke="#9b59b6" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Windows Desktop -->
  <rect x="475" y="130" width="110" height="50" rx="8" fill="#7c3aed" stroke="#a78bfa" stroke-width="2"/>
  <text x="480" y="153" font-family="sans-serif" font-size="11" fill="#e9d5ff" font-weight="bold">WPF / WinUI</text>
  <text x="480" y="170" font-family="monospace" font-size="10" fill="#c4b5fd">Desktop Apps</text>
  <line x1="475" y1="155" x2="350" y2="110" stroke="#9b59b6" stroke-width="2" stroke-dasharray="5,3"/>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Types
// ---------------------------------------------------------------------------

const VARIABLES_CODE = `using System;

class Program {
    static void Main() {
        // C# is statically typed — every variable has a fixed type
        string name    = "Amara";     // text
        int    age     = 15;          // whole number
        double height  = 1.68;        // decimal number
        bool   isReady = true;        // true or false

        // 'var' lets C# figure out the type automatically
        var city  = "Harare";         // still a string
        var score = 92;               // still an int

        // String interpolation — put $ before the quote, {} around variables
        Console.WriteLine($"Name:   {name}");
        Console.WriteLine($"Age:    {age}");
        Console.WriteLine($"Height: {height} m");
        Console.WriteLine($"Ready?  {isReady}");
        Console.WriteLine($"{name} lives in {city} and scored {score}.");
    }
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Control flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `using System;

class Program {
    static void Main() {
        int score = 74;

        // if / else if / else — same logic as Python but uses { } braces
        string grade;
        if (score >= 80) {
            grade = "A";
        } else if (score >= 60) {
            grade = "B";
        } else if (score >= 50) {
            grade = "C";
        } else {
            grade = "F";
        }
        Console.WriteLine($"Score {score} → Grade {grade}");

        // for loop — counts from 1 to 5
        Console.WriteLine("\\nCounting to 5:");
        for (int i = 1; i <= 5; i++) {
            Console.Write(i + " ");
        }
        Console.WriteLine();

        // foreach loop — iterates over an array
        string[] subjects = { "Maths", "Science", "English", "Art" };
        Console.WriteLine("\\nSubjects:");
        foreach (string subject in subjects) {
            Console.WriteLine($"  • {subject}");
        }
    }
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `using System;

class Program {
    static void Main() {
        // A simple number-guessing game
        int secret  = 42;
        int tries   = 0;
        int maxTries = 6;
        bool won    = false;

        Console.WriteLine("=== RoboCode Guess the Number ===");
        Console.WriteLine($"I'm thinking of a number between 1 and 100. You have {maxTries} guesses.\\n");

        while (tries < maxTries && !won) {
            Console.Write($"Guess #{tries + 1}: ");
            string input = Console.ReadLine() ?? "";

            if (!int.TryParse(input, out int guess)) {
                Console.WriteLine("  Please enter a whole number.");
                continue;
            }

            tries++;

            if (guess == secret) {
                won = true;
            } else if (guess < secret) {
                Console.WriteLine("  Too low! Try higher.");
            } else {
                Console.WriteLine("  Too high! Try lower.");
            }
        }

        if (won) {
            Console.WriteLine($"\\n🎉 Correct! You got it in {tries} guess{(tries == 1 ? "" : "es")}!");
        } else {
            Console.WriteLine($"\\nOut of guesses! The number was {secret}.");
        }
    }
}`;

export const langCsharp: CourseModule = {
  meta: {
    title: "C# Basics",
    slug: "lang-csharp",
    track: "coding",
    level: "high",
    description: "Learn C# — the language behind Unity games and professional apps — by building your way from Hello World to a playable guessing game.",
    coverImage: "/covers/coding.svg",
    order: 18,
  },
  lessons: [
    {
      title: "Hello, C#",
      slug: "hello-csharp",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is C#?

**C#** (pronounced *see-sharp*) is a programming language created by Microsoft in 2000. It is one of the most popular languages in the world, and for good reason — it powers **Unity** (the game engine behind thousands of games), **ASP.NET** web applications, cross-platform mobile apps, and Windows desktop software.

C# runs on the **.NET** platform, which means the same code can run on Windows, macOS, and Linux. If you have ever played a game made in Unity, you have experienced C# in action.

### Where is C# used?`),
        svg(SVG_CSHARP_ECOSYSTEM, "C# powers games, web, mobile, and desktop applications"),
        md(`### Your first C# program

Every C# program needs at least one **class** containing a **Main** method — that is where the program starts. The structure might look a little formal at first, but you will get used to it quickly.

Press **Open in RoboCode Studio** to run this program, then try changing the text inside the quotes.`),
        code("csharp", HELLO_WORLD, { filename: "Program.cs", openInStudio: true }),
        callout("tip", "In C#, every statement ends with a semicolon (;) and related code is grouped inside curly braces { }. These are the main visual differences from Python. Don't worry — your editor will remind you if you forget!"),
      ),
    },
    {
      title: "Variables & Types",
      slug: "csharp-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Storing data in C#

C# is a **statically typed** language. This means every variable must have a declared type and it cannot change. This sounds strict, but it helps catch mistakes before your program even runs.

### Core data types

| Type | What it stores | Example |
|------|---------------|---------|
| \`string\` | Text | \`string name = "Amara";\` |
| \`int\` | Whole numbers | \`int age = 15;\` |
| \`double\` | Decimal numbers | \`double height = 1.68;\` |
| \`bool\` | True or false | \`bool isReady = true;\` |
| \`char\` | Single character | \`char grade = 'A';\` |

### The \`var\` keyword

C# also supports \`var\`, which asks the compiler to infer the type from the value you provide. The type is still fixed — you just don't have to type it:

\`\`\`csharp
var city = "Harare";   // compiler knows this is a string
var score = 92;        // compiler knows this is an int
\`\`\`

### String interpolation

Put a \`$\` before the opening quote and use \`{}\` to embed any variable or expression:

\`\`\`csharp
Console.WriteLine($"Score: {score}");
\`\`\`

Run the example below to see all of this in action.`),
        code("csharp", VARIABLES_CODE, { filename: "Variables.cs", openInStudio: true }),
        callout("info", "C# uses PascalCase for class and method names (like WriteLine) and camelCase for local variables (like playerScore). Following these conventions will make your code look professional from day one."),
      ),
    },
    {
      title: "Control Flow",
      slug: "csharp-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and repeating things

C# has the same building blocks as most languages: **if/else** for decisions and **for/foreach/while** for loops. The main difference from Python is that C# uses curly braces \`{}\` to mark blocks of code instead of indentation.

### if / else if / else

\`\`\`csharp
if (score >= 80) {
    Console.WriteLine("A");
} else if (score >= 60) {
    Console.WriteLine("B");
} else {
    Console.WriteLine("Try again!");
}
\`\`\`

### Loops

C# gives you several loop types:

- **\`for\`** — runs a set number of times (great for counting).
- **\`foreach\`** — works through every item in a collection.
- **\`while\`** — keeps going as long as a condition is true.

### Flowchart — grade checker`),
        mermaid(
          `flowchart TD
  A([Start]) --> B[score = 74]
  B --> C{score >= 80?}
  C -- Yes --> D[grade = A]
  C -- No --> E{score >= 60?}
  E -- Yes --> F[grade = B]
  E -- No --> G{score >= 50?}
  G -- Yes --> H[grade = C]
  G -- No --> I[grade = F]
  D & F & H & I --> J[Console.WriteLine grade]
  J --> K([Done])`,
          "Decision tree for the C# grade checker",
        ),
        code("csharp", CONTROL_FLOW_CODE, { filename: "ControlFlow.cs", openInStudio: true }),
        callout("tip", "Notice the loop variable in a for loop: `for (int i = 1; i <= 5; i++)`. This reads as: start with i = 1; keep going while i is less than or equal to 5; add 1 to i after each loop. The i++ is shorthand for i = i + 1."),
      ),
    },
    {
      title: "Put It Together",
      slug: "csharp-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a number-guessing game

Now let's use everything you have learned — variables, types, conditionals, and loops — to build a complete, playable guessing game.

### How the game works

1. The program picks a secret number (42).
2. A \`while\` loop keeps asking the player to guess until they run out of tries or guess correctly.
3. \`int.TryParse()\` safely converts the player's typed input from a string to a number — without crashing if they type something that isn't a number.
4. Each wrong guess gets a hint: "too high" or "too low".
5. At the end, a message reveals whether the player won or lost.

### New ideas in this program

- **\`while\` loop** — repeats until a condition becomes false.
- **\`!won\`** — the \`!\` operator means "not", so \`!won\` means "won is currently false".
- **\`int.TryParse()\`** — a safe way to convert text to a number; returns \`false\` instead of crashing if the text is not a valid number.
- **\`continue\`** — skips the rest of the current loop iteration and goes back to the top.
- **Ternary expression** — \`tries == 1 ? "" : "es"\` is a compact if/else that produces "guess" or "guesses" based on the count.

Give it a try — then change the secret number or increase the maximum guesses!`),
        code("csharp", PUT_TOGETHER_CODE, { filename: "GuessGame.cs", openInStudio: true }),
        callout("tip", "C# is the language used in Unity, the game engine behind games like Hollow Knight, Cities: Skylines, and Monument Valley. Every feature you just learned — variables, loops, conditionals — appears in every Unity game script. You are already thinking like a game developer!"),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Factorial of 6",
      slug: "challenge-csharp",
      description: "Print 6 × 5 × 4 × 3 × 2 × 1.",
      track: "coding", difficulty: "beginner", points: 50, language: "csharp",
      starterCode: "using System;\n\nclass Program {\n    static void Main() {\n        int result = 1;\n        // multiply result by each number from 6 down to 1\n        Console.WriteLine(result);\n    }\n}\n",
      checks: { rules: [{ type: "stdout_contains", value: "720" }] },
    },
  ],
};
