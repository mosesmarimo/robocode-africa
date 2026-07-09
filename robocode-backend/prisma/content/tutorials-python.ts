import { md, tryit, exercise, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Intro & First Program
// ---------------------------------------------------------------------------

const L1_TRYIT_1 = `print("Hello, World!")
print("Welcome to Python.")`;

const L1_TRYIT_2 = `print("Python", "is", "fun", sep="-")
print(3 + 5)`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Data Types
// ---------------------------------------------------------------------------

const L2_TRYIT_1 = `name = "Aisha"
age = 13
height = 1.55
is_member = True

print(name)
print(age)
print(height)
print(is_member)
print(type(age))`;

const L2_TRYIT_2 = `name = "Aisha"
age = 13
print(f"{name} is {age} years old.")
age = age + 1
print(f"Next year {name} will be {age}.")`;

// ---------------------------------------------------------------------------
// Lesson 3 — Operators & Expressions
// ---------------------------------------------------------------------------

const L3_TRYIT_1 = `a = 10
b = 3

print(a + b)   # addition
print(a - b)   # subtraction
print(a * b)   # multiplication
print(a / b)   # division (always gives a float)
print(a // b)  # floor division (rounds down)
print(a % b)   # modulus (the remainder)
print(a ** b)  # exponent (a to the power of b)`;

const L3_TRYIT_2 = `x = 7
y = 12

print(x < y)                    # less than
print(x == y)                   # equal to
print(x != y)                   # not equal to
print(x > 5 and y > 10)         # both must be True
print(x > 5 or y < 10)          # at least one must be True
print(not x > 5)                # flips True/False`;

// ---------------------------------------------------------------------------
// Lesson 4 — Strings
// ---------------------------------------------------------------------------

const L4_TRYIT_1 = `greeting = "Hello, RoboCode!"

print(greeting)
print(len(greeting))        # number of characters
print(greeting.upper())     # ALL CAPS
print(greeting.lower())     # all lowercase
print(greeting[0])          # first character (index 0)
print(greeting[7:14])       # slice: characters 7 up to (not including) 14`;

const L4_TRYIT_2 = `first = "Robo"
last = "Code"
full = first + last              # + joins (concatenates) strings
print(full)
print(full.replace("Code", "Coder"))

sentence = "  learn python today  "
print(sentence.strip())          # removes leading/trailing spaces

words = "red,green,blue".split(",")   # splits into a list
print(words)`;

// ---------------------------------------------------------------------------
// Lesson 5 — Conditionals (if / elif / else)
// ---------------------------------------------------------------------------

const L5_TRYIT_1 = `age = 16

if age >= 18:
    print("You are an adult.")
elif age >= 13:
    print("You are a teenager.")
else:
    print("You are a child.")`;

const L5_TRYIT_2 = `temperature = 30
is_raining = False

if temperature > 25 and not is_raining:
    print("Great day for a picnic!")
else:
    print("Maybe stay indoors.")`;

// ---------------------------------------------------------------------------
// Lesson 6 — Loops
// ---------------------------------------------------------------------------

const L6_TRYIT_1 = `for i in range(1, 6):
    print(i)`;

const L6_TRYIT_2 = `count = 0
while count < 5:
    print("Count is", count)
    count += 1
print("Done!")`;

const L6_TRYIT_3 = `for number in range(1, 11):
    if number == 6:
        break
    print(number)`;

// ---------------------------------------------------------------------------
// Lesson 7 — Functions
// ---------------------------------------------------------------------------

const L7_TRYIT_1 = `def greet(name):
    return f"Hello, {name}!"

print(greet("Zanele"))
print(greet("Tino"))`;

const L7_TRYIT_2 = `def power(base, exponent=2):
    return base ** exponent

print(power(4))       # uses the default exponent (2)
print(power(2, 3))    # overrides the default`;

// ---------------------------------------------------------------------------
// Lesson 8 — Lists
// ---------------------------------------------------------------------------

const L8_TRYIT_1 = `fruits = ["apple", "banana", "cherry"]

print(fruits)
print(fruits[0])       # first item
print(len(fruits))      # number of items
fruits.append("date")   # add an item to the end
print(fruits)`;

const L8_TRYIT_2 = `numbers = [5, 2, 9, 1, 7]
numbers.sort()

print(numbers)
print(max(numbers))
print(min(numbers))
print(sum(numbers))`;

// ---------------------------------------------------------------------------
// Lesson 9 — Mini Project: Report Card
// ---------------------------------------------------------------------------

const L9_TRYIT_1 = `def grade_for(score):
    if score >= 80:
        return "A"
    elif score >= 60:
        return "B"
    elif score >= 50:
        return "C"
    else:
        return "F"

students = [("Aisha", 92), ("Kofi", 74), ("Zanele", 55)]

for name, score in students:
    grade = grade_for(score)
    print(f"{name}: {score} -> {grade}")`;

export const pythonTutorialCourse: CourseModule = {
  meta: {
    title: "Python Tutorial",
    slug: "tutorial-python",
    track: "coding",
    level: "primary",
    description: "A W3Schools-style, hands-on introduction to Python — from your first print() to lists, functions, and a mini report-card project.",
    coverImage: "/covers/coding.svg",
    order: 50,
    language: "python",
  },
  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1 — Intro & First Program
    // -----------------------------------------------------------------------
    {
      title: "Intro & First Program",
      slug: "python-tut-intro",
      estMinutes: 8,
      body: body(
        md(`## Welcome to Python

**Python** is one of the most popular programming languages in the world — used for websites, robots, data science, and artificial intelligence. It is famous for reading almost like plain English, which makes it a great first language to learn.

### The print() function

To display text on the screen, Python uses the built-in \`print()\` function. Whatever you put inside the parentheses gets shown as output.

\`\`\`python
print("Hello, World!")
\`\`\`

### Comments

A **comment** is a line of Python that the computer ignores — it's a note for humans. Comments start with a \`#\` symbol.

\`\`\`python
# This is a comment — it does nothing when the program runs
print("This line actually runs")
\`\`\`

Try running the example below. Then change the text inside the quotes and run it again to see what happens.`),
        tryit("python", L1_TRYIT_1, {
          expectedOutput: "Hello, World!\nWelcome to Python.",
          caption: "Your first Python program",
        }),
        md(`### print() can do more than text

You can \`print()\` multiple values separated by commas, and Python will automatically put a space between them (or whatever separator you choose with \`sep=\`). You can also print the result of a calculation directly.

| Example | Output |
|---------|--------|
| \`print("a", "b")\` | \`a b\` |
| \`print("a", "b", sep="-")\` | \`a-b\` |
| \`print(2 + 2)\` | \`4\` |

Try it yourself below.`),
        tryit("python", L1_TRYIT_2, {
          expectedOutput: "Python-is-fun\n8",
          caption: "Custom separators and maths inside print()",
        }),
        callout("tip", "Every Python statement is written on its own line, and (unlike some other languages) there is no semicolon needed at the end."),
        exercise(
          "python",
          "Write a program that prints your name on one line, then prints the text \"I am learning Python\" on the next line.",
          `# Print your name

# Print "I am learning Python"
`,
          `print("Tariro")
print("I am learning Python")`,
          { check: "I am learning Python", caption: "Two print() statements" },
        ),
        exercise(
          "python",
          "Print the result of adding 15 and 27 together.",
          `print(0)  # TODO: print 15 + 27 instead
`,
          `print(15 + 27)`,
          { check: "42", caption: "print() with a calculation" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2 — Variables & Data Types
    // -----------------------------------------------------------------------
    {
      title: "Variables & Data Types",
      slug: "python-tut-variables",
      estMinutes: 10,
      body: body(
        md(`## Storing data in variables

A **variable** is a name that points to a value stored in memory. In Python, you create one by writing a name, an equals sign, and a value — no type declaration required.

\`\`\`python
age = 14
\`\`\`

Python automatically figures out the type of the value. This is called **dynamic typing**.

### The four core types

| Type | Stores | Example |
|------|--------|---------|
| \`str\` | Text | \`name = "Tariro"\` |
| \`int\` | Whole numbers | \`age = 14\` |
| \`float\` | Decimal numbers | \`height = 1.62\` |
| \`bool\` | \`True\` or \`False\` | \`is_student = True\` |

You can check any variable's type with the built-in \`type()\` function.`),
        tryit("python", L2_TRYIT_1, {
          expectedOutput: "Aisha\n13\n1.55\nTrue\n<class 'int'>",
          caption: "Four variables, four types",
        }),
        md(`### f-strings — mixing text and variables

An **f-string** lets you embed variables directly inside text. Put an \`f\` right before the opening quote, then wrap variable names in curly braces \`{}\`.

\`\`\`python
print(f"My name is {name} and I am {age} years old.")
\`\`\`

f-strings can also contain expressions, not just variable names — Python evaluates whatever is inside the braces.`),
        tryit("python", L2_TRYIT_2, {
          expectedOutput: "Aisha is 13 years old.\nNext year Aisha will be 14.",
          caption: "f-strings and reassigning a variable",
        }),
        callout("info", "Variable names are case-sensitive: score, Score, and SCORE are three different variables. By convention, Python variable names use lowercase_with_underscores — this style is called snake_case."),
        exercise(
          "python",
          "Create a variable city set to \"Harare\" and a variable population set to 1500000. Using an f-string, print: The city of Harare has 1500000 people.",
          `city = ""
population = 0
# print an f-string using city and population
`,
          `city = "Harare"
population = 1500000
print(f"The city of {city} has {population} people.")`,
          { check: "The city of Harare has 1500000 people.", caption: "f-strings with two variables" },
        ),
        exercise(
          "python",
          "Create a variable price = 19.99 and print its type using type().",
          `price = 19.99
# print the type of price
`,
          `price = 19.99
print(type(price))`,
          { check: "<class 'float'>", caption: "Checking a variable's type" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3 — Operators & Expressions
    // -----------------------------------------------------------------------
    {
      title: "Operators & Expressions",
      slug: "python-tut-operators",
      estMinutes: 10,
      body: body(
        md(`## Doing maths and comparing values

**Operators** combine values into new values. Python has arithmetic operators for maths and comparison/logical operators for making decisions.

### Arithmetic operators

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| \`+\` | Addition | \`10 + 3\` | \`13\` |
| \`-\` | Subtraction | \`10 - 3\` | \`7\` |
| \`*\` | Multiplication | \`10 * 3\` | \`30\` |
| \`/\` | Division (always a float) | \`10 / 3\` | \`3.333...\` |
| \`//\` | Floor division (rounds down) | \`10 // 3\` | \`3\` |
| \`%\` | Modulus (remainder) | \`10 % 3\` | \`1\` |
| \`**\` | Exponent (power) | \`10 ** 3\` | \`1000\` |`),
        tryit("python", L3_TRYIT_1, {
          expectedOutput: "13\n7\n30\n3.3333333333333335\n3\n1\n1000",
          caption: "The seven arithmetic operators",
        }),
        md(`### Comparison and logical operators

Comparisons always produce a \`bool\` (\`True\` or \`False\`). Logical operators (\`and\`, \`or\`, \`not\`) combine booleans together.

| Operator | Meaning |
|----------|---------|
| \`==\` | equal to |
| \`!=\` | not equal to |
| \`<\`  \`>\` | less / greater than |
| \`<=\`  \`>=\` | less-or-equal / greater-or-equal |
| \`and\` | True only if **both** sides are True |
| \`or\` | True if **at least one** side is True |
| \`not\` | flips True to False and vice versa |`),
        tryit("python", L3_TRYIT_2, {
          expectedOutput: "True\nFalse\nTrue\nTrue\nTrue\nFalse",
          caption: "Comparisons and logical operators",
        }),
        callout("warning", "Don't confuse = (assignment, e.g. x = 5) with == (comparison, e.g. x == 5). This is one of the most common beginner mistakes."),
        exercise(
          "python",
          "Create width = 8 and height = 5, and print the area of the rectangle (width times height).",
          `width = 8
height = 5
# print the area
`,
          `width = 8
height = 5
print(width * height)`,
          { check: "40", caption: "Multiplication" },
        ),
        exercise(
          "python",
          "Create number = 17. Print True if the number is even, and False otherwise (hint: use % 2 == 0).",
          `number = 17
# print whether number is even
`,
          `number = 17
print(number % 2 == 0)`,
          { check: "False", caption: "Using modulus to test even/odd" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4 — Strings
    // -----------------------------------------------------------------------
    {
      title: "Strings",
      slug: "python-tut-strings",
      estMinutes: 11,
      body: body(
        md(`## Working with text

A **string** is a sequence of characters. Strings support **indexing** (picking a single character) and **slicing** (picking a range of characters), both counting from **0**.

\`\`\`python
word = "Python"
print(word[0])     # P  (first character)
print(word[0:3])   # Pyt  (characters 0, 1, 2)
\`\`\`

Python also has many built-in string **methods** — functions that belong to a string and are called with a dot, like \`.upper()\`.`),
        tryit("python", L4_TRYIT_1, {
          expectedOutput: "Hello, RoboCode!\n16\nHELLO, ROBOCODE!\nhello, robocode!\nH\nRoboCod",
          caption: "Indexing, slicing, and case methods",
        }),
        md(`### Common string methods

| Method | What it does |
|--------|---------------|
| \`.upper()\` / \`.lower()\` | Converts case |
| \`.strip()\` | Removes leading/trailing whitespace |
| \`.replace(old, new)\` | Replaces every occurrence of \`old\` with \`new\` |
| \`.split(sep)\` | Splits a string into a list, breaking on \`sep\` |
| \`len(s)\` | Returns the number of characters (a function, not a method) |
| \`+\` | Joins (concatenates) two strings |

Strings are **immutable** — methods like \`.upper()\` return a *new* string rather than changing the original.`),
        tryit("python", L4_TRYIT_2, {
          expectedOutput: "RoboCode\nRoboCoder\nlearn python today\n['red', 'green', 'blue']",
          caption: "Concatenation, replace, strip, and split",
        }),
        exercise(
          "python",
          "Create name = \"python\" and print it with the first letter capitalized, using .capitalize().",
          `name = "python"
# print name, capitalized
`,
          `name = "python"
print(name.capitalize())`,
          { check: "Python", caption: "The .capitalize() method" },
        ),
        exercise(
          "python",
          "Create text = \"RoboCode\" and print it reversed, using slicing ([::-1]).",
          `text = "RoboCode"
# print text reversed
`,
          `text = "RoboCode"
print(text[::-1])`,
          { check: "edoCoboR", caption: "Reversing a string with a slice" },
        ),
        exercise(
          "python",
          "Create sentence = \"the quick brown fox jumps\". Split it into words with .split() and print how many words there are, using len().",
          `sentence = "the quick brown fox jumps"
# split into words and print the count
`,
          `sentence = "the quick brown fox jumps"
words = sentence.split()
print(len(words))`,
          { check: "5", caption: "Splitting and counting words" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 5 — Conditionals (if / elif / else)
    // -----------------------------------------------------------------------
    {
      title: "Conditionals (if / else)",
      slug: "python-tut-conditionals",
      estMinutes: 11,
      body: body(
        md(`## Making decisions

Programs become powerful when they can make choices. Python's conditional statement uses \`if\`, \`elif\` (short for "else if"), and \`else\`. Python checks each condition from top to bottom and runs the first block whose condition is \`True\`.

\`\`\`python
if condition_1:
    # runs if condition_1 is True
elif condition_2:
    # runs if condition_1 was False but condition_2 is True
else:
    # runs if none of the above were True
\`\`\`

Notice the colon \`:\` at the end of every \`if\`, \`elif\`, and \`else\` line, and that the code inside each block is **indented**.`),
        tryit("python", L5_TRYIT_1, {
          expectedOutput: "You are a teenager.",
          caption: "if / elif / else",
        }),
        md(`### Combining conditions

You can combine multiple conditions with \`and\`, \`or\`, and \`not\` to make more precise decisions.`),
        tryit("python", L5_TRYIT_2, {
          expectedOutput: "Great day for a picnic!",
          caption: "Combining conditions with and / not",
        }),
        callout("tip", "Forgetting the colon (:) at the end of an if, elif, or else line is one of the most common beginner mistakes — Python will raise a SyntaxError."),
        exercise(
          "python",
          "Create number = 8. If it is even, print \"Even\"; otherwise print \"Odd\".",
          `number = 8
# print "Even" or "Odd"
`,
          `number = 8
if number % 2 == 0:
    print("Even")
else:
    print("Odd")`,
          { check: "Even", caption: "if / else with modulus" },
        ),
        exercise(
          "python",
          "Create n = 9. If n is divisible by 3, print \"Fizz\"; otherwise print n itself.",
          `n = 9
# print "Fizz" or the number
`,
          `n = 9
if n % 3 == 0:
    print("Fizz")
else:
    print(n)`,
          { check: "Fizz", caption: "A taste of FizzBuzz" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 6 — Loops
    // -----------------------------------------------------------------------
    {
      title: "Loops",
      slug: "python-tut-loops",
      estMinutes: 12,
      body: body(
        md(`## Repeating actions

A **loop** repeats a block of code. Python has two kinds: \`for\` loops (repeat a known number of times, or once per item in a collection) and \`while\` loops (repeat as long as a condition stays true).

### for loops with range()

\`range(1, 6)\` produces the numbers 1, 2, 3, 4, 5 — it stops *before* the second number.`),
        tryit("python", L6_TRYIT_1, {
          expectedOutput: "1\n2\n3\n4\n5",
          caption: "for i in range(1, 6)",
        }),
        md(`### while loops

A \`while\` loop keeps running **while** its condition is \`True\`. You must update the variable inside the loop, or it will run forever!`),
        tryit("python", L6_TRYIT_2, {
          expectedOutput: "Count is 0\nCount is 1\nCount is 2\nCount is 3\nCount is 4\nDone!",
          caption: "A while loop counting to 5",
        }),
        md(`### break — stopping a loop early

The \`break\` keyword immediately exits a loop, even if its condition would otherwise still be True.`),
        tryit("python", L6_TRYIT_3, {
          expectedOutput: "1\n2\n3\n4\n5",
          caption: "break stops the loop when number reaches 6",
        }),
        exercise(
          "python",
          "Use a for loop with range() to add up every whole number from 1 to 10, and print the total.",
          `total = 0
# loop from 1 to 10 and add each number to total
print(total)
`,
          `total = 0
for n in range(1, 11):
    total += n
print(total)`,
          { check: "55", caption: "Summing with a for loop" },
        ),
        exercise(
          "python",
          "Use a for loop to print every even number from 2 to 10 (inclusive), one per line.",
          `# print 2, 4, 6, 8, 10 — one per line
`,
          `for n in range(2, 11, 2):
    print(n)`,
          { check: "10", caption: "range() with a step of 2" },
        ),
        exercise(
          "python",
          "Print the 5 times table from 1 to 5, one line per row, in the form \"5 x 1 = 5\".",
          `# print the 5 times table, e.g. "5 x 1 = 5"
`,
          `for i in range(1, 6):
    print(f"5 x {i} = {5 * i}")`,
          { check: "5 x 5 = 25", caption: "A times table with an f-string" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 7 — Functions
    // -----------------------------------------------------------------------
    {
      title: "Functions",
      slug: "python-tut-functions",
      estMinutes: 11,
      body: body(
        md(`## Reusable blocks of code

A **function** is a named, reusable block of code. You define one with \`def\`, and it can accept **parameters** and send a value back with \`return\`.

\`\`\`python
def greet(name):
    return f"Hello, {name}!"
\`\`\`

Calling \`greet("Zanele")\` runs the function body with \`name\` set to \`"Zanele"\`, and gives back the returned string.`),
        tryit("python", L7_TRYIT_1, {
          expectedOutput: "Hello, Zanele!\nHello, Tino!",
          caption: "A function with one parameter",
        }),
        md(`### Default parameter values

A parameter can have a **default value**, used automatically whenever the caller doesn't supply one.

| Call | exponent used | Result |
|------|----------------|--------|
| \`power(4)\` | 2 (default) | 16 |
| \`power(2, 3)\` | 3 (supplied) | 8 |`),
        tryit("python", L7_TRYIT_2, {
          expectedOutput: "16\n8",
          caption: "A default parameter value",
        }),
        callout("info", "A function that doesn't explicitly return anything gives back None. Only use return when you actually need a value back in the calling code."),
        exercise(
          "python",
          "Write a function square(n) that returns n multiplied by itself. Print square(6).",
          `def square(n):
    pass  # TODO: return n * n

print(square(6))
`,
          `def square(n):
    return n * n

print(square(6))`,
          { check: "36", caption: "A one-line function" },
        ),
        exercise(
          "python",
          "Write a function is_even(n) that returns True if n is even. Print is_even(4) and is_even(7).",
          `def is_even(n):
    pass  # TODO: return whether n is even

print(is_even(4))
print(is_even(7))
`,
          `def is_even(n):
    return n % 2 == 0

print(is_even(4))
print(is_even(7))`,
          { check: "True\nFalse", caption: "A function returning a bool" },
        ),
        exercise(
          "python",
          "Write a function describe_temp(celsius=20) that returns \"hot\" if celsius >= 30, \"mild\" if celsius >= 15, and \"cold\" otherwise. Print describe_temp() and describe_temp(32).",
          `def describe_temp(celsius=20):
    pass  # TODO: return "hot", "mild", or "cold"

print(describe_temp())
print(describe_temp(32))
`,
          `def describe_temp(celsius=20):
    if celsius >= 30:
        return "hot"
    elif celsius >= 15:
        return "mild"
    else:
        return "cold"

print(describe_temp())
print(describe_temp(32))`,
          { check: "mild\nhot", caption: "A function with a default parameter and if/elif/else" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 8 — Lists
    // -----------------------------------------------------------------------
    {
      title: "Lists",
      slug: "python-tut-lists",
      estMinutes: 12,
      body: body(
        md(`## Storing many values together

A **list** stores an ordered collection of values in a single variable, written between square brackets \`[]\` and separated by commas. Lists are indexed from **0**, and they are **mutable** — you can change them after creating them.

\`\`\`python
fruits = ["apple", "banana", "cherry"]
\`\`\``),
        tryit("python", L8_TRYIT_1, {
          expectedOutput: "['apple', 'banana', 'cherry']\napple\n3\n['apple', 'banana', 'cherry', 'date']",
          caption: "Indexing, length, and .append()",
        }),
        md(`### Useful list functions and methods

| Function / method | What it does |
|--------------------|---------------|
| \`len(list)\` | Number of items |
| \`list.append(x)\` | Adds \`x\` to the end |
| \`list.remove(x)\` | Removes the first matching \`x\` |
| \`list.sort()\` | Sorts the list in place |
| \`max(list)\` / \`min(list)\` | Largest / smallest item |
| \`sum(list)\` | Total of all items (numbers only) |`),
        tryit("python", L8_TRYIT_2, {
          expectedOutput: "[1, 2, 5, 7, 9]\n9\n1\n24",
          caption: "sort(), max(), min(), and sum()",
        }),
        exercise(
          "python",
          "Create a list colors with \"red\", \"green\", \"blue\". Use a for loop to print each color on its own line.",
          `colors = ["red", "green", "blue"]
# loop over colors and print each one
`,
          `colors = ["red", "green", "blue"]
for color in colors:
    print(color)`,
          { check: "red\ngreen\nblue", caption: "Looping over a list" },
        ),
        exercise(
          "python",
          "Create animals = [\"cat\", \"dog\", \"hamster\"]. Remove \"dog\" using .remove() and print the resulting list.",
          `animals = ["cat", "dog", "hamster"]
# remove "dog" and print the list
`,
          `animals = ["cat", "dog", "hamster"]
animals.remove("dog")
print(animals)`,
          { check: "['cat', 'hamster']", caption: "The .remove() method" },
        ),
        exercise(
          "python",
          "Create scores = [70, 85, 90, 60] and print the total using sum().",
          `scores = [70, 85, 90, 60]
# print the total
`,
          `scores = [70, 85, 90, 60]
print(sum(scores))`,
          { check: "305", caption: "Totalling a list of numbers" },
        ),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 9 — Mini Project: Report Card
    // -----------------------------------------------------------------------
    {
      title: "Mini Project: Report Card",
      slug: "python-tut-project",
      estMinutes: 14,
      body: body(
        md(`## Bringing it all together

Time to combine everything from this tutorial — variables, strings, conditionals, loops, functions, and lists — into one small program: a class report-card generator.

### How it works

1. A function \`grade_for(score)\` uses \`if / elif / else\` to turn a numeric score into a letter grade.
2. A list of **tuples** \`(name, score)\` stores each student's data.
3. A \`for\` loop **unpacks** each tuple into \`name\` and \`score\`, calls \`grade_for()\`, and prints a formatted line with an f-string.

This is exactly the kind of small, useful script real programmers write every day.`),
        tryit("python", L9_TRYIT_1, {
          expectedOutput: "Aisha: 92 -> A\nKofi: 74 -> B\nZanele: 55 -> C",
          caption: "A report-card generator",
        }),
        md(`### One more building block: averages

A common next step is to compute the **average** of a list of numbers: divide the sum by how many items there are.

\`\`\`python
def average(numbers):
    return sum(numbers) / len(numbers)
\`\`\``),
        callout("tip", "Real programs often start small, just like this one. Break big problems into small functions, test each one, then combine them — this is exactly how professional developers work."),
        exercise(
          "python",
          "Write a function average(numbers) that returns the average of a list of numbers (sum divided by length). Print average([88, 92, 79, 65]).",
          `def average(numbers):
    pass  # TODO: return the average

scores = [88, 92, 79, 65]
print(average(scores))
`,
          `def average(numbers):
    return sum(numbers) / len(numbers)

scores = [88, 92, 79, 65]
print(average(scores))`,
          { check: "81.0", caption: "Computing an average with sum() and len()" },
        ),
        exercise(
          "python",
          "Extend the report card: add a new student (\"Blessing\", 40) to the students list, then run the same for loop to print grades for all four students.",
          `def grade_for(score):
    if score >= 80:
        return "A"
    elif score >= 60:
        return "B"
    elif score >= 50:
        return "C"
    else:
        return "F"

students = [("Aisha", 92), ("Kofi", 74), ("Zanele", 55)]
# TODO: add ("Blessing", 40) to students

for name, score in students:
    grade = grade_for(score)
    print(f"{name}: {score} -> {grade}")
`,
          `def grade_for(score):
    if score >= 80:
        return "A"
    elif score >= 60:
        return "B"
    elif score >= 50:
        return "C"
    else:
        return "F"

students = [("Aisha", 92), ("Kofi", 74), ("Zanele", 55), ("Blessing", 40)]

for name, score in students:
    grade = grade_for(score)
    print(f"{name}: {score} -> {grade}")`,
          { check: "Blessing: 40 -> F", caption: "Adding a student to the list" },
        ),
      ),
    },
  ],
};
