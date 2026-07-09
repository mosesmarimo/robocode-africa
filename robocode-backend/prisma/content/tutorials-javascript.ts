import { md, tryit, exercise, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Intro & First Program
// ---------------------------------------------------------------------------

const L1_TRYIT_1 = `console.log("Hello, World!");
console.log("Welcome to JavaScript.");`;

const L1_TRYIT_2 = `console.log("JavaScript", "is", "fun");
console.log(3 + 5);`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Data Types
// ---------------------------------------------------------------------------

const L2_TRYIT_1 = `let name = "Aisha";
let age = 13;
let height = 1.55;
let isMember = true;

console.log(name);
console.log(age);
console.log(height);
console.log(isMember);
console.log(typeof age);`;

const L2_TRYIT_2 = `let name = "Aisha";
let age = 13;
console.log(\`\${name} is \${age} years old.\`);
age = age + 1;
console.log(\`Next year \${name} will be \${age}.\`);`;

// ---------------------------------------------------------------------------
// Lesson 3 — Operators & Expressions
// ---------------------------------------------------------------------------

const L3_TRYIT_1 = `let a = 10;
let b = 3;

console.log(a + b);            // addition
console.log(a - b);            // subtraction
console.log(a * b);            // multiplication
console.log(a / b);            // division
console.log(Math.floor(a / b)); // floor division (rounds down)
console.log(a % b);            // modulus (the remainder)
console.log(a ** b);           // exponent (a to the power of b)`;

const L3_TRYIT_2 = `let x = 7;
let y = 12;

console.log(x < y);                   // less than
console.log(x === y);                 // strictly equal to
console.log(x !== y);                 // not equal to
console.log(x > 5 && y > 10);         // both must be true
console.log(x > 5 || y < 10);         // at least one must be true
console.log(!(x > 5));                // flips true/false`;

// ---------------------------------------------------------------------------
// Lesson 4 — Strings
// ---------------------------------------------------------------------------

const L4_TRYIT_1 = `let greeting = "Hello, RoboCode!";

console.log(greeting);
console.log(greeting.length);          // number of characters
console.log(greeting.toUpperCase());   // ALL CAPS
console.log(greeting.toLowerCase());   // all lowercase
console.log(greeting[0]);              // first character (index 0)
console.log(greeting.slice(7, 14));    // characters 7 up to (not including) 14`;

const L4_TRYIT_2 = `let first = "Robo";
let last = "Code";
let full = first + last;                 // + joins (concatenates) strings
console.log(full);
console.log(full.replace("Code", "Coder"));

let sentence = "  learn javascript today  ";
console.log(sentence.trim());            // removes leading/trailing spaces

let words = "red,green,blue".split(","); // splits into an array
console.log(words.join(", "));`;

// ---------------------------------------------------------------------------
// Lesson 5 — Conditionals (if / else if / else)
// ---------------------------------------------------------------------------

const L5_TRYIT_1 = `let age = 16;

if (age >= 18) {
  console.log("You are an adult.");
} else if (age >= 13) {
  console.log("You are a teenager.");
} else {
  console.log("You are a child.");
}`;

const L5_TRYIT_2 = `let temperature = 30;
let isRaining = false;

if (temperature > 25 && !isRaining) {
  console.log("Great day for a picnic!");
} else {
  console.log("Maybe stay indoors.");
}`;

// ---------------------------------------------------------------------------
// Lesson 6 — Loops
// ---------------------------------------------------------------------------

const L6_TRYIT_1 = `for (let i = 1; i <= 5; i++) {
  console.log(i);
}`;

const L6_TRYIT_2 = `let count = 0;
while (count < 5) {
  console.log("Count is", count);
  count++;
}
console.log("Done!");`;

const L6_TRYIT_3 = `for (let number = 1; number <= 10; number++) {
  if (number === 6) break;
  console.log(number);
}`;

// ---------------------------------------------------------------------------
// Lesson 7 — Functions
// ---------------------------------------------------------------------------

const L7_TRYIT_1 = `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Zanele"));
console.log(greet("Tino"));`;

const L7_TRYIT_2 = `function power(base, exponent = 2) {
  return base ** exponent;
}

console.log(power(4));      // uses the default exponent (2)
console.log(power(2, 3));   // overrides the default`;

// ---------------------------------------------------------------------------
// Lesson 8 — Arrays
// ---------------------------------------------------------------------------

const L8_TRYIT_1 = `let fruits = ["apple", "banana", "cherry"];

console.log(fruits.join(", "));
console.log(fruits[0]);        // first item
console.log(fruits.length);     // number of items
fruits.push("date");            // add an item to the end
console.log(fruits.join(", "));`;

const L8_TRYIT_2 = `let numbers = [5, 2, 9, 1, 7];
numbers.sort((a, b) => a - b);   // numeric sort (ascending)

console.log(numbers.join(", "));
console.log(Math.max(...numbers));
console.log(Math.min(...numbers));
console.log(numbers.reduce((sum, n) => sum + n, 0));`;

// ---------------------------------------------------------------------------
// Lesson 9 — Mini Project: Report Card
// ---------------------------------------------------------------------------

const L9_TRYIT_1 = `function gradeFor(score) {
  if (score >= 80) return "A";
  else if (score >= 60) return "B";
  else if (score >= 50) return "C";
  else return "F";
}

const students = [
  { name: "Aisha", score: 92 },
  { name: "Kofi", score: 74 },
  { name: "Zanele", score: 55 },
];

for (const student of students) {
  const grade = gradeFor(student.score);
  console.log(\`\${student.name}: \${student.score} -> \${grade}\`);
}`;

export const javascriptTutorialCourse: CourseModule = {
  meta: {
    title: "JavaScript Tutorial",
    slug: "tutorial-javascript",
    track: "coding",
    level: "primary",
    description: "A W3Schools-style, hands-on introduction to JavaScript — from your first console.log() to arrays, functions, and a mini report-card project.",
    coverImage: "/covers/coding.svg",
    order: 51,
    language: "javascript",
  },
  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1 — Intro & First Program
    // -----------------------------------------------------------------------
    {
      title: "Intro & First Program",
      slug: "javascript-tut-intro",
      estMinutes: 8,
      body: body(
        md(`## Welcome to JavaScript

**JavaScript** (JS) is the programming language of the web. Every button click, animation, and interactive form on a website is powered by JavaScript. It also runs outside the browser, on servers (Node.js) and even microcontrollers.

### The console.log() function

To display a value, JavaScript uses \`console.log()\`. Whatever you put inside the parentheses gets printed as output.

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

### Comments

A **comment** is a line JavaScript ignores — a note for humans. Single-line comments start with \`//\`.

\`\`\`javascript
// This is a comment — it does nothing when the program runs
console.log("This line actually runs");
\`\`\`

Try running the example below. Then change the text inside the quotes and run it again.`),
        tryit("javascript", L1_TRYIT_1, {
          expectedOutput: "Hello, World!\nWelcome to JavaScript.",
          caption: "Your first JavaScript program",
        }),
        md(`### console.log() can do more than text

You can pass \`console.log()\` several values separated by commas, and JavaScript joins them with a single space. You can also print the result of a calculation directly.

| Example | Output |
|---------|--------|
| \`console.log("a", "b")\` | \`a b\` |
| \`console.log(2 + 2)\` | \`4\` |

Try it yourself below.`),
        tryit("javascript", L1_TRYIT_2, {
          expectedOutput: "JavaScript is fun\n8",
          caption: "Multiple arguments and maths inside console.log()",
        }),
        callout("tip", "JavaScript statements usually end with a semicolon (;). Modern JavaScript can often work without them, but including them avoids subtle bugs, so this tutorial always uses them."),
        exercise(
          "javascript",
          "Write a program that prints your name on one line, then prints the text \"I am learning JavaScript\" on the next line.",
          `// Print your name

// Print "I am learning JavaScript"
`,
          `console.log("Tariro");
console.log("I am learning JavaScript");`,
          { check: "I am learning JavaScript", caption: "Two console.log() statements" },
        ),
        exercise(
          "javascript",
          "Print the result of adding 15 and 27 together.",
          `console.log(0); // TODO: print 15 + 27 instead
`,
          `console.log(15 + 27);`,
          { check: "42", caption: "console.log() with a calculation" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2 — Variables & Data Types
    // -----------------------------------------------------------------------
    {
      title: "Variables & Data Types",
      slug: "javascript-tut-variables",
      estMinutes: 10,
      body: body(
        md(`## Storing data in variables

JavaScript has three ways to declare a variable:

| Keyword | When to use | Can change? |
|---------|-------------|--------------|
| \`const\` | Values that never change | No — fixed |
| \`let\` | Values that may change | Yes |
| \`var\` | Old style — avoid in new code | Yes |

**Rule of thumb:** start with \`const\`. If you later need to reassign the variable, switch it to \`let\`.

### The main data types

| Type | Example |
|------|---------|
| \`number\` | \`let age = 13;\` |
| \`string\` | \`let name = "Tariro";\` |
| \`boolean\` | \`let loggedIn = true;\` |

You can check any variable's type with the built-in \`typeof\` operator.`),
        tryit("javascript", L2_TRYIT_1, {
          expectedOutput: "Aisha\n13\n1.55\ntrue\nnumber",
          caption: "Four variables and typeof",
        }),
        md(`### Template literals — mixing text and variables

A **template literal** uses backticks (\` \`) instead of quotes, and lets you embed variables directly inside text with \`\${}\`.

\`\`\`javascript
console.log(\`My name is \${name} and I am \${age} years old.\`);
\`\`\`

Template literals can contain any expression, not just a variable name.`),
        tryit("javascript", L2_TRYIT_2, {
          expectedOutput: "Aisha is 13 years old.\nNext year Aisha will be 14.",
          caption: "Template literals and reassigning a variable",
        }),
        callout("info", "Variable names are case-sensitive: score, Score, and SCORE are three different variables. By convention, JavaScript variable names use camelCase, e.g. playerScore."),
        exercise(
          "javascript",
          "Create a const city set to \"Harare\" and a const population set to 1500000. Using a template literal, print: The city of Harare has 1500000 people.",
          `const city = "";
const population = 0;
// print a template literal using city and population
`,
          `const city = "Harare";
const population = 1500000;
console.log(\`The city of \${city} has \${population} people.\`);`,
          { check: "The city of Harare has 1500000 people.", caption: "Template literals with two variables" },
        ),
        exercise(
          "javascript",
          "Create const price = 19.99 and print its type using typeof.",
          `const price = 19.99;
// print the type of price
`,
          `const price = 19.99;
console.log(typeof price);`,
          { check: "number", caption: "Checking a variable's type" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3 — Operators & Expressions
    // -----------------------------------------------------------------------
    {
      title: "Operators & Expressions",
      slug: "javascript-tut-operators",
      estMinutes: 10,
      body: body(
        md(`## Doing maths and comparing values

**Operators** combine values into new values. JavaScript has arithmetic operators for maths and comparison/logical operators for making decisions.

### Arithmetic operators

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| \`+\` | Addition | \`10 + 3\` | \`13\` |
| \`-\` | Subtraction | \`10 - 3\` | \`7\` |
| \`*\` | Multiplication | \`10 * 3\` | \`30\` |
| \`/\` | Division | \`10 / 3\` | \`3.333...\` |
| \`Math.floor(a / b)\` | Floor division | \`Math.floor(10 / 3)\` | \`3\` |
| \`%\` | Modulus (remainder) | \`10 % 3\` | \`1\` |
| \`**\` | Exponent (power) | \`10 ** 3\` | \`1000\` |

JavaScript has no built-in floor-division operator, so \`Math.floor()\` is used with regular division instead.`),
        tryit("javascript", L3_TRYIT_1, {
          expectedOutput: "13\n7\n30\n3.3333333333333335\n3\n1\n1000",
          caption: "Arithmetic operators, plus Math.floor()",
        }),
        md(`### Comparison and logical operators

Comparisons produce a \`boolean\` (\`true\` or \`false\`). Logical operators (\`&&\`, \`||\`, \`!\`) combine booleans together.

| Operator | Meaning |
|----------|---------|
| \`===\` | strictly equal to (checks value **and** type) |
| \`!==\` | not equal to |
| \`<\`  \`>\` | less / greater than |
| \`<=\`  \`>=\` | less-or-equal / greater-or-equal |
| \`&&\` | true only if **both** sides are true |
| \`\\|\\|\` | true if **at least one** side is true |
| \`!\` | flips true to false and vice versa |`),
        tryit("javascript", L3_TRYIT_2, {
          expectedOutput: "true\nfalse\ntrue\ntrue\ntrue\nfalse",
          caption: "Comparisons and logical operators",
        }),
        callout("warning", "Always use === (triple equals) rather than == in JavaScript. == performs type conversion before comparing (so 0 == false is true), while === checks both value and type (0 === false is false) and avoids surprises."),
        exercise(
          "javascript",
          "Create const width = 8 and const height = 5, and print the area of the rectangle (width times height).",
          `const width = 8;
const height = 5;
// print the area
`,
          `const width = 8;
const height = 5;
console.log(width * height);`,
          { check: "40", caption: "Multiplication" },
        ),
        exercise(
          "javascript",
          "Create const number = 17. Print true if the number is even, and false otherwise (hint: use % 2 === 0).",
          `const number = 17;
// print whether number is even
`,
          `const number = 17;
console.log(number % 2 === 0);`,
          { check: "false", caption: "Using modulus to test even/odd" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4 — Strings
    // -----------------------------------------------------------------------
    {
      title: "Strings",
      slug: "javascript-tut-strings",
      estMinutes: 11,
      body: body(
        md(`## Working with text

A **string** is a sequence of characters. Strings support **indexing** (a single character) and \`.slice()\` (a range of characters), both counting from **0**.

\`\`\`javascript
let word = "Python";
console.log(word[0]);        // P  (first character)
console.log(word.slice(0, 3)); // Pyt  (characters 0, 1, 2)
\`\`\`

JavaScript also has many built-in string **methods**, called with a dot, like \`.toUpperCase()\`.`),
        tryit("javascript", L4_TRYIT_1, {
          expectedOutput: "Hello, RoboCode!\n16\nHELLO, ROBOCODE!\nhello, robocode!\nH\nRoboCod",
          caption: "Indexing, .slice(), and case methods",
        }),
        md(`### Common string methods

| Method | What it does |
|--------|---------------|
| \`.toUpperCase()\` / \`.toLowerCase()\` | Converts case |
| \`.trim()\` | Removes leading/trailing whitespace |
| \`.replace(old, new)\` | Replaces the first occurrence of \`old\` with \`new\` |
| \`.split(sep)\` | Splits a string into an array, breaking on \`sep\` |
| \`.length\` | The number of characters (a property, not a method) |
| \`+\` | Joins (concatenates) two strings |

Strings are **immutable** — methods like \`.toUpperCase()\` return a *new* string rather than changing the original.`),
        tryit("javascript", L4_TRYIT_2, {
          expectedOutput: "RoboCode\nRoboCoder\nlearn javascript today\nred, green, blue",
          caption: "Concatenation, replace, trim, and split",
        }),
        exercise(
          "javascript",
          "Create const name = \"javascript\" and print it with the first letter capitalized (hint: name[0].toUpperCase() + name.slice(1)).",
          `const name = "javascript";
// print name, capitalized
`,
          `const name = "javascript";
console.log(name[0].toUpperCase() + name.slice(1));`,
          { check: "Javascript", caption: "Capitalizing without a built-in method" },
        ),
        exercise(
          "javascript",
          "Create const text = \"RoboCode\" and print it reversed (hint: split into characters, reverse the array, then join back together).",
          `const text = "RoboCode";
// print text reversed
`,
          `const text = "RoboCode";
console.log(text.split("").reverse().join(""));`,
          { check: "edoCoboR", caption: "Reversing a string via an array" },
        ),
        exercise(
          "javascript",
          "Create const sentence = \"the quick brown fox jumps\". Split it into words with .split(\" \") and print how many words there are, using .length.",
          `const sentence = "the quick brown fox jumps";
// split into words and print the count
`,
          `const sentence = "the quick brown fox jumps";
const words = sentence.split(" ");
console.log(words.length);`,
          { check: "5", caption: "Splitting and counting words" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 5 — Conditionals (if / else if / else)
    // -----------------------------------------------------------------------
    {
      title: "Conditionals (if / else)",
      slug: "javascript-tut-conditionals",
      estMinutes: 11,
      body: body(
        md(`## Making decisions

Programs become powerful when they can make choices. JavaScript's conditional uses \`if\`, \`else if\`, and \`else\`, with curly braces \`{}\` grouping each block. JavaScript checks each condition from top to bottom and runs the first block whose condition is \`true\`.

\`\`\`javascript
if (condition1) {
  // runs if condition1 is true
} else if (condition2) {
  // runs if condition1 was false but condition2 is true
} else {
  // runs if none of the above were true
}
\`\`\``),
        tryit("javascript", L5_TRYIT_1, {
          expectedOutput: "You are a teenager.",
          caption: "if / else if / else",
        }),
        md(`### Combining conditions

You can combine multiple conditions with \`&&\`, \`||\`, and \`!\` to make more precise decisions.`),
        tryit("javascript", L5_TRYIT_2, {
          expectedOutput: "Great day for a picnic!",
          caption: "Combining conditions with && and !",
        }),
        callout("tip", "Every if, else if, and else block needs curly braces {} around its code — even a single statement. Skipping them for multi-line blocks is a very common source of bugs."),
        exercise(
          "javascript",
          "Create const number = 8. If it is even, print \"Even\"; otherwise print \"Odd\".",
          `const number = 8;
// print "Even" or "Odd"
`,
          `const number = 8;
if (number % 2 === 0) {
  console.log("Even");
} else {
  console.log("Odd");
}`,
          { check: "Even", caption: "if / else with modulus" },
        ),
        exercise(
          "javascript",
          "Create const n = 9. If n is divisible by 3, print \"Fizz\"; otherwise print n itself.",
          `const n = 9;
// print "Fizz" or the number
`,
          `const n = 9;
if (n % 3 === 0) {
  console.log("Fizz");
} else {
  console.log(n);
}`,
          { check: "Fizz", caption: "A taste of FizzBuzz" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 6 — Loops
    // -----------------------------------------------------------------------
    {
      title: "Loops",
      slug: "javascript-tut-loops",
      estMinutes: 12,
      body: body(
        md(`## Repeating actions

A **loop** repeats a block of code. JavaScript has \`for\` loops (repeat a known number of times) and \`while\` loops (repeat as long as a condition stays true).

### for loops

A classic \`for\` loop has three parts: a starting value, a condition, and an update step.`),
        tryit("javascript", L6_TRYIT_1, {
          expectedOutput: "1\n2\n3\n4\n5",
          caption: "for (let i = 1; i <= 5; i++)",
        }),
        md(`### while loops

A \`while\` loop keeps running **while** its condition is \`true\`. You must update the variable inside the loop, or it will run forever!`),
        tryit("javascript", L6_TRYIT_2, {
          expectedOutput: "Count is 0\nCount is 1\nCount is 2\nCount is 3\nCount is 4\nDone!",
          caption: "A while loop counting to 5",
        }),
        md(`### break — stopping a loop early

The \`break\` keyword immediately exits a loop, even if its condition would otherwise still be true.`),
        tryit("javascript", L6_TRYIT_3, {
          expectedOutput: "1\n2\n3\n4\n5",
          caption: "break stops the loop when number reaches 6",
        }),
        exercise(
          "javascript",
          "Use a for loop to add up every whole number from 1 to 10, and print the total.",
          `let total = 0;
// loop from 1 to 10 and add each number to total
console.log(total);
`,
          `let total = 0;
for (let n = 1; n <= 10; n++) {
  total += n;
}
console.log(total);`,
          { check: "55", caption: "Summing with a for loop" },
        ),
        exercise(
          "javascript",
          "Use a for loop to print every even number from 2 to 10 (inclusive), one per line.",
          `// print 2, 4, 6, 8, 10 — one per line
`,
          `for (let n = 2; n <= 10; n += 2) {
  console.log(n);
}`,
          { check: "10", caption: "A for loop with a step of 2" },
        ),
        exercise(
          "javascript",
          "Print the 5 times table from 1 to 5, one line per row, in the form \"5 x 1 = 5\".",
          `// print the 5 times table, e.g. "5 x 1 = 5"
`,
          `for (let i = 1; i <= 5; i++) {
  console.log(\`5 x \${i} = \${5 * i}\`);
}`,
          { check: "5 x 5 = 25", caption: "A times table with a template literal" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 7 — Functions
    // -----------------------------------------------------------------------
    {
      title: "Functions",
      slug: "javascript-tut-functions",
      estMinutes: 11,
      body: body(
        md(`## Reusable blocks of code

A **function** is a named, reusable block of code. You define one with the \`function\` keyword; it can accept **parameters** and send a value back with \`return\`.

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Calling \`greet("Zanele")\` runs the function body with \`name\` set to \`"Zanele"\`, and gives back the returned string.`),
        tryit("javascript", L7_TRYIT_1, {
          expectedOutput: "Hello, Zanele!\nHello, Tino!",
          caption: "A function with one parameter",
        }),
        md(`### Default parameter values

A parameter can have a **default value**, used automatically whenever the caller doesn't supply one.

| Call | exponent used | Result |
|------|----------------|--------|
| \`power(4)\` | 2 (default) | 16 |
| \`power(2, 3)\` | 3 (supplied) | 8 |`),
        tryit("javascript", L7_TRYIT_2, {
          expectedOutput: "16\n8",
          caption: "A default parameter value",
        }),
        callout("info", "A function without a return statement gives back undefined. Only use return when you actually need a value back in the calling code."),
        exercise(
          "javascript",
          "Write a function square(n) that returns n multiplied by itself. Print square(6).",
          `function square(n) {
  // TODO: return n * n
}

console.log(square(6));
`,
          `function square(n) {
  return n * n;
}

console.log(square(6));`,
          { check: "36", caption: "A one-line function" },
        ),
        exercise(
          "javascript",
          "Write a function isEven(n) that returns true if n is even. Print isEven(4) and isEven(7).",
          `function isEven(n) {
  // TODO: return whether n is even
}

console.log(isEven(4));
console.log(isEven(7));
`,
          `function isEven(n) {
  return n % 2 === 0;
}

console.log(isEven(4));
console.log(isEven(7));`,
          { check: "true\nfalse", caption: "A function returning a boolean" },
        ),
        exercise(
          "javascript",
          "Write a function describeTemp(celsius = 20) that returns \"hot\" if celsius >= 30, \"mild\" if celsius >= 15, and \"cold\" otherwise. Print describeTemp() and describeTemp(32).",
          `function describeTemp(celsius = 20) {
  // TODO: return "hot", "mild", or "cold"
}

console.log(describeTemp());
console.log(describeTemp(32));
`,
          `function describeTemp(celsius = 20) {
  if (celsius >= 30) return "hot";
  else if (celsius >= 15) return "mild";
  else return "cold";
}

console.log(describeTemp());
console.log(describeTemp(32));`,
          { check: "mild\nhot", caption: "A function with a default parameter and if/else" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 8 — Arrays
    // -----------------------------------------------------------------------
    {
      title: "Arrays",
      slug: "javascript-tut-arrays",
      estMinutes: 12,
      body: body(
        md(`## Storing many values together

An **array** stores an ordered collection of values in a single variable, written between square brackets \`[]\` and separated by commas. Arrays are indexed from **0**, and they are **mutable** — you can change them after creating them.

\`\`\`javascript
let fruits = ["apple", "banana", "cherry"];
\`\`\``),
        tryit("javascript", L8_TRYIT_1, {
          expectedOutput: "apple, banana, cherry\napple\n3\napple, banana, cherry, date",
          caption: "Indexing, length, and .push()",
        }),
        md(`### Useful array methods

| Method | What it does |
|--------|---------------|
| \`.length\` | Number of items |
| \`.push(x)\` | Adds \`x\` to the end |
| \`.splice(i, 1)\` | Removes 1 item starting at index \`i\` |
| \`.sort((a, b) => a - b)\` | Sorts numbers in ascending order |
| \`Math.max(...arr)\` / \`Math.min(...arr)\` | Largest / smallest item |
| \`.reduce((sum, n) => sum + n, 0)\` | Total of all items |

\`.sort()\` on its own compares items as text, so numeric arrays need a **compare function** like \`(a, b) => a - b\` to sort correctly.`),
        tryit("javascript", L8_TRYIT_2, {
          expectedOutput: "1, 2, 5, 7, 9\n9\n1\n24",
          caption: "sort(), Math.max/min(), and reduce()",
        }),
        exercise(
          "javascript",
          "Create const colors with \"red\", \"green\", \"blue\". Use a for...of loop to print each color on its own line.",
          `const colors = ["red", "green", "blue"];
// loop over colors and print each one
`,
          `const colors = ["red", "green", "blue"];
for (const color of colors) {
  console.log(color);
}`,
          { check: "red\ngreen\nblue", caption: "Looping over an array with for...of" },
        ),
        exercise(
          "javascript",
          "Create const animals = [\"cat\", \"dog\", \"hamster\"]. Remove \"dog\" using indexOf() + splice(), and print the resulting array joined with \", \".",
          `const animals = ["cat", "dog", "hamster"];
// remove "dog" and print the array
`,
          `const animals = ["cat", "dog", "hamster"];
const index = animals.indexOf("dog");
animals.splice(index, 1);
console.log(animals.join(", "));`,
          { check: "cat, hamster", caption: "Removing an item with splice()" },
        ),
        exercise(
          "javascript",
          "Create const scores = [70, 85, 90, 60] and print the total using .reduce().",
          `const scores = [70, 85, 90, 60];
// print the total
`,
          `const scores = [70, 85, 90, 60];
console.log(scores.reduce((sum, s) => sum + s, 0));`,
          { check: "305", caption: "Totalling an array with reduce()" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 9 — Mini Project: Report Card
    // -----------------------------------------------------------------------
    {
      title: "Mini Project: Report Card",
      slug: "javascript-tut-project",
      estMinutes: 14,
      body: body(
        md(`## Bringing it all together

Time to combine everything from this tutorial — variables, strings, conditionals, loops, functions, and arrays — into one small program: a class report-card generator.

### How it works

1. A function \`gradeFor(score)\` uses \`if / else if / else\` to turn a numeric score into a letter grade.
2. An array of **objects** stores each student's \`name\` and \`score\`.
3. A \`for...of\` loop visits each student, calls \`gradeFor()\`, and prints a formatted line with a template literal.

This is exactly the kind of small, useful script real programmers write every day.`),
        tryit("javascript", L9_TRYIT_1, {
          expectedOutput: "Aisha: 92 -> A\nKofi: 74 -> B\nZanele: 55 -> C",
          caption: "A report-card generator",
        }),
        md(`### One more building block: averages

A common next step is to compute the **average** of an array of numbers: total everything with \`.reduce()\`, then divide by how many items there are.

\`\`\`javascript
function average(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}
\`\`\``),
        callout("tip", "Real programs often start small, just like this one. Break big problems into small functions, test each one, then combine them — this is exactly how professional developers work."),
        exercise(
          "javascript",
          "Write a function average(numbers) that returns the average of an array of numbers (total divided by length). Print average([88, 92, 79, 65]).",
          `function average(numbers) {
  // TODO: return the average
}

const scores = [88, 92, 79, 65];
console.log(average(scores));
`,
          `function average(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

const scores = [88, 92, 79, 65];
console.log(average(scores));`,
          { check: "81", caption: "Computing an average with reduce() and length" },
        ),
        exercise(
          "javascript",
          "Extend the report card: add a new student ({ name: \"Blessing\", score: 40 }) to the students array, then run the same for...of loop to print grades for all four students.",
          `function gradeFor(score) {
  if (score >= 80) return "A";
  else if (score >= 60) return "B";
  else if (score >= 50) return "C";
  else return "F";
}

const students = [
  { name: "Aisha", score: 92 },
  { name: "Kofi", score: 74 },
  { name: "Zanele", score: 55 },
];
// TODO: add { name: "Blessing", score: 40 } to students

for (const student of students) {
  const grade = gradeFor(student.score);
  console.log(\`\${student.name}: \${student.score} -> \${grade}\`);
}
`,
          `function gradeFor(score) {
  if (score >= 80) return "A";
  else if (score >= 60) return "B";
  else if (score >= 50) return "C";
  else return "F";
}

const students = [
  { name: "Aisha", score: 92 },
  { name: "Kofi", score: 74 },
  { name: "Zanele", score: 55 },
  { name: "Blessing", score: 40 },
];

for (const student of students) {
  const grade = gradeFor(student.score);
  console.log(\`\${student.name}: \${student.score} -> \${grade}\`);
}`,
          { check: "Blessing: 40 -> F", caption: "Adding a student to the array" },
        ),
      ),
    },
  ],
};
