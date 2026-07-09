import { md, code, callout, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, C# & Console.WriteLine
// ---------------------------------------------------------------------------

const HELLO_TRYIT = `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, RoboCode!");
        Console.WriteLine("C# programs start running in Main().");
        Console.WriteLine(6 * 7);
    }
}`;

const HELLO_REFERENCE = `using System;

class Program {
    static void Main() {
        Console.WriteLine("************");
        Console.WriteLine("*  ROBOCODE *");
        Console.WriteLine("************");
    }
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Types
// ---------------------------------------------------------------------------

const VARIABLES_TRYIT = `using System;

class Program {
    static void Main() {
        int age = 14;
        double height = 1.62;
        char grade = 'A';
        bool passed = true;
        string name = "Tariro";

        Console.WriteLine($"Name: {name}");
        Console.WriteLine($"Age: {age}");
        Console.WriteLine($"Height: {height}");
        Console.WriteLine($"Grade: {grade}");
        Console.WriteLine($"Passed: {passed}");
    }
}`;

const VARIABLES_REFERENCE = `using System;

class Program {
    static void Main() {
        var city = "Harare";
        var score = 92;
        const double Gravity = 9.81;

        Console.WriteLine($"City: {city}");
        Console.WriteLine($"Score: {score}");
        Console.WriteLine($"Gravity: {Gravity}");
    }
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Operators
// ---------------------------------------------------------------------------

const OPERATORS_TRYIT = `using System;

class Program {
    static void Main() {
        int a = 17;
        int b = 5;

        Console.WriteLine($"a + b = {a + b}");
        Console.WriteLine($"a - b = {a - b}");
        Console.WriteLine($"a * b = {a * b}");
        Console.WriteLine($"a / b = {a / b}");
        Console.WriteLine($"a % b = {a % b}");

        bool isGreater = a > b;
        bool bothPositive = (a > 0) && (b > 0);
        Console.WriteLine($"a > b: {isGreater}");
        Console.WriteLine($"both positive: {bothPositive}");
    }
}`;

const OPERATORS_REFERENCE = `using System;

class Program {
    static void Main() {
        int score = 10;
        score += 5;   // score = score + 5
        score *= 2;   // score = score * 2
        Console.WriteLine($"score = {score}");

        int count = 0;
        count++;      // increment
        count++;
        Console.WriteLine($"count = {count}");
    }
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Control Flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_TRYIT = `using System;

class Program {
    static void Main() {
        int score = 73;

        if (score >= 80) {
            Console.WriteLine("Grade: A");
        } else if (score >= 60) {
            Console.WriteLine("Grade: B");
        } else {
            Console.WriteLine("Grade: C");
        }

        Console.Write("Counting up: ");
        for (int i = 1; i <= 5; i++) {
            if (i > 1) Console.Write(", ");
            Console.Write(i);
        }
        Console.WriteLine();

        Console.Write("Counting down: ");
        int n = 3;
        while (n > 0) {
            if (n < 3) Console.Write(", ");
            Console.Write(n);
            n--;
        }
        Console.WriteLine();
    }
}`;

const CONTROL_FLOW_REFERENCE = `using System;

class Program {
    static void Main() {
        // break stops the loop immediately
        Console.Write("Stops at 5: ");
        for (int i = 1; i <= 10; i++) {
            if (i == 5) break;
            Console.Write(i + " ");
        }
        Console.WriteLine();

        // continue skips just this one iteration
        Console.Write("Skips 3: ");
        for (int i = 1; i <= 5; i++) {
            if (i == 3) continue;
            Console.Write(i + " ");
        }
        Console.WriteLine();
    }
}`;

// ---------------------------------------------------------------------------
// Lesson 5 — Methods
// ---------------------------------------------------------------------------

const METHODS_TRYIT = `using System;

class Program {
    static int Add(int a, int b) {
        return a + b;
    }

    static int Square(int n) {
        return n * n;
    }

    static bool IsEven(int n) {
        return n % 2 == 0;
    }

    static void Main() {
        Console.WriteLine($"Add(3, 4) = {Add(3, 4)}");
        Console.WriteLine($"Square(6) = {Square(6)}");
        Console.WriteLine($"IsEven(10) = {IsEven(10)}");
        Console.WriteLine($"IsEven(7) = {IsEven(7)}");
    }
}`;

const METHODS_REFERENCE = `using System;

class Program {
    // A void method performs an action but does not return a value.
    static void Greet(string name, int times) {
        for (int i = 0; i < times; i++) {
            Console.WriteLine($"Hello, {name}!");
        }
    }

    static void Main() {
        Greet("Amara", 3);
    }
}`;

// ---------------------------------------------------------------------------
// Lesson 6 — Arrays & Collections
// ---------------------------------------------------------------------------

const ARRAYS_TRYIT = `using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        int[] scores = { 92, 74, 55, 88, 100 };

        int total = 0;
        for (int i = 0; i < scores.Length; i++) {
            total += scores[i];
        }
        Console.WriteLine($"Array total: {total}");

        List<int> numbers = new List<int> { 10, 20, 30 };
        numbers.Add(40);

        int sum = 0;
        foreach (int n in numbers) {
            sum += n;
        }
        Console.WriteLine($"List count: {numbers.Count}");
        Console.WriteLine($"List sum: {sum}");
    }
}`;

const ARRAYS_REFERENCE = `using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        int[] fixedArr = { 1, 2, 3 };

        List<int> growable = new List<int> { 1, 2, 3 };
        growable.Add(4); // lists can grow — arrays cannot

        Console.WriteLine($"Fixed array length: {fixedArr.Length}");
        Console.WriteLine($"List count: {growable.Count}");
    }
}`;

export const csharpTutorialCourse: CourseModule = {
  meta: {
    title: "C# Tutorial",
    slug: "tutorial-csharp",
    track: "coding",
    level: "primary",
    description:
      "A W3Schools-style, hands-on introduction to C# — from your first Console.WriteLine to arrays and collections — with runnable examples and exercises.",
    coverImage: "/covers/coding.svg",
    order: 59,
    language: "csharp",
  },
  lessons: [
    // -------------------------------------------------------------------
    // Lesson 1 — Hello, C# & Console.WriteLine
    // -------------------------------------------------------------------
    {
      title: "Hello, C# & Console.WriteLine",
      slug: "csharp-tut-hello",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is C#?

**C#** (pronounced "see-sharp") was created by Microsoft in 2000. It runs on the **.NET** platform, which means the same C# code runs on Windows, macOS, and Linux. C# powers the **Unity** game engine, ASP.NET web apps, and countless desktop and mobile applications.

C# code is **compiled**: a compiler turns your \`.cs\` source file into an intermediate form that then runs on the .NET runtime, rather than being read line-by-line like Python.

### The shape of every C# program

\`\`\`csharp
using System;

class Program {
    static void Main() {
        // your code goes here
    }
}
\`\`\`

- \`using System;\` imports the \`System\` namespace, which contains \`Console\`.
- Every C# program needs a **class** — here, \`Program\` — containing a \`Main\` method, where the program starts.
- \`Console.WriteLine(value)\` prints \`value\` followed by a newline.
- Every statement ends with a semicolon \`;\`, and related statements are grouped inside curly braces \`{ }\`.

Press **Run** below to try your first C# program.`),
        tryit("csharp", HELLO_TRYIT, {
          expectedOutput: "Hello, RoboCode!\nC# programs start running in Main().\n42",
          caption: "Your first C# program — try changing the greeting or the multiplication.",
        }),
        md(`### Comments

Anything after \`//\` on a line is a **comment** — the compiler ignores it.

\`\`\`csharp
// This whole line is a comment
Console.WriteLine("Hi!"); // this part of the line is a comment too
\`\`\`

### More practice with Console.WriteLine

You can print as many lines as you like by calling \`Console.WriteLine\` again. Here is a small "banner" made entirely of repeated calls:`),
        code("csharp", HELLO_REFERENCE, { filename: "Banner.cs", openInStudio: true }),
        callout(
          "tip",
          "C# uses PascalCase for class and method names (like Console.WriteLine) and camelCase for local variables (like playerScore). Following these conventions from day one will make your code look professional and easy for other C# developers to read.",
        ),
        exercise(
          "csharp",
          "Change the program so it prints your name on the first line and \"I am learning C#!\" on the second line.",
          `using System;

class Program {
    static void Main() {
        // TODO: print "My name is ..." on the first line
        // TODO: print "I am learning C#!" on the second line
    }
}`,
          `using System;

class Program {
    static void Main() {
        Console.WriteLine("My name is Tariro");
        Console.WriteLine("I am learning C#!");
    }
}`,
          { check: "stdout contains a line ending with \"I am learning C#!\"" },
        ),
        exercise(
          "csharp",
          "Two numbers, a = 12 and b = 30, are already declared. Print their sum as a single line reading exactly \"Total: 42\".",
          `using System;

class Program {
    static void Main() {
        int a = 12;
        int b = 30;
        // TODO: print "Total: " followed by a + b
    }
}`,
          `using System;

class Program {
    static void Main() {
        int a = 12;
        int b = 30;
        Console.WriteLine($"Total: {a + b}");
    }
}`,
          { check: "stdout contains \"Total: 42\"" },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 2 — Variables & Types
    // -------------------------------------------------------------------
    {
      title: "Variables & Types",
      slug: "csharp-tut-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Variables and types in C#

C# is **statically typed** — every variable must have a fixed type, and that type cannot change afterwards. The compiler uses this to catch mistakes before your program ever runs.

### Core built-in types

| Type | What it stores | Example |
|---|---|---|
| \`int\` | Whole numbers | \`int age = 14;\` |
| \`double\` | Decimal numbers | \`double height = 1.62;\` |
| \`bool\` | \`true\` or \`false\` | \`bool passed = true;\` |
| \`char\` | A single character | \`char grade = 'A';\` |
| \`string\` | Text | \`string name = "Tariro";\` |

### String interpolation

Put a \`$\` before the opening quote and use \`{ }\` to embed any variable or expression directly inside the text:

\`\`\`csharp
Console.WriteLine($"My name is {name} and I am {age} years old.");
\`\`\`

### Printing booleans

C# prints \`bool\` values capitalised: \`True\` or \`False\` — not lowercase like some other languages. Keep an eye on that capital letter when you check expected output.

Run the example below to see every type in action.`),
        tryit("csharp", VARIABLES_TRYIT, {
          expectedOutput: "Name: Tariro\nAge: 14\nHeight: 1.62\nGrade: A\nPassed: True",
          caption: "Declaring one variable of each core type.",
        }),
        md(`### var and const

\`var\` asks the compiler to infer the type from the value — the type is still fixed, you just don't have to spell it out. \`const\` makes a value **immutable**: it can never change after it is first set.`),
        code("csharp", VARIABLES_REFERENCE, { filename: "VarConst.cs", openInStudio: true }),
        callout(
          "info",
          "Unlike some languages, C# refuses to compile a line like int pi = 3.14; — that is a compiler error, because it would silently throw away the decimal part. This strictness catches a whole category of precision bugs before your program ever runs. If you truly want to convert a double to an int on purpose, you must write it explicitly: int whole = (int)3.14;",
        ),
        exercise(
          "csharp",
          "Declare an int score = 88 and a string subject = \"Maths\", then print exactly \"Maths score: 88\".",
          `using System;

class Program {
    static void Main() {
        // TODO: declare int score = 88
        // TODO: declare string subject = "Maths"
        // TODO: print subject followed by " score: " followed by score
    }
}`,
          `using System;

class Program {
    static void Main() {
        int score = 88;
        string subject = "Maths";
        Console.WriteLine($"{subject} score: {score}");
    }
}`,
          { check: "stdout contains \"Maths score: 88\"" },
        ),
        exercise(
          "csharp",
          "There is a bug below: pi is declared as an int, so it can only store 3, not 3.14159. Fix the declaration so the program prints exactly \"Pi is about 3.14159\".",
          `using System;

class Program {
    static void Main() {
        int pi = 3; // BUG: an int can't hold 3.14159 — this should be a double
        Console.WriteLine($"Pi is about {pi}");
    }
}`,
          `using System;

class Program {
    static void Main() {
        double pi = 3.14159;
        Console.WriteLine($"Pi is about {pi}");
    }
}`,
          { check: "stdout contains \"Pi is about 3.14159\"" },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 3 — Operators
    // -------------------------------------------------------------------
    {
      title: "Operators",
      slug: "csharp-tut-operators",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Operators

Operators combine values to produce new values.

### Arithmetic operators

| Operator | Meaning | Example |
|---|---|---|
| \`+\` | Addition | \`a + b\` |
| \`-\` | Subtraction | \`a - b\` |
| \`*\` | Multiplication | \`a * b\` |
| \`/\` | Division | \`a / b\` |
| \`%\` | Remainder (modulo) | \`a % b\` |

**Careful:** when both operands are \`int\`, \`/\` performs **integer division** — the decimal part is thrown away. \`17 / 5\` is \`3\`, not \`3.4\`.

### Comparison & logical operators

| Operator | Meaning |
|---|---|
| \`==\` , \`!=\` | equal to, not equal to |
| \`<\` , \`>\` , \`<=\` , \`>=\` | less than, greater than, and their "or equal" versions |
| \`&&\` | logical AND — true only if both sides are true |
| logical OR | true if either side is true — written as two vertical-bar characters, e.g. \`(a > 0) OR (b > 0)\` in pseudocode |
| \`!\` | logical NOT — flips true/false |

Comparisons and logical operators always produce a \`bool\` (printed as \`True\`/\`False\`). Run the example below to see all of these at work.`),
        tryit("csharp", OPERATORS_TRYIT, {
          expectedOutput:
            "a + b = 22\na - b = 12\na * b = 85\na / b = 3\na % b = 2\na > b: True\nboth positive: True",
          caption: "Arithmetic, comparison, and logical operators with a=17, b=5.",
        }),
        md(`### Compound assignment & increment operators

Writing \`score = score + 5;\` is common enough that C# gives you a shortcut: \`score += 5;\`. The same pattern exists for \`-=\`, \`*=\`, \`/=\`, and \`%=\`. For adding or subtracting exactly 1, use \`++\` and \`--\`.`),
        code("csharp", OPERATORS_REFERENCE, { filename: "CompoundOps.cs", openInStudio: true }),
        callout(
          "tip",
          "Mixing up = (assignment) and == (comparison) is one of the most common bugs in C-family languages. In C#, however, writing if (score = 100) is actually a compiler error — an int cannot be used where a bool is expected — so C# protects you from this specific mistake that plagues C and C++.",
        ),
        exercise(
          "csharp",
          "Given int width = 6 and int height = 4, print \"Area: 24\" then \"Perimeter: 20\" (area = width * height, perimeter = 2 * (width + height)).",
          `using System;

class Program {
    static void Main() {
        int width = 6;
        int height = 4;
        // TODO: print "Area: " followed by width * height
        // TODO: print "Perimeter: " followed by 2 * (width + height)
    }
}`,
          `using System;

class Program {
    static void Main() {
        int width = 6;
        int height = 4;
        Console.WriteLine($"Area: {width * height}");
        Console.WriteLine($"Perimeter: {2 * (width + height)}");
    }
}`,
          { check: "stdout contains \"Area: 24\" and \"Perimeter: 20\"" },
        ),
        exercise(
          "csharp",
          "Use the % operator to check whether number = 42 is even or odd, printing either \"42 is even\" or \"42 is odd\".",
          `using System;

class Program {
    static void Main() {
        int number = 42;
        // TODO: use if/else and the % operator to print
        //       "<number> is even" or "<number> is odd"
    }
}`,
          `using System;

class Program {
    static void Main() {
        int number = 42;
        if (number % 2 == 0) {
            Console.WriteLine($"{number} is even");
        } else {
            Console.WriteLine($"{number} is odd");
        }
    }
}`,
          { check: "stdout contains \"42 is even\"" },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 4 — Control Flow
    // -------------------------------------------------------------------
    {
      title: "Control Flow",
      slug: "csharp-tut-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and repeating code

### if / else if / else

\`\`\`csharp
if (score >= 80) {
    // runs only if score >= 80
} else if (score >= 60) {
    // runs only if the first condition was false and this one is true
} else {
    // runs if none of the above were true
}
\`\`\`

C# requires parentheses around the condition and curly braces \`{ }\` around multi-line blocks — the same shape as C++ and Java.

### for loops

A classic \`for\` loop has three parts separated by semicolons: a starting point, a condition to keep looping, and an action after every lap.

\`\`\`csharp
for (int i = 1; i <= 5; i++) {
    // runs once for i = 1, 2, 3, 4, 5
}
\`\`\`

### while loops

A \`while\` loop keeps running **as long as** its condition stays true. You are responsible for changing something inside the loop so it eventually becomes false — otherwise you get an infinite loop!

\`\`\`csharp
while (n > 0) {
    // ... n must change in here, or this never stops
    n--;
}
\`\`\`

Run the example below to see if/else, for, and while working together.`),
        tryit("csharp", CONTROL_FLOW_TRYIT, {
          expectedOutput: "Grade: B\nCounting up: 1, 2, 3, 4, 5\nCounting down: 3, 2, 1",
          caption: "A grade check, a counting-up for loop, and a counting-down while loop.",
        }),
        md(`### break and continue

Inside a loop, \`break\` exits it immediately, and \`continue\` skips straight to the next lap without running the rest of the loop body.`),
        code("csharp", CONTROL_FLOW_REFERENCE, { filename: "BreakContinue.cs", openInStudio: true }),
        callout(
          "warning",
          "A while loop whose condition never becomes false will run forever and the sandbox will kill it after its time limit. Always double-check that something inside the loop body moves it towards the stopping condition.",
        ),
        exercise(
          "csharp",
          "Print every number from 1 to 10 that is divisible by 3, separated by \", \", on one line prefixed with \"Divisible by 3: \" (expected: \"Divisible by 3: 3, 6, 9\").",
          `using System;

class Program {
    static void Main() {
        Console.Write("Divisible by 3: ");
        // TODO: loop i from 1 to 10, printing each multiple of 3
        //       separated by ", "
        Console.WriteLine();
    }
}`,
          `using System;

class Program {
    static void Main() {
        Console.Write("Divisible by 3: ");
        bool first = true;
        for (int i = 1; i <= 10; i++) {
            if (i % 3 == 0) {
                if (!first) Console.Write(", ");
                Console.Write(i);
                first = false;
            }
        }
        Console.WriteLine();
    }
}`,
          { check: "stdout contains \"Divisible by 3: 3, 6, 9\"" },
        ),
        exercise(
          "csharp",
          "Use a while loop to add up the numbers 1 through 10 (inclusive) and print exactly \"Sum: 55\".",
          `using System;

class Program {
    static void Main() {
        int sum = 0;
        int i = 1;
        // TODO: use a while loop to add 1..10 to sum
        Console.WriteLine($"Sum: {sum}");
    }
}`,
          `using System;

class Program {
    static void Main() {
        int sum = 0;
        int i = 1;
        while (i <= 10) {
            sum += i;
            i++;
        }
        Console.WriteLine($"Sum: {sum}");
    }
}`,
          { check: "stdout contains \"Sum: 55\"" },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 5 — Methods
    // -------------------------------------------------------------------
    {
      title: "Methods",
      slug: "csharp-tut-methods",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Methods

A **method** packages up a piece of logic so you can reuse it by name instead of retyping it every time. In C#, methods live inside a class.

\`\`\`csharp
static returnType MethodName(parameterType parameterName) {
    // ... code ...
    return value; // only if returnType is not void
}
\`\`\`

- \`returnType\` is the type of value the method hands back (\`int\`, \`bool\`, \`double\`, or \`void\` if it returns nothing).
- **Parameters** are the inputs the method needs, listed in parentheses.
- \`return\` sends a value back to whoever called the method and immediately exits it.
- Method names use **PascalCase** by convention: \`Add\`, \`Square\`, \`IsEven\`.
- \`static\` here means the method belongs to the \`Program\` class itself, so \`Main\` (also static) can call it directly without creating an object first.

Here are three small methods, all called from \`Main()\`.`),
        tryit("csharp", METHODS_TRYIT, {
          expectedOutput: "Add(3, 4) = 7\nSquare(6) = 36\nIsEven(10) = True\nIsEven(7) = False",
          caption: "Three methods: one returns an int sum, one squares a number, one returns a bool.",
        }),
        md(`### void methods with parameters

A method does not have to return anything. A \`void\` method is called purely for its side effect — usually printing something.`),
        code("csharp", METHODS_REFERENCE, { filename: "Greet.cs", openInStudio: true }),
        callout(
          "tip",
          "Splitting a program into small methods, each doing one clear job, makes code far easier to test and reuse. If you find yourself copy-pasting the same few lines in several places, that is usually a sign they belong in a method.",
        ),
        exercise(
          "csharp",
          "Write static int Cube(int n) that returns n*n*n, and use it to print exactly \"Cube(3) = 27\".",
          `using System;

class Program {
    static int Cube(int n) {
        // TODO: return n*n*n
        return 0;
    }

    static void Main() {
        Console.WriteLine($"Cube(3) = {Cube(3)}");
    }
}`,
          `using System;

class Program {
    static int Cube(int n) {
        return n * n * n;
    }

    static void Main() {
        Console.WriteLine($"Cube(3) = {Cube(3)}");
    }
}`,
          { check: "stdout contains \"Cube(3) = 27\"" },
        ),
        exercise(
          "csharp",
          "Write static int Factorial(int n) using a for loop (not recursion) that returns n!, and print exactly \"Factorial(5) = 120\".",
          `using System;

class Program {
    static int Factorial(int n) {
        int result = 1;
        // TODO: multiply result by every number from 2 to n
        return result;
    }

    static void Main() {
        Console.WriteLine($"Factorial(5) = {Factorial(5)}");
    }
}`,
          `using System;

class Program {
    static int Factorial(int n) {
        int result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    static void Main() {
        Console.WriteLine($"Factorial(5) = {Factorial(5)}");
    }
}`,
          { check: "stdout contains \"Factorial(5) = 120\"" },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 6 — Arrays & Collections
    // -------------------------------------------------------------------
    {
      title: "Arrays & Collections",
      slug: "csharp-tut-arrays",
      contentType: "markdown",
      estMinutes: 13,
      body: body(
        md(`## Arrays & Collections

An **array** stores a fixed number of values of the same type, one after another in memory.

\`\`\`csharp
int[] scores = { 92, 74, 55, 88, 100 };
Console.WriteLine(scores[0]); // 92 — indexing starts at 0!
Console.WriteLine(scores.Length); // 5
\`\`\`

Arrays have a **fixed size** decided when they are created — you cannot add a 6th score to a 5-element array.

### List<T> — a growable collection

\`List<T>\` (from \`using System.Collections.Generic;\`) works like an array but can grow and shrink at runtime. The \`<T>\` is the type of item it holds — \`List<int>\`, \`List<string>\`, and so on.

\`\`\`csharp
List<int> numbers = new List<int> { 10, 20, 30 };
numbers.Add(40);           // add an element to the end
Console.WriteLine(numbers.Count); // 4
\`\`\`

### Looping over a collection

The classic index-based \`for\` loop works on arrays. \`foreach\` is shorter and works on both arrays and lists — it visits every item in order without you managing an index:

\`\`\`csharp
foreach (int n in numbers) {
    Console.WriteLine(n);
}
\`\`\`

Run the example below to see both an array and a \`List<int>\` in action.`),
        tryit("csharp", ARRAYS_TRYIT, {
          expectedOutput: "Array total: 409\nList count: 4\nList sum: 100",
          caption: "Summing a fixed array, then growing and summing a List<int>.",
        }),
        md(`### Array vs. List<T>, side by side

| | Array | \`List<T>\` |
|---|---|---|
| Size | Fixed at creation | Can grow/shrink (\`.Add\`) |
| Count property | \`.Length\` | \`.Count\` |
| Namespace needed | none | \`System.Collections.Generic\` |
| Good for | A small, known number of items | A collection that changes over time |`),
        code("csharp", ARRAYS_REFERENCE, { filename: "ArrayVsList.cs", openInStudio: true }),
        callout(
          "warning",
          "Accessing an index that does not exist (e.g. scores[10] on a 5-element array) throws an IndexOutOfRangeException at runtime and crashes the program. Unlike some languages, C# always checks this for you — but it is still your job to keep loop bounds correct so the crash never happens.",
        ),
        exercise(
          "csharp",
          "Given int[] arr = { 3, 7, 2, 9, 4 }, find and print the largest value as exactly \"Max: 9\".",
          `using System;

class Program {
    static void Main() {
        int[] arr = { 3, 7, 2, 9, 4 };
        int maxVal = arr[0];
        // TODO: loop through arr and update maxVal if a bigger value is found
        Console.WriteLine($"Max: {maxVal}");
    }
}`,
          `using System;

class Program {
    static void Main() {
        int[] arr = { 3, 7, 2, 9, 4 };
        int maxVal = arr[0];
        for (int i = 1; i < arr.Length; i++) {
            if (arr[i] > maxVal) {
                maxVal = arr[i];
            }
        }
        Console.WriteLine($"Max: {maxVal}");
    }
}`,
          { check: "stdout contains \"Max: 9\"" },
        ),
        exercise(
          "csharp",
          "Starting from List<string> names = new List<string> { \"Ana\", \"Ben\", \"Chi\" }, add \"Dee\" to the end, then print each name on its own line prefixed with \"- \" (four lines total, ending with \"- Dee\").",
          `using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        List<string> names = new List<string> { "Ana", "Ben", "Chi" };
        // TODO: add "Dee" to the end of names
        // TODO: print each name on its own line, prefixed with "- "
    }
}`,
          `using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        List<string> names = new List<string> { "Ana", "Ben", "Chi" };
        names.Add("Dee");
        foreach (string name in names) {
            Console.WriteLine($"- {name}");
        }
    }
}`,
          { check: "stdout contains \"- Dee\" on its own line" },
        ),
      ),
    },
  ],
};
