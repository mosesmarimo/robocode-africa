import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, JavaScript
// ---------------------------------------------------------------------------

const HELLO_WORLD = `// Your first JavaScript program
console.log("Hello, RoboCode!");

// JavaScript can do maths too
let result = 7 * 6;
console.log("7 times 6 is " + result);

// Modern string templates (backtick strings)
let name = "Tariro";
console.log(\`Welcome, \${name}!\`);`;

const SVG_JS_IN_BROWSER = `<svg viewBox="0 0 600 220" role="img" aria-label="JavaScript running inside a web browser — HTML provides structure, CSS styles it, JS makes it interactive" xmlns="http://www.w3.org/2000/svg">
  <!-- Browser chrome -->
  <rect x="20" y="20" width="560" height="180" rx="10" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <!-- Browser toolbar -->
  <rect x="20" y="20" width="560" height="36" rx="10" fill="#334155"/>
  <rect x="20" y="44" width="560" height="12" fill="#334155"/>
  <!-- Traffic lights -->
  <circle cx="44" cy="38" r="7" fill="#ef4444"/>
  <circle cx="64" cy="38" r="7" fill="#f59e0b"/>
  <circle cx="84" cy="38" r="7" fill="#22c55e"/>
  <!-- URL bar -->
  <rect x="100" y="27" width="380" height="22" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1"/>
  <text x="112" y="43" font-family="monospace" font-size="11" fill="#94a3b8">https://robocode.africa/my-page</text>
  <!-- Page content area -->
  <!-- HTML layer box -->
  <rect x="36" y="68" width="160" height="116" rx="6" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2"/>
  <text x="68" y="86" font-family="sans-serif" font-size="12" fill="#93c5fd" font-weight="bold">HTML</text>
  <text x="44" y="104" font-family="monospace" font-size="9" fill="#bfdbfe">&lt;h1&gt;Hello&lt;/h1&gt;</text>
  <text x="44" y="118" font-family="monospace" font-size="9" fill="#bfdbfe">&lt;button&gt;</text>
  <text x="44" y="132" font-family="monospace" font-size="9" fill="#bfdbfe">  Click me</text>
  <text x="44" y="146" font-family="monospace" font-size="9" fill="#bfdbfe">&lt;/button&gt;</text>
  <text x="52" y="176" font-family="sans-serif" font-size="10" fill="#60a5fa">Structure</text>
  <!-- CSS layer box -->
  <rect x="216" y="68" width="160" height="116" rx="6" fill="#3b1f6e" stroke="#a78bfa" stroke-width="2"/>
  <text x="258" y="86" font-family="sans-serif" font-size="12" fill="#c4b5fd" font-weight="bold">CSS</text>
  <text x="224" y="104" font-family="monospace" font-size="9" fill="#ddd6fe">h1 { color: blue }</text>
  <text x="224" y="118" font-family="monospace" font-size="9" fill="#ddd6fe">button {</text>
  <text x="224" y="132" font-family="monospace" font-size="9" fill="#ddd6fe">  background:</text>
  <text x="224" y="146" font-family="monospace" font-size="9" fill="#ddd6fe">  #22c55e; }</text>
  <text x="244" y="176" font-family="sans-serif" font-size="10" fill="#a78bfa">Style</text>
  <!-- JS layer box -->
  <rect x="396" y="68" width="160" height="116" rx="6" fill="#422006" stroke="#fbbf24" stroke-width="2"/>
  <text x="438" y="86" font-family="sans-serif" font-size="12" fill="#fde68a" font-weight="bold">JavaScript</text>
  <text x="404" y="104" font-family="monospace" font-size="9" fill="#fef3c7">button.onclick =</text>
  <text x="404" y="118" font-family="monospace" font-size="9" fill="#fef3c7">  function() {</text>
  <text x="404" y="132" font-family="monospace" font-size="9" fill="#fef3c7">    alert(</text>
  <text x="404" y="146" font-family="monospace" font-size="9" fill="#fef3c7">    "Clicked!")}</text>
  <text x="430" y="176" font-family="sans-serif" font-size="10" fill="#fbbf24">Behaviour</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & types
// ---------------------------------------------------------------------------

const VARIABLES_CODE = `// Variables in JavaScript — let, const, and the main types

// Use const for values that won't change
const PI = 3.14159;
const schoolName = "RoboCode Academy";

// Use let for values that can change
let score = 0;
let playerName = "Tariro";
let isLoggedIn = true;
let highScore = null;   // null means "no value yet"

console.log(\`Welcome to \${schoolName}, \${playerName}!\`);
console.log(\`Score: \${score}, Logged in: \${isLoggedIn}\`);

// Numbers — JavaScript has just one number type
let age = 14;            // whole number
let height = 1.62;       // decimal
let temperature = -3;    // negative

// Arrays — an ordered list of values
let subjects = ["Maths", "Science", "English", "Art"];
console.log("First subject:", subjects[0]);   // index 0 = first
console.log("Total subjects:", subjects.length);

// Objects — key-value pairs (like a record)
let student = {
  name: "Tariro",
  age: 14,
  grade: "9B",
};
console.log(\`Student: \${student.name}, Grade: \${student.grade}\`);`;

// ---------------------------------------------------------------------------
// Lesson 3 — Control flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `// Control flow: if / else + for loop + while loop

let score = 73;

// if / else if / else
if (score >= 80) {
  console.log("Grade: A — Excellent!");
} else if (score >= 60) {
  console.log("Grade: B — Good work!");
} else if (score >= 50) {
  console.log("Grade: C — Keep going!");
} else {
  console.log("Grade: F — Let's practise more.");
}

// for loop — iterate over an array
let fruits = ["mango", "banana", "orange", "guava"];
console.log("\\nFruits in the basket:");
for (let i = 0; i < fruits.length; i++) {
  console.log(\`  \${i + 1}. \${fruits[i]}\`);
}

// for...of — cleaner loop over an array
console.log("\\nSame list, cleaner loop:");
for (let fruit of fruits) {
  console.log("  •", fruit);
}

// while loop — repeat until a condition is false
let countdown = 5;
console.log("\\nCountdown:");
while (countdown > 0) {
  console.log(countdown);
  countdown--;
}
console.log("Blast off!");`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `// Temperature converter — converts Celsius to Fahrenheit and gives advice

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function getWeatherAdvice(celsius) {
  if (celsius >= 35) {
    return "Very hot! Stay hydrated and wear sunscreen.";
  } else if (celsius >= 25) {
    return "Warm and pleasant. Great day to go outside!";
  } else if (celsius >= 15) {
    return "Mild. A light jacket might be handy.";
  } else if (celsius >= 5) {
    return "Chilly. Wear a warm jersey.";
  } else {
    return "Very cold! Bundle up with a coat and scarf.";
  }
}

// A list of cities with their temperatures
let cities = [
  { name: "Harare",         celsius: 22 },
  { name: "Cape Town",      celsius: 18 },
  { name: "Nairobi",        celsius: 25 },
  { name: "Lagos",          celsius: 34 },
  { name: "Johannesburg",   celsius: 11 },
];

console.log("=== African City Weather Report ===\\n");

for (let city of cities) {
  let fahrenheit = celsiusToFahrenheit(city.celsius);
  let advice = getWeatherAdvice(city.celsius);
  console.log(\`\${city.name}: \${city.celsius}°C (\${fahrenheit.toFixed(1)}°F)\`);
  console.log(\`  → \${advice}\\n\`);
}`;

export const langJavascript: CourseModule = {
  meta: {
    title: "JavaScript Basics",
    slug: "lang-javascript",
    track: "coding",
    level: "high",
    description: "Master JavaScript — the language that powers every interactive website — from hello-world to your own weather report app.",
    coverImage: "/covers/coding.svg",
    order: 11,
  },
  lessons: [
    {
      title: "Hello, JavaScript",
      slug: "hello-javascript",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is JavaScript?

**JavaScript** (JS) is the programming language of the web. Every time you click a button, see an animation, or submit a form on a website, JavaScript is the code making it happen — right inside your browser, instantly, without needing to talk to a server.

JavaScript was created in 1995 and has since grown into one of the most widely-used programming languages in the world. Today it also runs outside browsers — on servers (Node.js), in mobile apps (React Native), and even on microcontrollers.

### The three languages of the web

Every webpage is built with three languages that work together.`),
        svg(SVG_JS_IN_BROWSER, "HTML structures the page, CSS styles it, JavaScript makes it interactive"),
        md(`### Your first program

In a browser, JavaScript uses \`console.log()\` to print messages to the developer console. In RoboCode Studio you will see the output right on screen.

The code below shows three important ideas:
- Comments start with \`//\` and are ignored by the computer — they are notes for humans.
- \`let\` creates a variable that can change.
- Template literals (backtick strings with \`\${}\`) let you embed variables inside text easily.`),
        code("javascript", HELLO_WORLD, { filename: "hello.js", openInStudio: true }),
        callout("info", "JavaScript is case-sensitive: console.log() works, but Console.Log() will cause an error. The language also uses semicolons (;) to end statements — most JS programmers include them, though modern JS can often work without them."),
      ),
    },
    {
      title: "Variables & Types",
      slug: "javascript-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Storing data in JavaScript

JavaScript has three ways to declare a variable:

| Keyword | When to use | Can change? |
|---------|-------------|-------------|
| \`const\` | Values that never change | No — fixed |
| \`let\` | Values that may change | Yes |
| \`var\` | Old style — avoid in new code | Yes |

**Rule of thumb:** always start with \`const\`. If you later need to reassign the variable, change it to \`let\`.

### The main data types

| Type | Description | Example |
|------|-------------|---------|
| \`number\` | Any number (integer or decimal) | \`let age = 14;\` |
| \`string\` | Text in quotes or backticks | \`let name = "Tariro";\` |
| \`boolean\` | \`true\` or \`false\` | \`let loggedIn = true;\` |
| \`null\` | Intentionally no value | \`let result = null;\` |
| \`undefined\` | Variable declared but not assigned | \`let x;\` |
| \`Array\` | Ordered list of values | \`let scores = [10, 20, 30];\` |
| \`Object\` | Key-value pairs (like a record) | \`let student = { name: "Tariro" };\` |

Arrays are indexed from **0** — so \`scores[0]\` is the first item.`),
        code("javascript", VARIABLES_CODE, { filename: "variables.js", openInStudio: true }),
        callout("tip", "Use descriptive variable names: playerScore is much clearer than ps or x. Your future self (reading the code six months later) will thank you!"),
      ),
    },
    {
      title: "Control Flow",
      slug: "javascript-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and repeating things

### if / else if / else

JavaScript conditions use curly braces \`{}\` to group the code that runs when a condition is true:

\`\`\`javascript
if (temperature > 30) {
  console.log("Hot day!");
} else {
  console.log("Cool enough.");
}
\`\`\`

### Three kinds of loops

**\`for\` loop** — when you know how many times to repeat:
\`\`\`javascript
for (let i = 0; i < 5; i++) {
  console.log(i); // prints 0, 1, 2, 3, 4
}
\`\`\`

**\`for...of\` loop** — cleaner way to loop over an array:
\`\`\`javascript
for (let item of myArray) {
  console.log(item);
}
\`\`\`

**\`while\` loop** — repeat while a condition is true:
\`\`\`javascript
while (score < 100) {
  score += 10;
}
\`\`\`

### Flowchart of the grade checker`),
        mermaid(
          `flowchart TD
  A([Start]) --> B[score = 73]
  B --> C{score >= 80?}
  C -- Yes --> D[Grade A]
  C -- No --> E{score >= 60?}
  E -- Yes --> F[Grade B]
  E -- No --> G{score >= 50?}
  G -- Yes --> H[Grade C]
  G -- No --> I[Grade F]
  D & F & H & I --> J[console.log grade]
  J --> K([Done])`,
          "Decision tree for the grade checker",
        ),
        code("javascript", CONTROL_FLOW_CODE, { filename: "control_flow.js", openInStudio: true }),
        callout("warning", "Don't confuse = (assignment) with == or === (comparison). Use === (triple equals) in JavaScript conditions — it checks both value AND type. For example: 0 == false is true, but 0 === false is false."),
      ),
    },
    {
      title: "Put It Together",
      slug: "javascript-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a city weather report

Let's combine functions, arrays of objects, loops, and conditionals to build a weather report for African cities.

### New concepts introduced

**Functions** — reusable blocks of code you define once and call many times:
\`\`\`javascript
function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}
let f = celsiusToFahrenheit(22); // call the function
\`\`\`

**Array of objects** — each city is stored as an object (with a \`name\` and a \`celsius\` property), and all cities are collected in an array. The \`for...of\` loop visits each city one by one.

**\`toFixed(1)\`** — formats a number to 1 decimal place, so \`71.6000000001\` becomes \`"71.6"\`.

Study the program below, then try adding a new city or changing the temperature thresholds.`),
        code("javascript", PUT_TOGETHER_CODE, { filename: "weather_report.js", openInStudio: true }),
        callout("tip", "Breaking a program into small functions (like celsiusToFahrenheit and getWeatherAdvice) makes it much easier to test and fix. If the temperatures are wrong, you only need to look inside celsiusToFahrenheit — you don't have to read the whole program."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 5 — What is a Framework?
    // -------------------------------------------------------------------------
    {
      title: "What is a Framework?",
      slug: "javascript-frameworks-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## From raw JavaScript to frameworks

You can build anything with plain JavaScript — but as an application grows, writing every single detail yourself becomes slow and error-prone. A **framework** solves that problem by giving you a structured, reusable foundation so you can focus on what makes your app unique instead of reinventing the wheel.

### Library vs. framework

People often use the two words interchangeably, but they mean slightly different things:

| Concept | Who is in charge? | Example |
|---------|-------------------|---------|
| **Library** | *You* call the library's code when you need it | React, Lodash, Axios |
| **Framework** | The framework calls *your* code at the right moment | Next.js, NestJS, Express |

The classic way to remember this is the **Hollywood principle**: "Don't call us, we'll call you." A framework provides the skeleton; you fill in the gaps.

### Three categories of JavaScript frameworks

Understanding which problem a framework is solving helps you pick the right one for a project.`),
        mermaid(
          `graph TD
  A([JavaScript Ecosystem]) --> B[Frontend / UI Frameworks]
  A --> C[Backend / Server Frameworks]
  A --> D[Meta-Frameworks]

  B --> B1[React]
  B --> B2[Vue]
  B --> B3[Svelte]

  C --> C1[Express]
  C --> C2[Fastify]
  C --> C3[NestJS]

  D --> D1[Next.js<br/>React + server]
  D --> D2[Nuxt<br/>Vue + server]
  D --> D3[SvelteKit<br/>Svelte + server]`,
          "The three major categories of JavaScript frameworks",
        ),
        md(`### Frontend / UI frameworks

These run **in the browser** and help you build interactive user interfaces without manually manipulating the DOM for every change. React, Vue, and Svelte are the most popular. They are technically *libraries* at their core but are called frameworks because they come with an opinionated way of organising your code.

**When to use:** any project where users interact with a rich, dynamic UI — dashboards, social feeds, form-heavy apps, games.

### Backend / server frameworks

These run on **Node.js** (the JavaScript runtime outside the browser) and help you build web servers, REST APIs, and services. Express is the minimal, flexible classic; NestJS adds structure and TypeScript on top.

**When to use:** when you need an API that a frontend, mobile app, or IoT device can talk to; when you need to read from a database or talk to third-party services.

### Meta-frameworks

A meta-framework combines a frontend framework with a server layer so you can write both in one project. Next.js (built on React) and Nuxt (built on Vue) are the industry standard choices. They add server-side rendering, file-based routing, and API routes.

**When to use:** public-facing websites that need fast load times and good SEO, or full-stack apps where you don't want to maintain a separate API repo.

### How to choose a framework

Ask yourself these questions in order:

1. **Where does the logic live?** User interaction only → frontend. Data, auth, integrations → backend. Both in one project → meta-framework.
2. **What does your team already know?** Learning curve matters. Vue is often praised as the most beginner-friendly; React has the largest community and job market; NestJS is ideal if you already know TypeScript.
3. **What does the ecosystem need?** Some frameworks have better libraries for specific domains (e.g., NestJS has excellent built-in support for WebSockets and microservices).

In the next three lessons you will get hands-on with Express (backend), React (frontend), and Vue (frontend).`),
        callout("info", "You do NOT need a framework to write JavaScript. Many small scripts, browser automations, and simple websites are better off with plain JS. Reach for a framework when the complexity of your project justifies the extra abstraction — not before."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 6 — Express (backend)
    // -------------------------------------------------------------------------
    {
      title: "Express (backend)",
      slug: "javascript-fw-express",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Express — minimal Node.js web framework

**Express** is the most widely-used Node.js framework in the world. It sits as a thin layer on top of Node's built-in \`http\` module and gives you a clean API for defining routes, handling requests, and sending responses — without imposing a rigid project structure.

### Use cases

Express is the right choice when you need:

- A **REST API** that a frontend app or mobile client consumes.
- A lightweight **web server** that serves HTML pages or static files.
- A **proxy** or **middleware layer** sitting between a client and other services.
- A quick **prototype** of any HTTP-based backend before committing to a heavier framework.

Because Express is unopinionated, large teams often add structure on top of it themselves, or migrate to NestJS as the project grows.

### Setup

Install Node.js first, then initialise a project and install Express:

\`\`\`bash
mkdir my-api && cd my-api
npm init -y
npm install express
\`\`\`

Create a file called \`server.js\` and paste the code below.

### A working REST API server`),
        code("javascript", "// server.js — A simple Express REST API\n// Run with: node server.js\nconst express = require(\"express\");\n\nconst app = express();\nconst PORT = 3000;\n\n// Middleware: parse incoming JSON request bodies\napp.use(express.json());\n\n// In-memory \"database\" — just an array for now\nconst students = [\n  { id: 1, name: \"Tariro\",  grade: \"9B\", score: 88 },\n  { id: 2, name: \"Chidi\",   grade: \"10A\", score: 74 },\n  { id: 3, name: \"Amara\",  grade: \"9B\", score: 91 },\n];\n\n// GET /students — return all students\napp.get(\"/students\", (req, res) => {\n  res.json(students);\n});\n\n// GET /students/:id — return one student by id\napp.get(\"/students/:id\", (req, res) => {\n  const id = parseInt(req.params.id, 10);\n  const student = students.find((s) => s.id === id);\n\n  if (!student) {\n    // 404 Not Found\n    return res.status(404).json({ error: \"Student not found\" });\n  }\n\n  res.json(student);\n});\n\n// POST /students — add a new student\napp.post(\"/students\", (req, res) => {\n  const { name, grade, score } = req.body;\n\n  if (!name || !grade || score === undefined) {\n    return res.status(400).json({ error: \"name, grade and score are required\" });\n  }\n\n  const newStudent = {\n    id: students.length + 1,\n    name,\n    grade,\n    score,\n  };\n\n  students.push(newStudent);\n  // 201 Created\n  res.status(201).json(newStudent);\n});\n\n// Start the server\napp.listen(PORT, () => {\n  console.log(`Server running at http://localhost:${PORT}`);\n  console.log(\"Try: GET /students   or   GET /students/1\");\n});", { filename: "server.js", openInStudio: true }),
        md(`### How it works

- \`app.get(path, handler)\` registers a route that responds to HTTP GET requests.
- \`req.params.id\` reads the dynamic \`:id\` segment from the URL.
- \`res.json(data)\` serialises JavaScript to JSON and sets the correct \`Content-Type\` header automatically.
- \`res.status(404).json(...)\` sends an HTTP error response with a custom body.
- \`app.listen(PORT, callback)\` starts the server and begins accepting connections.

You can test the routes with a browser (for GET) or a tool like **curl** or **Postman**:

\`\`\`bash
curl http://localhost:3000/students
curl http://localhost:3000/students/2
curl -X POST http://localhost:3000/students \\
     -H "Content-Type: application/json" \\
     -d '{"name":"Kofi","grade":"8C","score":66}'
\`\`\``),
        callout("tip", "Express middleware is just a function with the signature (req, res, next) => { ... }. Calling next() passes control to the next middleware or route handler. This composable design is why Express remains relevant even after 15 years — you can slot in authentication, logging, rate limiting, and more as independent middleware layers."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 7 — React (frontend)
    // -------------------------------------------------------------------------
    {
      title: "React (frontend)",
      slug: "javascript-fw-react",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## React — component-based UI library

**React** was created by Facebook (Meta) in 2013 and is now the most popular frontend framework in the world. At its core, React has one key idea: build your UI out of small, reusable **components**, and let React take care of updating the screen efficiently when your data changes.

### Use cases

React is the right choice when you need:

- A **Single Page Application (SPA)** — a web app that loads once and then updates the content without full page reloads (Gmail, Twitter/X, Notion).
- An **interactive dashboard** with data that changes in real time.
- A **design system** of shared UI components used across many pages or products.
- The foundation for a full-stack project with **Next.js** (which is built on top of React).

React is technically a *library* (it handles only the view layer), but in practice it is always paired with a router and a state manager, making the ecosystem feel like a full framework.

### Setup

Vite is the recommended way to scaffold a new React project:

\`\`\`bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
\`\`\`

Open \`http://localhost:5173\` to see your app running.

### Components and state

A React component is a JavaScript function that returns **JSX** — an HTML-like syntax that React compiles down to regular DOM calls. The \`useState\` hook lets a component remember a value between renders.`),
        code("javascript", "// Counter.jsx — a simple React component with state\nimport { useState } from \"react\";\n\n// A small reusable badge that shows a coloured label\nfunction ScoreBadge({ score }) {\n  const colour = score >= 80 ? \"#22c55e\" : score >= 60 ? \"#f59e0b\" : \"#ef4444\";\n  return (\n    <span style={{ background: colour, color: \"#fff\", padding: \"2px 10px\", borderRadius: 12 }}>\n      {score} pts\n    </span>\n  );\n}\n\n// The main Counter component\nexport default function Counter() {\n  // useState returns [currentValue, setterFunction]\n  const [count, setCount] = useState(0);\n  const [history, setHistory] = useState([]);\n\n  function increment() {\n    const next = count + 10;\n    setCount(next);\n    // Keep a log of every score\n    setHistory((prev) => [...prev, next]);\n  }\n\n  function reset() {\n    setCount(0);\n    setHistory([]);\n  }\n\n  return (\n    <div style={{ fontFamily: \"sans-serif\", padding: 24 }}>\n      <h2>Score Tracker</h2>\n\n      {/* Render our reusable badge component */}\n      <ScoreBadge score={count} />\n\n      <div style={{ marginTop: 16 }}>\n        <button onClick={increment}>+10 points</button>\n        <button onClick={reset} style={{ marginLeft: 8 }}>Reset</button>\n      </div>\n\n      {history.length > 0 && (\n        <div style={{ marginTop: 16 }}>\n          <strong>History:</strong>\n          <ul>\n            {history.map((s, i) => (\n              <li key={i}>{s} pts</li>\n            ))}\n          </ul>\n        </div>\n      )}\n    </div>\n  );\n}", { filename: "Counter.jsx", openInStudio: true }),
        md(`### What is the Virtual DOM?

Every time you call a setter like \`setCount(next)\`, React does **not** immediately touch the real browser DOM. Instead it builds a lightweight copy called the **Virtual DOM**, compares it with the previous snapshot (a process called *reconciliation*), and then makes only the minimum number of real DOM changes needed. This is why React UIs feel fast even with hundreds of components updating at once.

### Key concepts to remember

| Concept | What it is |
|---------|------------|
| **Component** | A function that accepts props and returns JSX |
| **Props** | Read-only inputs passed from a parent component |
| **State** | Private mutable data owned by a component, declared with \`useState\` |
| **JSX** | HTML-like syntax inside JavaScript, compiled by Vite/Babel |
| **Re-render** | React re-runs the component function whenever its state or props change |`),
        callout("info", "Components in React are just functions — they follow the same JavaScript rules you already know. The only requirement is that the function name starts with a capital letter (so React can distinguish components from plain HTML tags) and it returns JSX or null."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 8 — Vue (frontend)
    // -------------------------------------------------------------------------
    {
      title: "Vue (frontend)",
      slug: "javascript-fw-vue",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Vue — the approachable progressive framework

**Vue** was created by Evan You in 2014 after he worked at Google on Angular. His goal was to take the best parts of Angular and make them much more approachable. Vue calls itself *progressive* because you can adopt it a little at a time — sprinkle a single Vue component into an existing HTML page, or build an entire SPA entirely in Vue.

### Use cases

Vue is an excellent choice when:

- You want a **gentle learning curve** — Vue's template syntax is very close to standard HTML, making it the framework many beginners find easiest to pick up.
- You are building a **medium-sized SPA** where React's ecosystem overhead would be overkill.
- You need **two-way data binding** with minimal boilerplate — Vue's \`v-model\` directive syncs a form input to a variable in one line.
- Your team is already using **Nuxt** (the Vue meta-framework equivalent of Next.js).

Vue is widely used across Asia and in companies that prioritise readability and a consistent official ecosystem (Vue Router, Pinia for state management).

### Setup

The official scaffolding tool creates a project with your preferred options:

\`\`\`bash
npm create vue@latest my-vue-app
cd my-vue-app
npm install
npm run dev
\`\`\`

The wizard will ask about TypeScript, Vue Router, and Pinia — you can say No to all of them for a minimal start.

### Single File Components and reactivity

Vue uses **Single File Components** (SFCs) — files with a \`.vue\` extension that keep the template, script, and styles together in one place. The Composition API (introduced in Vue 3) uses \`ref()\` and \`reactive()\` to declare reactive state — similar in spirit to React's \`useState\`.`),
        code("javascript", "<!-- TaskList.vue — a Vue 3 Single File Component (Composition API) -->\n<template>\n  <div class=\"task-app\">\n    <h2>Task List</h2>\n\n    <!-- v-model syncs the input value with newTask automatically -->\n    <input v-model=\"newTask\" placeholder=\"Add a task...\" @keyup.enter=\"addTask\" />\n    <button @click=\"addTask\">Add</button>\n\n    <p v-if=\"tasks.length === 0\">No tasks yet. Add one above!</p>\n\n    <!-- v-for renders one <li> per item in the tasks array -->\n    <ul v-else>\n      <li\n        v-for=\"task in tasks\"\n        :key=\"task.id\"\n        :style=\"{ textDecoration: task.done ? 'line-through' : 'none' }\"\n      >\n        <!-- v-model on a checkbox binds to task.done -->\n        <input type=\"checkbox\" v-model=\"task.done\" />\n        {{ task.text }}\n        <button @click=\"removeTask(task.id)\">x</button>\n      </li>\n    </ul>\n\n    <p><strong>Remaining:</strong> {{ remaining }} of {{ tasks.length }}</p>\n  </div>\n</template>\n\n<script setup>\nimport { ref, computed } from \"vue\";\n\n// ref() wraps a primitive value so Vue can track changes\nconst newTask = ref(\"\");\n// reactive state for the task list — each task has id, text, done\nconst tasks = ref([\n  { id: 1, text: \"Learn Vue basics\", done: false },\n  { id: 2, text: \"Build a component\", done: false },\n]);\n\n// computed() derives a value from reactive state and caches it\nconst remaining = computed(() => tasks.value.filter((t) => !t.done).length);\n\nfunction addTask() {\n  const text = newTask.value.trim();\n  if (!text) return;\n  tasks.value.push({ id: Date.now(), text, done: false });\n  newTask.value = \"\"; // clear the input\n}\n\nfunction removeTask(id) {\n  tasks.value = tasks.value.filter((t) => t.id !== id);\n}\n</script>\n\n<style scoped>\n.task-app { font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; }\ninput[type=\"text\"], input:not([type]) { padding: 6px 10px; margin-right: 8px; border: 1px solid #ccc; border-radius: 4px; }\nbutton { padding: 6px 12px; cursor: pointer; }\nul { padding-left: 20px; }\nli { margin: 6px 0; }\n</style>", { filename: "TaskList.vue", openInStudio: true }),
        md(`### Vue vs React — a quick comparison

Both frameworks solve the same core problem (reactive UIs with components), but they take different approaches:

| Feature | React | Vue |
|---------|-------|-----|
| Template syntax | JSX (JavaScript + HTML mixed) | HTML-like templates (\`v-if\`, \`v-for\`) |
| Reactivity | \`useState\` / \`useReducer\` hooks | \`ref()\` / \`reactive()\` |
| Two-way binding | Manual (\`value\` + \`onChange\`) | \`v-model\` directive |
| Component file | Separate \`.jsx\` file | Single \`.vue\` file (template + script + style) |
| Learning curve | Moderate | Gentle |
| Ecosystem size | Very large (most libraries) | Large (strong official ecosystem) |
| Meta-framework | Next.js | Nuxt |

There is no objectively "better" framework — React dominates the job market and has a vast ecosystem; Vue offers a smoother on-ramp and a very coherent official toolkit. Many developers learn one and pick up the other quickly, because the core ideas are the same.`),
        callout("tip", "Vue's <script setup> syntax (shown above) is the modern, recommended way to write Vue 3 components. It removes a lot of boilerplate: everything you declare at the top level is automatically available in the template, and you never need to write return {}. If you see older tutorials using the Options API (with data(), methods:, computed:), those still work but are the older style."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Powers of two",
      slug: "challenge-javascript",
      description: "Print 2 raised to the power of 16.",
      track: "coding", difficulty: "beginner", points: 50, language: "javascript",
      starterCode: "// Print 2 to the power of 16\nlet result = 1;\nconsole.log(result);\n",
      checks: { rules: [{ type: "stdout_contains", value: "65536" }] },
    },
  ],
};
