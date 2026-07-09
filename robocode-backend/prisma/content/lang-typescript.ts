import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, TypeScript
// ---------------------------------------------------------------------------

const HELLO_WORLD = `// TypeScript: JavaScript with types added
const msg: string = "Hello, RoboCode!";
console.log(msg);

// Type annotations tell TypeScript what kind of value a variable holds
const year: number = 2025;
const isOnline: boolean = true;

console.log(\`Year: \${year}, Online: \${isOnline}\`);

// Try changing msg to a number — TypeScript will show an error before you even run it!
// const msg: string = 42;  // ← Type 'number' is not assignable to type 'string'`;

const SVG_TS_VS_JS = `<svg viewBox="0 0 600 200" role="img" aria-label="TypeScript is a superset of JavaScript — all valid JS is valid TS, but TS adds optional types" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer TS circle -->
  <circle cx="300" cy="100" r="90" fill="#1e3a5f" stroke="#3b82f6" stroke-width="3"/>
  <text x="210" y="44" font-family="sans-serif" font-size="14" fill="#93c5fd" font-weight="bold">TypeScript</text>
  <text x="215" y="62" font-family="monospace" font-size="10" fill="#60a5fa">type annotations</text>
  <text x="210" y="78" font-family="monospace" font-size="10" fill="#60a5fa">interfaces &amp; generics</text>
  <text x="218" y="174" font-family="monospace" font-size="10" fill="#60a5fa">compile-time checks</text>
  <text x="224" y="188" font-family="monospace" font-size="10" fill="#60a5fa">catches bugs early</text>
  <!-- Inner JS circle -->
  <circle cx="300" cy="105" r="54" fill="#422006" stroke="#fbbf24" stroke-width="3"/>
  <text x="270" y="96" font-family="sans-serif" font-size="14" fill="#fde68a" font-weight="bold">JavaScript</text>
  <text x="264" y="114" font-family="monospace" font-size="10" fill="#fef3c7">variables, functions</text>
  <text x="264" y="130" font-family="monospace" font-size="10" fill="#fef3c7">loops, objects</text>
  <!-- Arrow showing TS compiles to JS -->
  <rect x="420" y="60" width="150" height="60" rx="8" fill="#0f172a" stroke="#475569" stroke-width="2"/>
  <text x="434" y="83" font-family="sans-serif" font-size="11" fill="#94a3b8">TypeScript compiles</text>
  <text x="442" y="99" font-family="sans-serif" font-size="11" fill="#94a3b8">↓</text>
  <text x="434" y="115" font-family="sans-serif" font-size="11" fill="#fbbf24">plain JavaScript</text>
  <line x1="390" y1="90" x2="420" y2="90" stroke="#6b7280" stroke-width="2"/>
  <polygon points="420,85 430,90 420,95" fill="#6b7280"/>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & types
// ---------------------------------------------------------------------------

const VARIABLES_CODE = `// TypeScript types — explicit annotations + type inference

// Explicit type annotations
let playerName: string = "Tariro";
let score: number = 0;
let isActive: boolean = true;

// Type inference — TypeScript figures out the type automatically
let city = "Harare";     // TypeScript infers: string
let level = 7;           // TypeScript infers: number

// Arrays — use Type[] to annotate an array
let subjects: string[] = ["Maths", "Science", "English"];
let marks: number[] = [87, 73, 91];

// Interfaces — define the shape of an object
interface Student {
  name: string;
  age: number;
  grade: string;
  points?: number;   // ? makes this field optional
}

const student: Student = {
  name: "Tariro",
  age: 14,
  grade: "9B",
  // points is optional so we can leave it out
};

console.log(\`\${student.name} is in grade \${student.grade}\`);
console.log("Subjects:", subjects.join(", "));
console.log("Average mark:", marks.reduce((a, b) => a + b, 0) / marks.length);`;

// ---------------------------------------------------------------------------
// Lesson 3 — Control flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `// Control flow with typed parameters

// A typed function — parameter and return types are annotated
function getGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "F";
}

// A union type — either "pass" or "fail", nothing else
type Outcome = "pass" | "fail";

function getOutcome(score: number): Outcome {
  return score >= 50 ? "pass" : "fail";
}

// Loop over typed data
const examScores: number[] = [88, 45, 73, 61, 54, 29, 95];

console.log("=== Exam Results ===");
for (let i = 0; i < examScores.length; i++) {
  const s = examScores[i];
  const grade = getGrade(s);
  const outcome = getOutcome(s);
  console.log(\`Student \${i + 1}: \${s} → Grade \${grade} (\${outcome})\`);
}

// Count passes and fails
const passes = examScores.filter(s => s >= 50).length;
console.log(\`\\nPassed: \${passes}/\${examScores.length}\`);`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `// Student report card — interfaces, functions, loops, and conditions

interface Subject {
  name: string;
  mark: number;
  outOf: number;
}

interface ReportCard {
  studentName: string;
  grade: string;
  subjects: Subject[];
}

function percentage(mark: number, outOf: number): number {
  return Math.round((mark / outOf) * 100);
}

function letterGrade(pct: number): string {
  if (pct >= 80) return "A";
  if (pct >= 65) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

function printReport(card: ReportCard): void {
  console.log(\`\\n📋 Report Card — \${card.studentName} (Grade \${card.grade})\`);
  console.log("=".repeat(50));

  let totalPct = 0;

  for (const subject of card.subjects) {
    const pct = percentage(subject.mark, subject.outOf);
    const letter = letterGrade(pct);
    totalPct += pct;
    console.log(
      \`  \${subject.name.padEnd(12)} \${subject.mark}/\${subject.outOf}  \${pct}%  [\${letter}]\`
    );
  }

  const average = Math.round(totalPct / card.subjects.length);
  console.log("=".repeat(50));
  console.log(\`  Average: \${average}% [\${letterGrade(average)}]\`);
}

// Data
const report: ReportCard = {
  studentName: "Tariro Moyo",
  grade: "9B",
  subjects: [
    { name: "Mathematics", mark: 74, outOf: 100 },
    { name: "Science",     mark: 88, outOf: 100 },
    { name: "English",     mark: 61, outOf: 100 },
    { name: "History",     mark: 55, outOf: 80  },
    { name: "Art",         mark: 38, outOf: 50  },
  ],
};

printReport(report);`;

// ---------------------------------------------------------------------------
// Lesson 5 — What is a Framework?
// ---------------------------------------------------------------------------

const MERMAID_FW_LANDSCAPE = `flowchart LR
  subgraph FE["Frontend Frameworks"]
    A1["Angular\n(TS-first SPA)"]
    A2["React + Next.js\n(meta-framework)"]
    A3["Vue + Nuxt\n(progressive)"]
  end
  subgraph BE["Backend Frameworks"]
    B1["NestJS\n(opinionated, TS)"]
    B2["Express\n(minimal, JS/TS)"]
    B3["Fastify\n(high-perf, TS)"]
  end
  subgraph FS["Full-Stack / Meta"]
    C1["Next.js\n(React + API routes)"]
    C2["Remix\n(loaders + actions)"]
    C3["SvelteKit\n(Svelte + SSR)"]
  end
  Browser["Browser"] --> FE
  FE -- "HTTP / fetch" --> BE
  FS --> Browser`;

// ---------------------------------------------------------------------------
// Lesson 6 — NestJS (backend)
// ---------------------------------------------------------------------------

const NESTJS_CONTROLLER_CODE = `// src/students/students.controller.ts
import { Controller, Get, Post, Body, Param, ParseIntPipe } from "@nestjs/common";
import { StudentsService } from "./students.service";

// DTO — describes the shape of a request body
export class CreateStudentDto {
  name: string;
  grade: string;
  schoolId: number;
}

// @Controller declares this class as an HTTP controller
// All routes here are prefixed with /students
@Controller("students")
export class StudentsController {
  // NestJS injects StudentsService automatically (Dependency Injection)
  constructor(private readonly studentsService: StudentsService) {}

  // GET /students  → list all students
  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  // GET /students/:id  → find one student by numeric ID
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  // POST /students  → create a new student
  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }
}

// -----------------------------------------------------------------------
// src/students/students.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";

interface Student {
  id: number;
  name: string;
  grade: string;
  schoolId: number;
}

// @Injectable marks this class as a provider that can be injected elsewhere
@Injectable()
export class StudentsService {
  // In a real app this would use Prisma / TypeORM / etc.
  private readonly store: Student[] = [
    { id: 1, name: "Tariro Moyo", grade: "9B", schoolId: 1 },
    { id: 2, name: "Kudakwashe Dube", grade: "10A", schoolId: 1 },
  ];

  findAll(): Student[] {
    return this.store;
  }

  findOne(id: number): Student {
    const student = this.store.find((s) => s.id === id);
    if (!student) throw new NotFoundException(\`Student \${id} not found\`);
    return student;
  }

  create(dto: CreateStudentDto): Student {
    const newStudent: Student = { id: this.store.length + 1, ...dto };
    this.store.push(newStudent);
    return newStudent;
  }
}`;

// ---------------------------------------------------------------------------
// Lesson 7 — Next.js (full-stack React)
// ---------------------------------------------------------------------------

const NEXTJS_SERVER_COMPONENT_CODE = `// app/students/page.tsx  — a React Server Component (runs on the server)
// No "use client" directive → this component never ships to the browser.
// Data fetching happens on the server before any HTML is sent.

interface Student {
  id: number;
  name: string;
  grade: string;
}

// async Server Components can await data directly — no useEffect needed
async function getStudents(): Promise<Student[]> {
  // In production, replace with your real API URL or a direct DB call
  const res = await fetch("https://api.example.com/students", {
    // Next.js extends fetch with a cache option
    next: { revalidate: 60 }, // re-fetch at most once per minute (ISR)
  });
  if (!res.ok) throw new Error("Failed to load students");
  return res.json();
}

export default async function StudentsPage() {
  const students = await getStudents(); // awaited on the server

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Student Directory</h1>
      <ul className="space-y-2">
        {students.map((student) => (
          <li key={student.id} className="border rounded p-3">
            <span className="font-medium">{student.name}</span>
            <span className="ml-2 text-gray-500">Grade {student.grade}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

// -----------------------------------------------------------------------
// app/api/students/route.ts  — a Next.js API Route Handler
// This runs on the server and responds to HTTP requests.
import { NextResponse } from "next/server";

const students: Student[] = [
  { id: 1, name: "Tariro Moyo", grade: "9B" },
  { id: 2, name: "Kudakwashe Dube", grade: "10A" },
];

// Named export per HTTP method — GET, POST, PUT, DELETE ...
export async function GET() {
  return NextResponse.json(students);
}

export async function POST(request: Request) {
  const body: Omit<Student, "id"> = await request.json();
  const newStudent: Student = { id: students.length + 1, ...body };
  students.push(newStudent);
  return NextResponse.json(newStudent, { status: 201 });
}`;

// ---------------------------------------------------------------------------
// Lesson 8 — Angular (frontend)
// ---------------------------------------------------------------------------

const ANGULAR_COMPONENT_CODE = `// src/app/students/student-list.component.ts
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Observable } from "rxjs";

interface Student {
  id: number;
  name: string;
  grade: string;
}

// @Component is a decorator that turns a class into an Angular component
@Component({
  // The custom HTML tag used in templates: <app-student-list />
  selector: "app-student-list",
  // Standalone components import their own dependencies (Angular 17+)
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  // Inline template using Angular template syntax
  template: \`
    <div class="container">
      <h1>Student Directory</h1>

      <p *ngIf="loading">Loading…</p>

      <ul *ngIf="!loading">
        <!-- *ngFor is Angular's structural directive for loops -->
        <li *ngFor="let student of students">
          <strong>{{ student.name }}</strong>
          <span> — Grade {{ student.grade }}</span>
        </li>
      </ul>

      <p *ngIf="error" class="error">{{ error }}</p>
    </div>
  \`,
  styles: [\`
    .container { padding: 2rem; font-family: sans-serif; }
    li { margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
    .error { color: red; }
  \`],
})
export class StudentListComponent implements OnInit {
  // Class properties are strongly typed — Angular + TypeScript working together
  students: Student[] = [];
  loading = true;
  error: string | null = null;

  // Angular injects HttpClient via the constructor (Dependency Injection)
  constructor(private http: HttpClient) {}

  // ngOnInit runs once after the component is created
  ngOnInit(): void {
    this.fetchStudents();
  }

  private fetchStudents(): void {
    // http.get<T> returns an Observable — Angular's async data stream
    const students$: Observable<Student[]> = this.http.get<Student[]>(
      "https://api.example.com/students"
    );

    students$.subscribe({
      next: (data) => {
        this.students = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = "Could not load students. Please try again.";
        this.loading = false;
        console.error(err);
      },
    });
  }
}

// -----------------------------------------------------------------------
// src/app/app.component.ts  — root component that hosts the app
import { Component } from "@angular/core";
import { StudentListComponent } from "./students/student-list.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [StudentListComponent],
  template: \`<app-student-list />\`,
})
export class AppComponent {}`;

export const langTypescript: CourseModule = {
  meta: {
    title: "TypeScript Basics",
    slug: "lang-typescript",
    track: "coding",
    level: "high",
    description: "Level up from JavaScript to TypeScript — learn how types catch bugs before your code even runs.",
    coverImage: "/covers/coding.svg",
    order: 12,
  },
  lessons: [
    {
      title: "Hello, TypeScript",
      slug: "hello-typescript",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is TypeScript?

**TypeScript** is JavaScript with *type annotations* added. It was created by Microsoft in 2012 and is now used by some of the biggest companies in the world — including Google, Airbnb, and Slack — because it catches bugs before code runs.

### The key idea: types catch mistakes early

Imagine you write:
\`\`\`typescript
let age: number = "fourteen"; // ← TypeScript shows an error instantly
\`\`\`

TypeScript tells you about this mistake the moment you type it — before you save, before you run, before any user sees a bug. This is called **compile-time type checking**.

### TypeScript is a superset of JavaScript

All valid JavaScript is also valid TypeScript. You can think of TypeScript as JavaScript with a helpful safety net added on top. TypeScript code is compiled (converted) into plain JavaScript before it runs in a browser or server.`),
        svg(SVG_TS_VS_JS, "TypeScript is a superset of JavaScript — it adds types and compiles back down to JS"),
        md(`### Your first TypeScript program

Notice the \`: string\`, \`: number\`, and \`: boolean\` annotations — these are the types. They are optional in many cases (TypeScript can infer them), but writing them out makes your code clearer and helps your editor catch mistakes.`),
        code("typescript", HELLO_WORLD, { filename: "hello.ts", openInStudio: true }),
        callout("tip", "TypeScript only exists during development. When your program runs, it has already been compiled to plain JavaScript. The types are completely removed — they are just a safety tool for the programmer, not for the computer."),
      ),
    },
    {
      title: "Variables & Types",
      slug: "typescript-variables",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## TypeScript's type system

TypeScript's types fall into two groups: **primitive types** and **structured types**.

### Primitive types

| Type | Description | Example |
|------|-------------|---------|
| \`string\` | Text | \`let name: string = "Tariro";\` |
| \`number\` | Any number (int or decimal) | \`let age: number = 14;\` |
| \`boolean\` | True or false | \`let active: boolean = true;\` |
| \`null\` | Intentionally absent | \`let result: null = null;\` |
| \`undefined\` | Not yet assigned | \`let x: undefined;\` |

### Arrays

Annotate an array with the element type followed by \`[]\`:
\`\`\`typescript
let scores: number[] = [88, 73, 91];
let names: string[] = ["Alice", "Bob"];
\`\`\`

### Interfaces — describing the shape of objects

An **interface** is like a blueprint for an object. It lists what properties the object must have and their types:
\`\`\`typescript
interface Student {
  name: string;
  age: number;
  grade: string;
  points?: number;  // ? means this property is optional
}
\`\`\`

Once you have an interface, TypeScript checks every object you create against it. If you forget a required property, TypeScript tells you immediately.`),
        code("typescript", VARIABLES_CODE, { filename: "variables.ts", openInStudio: true }),
        callout("info", "Type inference means TypeScript can often figure out the type without you writing it. let city = \"Harare\" is automatically inferred as string. You only need to write the annotation when TypeScript can't figure it out, or when you want to be extra clear."),
      ),
    },
    {
      title: "Control Flow",
      slug: "typescript-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Typed functions and control flow

Control flow in TypeScript works the same as in JavaScript — \`if/else\`, \`for\`, \`while\`. The difference is that functions now have **typed parameters and return types**.

### Typed function syntax

\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

- \`a: number\` and \`b: number\` — the parameters must be numbers.
- \`: number\` after the parentheses — the function must return a number.

If you accidentally return a string, TypeScript flags it as an error.

### Union types

A **union type** lets a value be one of several specific options:
\`\`\`typescript
type Outcome = "pass" | "fail";
\`\`\`

Now \`Outcome\` can only ever be the string \`"pass"\` or \`"fail"\` — nothing else. This is much safer than just using \`string\`.

### Flowchart of the grade function`),
        mermaid(
          `flowchart TD
  A([getGrade called with score]) --> B{score >= 80?}
  B -- Yes --> C[return 'A']
  B -- No --> D{score >= 60?}
  D -- Yes --> E[return 'B']
  D -- No --> F{score >= 50?}
  F -- Yes --> G[return 'C']
  F -- No --> H[return 'F']`,
          "Decision tree inside the getGrade function",
        ),
        code("typescript", CONTROL_FLOW_CODE, { filename: "control_flow.ts", openInStudio: true }),
        callout("tip", "The Array .filter() method returns a new array containing only the elements where the callback returns true. scores.filter(s => s >= 50) gives you only the passing scores. This functional style is very common in TypeScript."),
      ),
    },
    {
      title: "Put It Together",
      slug: "typescript-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a typed report card

Now let's put interfaces, typed functions, loops, and conditionals together into a complete student report card program.

### What makes this TypeScript-specific

1. **Interfaces** (\`Subject\`, \`ReportCard\`) — define the exact shape of our data. If we forget the \`mark\` field on a subject, TypeScript gives an error before we run anything.
2. **Typed function parameters** — \`percentage(mark: number, outOf: number): number\` guarantees both inputs are numbers and the output is a number.
3. **\`void\` return type** — \`printReport(card: ReportCard): void\` means the function does not return a value.
4. **String methods** — \`.padEnd(12)\` pads a string with spaces to align columns neatly in the output.

### Challenge

After running the code, try:
- Adding a new subject to the \`subjects\` array.
- Changing the grade thresholds in \`letterGrade\`.
- Creating a second \`ReportCard\` for a different student and printing both.

TypeScript will catch any mismatch between your data and the interface the moment you type it!`),
        code("typescript", PUT_TOGETHER_CODE, { filename: "report_card.ts", openInStudio: true }),
        callout("info", "In large projects — with dozens of files and thousands of lines — TypeScript's type-checking becomes invaluable. It lets teams refactor code confidently because the compiler immediately flags every place that breaks when you change a function signature or interface."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 5 — What is a Framework?
    // -----------------------------------------------------------------------
    {
      title: "What is a Framework?",
      slug: "typescript-frameworks-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## What is a framework?

When you write a web application from scratch you quickly face the same problems every developer faces: how do I handle HTTP requests? How do I manage UI state? How do I route between pages? How do I talk to a database?

A **framework** is a collection of pre-built code that solves these common problems for you. Rather than reinventing the wheel, you follow the framework's conventions and focus on your actual business logic.

### Why use a framework?

| Without a framework | With a framework |
|---------------------|-----------------|
| Write your own router | Routing built-in |
| Manually wire up modules | Dependency injection provided |
| Roll your own middleware | Middleware pattern ready to use |
| No project structure conventions | Clear folder layout enforced |
| Every team does things differently | Shared conventions across projects |

### The three broad categories

**Frontend frameworks** run in the browser and manage what the user sees. They handle DOM updates, component lifecycles, and client-side navigation.

**Backend frameworks** run on a server. They handle incoming HTTP requests, talk to databases, validate input, and send responses.

**Meta-frameworks (full-stack)** combine both. They let you write server-side rendering, API routes, and client UI in one project, with the framework deciding what runs where.

### Why TypeScript-first frameworks matter

Plain JavaScript frameworks give you flexibility — but also room for mistakes. TypeScript-first frameworks like NestJS and Angular are designed from the ground up to use TypeScript. This means:

- Decorators and metadata (e.g. \`@Controller\`, \`@Component\`) are typed correctly.
- Your IDE shows autocomplete for every framework API.
- Runtime errors caused by passing the wrong type of argument drop dramatically.
- Refactoring a large codebase is safe because the compiler tells you every place that breaks.

### How to choose a framework

Ask yourself four questions:

1. **What am I building?** A simple REST API → NestJS or Fastify. A marketing site with SEO → Next.js. A large enterprise single-page app → Angular.
2. **Who is on my team?** Angular has a steeper learning curve but enforces consistency. React/Next.js has a larger talent pool.
3. **How opinionated should it be?** NestJS and Angular make many decisions for you (structure, DI, testing). Next.js and Express leave more choices to you.
4. **Does it need to scale?** All three covered here (NestJS, Next.js, Angular) are production-proven at very large scale.

### The TypeScript framework landscape`),
        mermaid(
          MERMAID_FW_LANDSCAPE,
          "TypeScript framework landscape — frontend, backend, and full-stack meta-frameworks",
        ),
        callout("tip", "You do not need to learn all frameworks at once. Pick the one that fits your next project and go deep. The core TypeScript skills you already have — interfaces, typed functions, generics — transfer directly to every framework here."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 6 — NestJS (backend)
    // -----------------------------------------------------------------------
    {
      title: "NestJS (backend)",
      slug: "typescript-fw-nestjs",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## NestJS — an opinionated TypeScript backend framework

**NestJS** is the most popular TypeScript-first backend framework. It was inspired by Angular and brings the same structured, decorator-based style to the server side. Under the hood it uses Express (or optionally Fastify) as the HTTP engine, but wraps it in a layer of conventions that scale to very large projects.

### Use cases

- **Scalable REST APIs** — the module system keeps large APIs maintainable as they grow.
- **Enterprise applications** — opinionated structure means every developer on a 20-person team writes code the same way.
- **Microservices** — NestJS has first-class support for message queues (Redis, RabbitMQ, Kafka) and gRPC.
- **Real-time apps** — WebSocket gateways are built in.
- **Backend-for-frontend (BFF)** — a NestJS API sits between a React/Angular frontend and multiple downstream services.

NestJS is a poor fit for tiny scripts or one-off serverless functions where its structure adds overhead without payoff.

### Core concepts

| Concept | Purpose |
|---------|---------|
| **Module** | Groups related controllers, services, and providers. Every app has at least one root module. |
| **Controller** | Handles incoming HTTP requests and returns responses. Decorated with \`@Controller\`. |
| **Service (Provider)** | Contains business logic. Decorated with \`@Injectable\` so NestJS can inject it. |
| **Dependency Injection (DI)** | NestJS creates class instances for you and passes them where needed. You never call \`new MyService()\` manually. |
| **Decorator** | A TypeScript function that annotates a class or method (e.g. \`@Get("/students")\`). |

### Quick setup

\`\`\`bash
npm install -g @nestjs/cli   # install the CLI globally
nest new school-api          # scaffold a new project
cd school-api
npm run start:dev            # start with live reload
\`\`\`

This generates the following structure:

\`\`\`
school-api/
├── src/
│   ├── app.module.ts        ← root module
│   ├── app.controller.ts    ← root controller
│   ├── app.service.ts       ← root service
│   └── main.ts              ← bootstrap (starts listening on port 3000)
├── test/
├── package.json
└── tsconfig.json
\`\`\`

### Controller + Service example

The code below shows a complete students feature with a controller that handles HTTP and a service that holds the logic. Notice how DI means the controller never creates \`StudentsService\` — NestJS does it.`),
        code("typescript", NESTJS_CONTROLLER_CODE, { filename: "students.controller.ts", openInStudio: true }),
        callout("info", "The single most important NestJS command to know: `nest generate resource students`. It scaffolds a controller, service, module, and DTOs for a full CRUD resource in seconds. Run it inside your project after setting up with `nest new`."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 7 — Next.js (full-stack React)
    // -----------------------------------------------------------------------
    {
      title: "Next.js (full-stack React)",
      slug: "typescript-fw-nextjs",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Next.js — the React meta-framework

**Next.js** is a meta-framework built on top of React. Where plain React only gives you components, Next.js adds a file-based router, server-side rendering, API routes, image optimisation, and a powerful caching system — all configured by convention, not by hand.

### Use cases

- **Production web applications** — the default choice for React apps that need to go to production fast.
- **SEO-critical sites** — server rendering means search engines see real HTML, not a blank page waiting for JavaScript.
- **Marketing sites and landing pages** — static generation (SSG) serves pre-built HTML at CDN speed.
- **Full-stack projects** — API Route Handlers live in the same repo as your UI, so a small team can ship a complete product.
- **Dashboards and admin tools** — React Server Components keep large data-heavy pages fast by fetching on the server.

Next.js is overkill for a purely static site with no dynamic data, where a simpler tool like Astro or plain HTML/CSS would be lighter.

### Core concepts (App Router, Next.js 13+)

| Concept | How it works |
|---------|-------------|
| **File-based routing** | A file at \`app/students/page.tsx\` automatically becomes the \`/students\` URL. |
| **Server Components** | Default. Run on the server, can \`await\` data, never ship to the browser. |
| **Client Components** | Add \`"use client"\` at the top. Run in the browser, can use \`useState\`/\`useEffect\`. |
| **Route Handlers** | Files named \`route.ts\` export \`GET\`, \`POST\` etc. — these are your API endpoints. |
| **ISR (Incremental Static Regeneration)** | Static pages that re-generate in the background at a set interval. |

### Quick setup

\`\`\`bash
npx create-next-app@latest school-web --typescript --tailwind --app
cd school-web
npm run dev   # starts on http://localhost:3000
\`\`\`

### Server Component + API Route example

The code below shows a Server Component that fetches students on the server (no loading spinner needed) and an API Route Handler that powers any client that calls \`/api/students\`.`),
        code("typescript", NEXTJS_SERVER_COMPONENT_CODE, { filename: "app/students/page.tsx", openInStudio: true }),
        callout("tip", "The biggest mental shift in Next.js is understanding where code runs. A file without 'use client' runs on the server — it can read from a database, access secrets, and is never sent to the browser. Add 'use client' only when you need interactivity (onClick, useState). Keeping most components as Server Components makes your app faster and more secure."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 8 — Angular (frontend)
    // -----------------------------------------------------------------------
    {
      title: "Angular (frontend)",
      slug: "typescript-fw-angular",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Angular — the TypeScript-first enterprise SPA framework

**Angular** is a complete, opinionated frontend framework maintained by Google. Unlike React (which is a library) or Vue (which is a progressive framework), Angular is a *full framework* — it ships with a router, HTTP client, form validation, testing utilities, and a dependency injection system, all in one package.

Angular was rebuilt in 2016 with TypeScript as its primary language. Today it is arguably the most TypeScript-native frontend framework available: decorators, interfaces, and strict null checks are not optional add-ons — they are the core of how Angular works.

### Use cases

- **Large enterprise frontends** — Angular's strict structure means a team of 50 engineers can all write code that looks the same.
- **Long-lived projects** — Angular's semantic versioning and migration tooling (\`ng update\`) makes upgrading major versions manageable.
- **Data-heavy admin dashboards** — Angular Material provides a full component library; two-way data binding keeps forms and tables in sync.
- **Government and financial systems** — sectors that require auditability and consistency prefer Angular's opinionated conventions.

Angular is heavier than React or Vue for small projects. If you are building a simple website or a small app with a two-person team, React + Next.js or Vue + Nuxt will feel lighter and faster to start.

### Core concepts

| Concept | Purpose |
|---------|---------|
| **Component** | The basic building block. A class decorated with \`@Component\` that has a template, styles, and logic. |
| **Decorator** | A TypeScript function (e.g. \`@Component\`, \`@Injectable\`) that attaches metadata to a class. |
| **Template syntax** | Angular's HTML superset: \`{{ expression }}\` for interpolation, \`*ngFor\` / \`*ngIf\` for structural directives. |
| **Dependency Injection** | Angular creates services and injects them via constructors — identical concept to NestJS. |
| **Observable (RxJS)** | Angular's async primitive. \`HttpClient\` returns Observables rather than Promises. |
| **Standalone components** | Angular 17+: components declare their own imports, no need for \`NgModule\`. |

### Compared to React and Vue

| | Angular | React + Next.js | Vue + Nuxt |
|---|---------|----------------|------------|
| **Language** | TypeScript-first | TypeScript optional | TypeScript optional |
| **Opinionation** | Very high | Low (React) / Medium (Next) | Medium |
| **Built-in HTTP** | Yes (\`HttpClient\`) | No (use \`fetch\`) | No (use \`fetch\`) |
| **Built-in router** | Yes | Next.js router | Nuxt router |
| **Learning curve** | Steeper | Moderate | Gentle |
| **Best for** | Large teams, enterprise | General web apps | Incremental adoption |

### Quick setup

\`\`\`bash
npm install -g @angular/cli    # install the CLI globally
ng new school-app              # scaffold a new project (select CSS + yes to routing)
cd school-app
ng serve                       # starts on http://localhost:4200
\`\`\`

Generate a standalone component:
\`\`\`bash
ng generate component students/student-list --standalone
\`\`\`

### Standalone component example

The code below is a complete, self-contained Angular component that fetches students from an API and renders them. Every Angular feature used — decorators, DI, \`*ngFor\`, Observables — is strongly typed.`),
        code("typescript", ANGULAR_COMPONENT_CODE, { filename: "student-list.component.ts", openInStudio: true }),
        callout("info", "If you already know NestJS, Angular will feel familiar: both use @Injectable services, dependency injection via constructors, and decorators to declare intent. This is not a coincidence — NestJS was deliberately designed to mirror Angular's architecture on the server side. Knowing one makes learning the other significantly faster."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Factorial of 7",
      slug: "challenge-typescript",
      description: "Print the factorial of 7 (7 × 6 × 5 × 4 × 3 × 2 × 1).",
      track: "coding", difficulty: "beginner", points: 50, language: "typescript",
      starterCode: "// Print 7! (7 factorial)\nlet result: number = 1;\nconsole.log(result);\n",
      checks: { rules: [{ type: "stdout_contains", value: "5040" }] },
    },
  ],
};
