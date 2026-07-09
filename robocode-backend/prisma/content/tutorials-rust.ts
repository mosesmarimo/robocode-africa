import { md, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello & println!
// ---------------------------------------------------------------------------

const L1_TRYIT = `fn main() {
    println!("Hello, RoboCode!");
    let result = 6 * 7;
    println!("6 times 7 is {}", result);
    println!("Rust was first released in {}.", 2015);
}`;
const L1_TRYIT_OUT = `Hello, RoboCode!
6 times 7 is 42
Rust was first released in 2015.`;

const L1_EX1_STARTER = `fn main() {
    println!("Welcome to RoboCode!");
    // TODO: compute 12 * 8 and print "12 times 8 is 96"
}`;
const L1_EX1_SOLUTION = `fn main() {
    println!("Welcome to RoboCode!");
    let result = 12 * 8;
    println!("12 times 8 is {}", result);
}`;

const L1_EX2_STARTER = `fn main() {
    let number = 7;
    let name = "Spark";
    println!("{} {}", name, number); // TODO: fix the format string to print "Robot #7 is named Spark"
}`;
const L1_EX2_SOLUTION = `fn main() {
    let number = 7;
    let name = "Spark";
    println!("Robot #{} is named {}", number, name);
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Mutability
// ---------------------------------------------------------------------------

const L2_TRYIT = `fn main() {
    // Variables are immutable by default in Rust
    let name = "Tariro";
    let mut score = 0; // mut makes a variable mutable
    score += 10;
    score += 5;

    println!("Name: {}", name);
    println!("Score: {}", score);

    // Shadowing — declare a new variable with the same name
    let level = "beginner";
    let level = level.to_uppercase();
    println!("Level: {}", level);

    // Constants — always immutable, type required, known at compile time
    const MAX_SCORE: i32 = 100;
    println!("Max score: {}", MAX_SCORE);
}`;
const L2_TRYIT_OUT = `Name: Tariro
Score: 15
Level: BEGINNER
Max score: 100`;

const L2_EX1_STARTER = `fn main() {
    let mut total = 0;
    // TODO: add 4, then 9, then 2 to total using +=
    println!("Total: {}", total);
}`;
const L2_EX1_SOLUTION = `fn main() {
    let mut total = 0;
    total += 4;
    total += 9;
    total += 2;
    println!("Total: {}", total);
}`;

const L2_EX2_STARTER = `fn main() {
    let word = "rust";
    // TODO: shadow word with its uppercase version using .to_uppercase()
    println!("Language: {}", word);
}`;
const L2_EX2_SOLUTION = `fn main() {
    let word = "rust";
    let word = word.to_uppercase();
    println!("Language: {}", word);
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Data Types
// ---------------------------------------------------------------------------

const L3_TRYIT = `fn main() {
    let age: u32 = 15;          // unsigned 32-bit integer
    let temperature: i32 = -4;  // signed integer — can be negative
    let pi: f64 = 3.14159;      // 64-bit float
    let initial: char = 'R';    // a single character
    let is_robot: bool = true;  // true or false

    println!("Age: {}", age);
    println!("Temperature: {}°C", temperature);
    println!("Pi rounded: {:.2}", pi);
    println!("Initial: {}", initial);
    println!("Is robot: {}", is_robot);

    // Type conversion with the \`as\` keyword (truncates, doesn't round)
    let whole = pi as i32;
    println!("Pi as an integer: {}", whole);

    // Tuple — a fixed-size group of values, possibly of different types
    let point: (i32, i32) = (3, 7);
    println!("Point: ({}, {})", point.0, point.1);
}`;
const L3_TRYIT_OUT = `Age: 15
Temperature: -4°C
Pi rounded: 3.14
Initial: R
Is robot: true
Pi as an integer: 3
Point: (3, 7)`;

const L3_EX1_STARTER = `fn main() {
    let price: f64 = 19.99;
    // TODO: convert price to i32 using \`as\` and print "Price as integer: 19"
}`;
const L3_EX1_SOLUTION = `fn main() {
    let price: f64 = 19.99;
    let price_int = price as i32;
    println!("Price as integer: {}", price_int);
}`;

const L3_EX2_STARTER = `fn main() {
    let dimensions: (i32, i32, i32) = (4, 5, 6);
    // TODO: destructure dimensions into width, height, depth and print "Volume: 120"
}`;
const L3_EX2_SOLUTION = `fn main() {
    let dimensions: (i32, i32, i32) = (4, 5, 6);
    let (width, height, depth) = dimensions;
    let volume = width * height * depth;
    println!("Volume: {}", volume);
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Functions
// ---------------------------------------------------------------------------

const L4_TRYIT = `fn square(n: i32) -> i32 {
    n * n
}

// Functions can return a tuple to hand back more than one value.
fn min_max(a: i32, b: i32) -> (i32, i32) {
    if a < b {
        (a, b)
    } else {
        (b, a)
    }
}

fn main() {
    println!("5 squared is {}", square(5));

    let (small, big) = min_max(9, 4);
    println!("min: {} max: {}", small, big);

    println!("Sum of squares: {}", square(3) + square(4));
}`;
const L4_TRYIT_OUT = `5 squared is 25
min: 4 max: 9
Sum of squares: 25`;

const L4_EX1_STARTER = `fn double(n: i32) -> i32 {
    // TODO: return n doubled
    0
}

fn main() {
    println!("Double of 9 is {}", double(9));
}`;
const L4_EX1_SOLUTION = `fn double(n: i32) -> i32 {
    n * 2
}

fn main() {
    println!("Double of 9 is {}", double(9));
}`;

const L4_EX2_STARTER = `fn divide(a: i32, b: i32) -> (i32, i32) {
    // TODO: return the quotient and remainder of a / b
    (0, 0)
}

fn main() {
    let (q, r) = divide(17, 5);
    println!("17 / 5 = {} remainder {}", q, r);
}`;
const L4_EX2_SOLUTION = `fn divide(a: i32, b: i32) -> (i32, i32) {
    (a / b, a % b)
}

fn main() {
    let (q, r) = divide(17, 5);
    println!("17 / 5 = {} remainder {}", q, r);
}`;

// ---------------------------------------------------------------------------
// Lesson 5 — Control Flow
// ---------------------------------------------------------------------------

const L5_TRYIT = `fn grade(score: u32) -> &'static str {
    if score >= 80 {
        "A"
    } else if score >= 60 {
        "B"
    } else if score >= 50 {
        "C"
    } else {
        "F"
    }
}

fn main() {
    let score = 73;
    println!("Grade: {}", grade(score));

    // Counting for loop over an inclusive range
    println!("\\nCounting:");
    for i in 1..=5 {
        if i > 1 {
            print!(" ");
        }
        print!("{}", i);
    }
    println!();

    // while loop
    println!("\\nCountdown:");
    let mut countdown = 3;
    while countdown > 0 {
        println!("{}", countdown);
        countdown -= 1;
    }
    println!("Liftoff!");

    // for loop with .enumerate() — index + value together
    println!("\\nSubjects:");
    let subjects = ["Maths", "Science", "Art"];
    for (i, subject) in subjects.iter().enumerate() {
        println!("{}: {}", i, subject);
    }
}`;
const L5_TRYIT_OUT = `Grade: B

Counting:
1 2 3 4 5

Countdown:
3
2
1
Liftoff!

Subjects:
0: Maths
1: Science
2: Art`;

const L5_EX1_STARTER = `fn main() {
    for i in 1..=15 {
        println!("{}", i); // TODO: replace with Fizz/Buzz/FizzBuzz logic
    }
}`;
const L5_EX1_SOLUTION = `fn main() {
    for i in 1..=15 {
        if i % 15 == 0 {
            println!("FizzBuzz");
        } else if i % 3 == 0 {
            println!("Fizz");
        } else if i % 5 == 0 {
            println!("Buzz");
        } else {
            println!("{}", i);
        }
    }
}`;

const L5_EX2_STARTER = `fn main() {
    let mut sum = 0;
    for i in 1..=20 {
        // TODO: add i to sum only when i is even
    }
    println!("Sum of evens: {}", sum);
}`;
const L5_EX2_SOLUTION = `fn main() {
    let mut sum = 0;
    for i in 1..=20 {
        if i % 2 == 0 {
            sum += i;
        }
    }
    println!("Sum of evens: {}", sum);
}`;

// ---------------------------------------------------------------------------
// Lesson 6 — Ownership Basics
// ---------------------------------------------------------------------------

const L6_TRYIT = `fn takes_ownership(s: String) {
    println!("I now own: {}", s);
} // s is dropped (freed) here — nothing else can use it after this

fn borrows(s: &String) -> usize {
    s.len()
} // s is only BORROWED here, so it is NOT dropped

fn main() {
    let name = String::from("RoboCode");

    // Passing a REFERENCE (&name) lets main keep using \`name\` afterwards.
    let length = borrows(&name);
    println!("'{}' has {} characters", name, length);

    // Passing \`name\` directly would MOVE ownership into the function,
    // and main could never use it again. We clone it first so main keeps
    // its own independent copy.
    let name_copy = name.clone();
    takes_ownership(name_copy);

    // \`name\` is still valid here because we only cloned, never moved it.
    println!("Original still available: {}", name);
}`;
const L6_TRYIT_OUT = `'RoboCode' has 8 characters
I now own: RoboCode
Original still available: RoboCode`;

const L6_EX1_STARTER = `fn shout(s: &String) -> String {
    // TODO: return s converted to uppercase with .to_uppercase()
    String::new()
}

fn main() {
    let message = String::from("RoboCode");
    let loud = shout(&message);
    println!("{}", loud);
    println!("Original: {}", message);
}`;
const L6_EX1_SOLUTION = `fn shout(s: &String) -> String {
    s.to_uppercase()
}

fn main() {
    let message = String::from("RoboCode");
    let loud = shout(&message);
    println!("{}", loud);
    println!("Original: {}", message);
}`;

const L6_EX2_STARTER = `fn total_len(list: Vec<String>) -> usize {
    // TODO: sum the .len() of every String in list
    0
}

fn main() {
    let words = vec![String::from("go"), String::from("rust"), String::from("code")];
    let total = total_len(words.clone());
    println!("Total length: {}", total);
    println!("Words remaining: {}", words.len());
}`;
const L6_EX2_SOLUTION = `fn total_len(list: Vec<String>) -> usize {
    let mut sum = 0;
    for word in list {
        sum += word.len();
    }
    sum
}

fn main() {
    let words = vec![String::from("go"), String::from("rust"), String::from("code")];
    let total = total_len(words.clone());
    println!("Total length: {}", total);
    println!("Words remaining: {}", words.len());
}`;

// ---------------------------------------------------------------------------
// Lesson 7 — Vectors
// ---------------------------------------------------------------------------

const L7_TRYIT = `fn main() {
    // Vec<T> — a growable, heap-allocated list
    let mut numbers: Vec<i32> = vec![1, 2, 3, 4, 5];
    numbers.push(6);

    println!("Numbers: {:?}", numbers);
    println!("Length: {}", numbers.len());
    println!("First: {}", numbers[0]);

    // Iterators — transform every element with .map(), collect into a new Vec
    let doubled: Vec<i32> = numbers.iter().map(|n| n * 2).collect();
    println!("Doubled: {:?}", doubled);

    // .sum() adds up every element
    let total: i32 = numbers.iter().sum();
    println!("Total: {}", total);

    // .filter() keeps only the elements that match a condition
    let evens: Vec<&i32> = numbers.iter().filter(|&&n| n % 2 == 0).collect();
    println!("Evens: {:?}", evens);
}`;
const L7_TRYIT_OUT = `Numbers: [1, 2, 3, 4, 5, 6]
Length: 6
First: 1
Doubled: [2, 4, 6, 8, 10, 12]
Total: 21
Evens: [2, 4, 6]`;

const L7_EX1_STARTER = `fn main() {
    let mut squares: Vec<i32> = Vec::new();
    for i in 1..=5 {
        // TODO: push i*i onto squares
    }
    println!("{:?}", squares);
}`;
const L7_EX1_SOLUTION = `fn main() {
    let mut squares: Vec<i32> = Vec::new();
    for i in 1..=5 {
        squares.push(i * i);
    }
    println!("{:?}", squares);
}`;

const L7_EX2_STARTER = `fn main() {
    let scores = vec![55, 92, 78, 64, 88];
    // TODO: find the highest score using .iter().max() and print "Highest score: 92"
    println!("Highest score: {}", 0);
}`;
const L7_EX2_SOLUTION = `fn main() {
    let scores = vec![55, 92, 78, 64, 88];
    let highest = scores.iter().max().unwrap();
    println!("Highest score: {}", highest);
}`;

export const rustTutorialCourse: CourseModule = {
  meta: {
    title: "Rust Tutorial",
    slug: "tutorial-rust",
    track: "coding",
    level: "primary",
    description: "A W3Schools-style, hands-on introduction to Rust — print your first line, then work through variables, data types, functions, control flow, ownership, and vectors with runnable examples and exercises.",
    coverImage: "/covers/coding.svg",
    order: 57,
    language: "rust",
  },
  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1 — Hello & println!
    // -----------------------------------------------------------------------
    {
      title: "Rust Hello & println!",
      slug: "tutorial-rust-hello",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## Rust Hello World

**Rust** is a compiled systems language known for combining C-like speed with compile-time memory safety. Every Rust program starts execution in \`fn main()\`.

\`println!\` is how you print text — the \`!\` marks it as a **macro** (a code-generating shortcut), not an ordinary function. Rust checks your format string at compile time, so a typo in the placeholders is caught before the program ever runs.

- \`{}\` is a placeholder — Rust fills it in with the next argument, in its default display format.
- \`{:.2}\` — a placeholder with 2 decimal places, for floats.
- \`{:?}\` — the "debug" format, used for things like vectors and tuples later in this course.

Click **Run** below to try the example, then edit the text or the maths and run it again.`),
        tryit("rust", L1_TRYIT, {
          expectedOutput: L1_TRYIT_OUT,
          caption: "Every Rust program starts execution in fn main().",
        }),
        md(`### Reference — println! placeholders

| Placeholder | Meaning | Example |
|---|---|---|
| \`{}\` | default display format | \`println!("{}", 42)\` → \`42\` |
| \`{:.2}\` | float, 2 decimal places | \`println!("{:.2}", 3.14159)\` → \`3.14\` |
| \`{:?}\` | debug format (collections, tuples) | \`println!("{:?}", vec![1, 2])\` → \`[1, 2]\` |
| \`{name}\` | named / captured variable (Rust 2021+) | \`println!("{name}")\` |

Rust programs are compiled with \`rustc\` (or Cargo, Rust's build tool, for larger projects). The compiler's error messages are famously helpful — they usually explain exactly what went wrong and suggest a fix.`),
        exercise(
          "rust",
          "Print `Welcome to RoboCode!`, then compute 12 * 8 and print `12 times 8 is 96`.",
          L1_EX1_STARTER,
          L1_EX1_SOLUTION,
          { check: "12 times 8 is 96", caption: "Exercise 1 — println! and a calculation" },
        ),
        exercise(
          "rust",
          "Given `let number = 7;` and `let name = \"Spark\";`, use println! to print exactly: `Robot #7 is named Spark`.",
          L1_EX2_STARTER,
          L1_EX2_SOLUTION,
          { check: "Robot #7 is named Spark", caption: "Exercise 2 — ordering println! placeholders" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2 — Variables & Mutability
    // -----------------------------------------------------------------------
    {
      title: "Rust Variables & Mutability",
      slug: "tutorial-rust-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Variables are immutable by default

This is Rust's most distinctive early lesson: once you give a variable a value, it **cannot change** — unless you say \`mut\`.

\`\`\`rust
let x = 5;      // immutable — x can never change
let mut y = 5;  // mutable — y can be changed
y += 1;         // OK
// x += 1;      // compile error!
\`\`\`

This feels strict at first, but it prevents a whole category of bugs where data changes unexpectedly deep inside a large program.

### Shadowing

Rust also lets you **shadow** a variable — declare a brand new variable with the same name, which completely replaces the old one:

\`\`\`rust
let level = "beginner";
let level = level.to_uppercase(); // a new variable, now a String "BEGINNER"
\`\`\`

Shadowing is different from \`mut\`: it can even change the *type*, because it's really a new variable.`),
        tryit("rust", L2_TRYIT, {
          expectedOutput: L2_TRYIT_OUT,
          caption: "mut for a changeable variable, shadowing to transform a value, and a const.",
        }),
        md(`### Reference — mut vs shadowing vs const

| Keyword | Can the value change? | Can the type change? |
|---|---|---|
| \`let x = 1;\` | No | — |
| \`let mut x = 1;\` | Yes, via \`x = ...\` | No |
| \`let x = 1; let x = "one";\` (shadowing) | New variable each time | Yes |
| \`const X: i32 = 1;\` | Never | No — type is required |

Constants (\`const\`) must always have an explicit type annotation and a value known at compile time — they can never be made mutable, even accidentally.`),
        exercise(
          "rust",
          "Create a mutable variable `total` starting at 0. Add 4, then 9, then 2 to it with +=, then print `Total: 15`.",
          L2_EX1_STARTER,
          L2_EX1_SOLUTION,
          { check: "Total: 15", caption: "Exercise 1 — mut and +=" },
        ),
        exercise(
          "rust",
          "Given `let word = \"rust\";`, use shadowing to create a new `word` that is the uppercase version (`.to_uppercase()`), then print `Language: RUST`.",
          L2_EX2_STARTER,
          L2_EX2_SOLUTION,
          { check: "Language: RUST", caption: "Exercise 2 — shadowing a variable" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3 — Data Types
    // -----------------------------------------------------------------------
    {
      title: "Rust Data Types",
      slug: "tutorial-rust-data-types",
      contentType: "markdown",
      estMinutes: 11,
      body: body(
        md(`## Core scalar types

Rust is statically typed, and its integer types even encode their size and sign in the name:

| Type | Size | Range / use | Example |
|---|---|---|---|
| \`i32\` | 32-bit signed | −2 billion to +2 billion | \`let n: i32 = -7;\` |
| \`u32\` | 32-bit unsigned | 0 to 4 billion | \`let age: u32 = 15;\` |
| \`f64\` | 64-bit float | decimal numbers | \`let pi: f64 = 3.14;\` |
| \`bool\` | 1 bit | \`true\` / \`false\` | \`let flag = true;\` |
| \`char\` | a single character | \`let c: char = 'R';\` | (note: single quotes) |
| \`&str\` | string slice | borrowed text | \`let s = "hi";\` |
| \`String\` | owned string | growable, heap-allocated | \`String::from("hi")\` |

### Tuples and type conversion

A **tuple** groups a fixed number of values, possibly of different types: \`(i32, i32)\`. Access each part with \`.0\`, \`.1\`, and so on.

Rust does not convert between numeric types automatically — you convert explicitly with \`as\`:

\`\`\`rust
let pi: f64 = 3.14159;
let whole = pi as i32; // 3 — truncates, does not round
\`\`\``),
        tryit("rust", L3_TRYIT, {
          expectedOutput: L3_TRYIT_OUT,
          caption: "Scalar types, the `as` conversion, and a tuple.",
        }),
        md(`### Reference — string types

\`&str\` (a *string slice*) is a reference to text that already exists somewhere — often a literal baked into your program. \`String\` is a separate, owned, growable type that lives on the heap. You'll see both constantly:

\`\`\`rust
let borrowed: &str = "hello";        // fast, read-only view
let owned: String = String::from("hello"); // can grow, can be modified
let converted: String = borrowed.to_string(); // &str → String
\`\`\``),
        exercise(
          "rust",
          "Given `let price: f64 = 19.99;`, convert it to i32 with `as` (truncating), then print `Price as integer: 19`.",
          L3_EX1_STARTER,
          L3_EX1_SOLUTION,
          { check: "Price as integer: 19", caption: "Exercise 1 — the `as` conversion" },
        ),
        exercise(
          "rust",
          "Given `let dimensions: (i32, i32, i32) = (4, 5, 6);` (width, height, depth), destructure it into three variables and print `Volume: 120`.",
          L3_EX2_STARTER,
          L3_EX2_SOLUTION,
          { check: "Volume: 120", caption: "Exercise 2 — destructuring a tuple" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4 — Functions
    // -----------------------------------------------------------------------
    {
      title: "Rust Functions",
      slug: "tutorial-rust-functions",
      contentType: "markdown",
      estMinutes: 11,
      body: body(
        md(`## Writing functions

A Rust function is declared with \`fn\`, typed parameters, and an arrow \`->\` before the return type:

\`\`\`rust
fn square(n: i32) -> i32 {
    n * n   // no semicolon — this is the returned EXPRESSION
}
\`\`\`

Notice there's no \`return\` keyword needed: the **last expression** in a function body (with no semicolon) is automatically its return value. You can still use \`return\` explicitly for an early exit.

Functions can return a **tuple** to hand back more than one value at once:

\`\`\`rust
fn min_max(a: i32, b: i32) -> (i32, i32) {
    if a < b { (a, b) } else { (b, a) }
}

let (small, big) = min_max(9, 4);
\`\`\``),
        tryit("rust", L4_TRYIT, {
          expectedOutput: L4_TRYIT_OUT,
          caption: "A function returning one value, and a function returning a tuple.",
        }),
        md(`### Reference — expressions vs statements

| | Ends with a semicolon? | Has a value? |
|---|---|---|
| Expression (e.g. \`n * n\`) | No | Yes — used as the return value |
| Statement (e.g. \`let x = 5;\`) | Yes | No |

This is why removing the trailing semicolon from the last line of a function changes its meaning — with a semicolon it becomes a statement that returns nothing (\`()\`), without one it becomes the function's return value.`),
        exercise(
          "rust",
          "Write a function `fn double(n: i32) -> i32` that returns double its input, then print `Double of 9 is 18`.",
          L4_EX1_STARTER,
          L4_EX1_SOLUTION,
          { check: "Double of 9 is 18", caption: "Exercise 1 — a single-return function" },
        ),
        exercise(
          "rust",
          "Write a function `fn divide(a: i32, b: i32) -> (i32, i32)` that returns the quotient and remainder of a / b, then print `17 / 5 = 3 remainder 2`.",
          L4_EX2_STARTER,
          L4_EX2_SOLUTION,
          { check: "17 / 5 = 3 remainder 2", caption: "Exercise 2 — a function returning a tuple" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 5 — Control Flow
    // -----------------------------------------------------------------------
    {
      title: "Rust Control Flow",
      slug: "tutorial-rust-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and looping

Rust has \`if\`/\`else\`, \`loop\`, \`while\`, and \`for\`. A key Rust idea: **\`if\` is an expression** — it produces a value, so you can use it directly in a \`let\`:

\`\`\`rust
let status = if score >= 50 { "pass" } else { "fail" };
\`\`\`

### Loops

\`\`\`rust
for i in 1..=5 { ... }     // inclusive range: 1, 2, 3, 4, 5
while condition { ... }    // repeat until the condition is false
loop { ... break; }        // repeat forever, until you break
\`\`\`

\`for ... in collection.iter().enumerate()\` gives you both the index and the value while looping — handy for numbered lists.`),
        tryit("rust", L5_TRYIT, {
          expectedOutput: L5_TRYIT_OUT,
          caption: "if as an expression (inside a function), a for range, a while loop, and .enumerate().",
        }),
        md(`### Reference — the three loop keywords

| Keyword | Use it for |
|---|---|
| \`for i in 1..=n\` | iterating a known range or collection |
| \`while condition\` | repeating until a condition becomes false |
| \`loop { ... break; }\` | repeating indefinitely, with an explicit exit |

\`1..5\` is an **exclusive** range (1, 2, 3, 4) while \`1..=5\` is **inclusive** (1, 2, 3, 4, 5) — the \`=\` is easy to miss but changes the last value included.`),
        exercise(
          "rust",
          "Print the numbers 1 to 15, but print \"Fizz\" for multiples of 3, \"Buzz\" for multiples of 5, and \"FizzBuzz\" for multiples of both.",
          L5_EX1_STARTER,
          L5_EX1_SOLUTION,
          { check: "FizzBuzz", caption: "Exercise 1 — classic FizzBuzz" },
        ),
        exercise(
          "rust",
          "Add up every even number from 1 to 20 (2 + 4 + ... + 20) and print `Sum of evens: 110`.",
          L5_EX2_STARTER,
          L5_EX2_SOLUTION,
          { check: "Sum of evens: 110", caption: "Exercise 2 — accumulating inside a loop" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 6 — Ownership Basics
    // -----------------------------------------------------------------------
    {
      title: "Rust Ownership Basics",
      slug: "tutorial-rust-ownership",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Rust's superpower: ownership

Most languages manage memory either automatically with a **garbage collector** (Python, JavaScript) or leave it entirely to you (C, C++). Rust takes a third path: the **ownership system**, checked entirely at compile time, for free.

Three rules govern ownership:

1. Every value has exactly one **owner** (a variable).
2. When the owner goes out of scope, the value is dropped (its memory is freed).
3. Ownership can be **moved** to another variable — after a move, the old variable can no longer be used.

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1;          // s1 is MOVED into s2
println!("{}", s1);   // compile error: value borrowed after move
\`\`\`

This looks strict, but it's exactly what prevents an entire category of memory bugs common in other systems languages.

### Borrowing — using a value without owning it

Instead of moving a value into a function, you can pass a **reference** (\`&value\`) — this *borrows* it temporarily:

\`\`\`rust
fn borrows(s: &String) -> usize {
    s.len()
} // only borrowed — the caller still owns s afterwards
\`\`\`

### Cloning — when you really do need two copies

If you need two independent copies of the same data, call \`.clone()\` — it makes a full copy, at the cost of extra memory:

\`\`\`rust
let copy = original.clone();
\`\`\`

Run the example below to see borrowing (no move) and cloning (an explicit, deliberate copy) side by side.`),
        tryit("rust", L6_TRYIT, {
          expectedOutput: L6_TRYIT_OUT,
          caption: "borrows() only borrows name; cloning before takes_ownership() keeps the original usable.",
        }),
        md(`### Reference — move vs borrow vs clone

| Action | Syntax | Original still usable after? |
|---|---|---|
| Move | \`let b = a;\` (for non-\`Copy\` types like \`String\`) | No |
| Borrow (reference) | \`fn f(x: &String)\`, called as \`f(&a)\` | Yes |
| Clone | \`let b = a.clone();\` | Yes — \`a\` and \`b\` are independent copies |

Simple types like \`i32\`, \`f64\`, and \`bool\` implement a special trait called \`Copy\` — they're copied automatically instead of moved, which is why you never see "moved" errors with plain numbers.`),
        exercise(
          "rust",
          "Write `fn shout(s: &String) -> String` that borrows a String and returns its uppercase version (without taking ownership). Call it with `&message`, then print the shouted version followed by `Original: RoboCode` — proving `message` is still usable.",
          L6_EX1_STARTER,
          L6_EX1_SOLUTION,
          { check: "Original: RoboCode", caption: "Exercise 1 — borrowing instead of moving" },
        ),
        exercise(
          "rust",
          "`total_len(list: Vec<String>) -> usize` takes ownership of a vector of Strings and returns the sum of their lengths. Call it with `words.clone()` so `words` stays usable, then print the total length and how many words remain in the original.",
          L6_EX2_STARTER,
          L6_EX2_SOLUTION,
          { check: "Total length: 10", caption: "Exercise 2 — cloning to keep the original after a move" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 7 — Vectors
    // -----------------------------------------------------------------------
    {
      title: "Rust Vectors",
      slug: "tutorial-rust-vectors",
      contentType: "markdown",
      estMinutes: 13,
      body: body(
        md(`## Vec<T> — a growable list

A **vector** (\`Vec<T>\`) is Rust's growable, heap-allocated list — the workhorse collection type, similar to a Python list or a Go slice.

\`\`\`rust
let mut numbers: Vec<i32> = vec![1, 2, 3];
numbers.push(4);          // grow the vector
println!("{}", numbers[0]); // index like an array
println!("{:?}", numbers);  // {:?} prints the whole vector
\`\`\`

### Iterators — the idiomatic way to process a Vec

Rust encourages processing collections with **iterator chains** rather than hand-written loops:

\`\`\`rust
let doubled: Vec<i32> = numbers.iter().map(|n| n * 2).collect();
let total: i32 = numbers.iter().sum();
let evens: Vec<&i32> = numbers.iter().filter(|&&n| n % 2 == 0).collect();
\`\`\`

- \`.iter()\` — produces references to each element, without taking ownership.
- \`.map(closure)\` — transforms every element.
- \`.filter(closure)\` — keeps only elements matching a condition.
- \`.collect()\` — gathers the results back into a new \`Vec\`.
- \`.sum()\` — adds every element together.`),
        tryit("rust", L7_TRYIT, {
          expectedOutput: L7_TRYIT_OUT,
          caption: "push, indexing, {:?} debug-printing, and an iterator chain (map/filter/sum).",
        }),
        md(`### Reference — common Vec & iterator methods

| Method | What it does |
|---|---|
| \`v.push(x)\` | appends x to the end |
| \`v.len()\` | number of elements |
| \`v[i]\` | access element at index i (panics if out of range) |
| \`v.iter().map(f)\` | transform every element |
| \`v.iter().filter(f)\` | keep only matching elements |
| \`v.iter().sum()\` | add every element |
| \`v.iter().max()\` / \`.min()\` | largest / smallest element, as an \`Option\` |

\`.max()\` and \`.min()\` return an \`Option<&T>\` because an empty vector has no maximum — call \`.unwrap()\` once you're sure the vector isn't empty.`),
        exercise(
          "rust",
          "Build a Vec<i32> containing the squares of 1 through 5 (push i*i inside a loop for i in 1..=5), then print it with {:?}.",
          L7_EX1_STARTER,
          L7_EX1_SOLUTION,
          { check: "[1, 4, 9, 16, 25]", caption: "Exercise 1 — building a Vec with push" },
        ),
        exercise(
          "rust",
          "Given `let scores = vec![55, 92, 78, 64, 88];`, use `.iter().max()` to find the highest score and print `Highest score: 92`.",
          L7_EX2_STARTER,
          L7_EX2_SOLUTION,
          { check: "Highest score: 92", caption: "Exercise 2 — .iter().max()" },
        ),
      ),
    },
  ],
};
