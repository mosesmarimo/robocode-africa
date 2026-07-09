import { md, callout, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Introduction & Types
// ---------------------------------------------------------------------------

const INTRO_TYPES_CODE = `let name: string = "Tariro";
let age: number = 14;
let isStudent: boolean = true;

console.log("Name:", name);
console.log("Age:", age);
console.log("Is student:", isStudent);

let city = "Harare"; // inferred as string
console.log("City:", city);`;

const INTRO_TYPES_EXPECTED = "Name: Tariro\nAge: 14\nIs student: true\nCity: Harare\n";

// ---------------------------------------------------------------------------
// Lesson 2 — Interfaces & Object Types
// ---------------------------------------------------------------------------

const INTERFACES_CODE = `interface Student {
  name: string;
  age: number;
  grade: string;
}

const student: Student = {
  name: "Farai",
  age: 15,
  grade: "9th",
};

function describe(s: Student): string {
  return \`\${s.name} is \${s.age} years old and in grade \${s.grade}.\`;
}

console.log(describe(student));`;

const INTERFACES_EXPECTED = "Farai is 15 years old and in grade 9th.\n";

// ---------------------------------------------------------------------------
// Lesson 3 — Functions & Generics
// ---------------------------------------------------------------------------

const FUNCTIONS_GENERICS_CODE = `function add(a: number, b: number): number {
  return a + b;
}

function identity<T>(value: T): T {
  return value;
}

console.log("3 + 4 =", add(3, 4));
console.log(identity<string>("hello"));
console.log(identity<number>(42));`;

const FUNCTIONS_GENERICS_EXPECTED = "3 + 4 = 7\nhello\n42\n";

// ---------------------------------------------------------------------------
// Lesson 4 — Arrays & Objects
// ---------------------------------------------------------------------------

const ARRAYS_OBJECTS_CODE = `const scores: number[] = [70, 85, 90, 60];
const passing = scores.filter((s) => s >= 70);
const doubled = scores.map((s) => s * 2);

console.log("All scores:", scores);
console.log("Passing scores:", passing);
console.log("Doubled:", doubled);`;

const ARRAYS_OBJECTS_EXPECTED =
  "All scores: [70,85,90,60]\nPassing scores: [70,85,90]\nDoubled: [140,170,180,120]\n";

// ---------------------------------------------------------------------------
// Lesson 5 — Union & Optional Types
// ---------------------------------------------------------------------------

const UNION_OPTIONAL_CODE = `function formatId(id: string | number): string {
  return \`ID-\${id}\`;
}

interface Pet {
  name: string;
  nickname?: string;
}

function greetPet(pet: Pet): string {
  return \`Hello, \${pet.nickname ?? pet.name}!\`;
}

console.log(formatId(42));
console.log(formatId("A7"));
console.log(greetPet({ name: "Rex" }));
console.log(greetPet({ name: "Rex", nickname: "Rexy" }));`;

const UNION_OPTIONAL_EXPECTED = "ID-42\nID-A7\nHello, Rex!\nHello, Rexy!\n";

// ---------------------------------------------------------------------------
// Lesson 6 — Mini Project: Gradebook
// ---------------------------------------------------------------------------

const MINI_GRADEBOOK_CODE = `interface Student {
  name: string;
  scores: number[];
}

function average(scores: number[]): number {
  const total = scores.reduce((sum, s) => sum + s, 0);
  return total / scores.length;
}

function letterGrade(avg: number): string {
  if (avg >= 80) return "A";
  if (avg >= 70) return "B";
  if (avg >= 60) return "C";
  return "F";
}

const students: Student[] = [
  { name: "Tariro", scores: [85, 90, 78] },
  { name: "Farai", scores: [60, 65, 70] },
];

for (const student of students) {
  const avg = average(student.scores);
  console.log(\`\${student.name}: average \${avg.toFixed(1)}, grade \${letterGrade(avg)}\`);
}`;

const MINI_GRADEBOOK_EXPECTED = "Tariro: average 84.3, grade A\nFarai: average 65.0, grade C\n";

export const typescriptTutorialCourse: CourseModule = {
  meta: {
    title: "TypeScript Tutorial",
    slug: "tutorial-typescript",
    track: "coding",
    level: "primary",
    description:
      "Learn TypeScript — JavaScript with types — from your first typed variable to interfaces, generics, and a mini gradebook project.",
    coverImage: "/covers/coding.svg",
    order: 52,
    language: "typescript",
  },
  lessons: [
    {
      title: "Introduction & Types",
      slug: "intro-types",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## What is TypeScript?

**TypeScript** is a programming language built by Microsoft as a superset of JavaScript — every valid JavaScript program is also valid TypeScript. TypeScript adds one big feature on top of JavaScript: **static types**. You describe what *kind* of value a variable holds (a number, a string, a boolean...) and TypeScript checks your code for mistakes before it ever runs.

Browsers cannot run TypeScript directly — it is **transpiled** (converted) to plain JavaScript first, and that JavaScript is what actually runs.

### Why add types to JavaScript?

- **Catch mistakes early** — passing the wrong kind of value is flagged immediately in your editor, instead of being discovered by a user later.
- **Self-documenting code** — a variable or function's type tells you exactly what it holds or expects, without reading the implementation.
- **Better autocomplete** — editors can suggest exactly the properties and methods available on a typed value.

### Declaring a typed variable

\`\`\`typescript
let age: number = 14;
\`\`\`

The \`: number\` after the variable name is a **type annotation**. Read it as *"age is a variable of type number."*

### The core primitive types

| Type | Holds | Example |
|------|-------|---------|
| \`string\` | Text | \`let name: string = "Tariro";\` |
| \`number\` | Any number (integer or decimal) | \`let age: number = 14;\` |
| \`boolean\` | \`true\` or \`false\` | \`let isStudent: boolean = true;\` |

### Type inference

If you assign a value immediately, TypeScript usually **infers** the type for you — you don't have to write it out:

\`\`\`typescript
let city = "Harare"; // TypeScript infers: string
\`\`\`

If you later tried \`city = 42;\`, TypeScript would report an error, because \`city\` was inferred as \`string\`.

Run the example below to see typed variables in action.`),
        tryit("typescript", INTRO_TYPES_CODE, {
          expectedOutput: INTRO_TYPES_EXPECTED,
          caption: "Typed variables and console.log",
        }),
        callout(
          "tip",
          "Type annotations only exist while you are writing code — they disappear completely once TypeScript is transpiled to JavaScript. They cost nothing at runtime; all the checking happens ahead of time, in your editor or build step.",
        ),
        exercise(
          "typescript",
          'Declare a variable `score` of type `number`, set it to `85`, then print it with `console.log("Score:", score)`. The output should read exactly `Score: 85`.',
          'let score: number = 0; // TODO: set this to 85\nconsole.log("Score:", score);',
          'let score: number = 85;\nconsole.log("Score:", score);',
          { check: "Output should read exactly: Score: 85" },
        ),
        exercise(
          "typescript",
          'Declare `subject: string = "Robotics"` and `hoursPerWeek: number = 3`, then print `"Subject:", subject` and `"Hours per week:", hoursPerWeek` on two separate console.log lines.',
          'let subject: string = ""; // TODO\nlet hoursPerWeek: number = 0; // TODO\nconsole.log("Subject:", subject);\nconsole.log("Hours per week:", hoursPerWeek);',
          'let subject: string = "Robotics";\nlet hoursPerWeek: number = 3;\nconsole.log("Subject:", subject);\nconsole.log("Hours per week:", hoursPerWeek);',
          { check: "Output should read: Subject: Robotics then Hours per week: 3" },
        ),
      ),
    },
    {
      title: "Interfaces & Object Types",
      slug: "interfaces-object-types",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Describing the shape of an object

Most real programs deal with more than plain numbers and strings — they deal with **objects**: a student, a robot, a sensor reading. TypeScript lets you describe the exact shape of an object with an **interface**.

\`\`\`typescript
interface Student {
  name: string;
  age: number;
  grade: string;
}
\`\`\`

This says: *any value with type \`Student\` must have a \`name\` (string), an \`age\` (number), and a \`grade\` (string).* Once declared, you can use \`Student\` as a type anywhere — for a variable, a function parameter, or an array.

### Using an interface

\`\`\`typescript
const student: Student = {
  name: "Farai",
  age: 15,
  grade: "9th",
};
\`\`\`

If you forget a property, misspell one, or use the wrong type for a value, TypeScript reports an error immediately — before you ever run the code.

### Interfaces as function parameters

Interfaces really shine when used as a function's parameter type:

\`\`\`typescript
function describe(s: Student): string {
  return \`\${s.name} is \${s.age} years old and in grade \${s.grade}.\`;
}
\`\`\`

Inside \`describe\`, your editor knows exactly which properties \`s\` has — try typing \`s.\` in an editor with TypeScript enabled and it will suggest \`name\`, \`age\`, and \`grade\`.

Run the example below to see an interface in action.`),
        tryit("typescript", INTERFACES_CODE, {
          expectedOutput: INTERFACES_EXPECTED,
          caption: "An interface describing a Student object",
        }),
        md(`### Quick reference

| Concept | Syntax |
|---------|--------|
| Declare an interface | \`interface Name { field: Type; }\` |
| Use it as a variable's type | \`const x: Name = { ... };\` |
| Use it as a parameter's type | \`function f(x: Name) { ... }\` |`),
        callout(
          "info",
          "Interfaces are a compile-time-only concept — like type annotations, they vanish once your code is transpiled to JavaScript. There is no interface object at runtime; it exists purely to help TypeScript check your code.",
        ),
        exercise(
          "typescript",
          "Define an interface `Book` with a `title` (string) and `pages` (number). Create a `book` object matching it, write a function `describeBook(b: Book): string` that returns `\"<title> has <pages> pages.\"`, then console.log the result.",
          "interface Book {\n  title: string;\n  pages: number;\n}\n\n// TODO: create a book object and a describeBook function, then log the result\n",
          'interface Book {\n  title: string;\n  pages: number;\n}\n\nfunction describeBook(b: Book): string {\n  return `${b.title} has ${b.pages} pages.`;\n}\n\nconst book: Book = { title: "Robotics for Beginners", pages: 120 };\nconsole.log(describeBook(book));',
          { check: "Output should read: Robotics for Beginners has 120 pages." },
        ),
        exercise(
          "typescript",
          "Define an interface `Movie` with a required `title` (string) and an optional `rating` (number). Write `describeMovie(m: Movie): string` that returns `\"<title>: <rating>\"`, using `??` to print `\"not rated\"` when `rating` is missing. Call it once without a rating and once with one.",
          'interface Movie {\n  title: string;\n  rating?: number;\n}\n\n// TODO: write describeMovie and call it twice\n',
          'interface Movie {\n  title: string;\n  rating?: number;\n}\n\nfunction describeMovie(m: Movie): string {\n  return `${m.title}: ${m.rating ?? "not rated"}`;\n}\n\nconsole.log(describeMovie({ title: "Cars" }));\nconsole.log(describeMovie({ title: "Robots", rating: 8 }));',
          { check: "Output should read: Cars: not rated then Robots: 8" },
        ),
      ),
    },
    {
      title: "Functions & Generics",
      slug: "functions-generics",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Typing function parameters and return values

A TypeScript function can annotate both its parameters and its return value:

\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

Read the \`: number\` after the parentheses as *"this function returns a number."* If the function body tried to \`return "seven"\`, TypeScript would report an error, because the declared return type is \`number\`.

### Generics — writing a function that works with any type

Sometimes you want a function to work with *any* type, while still keeping type safety. That's what **generics** are for. A generic function declares a placeholder type — conventionally named \`T\` — in angle brackets:

\`\`\`typescript
function identity<T>(value: T): T {
  return value;
}
\`\`\`

\`identity<T>\` says: *"whatever type T you give me in, I return that same type out."* You can call it with any type, and TypeScript keeps track of exactly which type \`T\` is for that call:

\`\`\`typescript
identity<string>("hello"); // T = string, returns a string
identity<number>(42);      // T = number, returns a number
\`\`\`

Generics let you write one reusable function instead of a separate \`identityString\`, \`identityNumber\`, and so on — while TypeScript still checks every call correctly.

Run the example below to see both a plain typed function and a generic function.`),
        tryit("typescript", FUNCTIONS_GENERICS_CODE, {
          expectedOutput: FUNCTIONS_GENERICS_EXPECTED,
          caption: "A typed function and a generic function",
        }),
        md(`### Quick reference

| Concept | Syntax |
|---------|--------|
| Typed parameters + return | \`function f(a: number, b: number): number { ... }\` |
| Generic function | \`function f<T>(value: T): T { ... }\` |
| Calling a generic explicitly | \`f<string>("hi")\` |
| Calling a generic (inferred) | \`f("hi")\` — TypeScript infers \`T = string\` |`),
        callout(
          "tip",
          "You rarely need to write <string> or <number> explicitly when calling a generic function — TypeScript can usually infer T from the argument you pass in. Writing it explicitly (as in the example) is mostly useful for teaching or for cases where inference would be ambiguous.",
        ),
        exercise(
          "typescript",
          "Write a function `square(n: number): number` that returns `n * n`, then console.log(square(5)).",
          "function square(n: number): number {\n  // TODO: return n * n\n  return 0;\n}\n\nconsole.log(square(5));",
          "function square(n: number): number {\n  return n * n;\n}\n\nconsole.log(square(5));",
          { check: "Output should read exactly: 25" },
        ),
        exercise(
          "typescript",
          "Write a generic function `firstElement<T>(arr: T[]): T` that returns the first element of any array. Test it with a `number[]` and a `string[]`.",
          "function firstElement<T>(arr: T[]): T {\n  // TODO: return the first element of arr\n  return arr[0];\n}\n\nconsole.log(firstElement<number>([10, 20, 30]));\nconsole.log(firstElement<string>([\"a\", \"b\", \"c\"]));",
          'function firstElement<T>(arr: T[]): T {\n  return arr[0];\n}\n\nconsole.log(firstElement<number>([10, 20, 30]));\nconsole.log(firstElement<string>(["a", "b", "c"]));',
          { check: "Output should read: 10 then a" },
        ),
      ),
    },
    {
      title: "Arrays & Objects",
      slug: "arrays-objects",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Typed arrays

An array's type is written as \`ElementType[]\`. A \`number[]\` is an array that can only ever contain numbers; a \`string[]\` can only ever contain strings.

\`\`\`typescript
const scores: number[] = [70, 85, 90, 60];
\`\`\`

If you tried \`scores.push("high")\`, TypeScript would reject it — every element must be a \`number\`.

### Array methods: filter and map

Two of the most useful array methods are \`filter\` and \`map\`:

- \`array.filter(fn)\` — keeps only the elements where \`fn\` returns \`true\`, and returns a **new** array.
- \`array.map(fn)\` — transforms every element with \`fn\`, and returns a **new** array of the results.

\`\`\`typescript
const passing = scores.filter((s) => s >= 70); // keep scores >= 70
const doubled = scores.map((s) => s * 2);      // double every score
\`\`\`

Neither method changes the original \`scores\` array — they both return brand new arrays, which is a very common pattern in TypeScript and JavaScript.

### Objects still follow their interface's type

Arrays of objects combine everything you've learned so far — for example, \`Student[]\` is an array where every element must match the \`Student\` interface.

Run the example below to see \`filter\` and \`map\` on a typed array.`),
        tryit("typescript", ARRAYS_OBJECTS_CODE, {
          expectedOutput: ARRAYS_OBJECTS_EXPECTED,
          caption: "filter() and map() on a typed number array",
        }),
        md(`### Quick reference

| Method | What it does | Returns |
|--------|--------------|---------|
| \`array.filter(fn)\` | Keeps elements where \`fn\` is true | A new, possibly shorter array |
| \`array.map(fn)\` | Transforms every element | A new array, same length |
| \`array.reduce(fn, start)\` | Combines all elements into one value | A single value |`),
        callout(
          "info",
          "console.log prints arrays and objects as JSON text (like [70,85,90]) rather than as a string with quotes — that's why the example output shows square brackets instead of a formatted sentence.",
        ),
        exercise(
          "typescript",
          "Given `const numbers: number[] = [1, 2, 3, 4, 5, 6];`, use `.filter()` to build an array `evens` containing only the even numbers, then console.log(\"Evens:\", evens).",
          "const numbers: number[] = [1, 2, 3, 4, 5, 6];\n// TODO: use .filter() to build evens\nconst evens: number[] = [];\nconsole.log(\"Evens:\", evens);",
          "const numbers: number[] = [1, 2, 3, 4, 5, 6];\nconst evens = numbers.filter((n) => n % 2 === 0);\nconsole.log(\"Evens:\", evens);",
          { check: "Output should read: Evens: [2,4,6]" },
        ),
        exercise(
          "typescript",
          'Given an `Item` interface with `name: string` and `price: number`, and an array `items: Item[]` of two items, use `.map()` to build an array of just the names, then console.log("Names:", names).',
          'interface Item {\n  name: string;\n  price: number;\n}\nconst items: Item[] = [\n  { name: "Sensor", price: 10 },\n  { name: "Motor", price: 25 },\n];\n// TODO: use .map() to build an array of names\nconst names: string[] = [];\nconsole.log("Names:", names);',
          'interface Item {\n  name: string;\n  price: number;\n}\nconst items: Item[] = [\n  { name: "Sensor", price: 10 },\n  { name: "Motor", price: 25 },\n];\nconst names = items.map((i) => i.name);\nconsole.log("Names:", names);',
          { check: 'Output should read: Names: ["Sensor","Motor"]' },
        ),
      ),
    },
    {
      title: "Union & Optional Types",
      slug: "union-optional-types",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Union types — "this OR that"

Sometimes a value can legitimately be more than one type. A **union type** lists the allowed types separated by \`|\` (a vertical bar, read as "or"):

\`\`\`typescript
function formatId(id: string | number): string {
  return \`ID-\${id}\`;
}
\`\`\`

\`id: string | number\` means \`formatId\` accepts *either* a string *or* a number — nothing else. TypeScript will check every call: \`formatId(42)\` and \`formatId("A7")\` are both fine, but \`formatId(true)\` would be rejected.

### Optional properties

Adding a \`?\` after a property name in an interface makes that property **optional** — it may or may not be present on the object:

\`\`\`typescript
interface Pet {
  name: string;
  nickname?: string; // optional
}
\`\`\`

Both \`{ name: "Rex" }\` and \`{ name: "Rex", nickname: "Rexy" }\` are valid \`Pet\` values.

### The nullish coalescing operator (??)

When a property might be missing, \`??\` lets you provide a fallback value used only when the left side is \`null\` or \`undefined\`:

\`\`\`typescript
function greetPet(pet: Pet): string {
  return \`Hello, \${pet.nickname ?? pet.name}!\`;
}
\`\`\`

If \`pet.nickname\` is missing, \`pet.name\` is used instead.

Run the example below to see union types and optional properties together.`),
        tryit("typescript", UNION_OPTIONAL_CODE, {
          expectedOutput: UNION_OPTIONAL_EXPECTED,
          caption: "A union-typed function and an optional interface property",
        }),
        md(`### Quick reference

| Concept | Syntax |
|---------|--------|
| Union type | \`string \\| number\` |
| Optional property | \`nickname?: string;\` |
| Fallback when missing | \`value ?? fallback\` |`),
        callout(
          "warning",
          "?? (nullish coalescing) only falls back for null or undefined. It is different from ||, which also falls back for any \"falsy\" value like an empty string \"\" or the number 0. If you want \"use the default only when the value is truly missing,\" ?? is almost always what you want.",
        ),
        exercise(
          "typescript",
          'Write a function `formatLabel(value: string | number): string` that returns `"Label: <value>"`. Call it once with a number (`7`) and once with a string (`"seven"`).',
          'function formatLabel(value: string | number): string {\n  // TODO: return `Label: ${value}`\n  return "";\n}\n\nconsole.log(formatLabel(7));\nconsole.log(formatLabel("seven"));',
          'function formatLabel(value: string | number): string {\n  return `Label: ${value}`;\n}\n\nconsole.log(formatLabel(7));\nconsole.log(formatLabel("seven"));',
          { check: "Output should read: Label: 7 then Label: seven" },
        ),
        exercise(
          "typescript",
          "Define an interface `Config` with an optional `timeout?: number`. Write `getTimeout(config: Config): number` that returns `config.timeout` if present, otherwise `30`, using `??`. Call it once with `{}` and once with `{ timeout: 60 }`.",
          "interface Config {\n  timeout?: number;\n}\nfunction getTimeout(config: Config): number {\n  // TODO: return config.timeout, or 30 if missing\n  return 0;\n}\n\nconsole.log(getTimeout({}));\nconsole.log(getTimeout({ timeout: 60 }));",
          "interface Config {\n  timeout?: number;\n}\nfunction getTimeout(config: Config): number {\n  return config.timeout ?? 30;\n}\n\nconsole.log(getTimeout({}));\nconsole.log(getTimeout({ timeout: 60 }));",
          { check: "Output should read: 30 then 60" },
        ),
      ),
    },
    {
      title: "Mini Project: Gradebook",
      slug: "mini-gradebook",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Putting it all together

Let's combine everything from this tutorial — interfaces, typed arrays, functions, and template strings — into one small but complete program: a class gradebook that computes each student's average and letter grade.

### How it works

1. An **interface** \`Student\` describes the shape of each student: a \`name\` and an array of \`scores\`.
2. The function \`average(scores: number[]): number\` uses \`reduce\` to sum the scores, then divides by how many there are.
3. The function \`letterGrade(avg: number): string\` uses \`if\` statements to map a number onto a letter grade.
4. A \`Student[]\` array holds every student.
5. A \`for...of\` loop visits each student, computes their average and grade, and prints a summary line.

### Key ideas reused from this tutorial

- **Interfaces** — \`Student\` describes the shape every array element must match.
- **Typed arrays** — \`Student[]\` and \`number[]\` keep every element consistent.
- **Functions with typed parameters and return values** — \`average\` and \`letterGrade\` each declare exactly what they take and return.
- **Template strings** — \`\\\`\${student.name}: average \${avg.toFixed(1)}\\\`\` embeds computed values inside text.

Run the program below, then try adding a third student of your own.`),
        tryit("typescript", MINI_GRADEBOOK_CODE, {
          expectedOutput: MINI_GRADEBOOK_EXPECTED,
          caption: "A mini gradebook combining interfaces, arrays, and functions",
        }),
        callout(
          "tip",
          "toFixed(1) is a built-in method on numbers that formats a number as a string with exactly one digit after the decimal point (so 65 becomes \"65.0\"). It is commonly used to keep displayed numbers tidy and consistent.",
        ),
        exercise(
          "typescript",
          'Add a third student, `{ name: "Rudo", scores: [95, 92, 98] }`, to the `students` array, so the loop prints a third summary line for Rudo (average 95.0, grade A) after Tariro and Farai.',
          'interface Student {\n  name: string;\n  scores: number[];\n}\n\nfunction average(scores: number[]): number {\n  const total = scores.reduce((sum, s) => sum + s, 0);\n  return total / scores.length;\n}\n\nfunction letterGrade(avg: number): string {\n  if (avg >= 80) return "A";\n  if (avg >= 70) return "B";\n  if (avg >= 60) return "C";\n  return "F";\n}\n\nconst students: Student[] = [\n  { name: "Tariro", scores: [85, 90, 78] },\n  { name: "Farai", scores: [60, 65, 70] },\n  // TODO: add Rudo here\n];\n\nfor (const student of students) {\n  const avg = average(student.scores);\n  console.log(`${student.name}: average ${avg.toFixed(1)}, grade ${letterGrade(avg)}`);\n}',
          'interface Student {\n  name: string;\n  scores: number[];\n}\n\nfunction average(scores: number[]): number {\n  const total = scores.reduce((sum, s) => sum + s, 0);\n  return total / scores.length;\n}\n\nfunction letterGrade(avg: number): string {\n  if (avg >= 80) return "A";\n  if (avg >= 70) return "B";\n  if (avg >= 60) return "C";\n  return "F";\n}\n\nconst students: Student[] = [\n  { name: "Tariro", scores: [85, 90, 78] },\n  { name: "Farai", scores: [60, 65, 70] },\n  { name: "Rudo", scores: [95, 92, 98] },\n];\n\nfor (const student of students) {\n  const avg = average(student.scores);\n  console.log(`${student.name}: average ${avg.toFixed(1)}, grade ${letterGrade(avg)}`);\n}',
          { check: "Output should include a third line: Rudo: average 95.0, grade A" },
        ),
      ),
    },
  ],
};
