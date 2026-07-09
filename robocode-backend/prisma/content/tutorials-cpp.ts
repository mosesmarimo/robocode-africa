import { md, code, callout, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, C++ & cout
// ---------------------------------------------------------------------------

const HELLO_TRYIT = `#include <iostream>

int main() {
    std::cout << "Hello, RoboCode!" << std::endl;
    std::cout << "C++ programs start running in main()." << std::endl;
    std::cout << 6 * 7 << std::endl;
    return 0;
}`;

const HELLO_REFERENCE = `#include <iostream>

int main() {
    std::cout << "************" << std::endl;
    std::cout << "*  ROBOCODE *" << std::endl;
    std::cout << "************" << std::endl;
    return 0;
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Types
// ---------------------------------------------------------------------------

const VARIABLES_TRYIT = `#include <iostream>
#include <string>

int main() {
    int age = 14;
    double height = 1.62;
    char grade = 'A';
    bool passed = true;
    std::string name = "Tariro";

    std::cout << "Name: " << name << std::endl;
    std::cout << "Age: " << age << std::endl;
    std::cout << "Height: " << height << std::endl;
    std::cout << "Grade: " << grade << std::endl;
    std::cout << "Passed: " << std::boolalpha << passed << std::endl;
    return 0;
}`;

const VARIABLES_REFERENCE = `#include <iostream>

int main() {
    const double GRAVITY = 9.81;
    int score = 100;
    long population = 16000000L;

    std::cout << "Gravity: " << GRAVITY << " m/s^2" << std::endl;
    std::cout << "Score: " << score << std::endl;
    std::cout << "Population: " << population << std::endl;
    return 0;
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Operators
// ---------------------------------------------------------------------------

const OPERATORS_TRYIT = `#include <iostream>

int main() {
    int a = 17;
    int b = 5;

    std::cout << "a + b = " << (a + b) << std::endl;
    std::cout << "a - b = " << (a - b) << std::endl;
    std::cout << "a * b = " << (a * b) << std::endl;
    std::cout << "a / b = " << (a / b) << std::endl;
    std::cout << "a % b = " << (a % b) << std::endl;

    bool isGreater = a > b;
    bool bothPositive = (a > 0) && (b > 0);
    std::cout << "a > b: " << std::boolalpha << isGreater << std::endl;
    std::cout << "both positive: " << bothPositive << std::endl;

    return 0;
}`;

const OPERATORS_REFERENCE = `#include <iostream>

int main() {
    int score = 10;
    score += 5;   // score = score + 5
    score *= 2;   // score = score * 2
    std::cout << "score = " << score << std::endl;

    int count = 0;
    count++;      // increment
    count++;
    std::cout << "count = " << count << std::endl;
    return 0;
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Control Flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_TRYIT = `#include <iostream>

int main() {
    int score = 73;

    if (score >= 80) {
        std::cout << "Grade: A" << std::endl;
    } else if (score >= 60) {
        std::cout << "Grade: B" << std::endl;
    } else {
        std::cout << "Grade: C" << std::endl;
    }

    std::cout << "Counting up: ";
    for (int i = 1; i <= 5; i++) {
        if (i > 1) std::cout << ", ";
        std::cout << i;
    }
    std::cout << std::endl;

    std::cout << "Counting down: ";
    int n = 3;
    while (n > 0) {
        if (n < 3) std::cout << ", ";
        std::cout << n;
        n--;
    }
    std::cout << std::endl;

    return 0;
}`;

const CONTROL_FLOW_REFERENCE = `#include <iostream>

int main() {
    // break stops the loop immediately
    std::cout << "Stops at 5: ";
    for (int i = 1; i <= 10; i++) {
        if (i == 5) break;
        std::cout << i << " ";
    }
    std::cout << std::endl;

    // continue skips just this one iteration
    std::cout << "Skips 3: ";
    for (int i = 1; i <= 5; i++) {
        if (i == 3) continue;
        std::cout << i << " ";
    }
    std::cout << std::endl;

    return 0;
}`;

// ---------------------------------------------------------------------------
// Lesson 5 — Functions
// ---------------------------------------------------------------------------

const FUNCTIONS_TRYIT = `#include <iostream>

int add(int a, int b) {
    return a + b;
}

int square(int n) {
    return n * n;
}

bool isEven(int n) {
    return n % 2 == 0;
}

int main() {
    std::cout << "add(3, 4) = " << add(3, 4) << std::endl;
    std::cout << "square(6) = " << square(6) << std::endl;
    std::cout << "isEven(10) = " << std::boolalpha << isEven(10) << std::endl;
    std::cout << "isEven(7) = " << isEven(7) << std::endl;
    return 0;
}`;

const FUNCTIONS_REFERENCE = `#include <iostream>
#include <string>

// A void function performs an action but does not return a value.
void greet(std::string name, int times) {
    for (int i = 0; i < times; i++) {
        std::cout << "Hello, " << name << "!" << std::endl;
    }
}

int main() {
    greet("Amara", 3);
    return 0;
}`;

// ---------------------------------------------------------------------------
// Lesson 6 — Arrays & Vectors
// ---------------------------------------------------------------------------

const ARRAYS_TRYIT = `#include <iostream>
#include <vector>

int main() {
    int scores[5] = {92, 74, 55, 88, 100};

    int total = 0;
    for (int i = 0; i < 5; i++) {
        total += scores[i];
    }
    std::cout << "Array total: " << total << std::endl;

    std::vector<int> numbers = {10, 20, 30};
    numbers.push_back(40);

    int sum = 0;
    for (int n : numbers) {
        sum += n;
    }
    std::cout << "Vector size: " << numbers.size() << std::endl;
    std::cout << "Vector sum: " << sum << std::endl;

    return 0;
}`;

const ARRAYS_REFERENCE = `#include <iostream>
#include <vector>

int main() {
    int fixedArr[3] = {1, 2, 3};

    std::vector<int> growable = {1, 2, 3};
    growable.push_back(4); // vectors can grow — arrays cannot

    std::cout << "Fixed array size: " << (sizeof(fixedArr) / sizeof(fixedArr[0])) << std::endl;
    std::cout << "Vector size: " << growable.size() << std::endl;
    return 0;
}`;

export const cppTutorialCourse: CourseModule = {
  meta: {
    title: "C/C++ Tutorial",
    slug: "tutorial-cpp",
    track: "coding",
    level: "primary",
    description:
      "A W3Schools-style, hands-on introduction to C and C++ — from your first std::cout to arrays and vectors — with runnable examples and exercises.",
    coverImage: "/covers/coding.svg",
    order: 58,
    language: "cpp",
  },
  lessons: [
    // -------------------------------------------------------------------
    // Lesson 1 — Hello, C++ & cout
    // -------------------------------------------------------------------
    {
      title: "Hello, C++ & cout",
      slug: "cpp-tut-hello",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is C/C++?

**C** was created in 1972 by Dennis Ritchie and became the language operating systems were built with. **C++**, created by Bjarne Stroustrup in 1985, added object-oriented features on top of C. Together they power operating systems, game engines, browsers, and — importantly for you — robotics and embedded systems like Arduino boards.

C++ code is **compiled**: a compiler (here, \`g++\`) turns your \`.cpp\` source file into a machine-code program before it runs. This is different from languages like Python, which run line-by-line through an interpreter.

### The shape of every C++ program

\`\`\`cpp
#include <iostream>

int main() {
    // your code goes here
    return 0;
}
\`\`\`

- \`#include <iostream>\` brings in the **i**nput/**o**utput **stream** library, which gives you \`std::cout\`.
- Every program starts running inside \`int main() { ... }\`.
- \`std::cout << value\` sends \`value\` to the terminal. The \`<<\` operator can be chained: \`std::cout << "a" << "b";\` prints \`ab\`.
- \`std::endl\` prints a newline and flushes the output buffer.
- \`return 0;\` tells the operating system the program finished successfully.
- Every statement ends with a semicolon \`;\` — forgetting one is the most common beginner mistake.

Press **Run** below to try your first C++ program.`),
        tryit("cpp", HELLO_TRYIT, {
          expectedOutput: "Hello, RoboCode!\nC++ programs start running in main().\n42",
          caption: "Your first C++ program — try changing the greeting or the multiplication.",
        }),
        md(`### Comments

Anything after \`//\` on a line is a **comment** — the compiler ignores it. Comments explain your code to other humans (including future you).

\`\`\`cpp
// This whole line is a comment
std::cout << "Hi!" << std::endl; // this part of the line is a comment too
\`\`\`

### More practice with cout

You can print as many lines as you like by calling \`std::cout\` again, or by chaining several \`<<\` in one statement. Here is a small "banner" made entirely of \`std::cout\` calls:`),
        code("cpp", HELLO_REFERENCE, { filename: "banner.cpp", openInStudio: true }),
        callout(
          "tip",
          "The std:: prefix means we are using cout from the C++ Standard Library's std namespace. Many beginner tutorials write using namespace std; at the top so they can just write cout — but explicit std:: is better practice because it makes it obvious where every name comes from.",
        ),
        exercise(
          "cpp",
          "Change the program so it prints your name on the first line and \"I am learning C++!\" on the second line.",
          `#include <iostream>

int main() {
    // TODO: print "My name is ..." on the first line
    // TODO: print "I am learning C++!" on the second line

    return 0;
}`,
          `#include <iostream>

int main() {
    std::cout << "My name is Tariro" << std::endl;
    std::cout << "I am learning C++!" << std::endl;
    return 0;
}`,
          { check: "stdout contains a line ending with \"I am learning C++!\"" },
        ),
        exercise(
          "cpp",
          "Two numbers, a = 12 and b = 30, are already declared. Print their sum as a single line reading exactly \"Total: 42\".",
          `#include <iostream>

int main() {
    int a = 12;
    int b = 30;
    // TODO: print "Total: " followed by a + b

    return 0;
}`,
          `#include <iostream>

int main() {
    int a = 12;
    int b = 30;
    std::cout << "Total: " << (a + b) << std::endl;
    return 0;
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
      slug: "cpp-tut-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Variables and types in C++

C++ is **statically typed** — every variable must have a declared type, and that type cannot change afterwards. The compiler uses this to catch mistakes before your program ever runs.

### Core built-in types

| Type | What it stores | Example |
|---|---|---|
| \`int\` | Whole numbers | \`int age = 14;\` |
| \`long\` | Larger whole numbers | \`long pop = 16000000L;\` |
| \`double\` | Decimal numbers (high precision) | \`double height = 1.62;\` |
| \`float\` | Decimal numbers (less precision) | \`float temp = 27.5f;\` |
| \`bool\` | \`true\` or \`false\` | \`bool passed = true;\` |
| \`char\` | A single character | \`char grade = 'A';\` |
| \`std::string\` | Text (needs \`#include <string>\`) | \`std::string name = "Tariro";\` |

### Constants

Prefix a variable with \`const\` to make it **immutable** — it can never change after it is first set:

\`\`\`cpp
const double GRAVITY = 9.81;
\`\`\`

### Printing booleans

By default, \`std::cout\` prints a \`bool\` as \`1\` or \`0\`. Adding \`std::boolalpha\` to the stream switches it to print \`true\`/\`false\` instead — try removing it in the example below and see what changes.

Run the example to see every type in action.`),
        tryit("cpp", VARIABLES_TRYIT, {
          expectedOutput: "Name: Tariro\nAge: 14\nHeight: 1.62\nGrade: A\nPassed: true",
          caption: "Declaring one variable of each core type.",
        }),
        md(`### const and larger numbers

\`const\` values and \`long\` (for numbers too big for \`int\`) show up constantly in real C++ code — for example physics constants or population counts:`),
        code("cpp", VARIABLES_REFERENCE, { filename: "constants.cpp", openInStudio: true }),
        callout(
          "info",
          "C++ has more integer types than most languages (int, short, long, long long, and their unsigned variants). For everyday work, int and long are enough. When you write firmware for microcontrollers, you will meet exact-size types like uint8_t to control memory precisely.",
        ),
        exercise(
          "cpp",
          "Declare an int score = 88 and a std::string subject = \"Maths\", then print exactly \"Maths score: 88\".",
          `#include <iostream>
#include <string>

int main() {
    // TODO: declare int score = 88
    // TODO: declare std::string subject = "Maths"
    // TODO: print subject followed by " score: " followed by score

    return 0;
}`,
          `#include <iostream>
#include <string>

int main() {
    int score = 88;
    std::string subject = "Maths";
    std::cout << subject << " score: " << score << std::endl;
    return 0;
}`,
          { check: "stdout contains \"Maths score: 88\"" },
        ),
        exercise(
          "cpp",
          "There is a bug below: pi is declared as an int, so it can only store 3, not 3.14159. Fix the declaration so the program prints exactly \"Pi is about 3.14159\".",
          `#include <iostream>

int main() {
    int pi = 3.14159; // BUG: wrong type! pi should be a double
    std::cout << "Pi is about " << pi << std::endl;
    return 0;
}`,
          `#include <iostream>

int main() {
    double pi = 3.14159;
    std::cout << "Pi is about " << pi << std::endl;
    return 0;
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
      slug: "cpp-tut-operators",
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

Comparisons and logical operators always produce a \`bool\`. Run the example below to see all of these at work.`),
        tryit("cpp", OPERATORS_TRYIT, {
          expectedOutput: "a + b = 22\na - b = 12\na * b = 85\na / b = 3\na % b = 2\na > b: true\nboth positive: true",
          caption: "Arithmetic, comparison, and logical operators with a=17, b=5.",
        }),
        md(`### Compound assignment & increment operators

Writing \`score = score + 5;\` is common enough that C++ gives you a shortcut: \`score += 5;\`. The same pattern exists for \`-=\`, \`*=\`, \`/=\`, and \`%=\`. For adding or subtracting exactly 1, use \`++\` and \`--\`.`),
        code("cpp", OPERATORS_REFERENCE, { filename: "compound_ops.cpp", openInStudio: true }),
        callout(
          "tip",
          "Mixing up = (assignment) and == (comparison) is one of the most common bugs in C-family languages. if (score = 100) assigns 100 to score and is always true, instead of checking whether score equals 100 — a bug the compiler usually warns about but does not block.",
        ),
        exercise(
          "cpp",
          "Given int width = 6 and int height = 4, print \"Area: 24\" then \"Perimeter: 20\" (area = width * height, perimeter = 2 * (width + height)).",
          `#include <iostream>

int main() {
    int width = 6;
    int height = 4;
    // TODO: print "Area: " followed by width * height
    // TODO: print "Perimeter: " followed by 2 * (width + height)

    return 0;
}`,
          `#include <iostream>

int main() {
    int width = 6;
    int height = 4;
    std::cout << "Area: " << (width * height) << std::endl;
    std::cout << "Perimeter: " << (2 * (width + height)) << std::endl;
    return 0;
}`,
          { check: "stdout contains \"Area: 24\" and \"Perimeter: 20\"" },
        ),
        exercise(
          "cpp",
          "Use the % operator to check whether number = 42 is even or odd, printing either \"42 is even\" or \"42 is odd\".",
          `#include <iostream>

int main() {
    int number = 42;
    // TODO: use if/else and the % operator to print
    //       "<number> is even" or "<number> is odd"

    return 0;
}`,
          `#include <iostream>

int main() {
    int number = 42;
    if (number % 2 == 0) {
        std::cout << number << " is even" << std::endl;
    } else {
        std::cout << number << " is odd" << std::endl;
    }
    return 0;
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
      slug: "cpp-tut-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and repeating code

### if / else if / else

\`\`\`cpp
if (score >= 80) {
    // runs only if score >= 80
} else if (score >= 60) {
    // runs only if the first condition was false and this one is true
} else {
    // runs if none of the above were true
}
\`\`\`

Unlike Python, C++ **requires** parentheses around the condition and curly braces \`{ }\` around multi-line blocks.

### for loops

A classic \`for\` loop has three parts separated by semicolons: a starting point, a condition to keep looping, and an action after every lap.

\`\`\`cpp
for (int i = 1; i <= 5; i++) {
    // runs once for i = 1, 2, 3, 4, 5
}
\`\`\`

### while loops

A \`while\` loop keeps running **as long as** its condition stays true. You are responsible for changing something inside the loop so it eventually becomes false — otherwise you get an infinite loop!

\`\`\`cpp
while (n > 0) {
    // ... n must change in here, or this never stops
    n--;
}
\`\`\`

Run the example below to see if/else, for, and while working together.`),
        tryit("cpp", CONTROL_FLOW_TRYIT, {
          expectedOutput: "Grade: B\nCounting up: 1, 2, 3, 4, 5\nCounting down: 3, 2, 1",
          caption: "A grade check, a counting-up for loop, and a counting-down while loop.",
        }),
        md(`### break and continue

Inside a loop, \`break\` exits it immediately, and \`continue\` skips straight to the next lap without running the rest of the loop body.`),
        code("cpp", CONTROL_FLOW_REFERENCE, { filename: "break_continue.cpp", openInStudio: true }),
        callout(
          "warning",
          "A while loop whose condition never becomes false will run forever and the sandbox will kill it after its time limit. Always double-check that something inside the loop body moves it towards the stopping condition.",
        ),
        exercise(
          "cpp",
          "Print every number from 1 to 10 that is divisible by 3, separated by \", \", on one line prefixed with \"Divisible by 3: \" (expected: \"Divisible by 3: 3, 6, 9\").",
          `#include <iostream>

int main() {
    std::cout << "Divisible by 3: ";
    // TODO: loop i from 1 to 10, printing each multiple of 3
    //       separated by ", "
    std::cout << std::endl;
    return 0;
}`,
          `#include <iostream>

int main() {
    std::cout << "Divisible by 3: ";
    bool first = true;
    for (int i = 1; i <= 10; i++) {
        if (i % 3 == 0) {
            if (!first) std::cout << ", ";
            std::cout << i;
            first = false;
        }
    }
    std::cout << std::endl;
    return 0;
}`,
          { check: "stdout contains \"Divisible by 3: 3, 6, 9\"" },
        ),
        exercise(
          "cpp",
          "Use a while loop to add up the numbers 1 through 10 (inclusive) and print exactly \"Sum: 55\".",
          `#include <iostream>

int main() {
    int sum = 0;
    int i = 1;
    // TODO: use a while loop to add 1..10 to sum
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}`,
          `#include <iostream>

int main() {
    int sum = 0;
    int i = 1;
    while (i <= 10) {
        sum += i;
        i++;
    }
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}`,
          { check: "stdout contains \"Sum: 55\"" },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 5 — Functions
    // -------------------------------------------------------------------
    {
      title: "Functions",
      slug: "cpp-tut-functions",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Functions

A **function** packages up a piece of logic so you can reuse it by name instead of retyping it every time.

\`\`\`cpp
returnType functionName(parameterType parameterName) {
    // ... code ...
    return value; // only if returnType is not void
}
\`\`\`

- \`returnType\` is the type of value the function hands back (\`int\`, \`bool\`, \`double\`, or \`void\` if it returns nothing).
- **Parameters** are the inputs the function needs, listed in parentheses.
- \`return\` sends a value back to whoever called the function and immediately exits it.
- A function must be **defined above** (or at least declared above) the place where you call it — \`main()\` usually goes last so it can call everything defined earlier in the file.

Here are three small functions, all called from \`main()\`.`),
        tryit("cpp", FUNCTIONS_TRYIT, {
          expectedOutput: "add(3, 4) = 7\nsquare(6) = 36\nisEven(10) = true\nisEven(7) = false",
          caption: "Three functions: one returns an int sum, one squares a number, one returns a bool.",
        }),
        md(`### void functions with parameters

A function does not have to return anything. A \`void\` function is called purely for its side effect — usually printing something.`),
        code("cpp", FUNCTIONS_REFERENCE, { filename: "greet.cpp", openInStudio: true }),
        callout(
          "tip",
          "Splitting a program into small functions, each doing one clear job, makes code far easier to test and reuse. If you find yourself copy-pasting the same three lines in several places, that is usually a sign they belong in a function.",
        ),
        exercise(
          "cpp",
          "Write int cube(int n) that returns n*n*n, and use it to print exactly \"cube(3) = 27\".",
          `#include <iostream>

int cube(int n) {
    // TODO: return n*n*n
    return 0;
}

int main() {
    std::cout << "cube(3) = " << cube(3) << std::endl;
    return 0;
}`,
          `#include <iostream>

int cube(int n) {
    return n * n * n;
}

int main() {
    std::cout << "cube(3) = " << cube(3) << std::endl;
    return 0;
}`,
          { check: "stdout contains \"cube(3) = 27\"" },
        ),
        exercise(
          "cpp",
          "Write int factorial(int n) using a for loop (not recursion) that returns n!, and print exactly \"factorial(5) = 120\".",
          `#include <iostream>

int factorial(int n) {
    int result = 1;
    // TODO: multiply result by every number from 2 to n
    return result;
}

int main() {
    std::cout << "factorial(5) = " << factorial(5) << std::endl;
    return 0;
}`,
          `#include <iostream>

int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int main() {
    std::cout << "factorial(5) = " << factorial(5) << std::endl;
    return 0;
}`,
          { check: "stdout contains \"factorial(5) = 120\"" },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 6 — Arrays & Vectors
    // -------------------------------------------------------------------
    {
      title: "Arrays & Vectors",
      slug: "cpp-tut-arrays",
      contentType: "markdown",
      estMinutes: 13,
      body: body(
        md(`## Arrays & Vectors

An **array** stores a fixed number of values of the same type, one after another in memory.

\`\`\`cpp
int scores[5] = {92, 74, 55, 88, 100};
std::cout << scores[0]; // 92 — indexing starts at 0!
\`\`\`

Arrays have a **fixed size** decided when they are created — you cannot add a 6th score to a 5-element array.

### std::vector — a growable array

\`std::vector\` (from \`#include <vector>\`) works like an array but can grow and shrink at runtime:

\`\`\`cpp
std::vector<int> numbers = {10, 20, 30};
numbers.push_back(40);        // add an element to the end
std::cout << numbers.size();  // 4
\`\`\`

### Looping over a collection

The classic index-based \`for\` loop works on both arrays and vectors. C++11 also added the **range-based for loop**, which is shorter and avoids index mistakes:

\`\`\`cpp
for (int n : numbers) {
    std::cout << n << std::endl;
}
\`\`\`

Run the example below to see both an array and a vector in action.`),
        tryit("cpp", ARRAYS_TRYIT, {
          expectedOutput: "Array total: 409\nVector size: 4\nVector sum: 100",
          caption: "Summing a fixed array, then growing and summing a std::vector.",
        }),
        md(`### Array vs. vector, side by side

| | Array | \`std::vector\` |
|---|---|---|
| Size | Fixed at creation | Can grow/shrink (\`push_back\`) |
| Knows its own size? | No — you must track it yourself | Yes — \`.size()\` |
| \`#include\` needed | none | \`<vector>\` |
| Good for | A small, known number of items | A collection that changes over time |`),
        code("cpp", ARRAYS_REFERENCE, { filename: "array_vs_vector.cpp", openInStudio: true }),
        callout(
          "warning",
          "C++ does not stop you from reading or writing past the end of an array or vector (e.g. scores[10] on a 5-element array) — this is called undefined behavior and is a common source of hard-to-find bugs. Always double-check your loop bounds against the actual size.",
        ),
        exercise(
          "cpp",
          "Given int arr[5] = {3, 7, 2, 9, 4}, find and print the largest value as exactly \"Max: 9\".",
          `#include <iostream>

int main() {
    int arr[5] = {3, 7, 2, 9, 4};
    int maxVal = arr[0];
    // TODO: loop through arr and update maxVal if a bigger value is found
    std::cout << "Max: " << maxVal << std::endl;
    return 0;
}`,
          `#include <iostream>

int main() {
    int arr[5] = {3, 7, 2, 9, 4};
    int maxVal = arr[0];
    for (int i = 1; i < 5; i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }
    std::cout << "Max: " << maxVal << std::endl;
    return 0;
}`,
          { check: "stdout contains \"Max: 9\"" },
        ),
        exercise(
          "cpp",
          "Starting from std::vector<std::string> names = {\"Ana\", \"Ben\", \"Chi\"}, add \"Dee\" to the end, then print each name on its own line prefixed with \"- \" (four lines total, ending with \"- Dee\").",
          `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> names = {"Ana", "Ben", "Chi"};
    // TODO: add "Dee" to the end of names
    // TODO: print each name on its own line, prefixed with "- "

    return 0;
}`,
          `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> names = {"Ana", "Ben", "Chi"};
    names.push_back("Dee");
    for (const std::string& name : names) {
        std::cout << "- " << name << std::endl;
    }
    return 0;
}`,
          { check: "stdout contains \"- Dee\" on its own line" },
        ),
      ),
    },
  ],
};
