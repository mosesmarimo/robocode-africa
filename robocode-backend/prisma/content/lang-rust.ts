import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, Rust
// ---------------------------------------------------------------------------

const HELLO_WORLD = `fn main() {
    println!("Hello, RoboCode!");
}`;

const SVG_RUST_MEMORY = `<svg viewBox="0 0 600 200" role="img" aria-label="Rust: safe memory management without a garbage collector" xmlns="http://www.w3.org/2000/svg">
  <!-- Stack box -->
  <rect x="30" y="30" width="180" height="140" rx="10" fill="#1c1917" stroke="#f97316" stroke-width="2"/>
  <text x="120" y="58" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fb923c" text-anchor="middle">Stack</text>
  <rect x="50" y="68" width="140" height="28" rx="4" fill="#292524"/>
  <text x="120" y="88" font-family="monospace" font-size="12" fill="#fed7aa" text-anchor="middle">let x: i32 = 42;</text>
  <rect x="50" y="104" width="140" height="28" rx="4" fill="#292524"/>
  <text x="120" y="124" font-family="monospace" font-size="12" fill="#fed7aa" text-anchor="middle">let flag: bool</text>
  <text x="120" y="158" font-family="sans-serif" font-size="10" fill="#a8a29e" text-anchor="middle">fixed size, fast</text>
  <!-- Arrow -->
  <line x1="210" y1="100" x2="270" y2="100" stroke="#f97316" stroke-width="2" stroke-dasharray="4,3"/>
  <polygon points="270,96 280,100 270,104" fill="#f97316"/>
  <!-- Heap box -->
  <rect x="280" y="30" width="290" height="140" rx="10" fill="#1c1917" stroke="#f97316" stroke-width="2"/>
  <text x="425" y="58" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fb923c" text-anchor="middle">Heap</text>
  <rect x="300" y="68" width="250" height="28" rx="4" fill="#292524"/>
  <text x="425" y="88" font-family="monospace" font-size="12" fill="#fed7aa" text-anchor="middle">let s = String::from("Hi")</text>
  <rect x="300" y="104" width="250" height="28" rx="4" fill="#292524"/>
  <text x="425" y="124" font-family="monospace" font-size="12" fill="#fed7aa" text-anchor="middle">let v: Vec&lt;i32&gt; = vec![1,2,3]</text>
  <text x="425" y="158" font-family="sans-serif" font-size="10" fill="#a8a29e" text-anchor="middle">dynamic size — Rust frees automatically via ownership</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Types
// ---------------------------------------------------------------------------

const VARIABLES_CODE = `fn main() {
    // Variables are immutable by default in Rust
    let name = "Amara";          // &str — a string slice
    let age: u32 = 15;           // u32 — unsigned 32-bit integer
    let height: f64 = 1.68;      // f64 — 64-bit float
    let is_student = true;       // bool

    println!("Name: {}", name);
    println!("Age: {}", age);
    println!("Height: {:.2} m", height);
    println!("Student: {}", is_student);

    // mut makes a variable mutable (changeable)
    let mut score = 0;
    score += 10;
    score += 5;
    println!("\\nScore after two rounds: {}", score);

    // Shadowing — reuse a variable name with a new value/type
    let level = "beginner";
    let level = level.to_uppercase(); // shadow with String
    println!("Level: {}", level);
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Control Flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `fn grade(score: u32) -> &'static str {
    match score {
        80..=100 => "A",
        60..=79  => "B",
        50..=59  => "C",
        _        => "F",
    }
}

fn main() {
    let scores = [92u32, 74, 55, 38, 100];

    for &s in &scores {
        println!("Score {:>3} → Grade {}", s, grade(s));
    }

    // while loop
    let mut countdown = 3;
    println!("\\nLaunch countdown:");
    while countdown > 0 {
        println!("  {}...", countdown);
        countdown -= 1;
    }
    println!("  Lift off!");

    // if as an expression — Rust lets you use if inline
    let status = if scores[0] >= 80 { "passing" } else { "failing" };
    println!("\\nFirst student is {status}.");
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put It Together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `use std::io::{self, Write};

struct Question {
    prompt: &'static str,
    answer: &'static str,
}

fn ask(q: &Question) -> bool {
    print!("{} ", q.prompt);
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let guess = input.trim().to_lowercase();

    if guess == q.answer {
        println!("  Correct!");
        true
    } else {
        println!("  Not quite — answer: {}", q.answer);
        false
    }
}

fn main() {
    let questions = vec![
        Question { prompt: "What is the capital of Zimbabwe?", answer: "harare" },
        Question { prompt: "How many bits in a byte?",         answer: "8" },
        Question { prompt: "What year was Rust 1.0 released?", answer: "2015" },
    ];

    println!("=== RoboCode Rust Quiz ===\\n");

    let score: usize = questions.iter().map(|q| ask(q) as usize).sum();

    println!("\\nYou scored {}/{}.", score, questions.len());

    match score {
        s if s == questions.len() => println!("Ownership mastered!"),
        n if n >= 1               => println!("Great effort — keep going!"),
        _                         => println!("Don't give up — try again!"),
    }
}`;

export const langRust: CourseModule = {
  meta: {
    title: "Rust Basics",
    slug: "lang-rust",
    track: "coding",
    level: "high",
    description: "Learn Rust — the language of fast, safe systems programming — and discover how ownership eliminates entire classes of bugs.",
    coverImage: "/covers/coding.svg",
    order: 16,
  },
  lessons: [
    {
      title: "Hello, Rust",
      slug: "hello-rust",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is Rust?

**Rust** is a systems programming language first released by Mozilla in 2015. It has since won the "most loved programming language" award in the Stack Overflow developer survey *nine years in a row*. Developers love it because Rust is as fast as C but catches entire categories of bugs at **compile time** — before your program ever runs.

Rust is used in:
- **Operating systems** — parts of the Linux kernel, Windows, and macOS are now written in Rust.
- **Web browsers** — Mozilla Firefox's rendering engine is largely Rust.
- **Game engines** — Bevy is a popular game engine written in Rust.
- **Cloud infrastructure** — AWS, Cloudflare, and Dropbox use Rust for performance-critical services.
- **Embedded systems** — microcontrollers and robotics firmware.

### Rust's superpower: ownership

Most languages either manage memory automatically (Python, JavaScript) using a *garbage collector*, or leave it to you (C, C++) — which leads to crashes and security vulnerabilities. Rust takes a third path: the **ownership system** checks memory safety at compile time, for free. The diagram below illustrates the two memory regions Rust uses.`),
        svg(SVG_RUST_MEMORY, "Stack holds fixed-size values; heap holds dynamic data — Rust frees both automatically via ownership"),
        md(`### Your first Rust program

In Rust, \`fn main()\` is the entry point — execution always starts here. The \`println!\` with an exclamation mark is a **macro** (a code-generating shortcut), not a regular function. Rust uses macros for formatting because they check your format string at compile time.`),
        code("rust", HELLO_WORLD, { filename: "main.rs", openInStudio: true }),
        callout("tip", "Rust programs are compiled with the rustc compiler (or via Cargo, Rust's build tool). The compiler is famously helpful — its error messages include the exact line, an explanation of what went wrong, and often a suggestion for how to fix it."),
      ),
    },
    {
      title: "Variables & Types",
      slug: "rust-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Variables and immutability

One of Rust's most important design decisions: **variables are immutable by default**. Once you give a variable a value, it cannot change — unless you explicitly say \`mut\`.

This feels unusual at first, but it prevents a whole class of bugs where data changes unexpectedly in a large program.

\`\`\`rust
let x = 5;      // immutable — x can never change
let mut y = 5;  // mutable — y can be changed
y += 1;         // OK
// x += 1;      // compile error!
\`\`\`

### Core scalar types

| Type | Size | Range / use | Example |
|---|---|---|---|
| \`i32\` | 32-bit signed int | −2 billion to +2 billion | \`let n: i32 = -7;\` |
| \`u32\` | 32-bit unsigned int | 0 to 4 billion | \`let age: u32 = 15;\` |
| \`f64\` | 64-bit float | decimal numbers | \`let pi: f64 = 3.14;\` |
| \`bool\` | 1 bit | \`true\` / \`false\` | \`let flag = true;\` |
| \`&str\` | string slice | borrowed text literal | \`let s = "hi";\` |
| \`String\` | owned string | growable text on the heap | \`String::from("hi")\` |

### Shadowing

Rust lets you *shadow* a variable — declare a new variable with the same name. The new variable completely replaces the old one. This is useful when you want to transform a value and keep the same name:

\`\`\`rust
let level = "beginner";
let level = level.to_uppercase(); // now level is a String "BEGINNER"
\`\`\`

Run the example to see all of this in action.`),
        code("rust", VARIABLES_CODE, { filename: "variables.rs", openInStudio: true }),
        callout("info", "Rust infers types most of the time, so you rarely need to write them out. But adding type annotations (like : u32) is great for learning — it forces you to think about exactly what kind of value you are working with."),
      ),
    },
    {
      title: "Control Flow",
      slug: "rust-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Controlling what your program does

Rust has \`if\`, \`loop\`, \`while\`, and \`for\` — and a very powerful pattern-matching construct called \`match\`.

### match — Rust's supercharged switch

\`match\` checks a value against a list of *patterns* and runs the first one that matches. It must be **exhaustive** — you must handle every possible case (the \`_\` wildcard covers everything else):

\`\`\`rust
match score {
    90..=100 => println!("A"),
    70..=89  => println!("B"),
    _        => println!("Try again!"),
}
\`\`\`

The \`..=\` syntax means "inclusive range" — \`80..=100\` means 80, 81, ..., 100.

### if as an expression

In Rust, \`if\` is an *expression* — it produces a value. This means you can use it directly on the right side of \`let\`:

\`\`\`rust
let label = if score >= 50 { "pass" } else { "fail" };
\`\`\`

### Flowchart for the grade checker`),
        mermaid(
          `flowchart TD
  A([Start]) --> B[scores array]
  B --> C{more scores?}
  C -- Yes --> D[s = next score]
  D --> E{match score}
  E -- 80-100 --> F[A]
  E -- 60-79  --> G[B]
  E -- 50-59  --> H[C]
  E -- other  --> I[F]
  F & G & H & I --> J[println!]
  J --> C
  C -- No --> K[while countdown]
  K --> L{countdown > 0?}
  L -- Yes --> M[print, decrement]
  M --> L
  L -- No --> N([Done])`,
          "Control flow: for loop with match, then a while countdown",
        ),
        code("rust", CONTROL_FLOW_CODE, { filename: "control_flow.rs", openInStudio: true }),
        callout("tip", "The Rust compiler enforces that match expressions cover every case. If you forget the _ wildcard and there are values you haven't handled, the code won't compile. This \"exhaustive matching\" prevents bugs where an unexpected value slips through unchecked."),
      ),
    },
    {
      title: "Put It Together",
      slug: "rust-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a quiz game in Rust

Let's combine structs, vectors, iterators, closures, and standard input into a complete Rust quiz game.

### New ideas in this program

- **Struct** — \`struct Question { ... }\` is like a record type that groups fields together.
- **Vec** — \`vec![...]\` creates a growable list on the heap.
- **Iterators and closures** — \`.iter().map(|q| ask(q) as usize).sum()\` processes every question in one elegant chain.
- \`io::stdout().flush()\` — Rust buffers terminal output for performance; we flush it manually to make the prompt appear before the user types.
- **match with a guard** — the \`s if s == questions.len()\` pattern adds an extra condition to a match arm.

This program introduces real Rust patterns used in production software. Give it a try — and add your own questions!`),
        code("rust", PUT_TOGETHER_CODE, { filename: "quiz.rs", openInStudio: true }),
        callout("tip", "Notice that the ask function returns bool and we cast it to usize with as usize — false becomes 0 and true becomes 1. Then .sum() adds up all the 1s. This kind of functional iterator chain is idiomatic Rust and very common in real codebases."),
      ),
    },
    // -------------------------------------------------------------------------
    // Lesson 5 — What is a Framework?
    // -------------------------------------------------------------------------
    {
      title: "What is a Framework?",
      slug: "rust-frameworks-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Frameworks in Rust

A **framework** is a reusable collection of libraries, conventions, and tools that handle the repetitive infrastructure of an application so you can focus on the logic that matters to your project. Instead of writing your own HTTP parser, router, or connection pool from scratch, you pick a framework that has already solved those problems and build on top of it.

### Why use a framework?

Without a framework you would need to:
- Parse raw TCP bytes into HTTP requests by hand.
- Match URL paths to handler functions yourself.
- Manage thread pools or async task schedulers explicitly.
- Handle serialisation, authentication middleware, logging, and error propagation — all from scratch.

Frameworks eliminate that boilerplate and give you well-tested building blocks, so you can ship working software far faster.

### Types of Rust frameworks

Rust has three distinct categories of framework-like crates:

| Category | What it does | Examples |
|---|---|---|
| **Web frameworks** | HTTP routing, middleware, request/response handling | Actix Web, Axum, Rocket, Warp |
| **Async runtimes** | Schedule and poll async tasks efficiently | Tokio, async-std, smol |
| **Frontend / WASM frameworks** | Build browser UIs compiled to WebAssembly | Yew, Leptos, Dioxus |

The diagram below shows how these layers relate to each other.`),
        mermaid(
          `flowchart TD
  A[Your Application Code] --> B[Web Framework\\nActix / Axum / Rocket]
  B --> C[Async Runtime\\nTokio / async-std]
  C --> D[Operating System\\nTCP sockets, threads, timers]
  A --> E[Frontend / WASM\\nYew / Leptos]
  E --> F[Browser WebAssembly Engine]`,
          "Rust ecosystem layers: your code sits on top of a web framework, which in turn relies on an async runtime",
        ),
        md(`### How to choose

When picking a Rust web framework consider four dimensions:

1. **Performance needs** — Actix Web consistently tops benchmarks; use it when raw throughput is the priority (game backends, real-time APIs).
2. **Ergonomics and team experience** — Axum has an intuitive API and excellent documentation; great for teams coming from Node/Express.
3. **Beginner-friendliness** — Rocket's macro-driven API reads almost like pseudocode; ideal for students or rapid prototyping.
4. **Ecosystem integration** — all three work with the Tokio async runtime, but Axum is built *by* the Tokio team and integrates most tightly with Tower middleware.

You do not need to choose the "best" framework — you need the one that fits your use case and your team. All three are production-ready and widely used.`),
        callout("info", "Async runtimes like Tokio are not web frameworks — they are the execution engine that web frameworks run on. Most Rust web frameworks require you to add Tokio (or another runtime) separately. Think of Tokio as the engine and your web framework as the car body built on top of it."),
      ),
    },
    // -------------------------------------------------------------------------
    // Lesson 6 — Actix Web
    // -------------------------------------------------------------------------
    {
      title: "Actix Web",
      slug: "rust-fw-actix",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Actix Web — high-performance actor-based web framework

**Actix Web** is one of the fastest web frameworks in any language. In the TechEmpower benchmark (the industry-standard HTTP framework benchmark) Actix Web routinely places in the top five out of hundreds of frameworks across all languages.

### Use cases

Actix Web is an excellent choice when:
- You need to handle **tens of thousands of concurrent connections** — multiplayer game servers, real-time dashboards, IoT ingestion pipelines.
- You are building **high-throughput REST or GraphQL APIs** where every millisecond of latency counts.
- You want **fine-grained control** over middleware, extractors, and the request lifecycle.
- Your team is comfortable with Rust's type system and wants zero-cost abstractions at the framework level.

It may be overkill for a simple CRUD API where developer velocity matters more than raw speed — in that case Axum or Rocket might serve you better.

### Setup

Add Actix Web to your project with:

\`\`\`bash
cargo add actix-web
\`\`\`

Your \`Cargo.toml\` will gain a dependency like:

\`\`\`toml
[dependencies]
actix-web = "4"
\`\`\`

Actix Web bundles its own async executor (based on Tokio internally), so you do not need to add Tokio separately for basic use.

### A minimal Actix Web server

The program below starts an HTTP server on port 8080 with two routes: a welcome page and a greeter that reads a name from the URL path.`),
        code("rust", `use actix_web::{get, web, App, HttpServer, HttpResponse, Responder};

// Handler for GET /
#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().body("Welcome to RoboCode! Visit /greet/YourName")
}

// Handler for GET /greet/{name}
// Actix Web deserialises the path segment into the name: String argument.
#[get("/greet/{name}")]
async fn greet(name: web::Path<String>) -> impl Responder {
    let message = format!("Hello, {}! Rust says hi from Actix Web.", name.into_inner());
    HttpResponse::Ok().body(message)
}

// The #[actix_web::main] macro starts the Actix async runtime.
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Server running at http://127.0.0.1:8080");

    HttpServer::new(|| {
        App::new()
            .service(index)
            .service(greet)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}`, { filename: "main.rs", openInStudio: true }),
        md(`### What each part does

- \`#[get("/")]\` — an attribute macro that registers the function as a GET handler for the given path. Actix Web reads this at compile time.
- \`web::Path<String>\` — an *extractor*. Actix Web automatically parses the \`{name}\` segment from the URL and hands it to your function as a typed Rust value.
- \`HttpServer::new(|| App::new()...)\` — creates a server factory. The closure runs once per worker thread, so each thread gets its own \`App\` instance with no shared-state bottleneck.
- \`.bind(...)?..run().await\` — binds the TCP socket and starts the event loop.`),
        callout("tip", "Actix Web uses an actor model internally — each worker thread runs independently, which is why it scales so well on multi-core hardware. You can set the number of workers explicitly with .workers(4) on HttpServer to match your CPU count."),
      ),
    },
    // -------------------------------------------------------------------------
    // Lesson 7 — Axum
    // -------------------------------------------------------------------------
    {
      title: "Axum",
      slug: "rust-fw-axum",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Axum — ergonomic async web framework from the Tokio team

**Axum** is a web framework built and maintained by the Tokio project — the same team behind the most popular async runtime in the Rust ecosystem. Axum is designed around composability: instead of inventing its own middleware system, it uses **Tower**, a battle-tested library of reusable network service components already used by large companies in production.

### Use cases

Axum is an excellent choice when:
- You are building **modern async microservices or REST APIs** and want clean, readable code.
- You want to **share middleware** (rate limiting, authentication, tracing, compression) with other Tower-compatible services.
- Your team is already using Tokio and wants the tightest possible integration with the async runtime.
- You value **type-safe routing** — Axum's extractor system catches mismatches between your route definition and handler signature at compile time.
- You are new to Rust web frameworks and want the best documentation and community support.

### Setup

Axum requires both \`axum\` and the Tokio runtime:

\`\`\`bash
cargo add axum tokio --features tokio/full
\`\`\`

Your \`Cargo.toml\`:

\`\`\`toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
\`\`\`

### A minimal Axum server

The example below defines a router with two routes, passes a shared application state into handlers, and starts a Tokio-powered HTTP server.`),
        code("rust", `use axum::{
    extract::{Path, State},
    routing::get,
    Router,
};
use std::sync::Arc;

// Shared application state — wrapped in Arc so multiple threads can read it.
struct AppState {
    app_name: String,
}

// Handler for GET /
async fn index(State(state): State<Arc<AppState>>) -> String {
    format!("Welcome to {}! Try /greet/YourName", state.app_name)
}

// Handler for GET /greet/:name
// Axum extracts the path segment and the shared state automatically.
async fn greet(
    Path(name): Path<String>,
    State(state): State<Arc<AppState>>,
) -> String {
    format!("Hello, {}! Greetings from {} (powered by Axum).", name, state.app_name)
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        app_name: "RoboCode".to_string(),
    });

    // Build the router — Axum routers are composable: you can nest them,
    // split them across modules, and layer Tower middleware on each branch.
    let app = Router::new()
        .route("/", get(index))
        .route("/greet/:name", get(greet))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("Listening on http://0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}`, { filename: "main.rs", openInStudio: true }),
        md(`### What each part does

- \`Router::new().route(...)\` — builds a routing table. Routes are matched in definition order and Axum returns 404 automatically for unmatched paths.
- \`State<Arc<AppState>>\` — an extractor that injects shared application state into your handler. \`Arc\` (Atomic Reference Count) allows multiple threads to share the same data safely without copying it.
- \`Path<String>\` — extracts a named path segment. If the segment cannot be parsed into \`String\`, Axum returns a 422 response automatically.
- \`#[tokio::main]\` — the Tokio macro that starts the async runtime and drives your \`async fn main\`.`),
        callout("tip", "Axum's greatest strength is composability with Tower. You can add logging, rate limiting, CORS headers, compression, and authentication as Tower layers — all in a few lines. For example: app.layer(tower_http::trace::TraceLayer::new_for_http()) adds full request/response tracing with zero changes to your handlers."),
      ),
    },
    // -------------------------------------------------------------------------
    // Lesson 8 — Rocket
    // -------------------------------------------------------------------------
    {
      title: "Rocket",
      slug: "rust-fw-rocket",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Rocket — batteries-included, beginner-friendly web framework

**Rocket** is a web framework that prioritises developer experience above all else. Its API is driven by **procedural macros** — Rust's code-generation system — which lets you express routes in a way that reads almost like pseudocode. Rocket handles request guards, form parsing, JSON serialisation, templating, and database connection pooling out of the box, so you spend more time on features and less time on plumbing.

### Use cases

Rocket is an excellent choice when:
- You are **learning Rust web development** for the first time and want clear, readable, well-documented code.
- You need to **prototype a web app quickly** — a school project, a hackathon entry, an internal tool.
- Your application does standard CRUD work (forms, databases, session auth) and does not need extreme throughput.
- You want **built-in form validation**, **typed query parameters**, and **request guards** without adding extra crates.

If you later find you need more raw performance, migrating to Axum or Actix Web is straightforward because the routing concepts are very similar.

### Setup

\`\`\`bash
cargo add rocket
\`\`\`

Your \`Cargo.toml\`:

\`\`\`toml
[dependencies]
rocket = "0.5"
\`\`\`

Rocket ships with its own async runtime integration (built on Tokio) so you do not need to add Tokio manually.

### A minimal Rocket server

Rocket uses attribute macros on functions to declare routes. The \`#[launch]\` macro wires up the entry point so you do not need to write an async main by hand.`),
        code("rust", `#[macro_use] extern crate rocket;

// Handler for GET /
// The #[get("/")] macro registers this function as the handler for GET /.
#[get("/")]
fn index() -> &'static str {
    "Welcome to RoboCode! Try /greet/YourName"
}

// Handler for GET /greet/<name>
// Rocket automatically extracts <name> from the URL and passes it as a
// typed argument. If it cannot parse the segment, it returns 404.
#[get("/greet/<name>")]
fn greet(name: &str) -> String {
    format!("Hello, {}! Rocket-powered Rust says hi.", name)
}

// Handler for GET /score/<player>/<points>
// Multiple path segments are each extracted into separate arguments.
#[get("/score/<player>/<points>")]
fn score(player: &str, points: u32) -> String {
    format!("{} scored {} points — well done!", player, points)
}

// #[launch] builds the Rocket instance and starts the server.
// rocket::build() returns a Rocket<Build> that you can configure further
// (attach fairings, manage state, mount additional routes) before launch.
#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index, greet, score])
}`, { filename: "main.rs", openInStudio: true }),
        md(`### What each part does

- \`#[macro_use] extern crate rocket\` — brings Rocket's macros (\`#[get]\`, \`#[post]\`, \`routes!\`, etc.) into scope.
- \`#[get("/greet/<name>")]\` — the angle-bracket syntax \`<name>\` tells Rocket to capture that path segment and pass it to the matching function argument of the same name.
- \`u32\` argument in \`score\` — Rocket tries to parse the path segment as \`u32\`. If the visitor sends \`/score/alice/notanumber\` Rocket automatically responds with 422 Unprocessable Entity. No validation code needed.
- \`#[launch]\` — a convenience macro that generates \`fn main()\` for you, calling \`rocket().launch()\` inside a Tokio runtime.
- \`rocket::build().mount("/", routes![...])\` — \`mount\` attaches a list of route handlers under a base path. You can call \`mount\` multiple times to group routes by prefix (e.g. \`/api\`, \`/admin\`).

### Comparing the three frameworks`),
        mermaid(
          `quadrantChart
    title Rust Web Framework Trade-offs
    x-axis Low Ergonomics --> High Ergonomics
    y-axis Low Throughput --> High Throughput
    quadrant-1 Fast & ergonomic
    quadrant-2 Fast but verbose
    quadrant-3 Slow & verbose
    quadrant-4 Ergonomic but slower
    Actix Web: [0.35, 0.95]
    Axum: [0.75, 0.85]
    Rocket: [0.88, 0.55]`,
          "Approximate trade-off positions — all three are production-ready; the differences are about priorities, not quality",
        ),
        callout("info", "All three frameworks — Actix Web, Axum, and Rocket — are production-ready and used by real companies. Actix Web wins on raw throughput. Axum wins on composability and Tower ecosystem integration. Rocket wins on developer experience and beginner-friendliness. For most school or hackathon projects, Rocket or Axum will serve you best. When you need extreme performance at scale, reach for Actix Web."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Powers of three",
      slug: "challenge-rust",
      description: "Print 3 raised to the power of 7.",
      track: "coding", difficulty: "beginner", points: 50, language: "rust",
      starterCode: "fn main() {\n    // Print 3 to the power of 7\n    let mut result: u64 = 1;\n    println!(\"{}\", result);\n}\n",
      checks: { rules: [{ type: "stdout_contains", value: "2187" }] },
    },
  ],
};
