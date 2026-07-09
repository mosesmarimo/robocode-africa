import { md, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello & fmt
// ---------------------------------------------------------------------------

const L1_TRYIT = `package main

import "fmt"

func main() {
	fmt.Println("Hello, RoboCode!")
	fmt.Printf("Go was created at %s in %d.\\n", "Google", 2009)
	total := 6 * 7
	fmt.Println("6 times 7 is", total)
}`;
const L1_TRYIT_OUT = `Hello, RoboCode!
Go was created at Google in 2009.
6 times 7 is 42`;

const L1_EX1_STARTER = `package main

import "fmt"

func main() {
	fmt.Println("Welcome to RoboCode!")
	// TODO: compute 12 * 8 and print "12 times 8 is 96"
}`;
const L1_EX1_SOLUTION = `package main

import "fmt"

func main() {
	fmt.Println("Welcome to RoboCode!")
	result := 12 * 8
	fmt.Println("12 times 8 is", result)
}`;

const L1_EX2_STARTER = `package main

import "fmt"

func main() {
	number := 7
	name := "Spark"
	fmt.Println(name, number) // TODO: replace with fmt.Printf to print "Robot #7 is named Spark"
}`;
const L1_EX2_SOLUTION = `package main

import "fmt"

func main() {
	number := 7
	name := "Spark"
	fmt.Printf("Robot #%d is named %s\\n", number, name)
}`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Types
// ---------------------------------------------------------------------------

const L2_TRYIT = `package main

import "fmt"

func main() {
	var name string = "Tariro"
	var age int = 14
	var height float64 = 1.62
	var isStudent bool = true

	fmt.Println(name, age, height, isStudent)

	// Short form: := lets Go infer the type
	country := "Zimbabwe"
	score := 87.5

	fmt.Printf("%s lives in %s and scored %.1f\\n", name, country, score)

	// Zero values — declared but not assigned
	var count int
	var label string
	fmt.Printf("count=%d label=%q\\n", count, label)
}`;
const L2_TRYIT_OUT = `Tariro 14 1.62 true
Tariro lives in Zimbabwe and scored 87.5
count=0 label=""`;

const L2_EX1_STARTER = `package main

import "fmt"

func main() {
	robotName := "Atlas"
	batteryLevel := 82
	fmt.Println(robotName, batteryLevel) // TODO: use Printf to print "Atlas is at 82% battery"
}`;
const L2_EX1_SOLUTION = `package main

import "fmt"

func main() {
	robotName := "Atlas"
	batteryLevel := 82
	fmt.Printf("%s is at %d%% battery\\n", robotName, batteryLevel)
}`;

const L2_EX2_STARTER = `package main

import "fmt"

func main() {
	total := 7
	count := 2
	fmt.Println(total, count) // TODO: convert to float64, divide, and print "Average: 3.50"
}`;
const L2_EX2_SOLUTION = `package main

import "fmt"

func main() {
	total := 7
	count := 2
	average := float64(total) / float64(count)
	fmt.Printf("Average: %.2f\\n", average)
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Functions
// ---------------------------------------------------------------------------

const L3_TRYIT = `package main

import "fmt"

// square returns the square of a number.
func square(n int) int {
	return n * n
}

// minMax returns both the smallest and largest of two numbers —
// Go functions can return more than one value.
func minMax(a, b int) (int, int) {
	if a < b {
		return a, b
	}
	return b, a
}

func main() {
	fmt.Println("5 squared is", square(5))

	small, big := minMax(9, 4)
	fmt.Println("min:", small, "max:", big)

	fmt.Println("Sum of squares:", square(3)+square(4))
}`;
const L3_TRYIT_OUT = `5 squared is 25
min: 4 max: 9
Sum of squares: 25`;

const L3_EX1_STARTER = `package main

import "fmt"

func double(n int) int {
	// TODO: return n doubled
	return 0
}

func main() {
	fmt.Println("Double of 9 is", double(9))
}`;
const L3_EX1_SOLUTION = `package main

import "fmt"

func double(n int) int {
	return n * 2
}

func main() {
	fmt.Println("Double of 9 is", double(9))
}`;

const L3_EX2_STARTER = `package main

import "fmt"

func divide(a, b int) (int, int) {
	// TODO: return the quotient and remainder of a / b
	return 0, 0
}

func main() {
	q, r := divide(17, 5)
	fmt.Printf("17 / 5 = %d remainder %d\\n", q, r)
}`;
const L3_EX2_SOLUTION = `package main

import "fmt"

func divide(a, b int) (int, int) {
	return a / b, a % b
}

func main() {
	q, r := divide(17, 5)
	fmt.Printf("17 / 5 = %d remainder %d\\n", q, r)
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Control Flow (if / for)
// ---------------------------------------------------------------------------

const L4_TRYIT = `package main

import "fmt"

func main() {
	score := 73

	if score >= 80 {
		fmt.Println("Grade: A")
	} else if score >= 60 {
		fmt.Println("Grade: B")
	} else if score >= 50 {
		fmt.Println("Grade: C")
	} else {
		fmt.Println("Grade: F")
	}

	// Classic three-part for loop
	fmt.Println("\\nCounting:")
	for i := 1; i <= 5; i++ {
		if i > 1 {
			fmt.Print(" ")
		}
		fmt.Print(i)
	}
	fmt.Println()

	// While-style for loop — condition only
	fmt.Println("\\nCountdown:")
	countdown := 3
	for countdown > 0 {
		fmt.Println(countdown)
		countdown--
	}
	fmt.Println("Liftoff!")

	// Range loop over a slice
	fmt.Println("\\nSubjects:")
	subjects := []string{"Maths", "Science", "Art"}
	for i, subject := range subjects {
		fmt.Printf("%d: %s\\n", i, subject)
	}
}`;
const L4_TRYIT_OUT = `Grade: B

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

const L4_EX1_STARTER = `package main

import "fmt"

func main() {
	for i := 1; i <= 15; i++ {
		fmt.Println(i) // TODO: replace with Fizz/Buzz/FizzBuzz logic
	}
}`;
const L4_EX1_SOLUTION = `package main

import "fmt"

func main() {
	for i := 1; i <= 15; i++ {
		switch {
		case i%15 == 0:
			fmt.Println("FizzBuzz")
		case i%3 == 0:
			fmt.Println("Fizz")
		case i%5 == 0:
			fmt.Println("Buzz")
		default:
			fmt.Println(i)
		}
	}
}`;

const L4_EX2_STARTER = `package main

import "fmt"

func main() {
	sum := 0
	for i := 1; i <= 20; i++ {
		// TODO: add i to sum only when i is even
	}
	fmt.Println("Sum of evens:", sum)
}`;
const L4_EX2_SOLUTION = `package main

import "fmt"

func main() {
	sum := 0
	for i := 1; i <= 20; i++ {
		if i%2 == 0 {
			sum += i
		}
	}
	fmt.Println("Sum of evens:", sum)
}`;

// ---------------------------------------------------------------------------
// Lesson 5 — Slices & Maps
// ---------------------------------------------------------------------------

const L5_TRYIT = `package main

import (
	"fmt"
	"sort"
)

func main() {
	// Slices — dynamically-sized, growable lists
	numbers := []int{1, 2, 3, 4, 5}
	numbers = append(numbers, 6)
	fmt.Println("Numbers:", numbers)
	fmt.Println("Length:", len(numbers))

	// Slicing — take a sub-range [start:end)
	firstThree := numbers[:3]
	fmt.Println("First three:", firstThree)

	// Maps — key/value pairs
	ages := map[string]int{
		"Tariro": 14,
		"Rudo":   16,
		"Simba":  15,
	}
	ages["Tatenda"] = 17 // add a new entry

	// fmt sorts map keys automatically when printing the whole map
	fmt.Println("Ages:", ages)

	// Iterate in a guaranteed order by sorting the keys first —
	// looping over a map directly does NOT guarantee any order.
	keys := make([]string, 0, len(ages))
	for name := range ages {
		keys = append(keys, name)
	}
	sort.Strings(keys)

	fmt.Println("\\nSorted roster:")
	for _, name := range keys {
		fmt.Printf("%s is %d\\n", name, ages[name])
	}
}`;
const L5_TRYIT_OUT = `Numbers: [1 2 3 4 5 6]
Length: 6
First three: [1 2 3]
Ages: map[Rudo:16 Simba:15 Tariro:14 Tatenda:17]

Sorted roster:
Rudo is 16
Simba is 15
Tariro is 14
Tatenda is 17`;

const L5_EX1_STARTER = `package main

import "fmt"

func main() {
	squares := []int{}
	for i := 1; i <= 5; i++ {
		// TODO: append i*i to squares
	}
	fmt.Println(squares)
}`;
const L5_EX1_SOLUTION = `package main

import "fmt"

func main() {
	squares := []int{}
	for i := 1; i <= 5; i++ {
		squares = append(squares, i*i)
	}
	fmt.Println(squares)
}`;

const L5_EX2_STARTER = `package main

import (
	"fmt"
	"sort"
)

func main() {
	words := []string{"go", "is", "fast", "go", "is", "go"}
	counts := map[string]int{}
	for _, w := range words {
		_ = w // TODO: increment counts[w]
	}

	keys := make([]string, 0, len(counts))
	for k := range counts {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	for _, k := range keys {
		fmt.Printf("%s: %d\\n", k, counts[k])
	}
}`;
const L5_EX2_SOLUTION = `package main

import (
	"fmt"
	"sort"
)

func main() {
	words := []string{"go", "is", "fast", "go", "is", "go"}
	counts := map[string]int{}
	for _, w := range words {
		counts[w]++
	}

	keys := make([]string, 0, len(counts))
	for k := range counts {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	for _, k := range keys {
		fmt.Printf("%s: %d\\n", k, counts[k])
	}
}`;

// ---------------------------------------------------------------------------
// Lesson 6 — Structs
// ---------------------------------------------------------------------------

const L6_TRYIT = `package main

import "fmt"

// Robot groups related fields together — like a lightweight class.
type Robot struct {
	Name    string
	Battery int
}

// Describe is a method with a VALUE receiver — it can read fields but
// never modifies the original struct.
func (r Robot) Describe() string {
	return fmt.Sprintf("%s (battery: %d%%)", r.Name, r.Battery)
}

// Charge is a method with a POINTER receiver — it can modify the caller's
// struct because it operates on a pointer to it.
func (r *Robot) Charge(amount int) {
	r.Battery += amount
	if r.Battery > 100 {
		r.Battery = 100
	}
}

func main() {
	spark := Robot{Name: "Spark", Battery: 40}
	fmt.Println(spark.Describe())

	spark.Charge(70)
	fmt.Println(spark.Describe())

	// A slice of structs — a small fleet
	fleet := []Robot{
		{Name: "Atlas", Battery: 90},
		{Name: "Byte", Battery: 55},
	}
	for _, r := range fleet {
		fmt.Println(r.Describe())
	}
}`;
const L6_TRYIT_OUT = `Spark (battery: 40%)
Spark (battery: 100%)
Atlas (battery: 90%)
Byte (battery: 55%)`;

const L6_EX1_STARTER = `package main

import "fmt"

type Rectangle struct {
	Width  float64
	Height float64
}

func (r Rectangle) Area() float64 {
	// TODO: return r.Width * r.Height
	return 0
}

func main() {
	rect := Rectangle{Width: 6, Height: 3.5}
	fmt.Printf("Area: %.2f\\n", rect.Area())
}`;
const L6_EX1_SOLUTION = `package main

import "fmt"

type Rectangle struct {
	Width  float64
	Height float64
}

func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func main() {
	rect := Rectangle{Width: 6, Height: 3.5}
	fmt.Printf("Area: %.2f\\n", rect.Area())
}`;

const L6_EX2_STARTER = `package main

import "fmt"

type Robot struct {
	Name    string
	Battery int
}

func main() {
	fleet := []Robot{
		{Name: "Atlas", Battery: 90},
		{Name: "Byte", Battery: 55},
		{Name: "Spark", Battery: 40},
	}

	total := 0
	for _, r := range fleet {
		_ = r // TODO: add r.Battery to total
	}
	fmt.Println("Total battery:", total)
}`;
const L6_EX2_SOLUTION = `package main

import "fmt"

type Robot struct {
	Name    string
	Battery int
}

func main() {
	fleet := []Robot{
		{Name: "Atlas", Battery: 90},
		{Name: "Byte", Battery: 55},
		{Name: "Spark", Battery: 40},
	}

	total := 0
	for _, r := range fleet {
		total += r.Battery
	}
	fmt.Println("Total battery:", total)
}`;

export const goTutorialCourse: CourseModule = {
  meta: {
    title: "Go Tutorial",
    slug: "tutorial-go",
    track: "coding",
    level: "primary",
    description: "A W3Schools-style, hands-on introduction to Go — print your first line, then work through variables, functions, control flow, slices, maps, and structs with runnable examples and exercises.",
    coverImage: "/covers/coding.svg",
    order: 56,
    language: "go",
  },
  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1 — Hello & fmt
    // -----------------------------------------------------------------------
    {
      title: "Go Hello & fmt",
      slug: "tutorial-go-hello",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## Go Hello World

**Go** (also called *Golang*) is a compiled, statically-typed language created at Google. Every Go program starts life the same way: a file belonging to \`package main\` with a \`func main()\` — the entry point where execution begins.

The \`fmt\` package (short for *format*) is Go's standard toolbox for printing text:

- \`fmt.Println(...)\` — prints its arguments separated by spaces, then a newline.
- \`fmt.Printf(format, ...)\` — prints using a **format string** with verbs like \`%s\` (string), \`%d\` (integer), \`%.1f\` (float, 1 decimal place), and \`%v\` (any value, default format).

Click **Run** below to try the example, then edit the text or the maths and run it again.`),
        tryit("go", L1_TRYIT, {
          expectedOutput: L1_TRYIT_OUT,
          caption: "Every Go program needs package main and func main().",
        }),
        md(`### Reference — common fmt verbs

| Verb | Meaning | Example |
|---|---|---|
| \`%s\` | string | \`fmt.Printf("%s", "hi")\` → \`hi\` |
| \`%d\` | integer | \`fmt.Printf("%d", 42)\` → \`42\` |
| \`%.2f\` | float, 2 decimals | \`fmt.Printf("%.2f", 3.14159)\` → \`3.14\` |
| \`%v\` | default format, any type | \`fmt.Printf("%v", true)\` → \`true\` |
| \`%q\` | quoted string | \`fmt.Printf("%q", "hi")\` → \`"hi"\` |
| \`%%\` | a literal percent sign | \`fmt.Printf("%d%%", 50)\` → \`50%\` |

Every \`.go\` file that should run on its own needs exactly one \`func main()\`, inside \`package main\`. Files that are imported as libraries use a different package name and have no \`main\` function.`),
        exercise(
          "go",
          "Print `Welcome to RoboCode!`, then compute 12 * 8 and print `12 times 8 is 96` using fmt.Println.",
          L1_EX1_STARTER,
          L1_EX1_SOLUTION,
          { check: "12 times 8 is 96", caption: "Exercise 1 — println and a calculation" },
        ),
        exercise(
          "go",
          "Given `number := 7` and `name := \"Spark\"`, use fmt.Printf with %d and %s to print exactly: `Robot #7 is named Spark`.",
          L1_EX2_STARTER,
          L1_EX2_SOLUTION,
          { check: "Robot #7 is named Spark", caption: "Exercise 2 — Printf with format verbs" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2 — Variables & Types
    // -----------------------------------------------------------------------
    {
      title: "Go Variables & Types",
      slug: "tutorial-go-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Declaring variables in Go

Go is **statically typed** — every variable has a fixed type known at compile time. You can declare a variable two ways:

\`\`\`go
var age int = 14   // long form — explicit type
age := 14          // short form — Go infers the type (only inside functions)
\`\`\`

### Core types

| Type | Stores | Example |
|---|---|---|
| \`string\` | text (UTF-8) | \`"Harare"\` |
| \`int\` | whole number | \`42\` |
| \`float64\` | decimal number | \`3.14\` |
| \`bool\` | true or false | \`true\` |

If you declare a variable without giving it a value, Go gives it a **zero value**: \`0\` for numbers, \`""\` for strings, \`false\` for booleans. Run the example to see both declaration styles and the zero values in action.`),
        tryit("go", L2_TRYIT, {
          expectedOutput: L2_TRYIT_OUT,
          caption: "Long-form declarations, short-form :=, and zero values.",
        }),
        md(`### Reference — zero values

| Type | Zero value |
|---|---|
| \`int\`, \`float64\` | \`0\`, \`0\` |
| \`string\` | \`""\` (empty string) |
| \`bool\` | \`false\` |

Go will refuse to **compile** if you declare a variable and never use it anywhere — this keeps programs free of forgotten clutter. It will not, however, stop you from declaring a variable and giving it the "wrong" value — that's on you to test!`),
        exercise(
          "go",
          "Given `robotName := \"Atlas\"` and `batteryLevel := 82`, use fmt.Printf to print exactly: `Atlas is at 82% battery` (remember %% for a literal percent sign).",
          L2_EX1_STARTER,
          L2_EX1_SOLUTION,
          { check: "Atlas is at 82% battery", caption: "Exercise 1 — Printf with a literal %" },
        ),
        exercise(
          "go",
          "Given `total := 7` and `count := 2` (both int), convert both to float64, divide, and print `Average: 3.50` using %.2f.",
          L2_EX2_STARTER,
          L2_EX2_SOLUTION,
          { check: "Average: 3.50", caption: "Exercise 2 — type conversion with float64()" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3 — Functions
    // -----------------------------------------------------------------------
    {
      title: "Go Functions",
      slug: "tutorial-go-functions",
      contentType: "markdown",
      estMinutes: 11,
      body: body(
        md(`## Writing functions

A Go function is declared with \`func\`, a name, a list of parameters (each with a type), and a return type:

\`\`\`go
func square(n int) int {
    return n * n
}
\`\`\`

Go functions can return **more than one value** — a feature used constantly in real Go code (for example, to return both a result and an error):

\`\`\`go
func minMax(a, b int) (int, int) {
    if a < b {
        return a, b
    }
    return b, a
}

small, big := minMax(9, 4)
\`\`\`

Run the example below to see both single-return and multi-return functions in action.`),
        tryit("go", L3_TRYIT, {
          expectedOutput: L3_TRYIT_OUT,
          caption: "Functions can take parameters and return more than one value.",
        }),
        md(`### Reference — function syntax

| Piece | Purpose |
|---|---|
| \`func name(param type) returnType { ... }\` | single return value |
| \`func name(param type) (typeA, typeB) { ... }\` | two return values |
| \`a, b int\` | shorthand for two parameters that share a type |
| \`return a, b\` | returns both values at once |

When calling a function that returns two values, capture both with a comma: \`x, y := minMax(1, 2)\`. If you only need one of them, discard the other with the blank identifier: \`_, y := minMax(1, 2)\`.`),
        exercise(
          "go",
          "Write a function `double(n int) int` that returns double its input, then use it to print `Double of 9 is 18`.",
          L3_EX1_STARTER,
          L3_EX1_SOLUTION,
          { check: "Double of 9 is 18", caption: "Exercise 1 — a single-return function" },
        ),
        exercise(
          "go",
          "Write a function `divide(a, b int) (int, int)` that returns the quotient and remainder of a / b, then print `17 / 5 = 3 remainder 2`.",
          L3_EX2_STARTER,
          L3_EX2_SOLUTION,
          { check: "17 / 5 = 3 remainder 2", caption: "Exercise 2 — a function with two return values" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4 — Control Flow
    // -----------------------------------------------------------------------
    {
      title: "Go Control Flow",
      slug: "tutorial-go-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and looping

Go keeps control flow deliberately small: \`if\`/\`else\`, \`switch\`, and just **one** loop keyword — \`for\` — which does the job of a while-loop, a counting loop, and a range-based loop.

\`\`\`go
if score >= 80 {
    fmt.Println("Great!")
} else if score >= 50 {
    fmt.Println("Keep practising.")
} else {
    fmt.Println("Don't give up!")
}
\`\`\`

Notice: no parentheses around the condition — that's Go style. The three shapes of \`for\` are:

\`\`\`go
for i := 0; i < 5; i++ { ... }   // classic, C-style counting
for condition { ... }            // while-style
for i, v := range slice { ... }  // range — iterate a slice, array, or map
\`\`\`

Run the example to see all three loop shapes together with an if/else chain.`),
        tryit("go", L4_TRYIT, {
          expectedOutput: L4_TRYIT_OUT,
          caption: "if/else, a counting for, a while-style for, and a range for.",
        }),
        md(`### Reference — the three shapes of \`for\`

| Shape | Use it for |
|---|---|
| \`for i := 0; i < n; i++\` | counting a known number of times |
| \`for condition\` | repeating until a condition becomes false |
| \`for i, v := range collection\` | walking every element of a slice, array, string, or map |

The blank identifier \`_\` lets you intentionally ignore a value Go's range loop gives you — for example \`for _, v := range list\` when you don't need the index.`),
        exercise(
          "go",
          "Print the numbers 1 to 15, but print \"Fizz\" for multiples of 3, \"Buzz\" for multiples of 5, and \"FizzBuzz\" for multiples of both.",
          L4_EX1_STARTER,
          L4_EX1_SOLUTION,
          { check: "FizzBuzz", caption: "Exercise 1 — classic FizzBuzz" },
        ),
        exercise(
          "go",
          "Add up every even number from 1 to 20 (2 + 4 + ... + 20) and print `Sum of evens: 110`.",
          L4_EX2_STARTER,
          L4_EX2_SOLUTION,
          { check: "Sum of evens: 110", caption: "Exercise 2 — accumulating inside a loop" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 5 — Slices & Maps
    // -----------------------------------------------------------------------
    {
      title: "Go Slices & Maps",
      slug: "tutorial-go-slices-maps",
      contentType: "markdown",
      estMinutes: 13,
      body: body(
        md(`## Slices — growable lists

A **slice** is Go's dynamically-sized list type. Create one with a literal, then grow it with \`append\`:

\`\`\`go
numbers := []int{1, 2, 3}
numbers = append(numbers, 4)   // append returns a (possibly new) slice
\`\`\`

\`len(numbers)\` gives the length, and \`numbers[:3]\` takes a **sub-slice** — everything before index 3.

## Maps — key/value pairs

A **map** stores values looked up by key:

\`\`\`go
ages := map[string]int{"Tariro": 14, "Rudo": 16}
ages["Simba"] = 15        // add or update an entry
fmt.Println(ages["Rudo"]) // 16
\`\`\`

Since Go 1.12, printing a whole map with \`fmt\` automatically sorts its keys, so \`fmt.Println(ages)\` is deterministic. But looping over a map yourself with \`for k := range m\` visits keys in a **random order** every time — if you need a stable order in your own loop, sort the keys first with \`sort.Strings\`.`),
        tryit("go", L5_TRYIT, {
          expectedOutput: L5_TRYIT_OUT,
          caption: "append, sub-slicing, map lookups, and sorting keys for a stable loop order.",
        }),
        md(`### Reference — slices vs maps

| | Slice | Map |
|---|---|---|
| Shape | ordered list | unordered key → value |
| Declare | \`[]int{1, 2, 3}\` | \`map[string]int{"a": 1}\` |
| Add | \`append(s, x)\` | \`m[key] = value\` |
| Size | \`len(s)\` | \`len(m)\` |
| Looping order | always index 0, 1, 2, ... | random — sort keys for a stable order |`),
        exercise(
          "go",
          "Build a slice containing the squares of 1 through 5 (append i*i inside a loop for i := 1..5), then print it.",
          L5_EX1_STARTER,
          L5_EX1_SOLUTION,
          { check: "[1 4 9 16 25]", caption: "Exercise 1 — building a slice with append" },
        ),
        exercise(
          "go",
          "Count how many times each word appears in `[]string{\"go\", \"is\", \"fast\", \"go\", \"is\", \"go\"}` using a `map[string]int` (increment `counts[w]` per word), then print each word and its count in alphabetical order.",
          L5_EX2_STARTER,
          L5_EX2_SOLUTION,
          { check: "go: 3", caption: "Exercise 2 — counting with a map, printed in sorted order" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 6 — Structs
    // -----------------------------------------------------------------------
    {
      title: "Go Structs",
      slug: "tutorial-go-structs",
      contentType: "markdown",
      estMinutes: 13,
      body: body(
        md(`## Grouping data with structs

A **struct** groups related fields into one type — Go's answer to a lightweight class:

\`\`\`go
type Robot struct {
    Name    string
    Battery int
}

spark := Robot{Name: "Spark", Battery: 40}
\`\`\`

You attach behaviour to a struct with **methods** — functions with a special *receiver* argument before the name:

\`\`\`go
func (r Robot) Describe() string { ... }   // value receiver — read-only
func (r *Robot) Charge(n int)    { ... }   // pointer receiver — can modify r
\`\`\`

Use a **value receiver** when the method only reads the struct, and a **pointer receiver** (\`*Robot\`) when it needs to change the struct's fields. Run the example to see both kinds of method, plus a slice of structs.`),
        tryit("go", L6_TRYIT, {
          expectedOutput: L6_TRYIT_OUT,
          caption: "A struct with a read-only method and a mutating (pointer-receiver) method.",
        }),
        md(`### Reference — value vs pointer receivers

| Receiver | Can modify the original? | When to use |
|---|---|---|
| \`func (r Robot) M()\` | No — works on a copy | reading fields, formatting, computing a result |
| \`func (r *Robot) M()\` | Yes — works on the real struct | charging a battery, renaming, any mutation |

A slice of structs, \`[]Robot{...}\`, works exactly like a slice of any other type — you can \`range\` over it, \`append\` to it, and call methods on each element.`),
        exercise(
          "go",
          "Define a `Rectangle` struct with `Width` and `Height` (float64), and a method `Area() float64` that returns width * height. For `Rectangle{Width: 6, Height: 3.5}`, print `Area: 21.00`.",
          L6_EX1_STARTER,
          L6_EX1_SOLUTION,
          { check: "Area: 21.00", caption: "Exercise 1 — a method on a struct" },
        ),
        exercise(
          "go",
          "Given a `[]Robot` fleet with Battery values 90, 55, and 40, loop over it and sum the Battery field, then print `Total battery: 185`.",
          L6_EX2_STARTER,
          L6_EX2_SOLUTION,
          { check: "Total battery: 185", caption: "Exercise 2 — summing a field across a slice of structs" },
        ),
      ),
    },
  ],
};
