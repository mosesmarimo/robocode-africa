import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, Go
// ---------------------------------------------------------------------------

const HELLO_WORLD = `package main

import "fmt"

func main() {
	fmt.Println("Hello, RoboCode!")
}`;

const SVG_GO_MASCOT = `<svg viewBox="0 0 600 200" role="img" aria-label="Go: compiled, fast, concurrent — used in servers, CLIs, and cloud tools" xmlns="http://www.w3.org/2000/svg">
  <!-- Central Go circle -->
  <circle cx="300" cy="100" r="50" fill="#00add8" stroke="#ffffff" stroke-width="3"/>
  <text x="283" y="95" font-family="monospace" font-size="26" fill="white" font-weight="bold">Go</text>
  <text x="270" y="116" font-family="sans-serif" font-size="11" fill="#e0f7fa">Google, 2009</text>
  <!-- Server -->
  <rect x="30" y="55" width="100" height="58" rx="8" fill="#0f4c81" stroke="#1a73e8" stroke-width="2"/>
  <text x="50" y="81" font-family="sans-serif" font-size="11" fill="#bfdbfe">Web Server</text>
  <text x="42" y="97" font-family="monospace" font-size="10" fill="#93c5fd">net/http</text>
  <line x1="130" y1="84" x2="250" y2="100" stroke="#00add8" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- CLI tool -->
  <rect x="30" y="140" width="100" height="44" rx="8" fill="#1b5e20" stroke="#4caf50" stroke-width="2"/>
  <text x="48" y="160" font-family="sans-serif" font-size="11" fill="#c8e6c9">CLI Tools</text>
  <text x="44" y="176" font-family="monospace" font-size="10" fill="#a5d6a7">os.Args</text>
  <line x1="130" y1="162" x2="250" y2="115" stroke="#00add8" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Kubernetes -->
  <rect x="470" y="40" width="100" height="58" rx="8" fill="#326ce5" stroke="#6ba3f5" stroke-width="2"/>
  <text x="476" y="66" font-family="sans-serif" font-size="11" fill="white">Kubernetes</text>
  <text x="480" y="82" font-family="monospace" font-size="10" fill="#bfdbfe">Docker, k8s</text>
  <line x1="470" y1="69" x2="350" y2="90" stroke="#00add8" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Concurrent workers -->
  <rect x="470" y="130" width="100" height="58" rx="8" fill="#6a1b9a" stroke="#ab47bc" stroke-width="2"/>
  <text x="476" y="155" font-family="sans-serif" font-size="11" fill="#e1bee7">Goroutines</text>
  <text x="480" y="172" font-family="monospace" font-size="10" fill="#ce93d8">concurrency</text>
  <line x1="470" y1="158" x2="350" y2="115" stroke="#00add8" stroke-width="2" stroke-dasharray="5,3"/>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & Types
// ---------------------------------------------------------------------------

const VARIABLES_CODE = `package main

import "fmt"

func main() {
	// Long form: var name type = value
	var city string = "Harare"
	var population int = 1_500_000
	var temp float64 = 27.3
	var isSunny bool = true

	// Short form: := lets Go infer the type automatically
	country := "Zimbabwe"
	elevation := 1483 // metres above sea level

	fmt.Println("City:      ", city)
	fmt.Println("Country:   ", country)
	fmt.Println("Population:", population)
	fmt.Printf("Temp: %.1f°C  Sunny: %v\\n", temp, isSunny)
	fmt.Printf("Elevation: %d m\\n", elevation)
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — Control Flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `package main

import "fmt"

func grade(score int) string {
	switch {
	case score >= 80:
		return "A"
	case score >= 60:
		return "B"
	case score >= 50:
		return "C"
	default:
		return "F"
	}
}

func main() {
	scores := []int{92, 74, 55, 38}

	for _, s := range scores {
		fmt.Printf("Score %d → Grade %s\\n", s, grade(s))
	}

	// Classic for loop counting
	fmt.Println("\\nCounting to 5:")
	for i := 1; i <= 5; i++ {
		fmt.Print(i, " ")
	}
	fmt.Println()
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put It Together
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Lesson 5 — What is a Framework?
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Lesson 6 — Gin
// ---------------------------------------------------------------------------

const GIN_CODE = `package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// album represents a music album in our library.
type album struct {
	ID     string  \`json:"id"\`
	Title  string  \`json:"title"\`
	Artist string  \`json:"artist"\`
	Price  float64 \`json:"price"\`
}

// In-memory store — a real app would use a database.
var albums = []album{
	{ID: "1", Title: "Chimurenga Renaissance", Artist: "Chiwoniso Maraire", Price: 9.99},
	{ID: "2", Title: "Mapfumo Gold",           Artist: "Thomas Mapfumo",   Price: 12.49},
	{ID: "3", Title: "Shona Spirit",            Artist: "Oliver Mtukudzi",  Price: 11.00},
}

// getAlbums responds with the full list as JSON.
func getAlbums(c *gin.Context) {
	c.JSON(http.StatusOK, albums)
}

// getAlbumByID looks up an album by its :id URL parameter.
func getAlbumByID(c *gin.Context) {
	id := c.Param("id")
	for _, a := range albums {
		if a.ID == id {
			c.JSON(http.StatusOK, a)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"message": "album not found"})
}

// createAlbum binds the incoming JSON body to a new album and appends it.
func createAlbum(c *gin.Context) {
	var newAlbum album
	if err := c.ShouldBindJSON(&newAlbum); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	albums = append(albums, newAlbum)
	c.JSON(http.StatusCreated, newAlbum)
}

func main() {
	r := gin.Default() // Default includes Logger and Recovery middleware

	r.GET("/albums", getAlbums)
	r.GET("/albums/:id", getAlbumByID)
	r.POST("/albums", createAlbum)

	// Start the server on port 8080
	r.Run(":8080")
}`;

// ---------------------------------------------------------------------------
// Lesson 7 — Echo
// ---------------------------------------------------------------------------

const ECHO_CODE = `package main

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// Student represents a learner in the RoboCode platform.
type Student struct {
	ID    int    \`json:"id"\`
	Name  string \`json:"name"\`
	Grade string \`json:"grade"\`
}

var students = []Student{
	{ID: 1, Name: "Rudo Nhamo",    Grade: "Form 3"},
	{ID: 2, Name: "Tatenda Moyo",  Grade: "Form 4"},
	{ID: 3, Name: "Simba Chikuni", Grade: "Form 2"},
}

func getStudents(c echo.Context) error {
	return c.JSON(http.StatusOK, students)
}

func getStudent(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id must be an integer"})
	}
	for _, s := range students {
		if s.ID == id {
			return c.JSON(http.StatusOK, s)
		}
	}
	return c.JSON(http.StatusNotFound, map[string]string{"message": "student not found"})
}

func createStudent(c echo.Context) error {
	s := new(Student)
	if err := c.Bind(s); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	s.ID = len(students) + 1
	students = append(students, *s)
	return c.JSON(http.StatusCreated, s)
}

func main() {
	e := echo.New()

	// Built-in middleware: structured request logging and panic recovery.
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// CORS middleware — allow all origins for development.
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodDelete},
	}))

	e.GET("/students", getStudents)
	e.GET("/students/:id", getStudent)
	e.POST("/students", createStudent)

	e.Logger.Fatal(e.Start(":1323"))
}`;

// ---------------------------------------------------------------------------
// Lesson 8 — Fiber
// ---------------------------------------------------------------------------

const FIBER_CODE = `package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

// Project represents a RoboCode coding project.
type Project struct {
	ID       int    \`json:"id"\`
	Title    string \`json:"title"\`
	Language string \`json:"language"\`
	Author   string \`json:"author"\`
}

var projects = []Project{
	{ID: 1, Title: "Traffic Light Simulator", Language: "Python", Author: "Rudo"},
	{ID: 2, Title: "Quiz Game",               Language: "Go",     Author: "Tatenda"},
	{ID: 3, Title: "LED Blink",               Language: "C",      Author: "Simba"},
}

func main() {
	app := fiber.New(fiber.Config{
		// Friendly error messages in JSON — great for REST APIs.
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(logger.New())   // Log every request to stdout
	app.Use(recover.New())  // Recover from panics without crashing the server

	// Routes
	app.Get("/projects", func(c *fiber.Ctx) error {
		return c.JSON(projects)
	})

	app.Get("/projects/:id", func(c *fiber.Ctx) error {
		id, err := c.ParamsInt("id")
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id must be an integer"})
		}
		for _, p := range projects {
			if p.ID == id {
				return c.JSON(p)
			}
		}
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "project not found"})
	})

	app.Post("/projects", func(c *fiber.Ctx) error {
		p := new(Project)
		if err := c.BodyParser(p); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		p.ID = len(projects) + 1
		projects = append(projects, *p)
		return c.Status(fiber.StatusCreated).JSON(p)
	})

	log.Fatal(app.Listen(":3000"))
}`;

const PUT_TOGETHER_CODE = `package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Question struct {
	prompt string
	answer string
}

func main() {
	questions := []Question{
		{"What is the capital of Zimbabwe?", "harare"},
		{"How many sides does a hexagon have?", "6"},
		{"What company created Go?", "google"},
	}

	reader := bufio.NewReader(os.Stdin)
	score := 0

	fmt.Println("=== RoboCode Go Quiz ===")

	for _, q := range questions {
		fmt.Print("\\n", q.prompt, " ")
		input, _ := reader.ReadString('\\n')
		guess := strings.TrimSpace(strings.ToLower(input))

		if guess == q.answer {
			fmt.Println("  Correct!")
			score++
		} else {
			fmt.Printf("  Not quite — answer was: %s\\n", q.answer)
		}
	}

	fmt.Printf("\\nYou scored %d/%d.\\n", score, len(questions))

	switch {
	case score == len(questions):
		fmt.Println("Perfect! You're a Go champion!")
	case score > 0:
		fmt.Println("Good effort — keep practising!")
	default:
		fmt.Println("Don't give up — try again!")
	}
}`;

export const langGo: CourseModule = {
  meta: {
    title: "Go Basics",
    slug: "lang-go",
    track: "coding",
    level: "high",
    description: "Learn Go — Google's fast, simple language built for servers, cloud tools, and modern software engineering.",
    coverImage: "/covers/coding.svg",
    order: 15,
  },
  lessons: [
    {
      title: "Hello, Go",
      slug: "hello-go",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is Go?

**Go** (sometimes called *Golang*) is a programming language created at Google in 2009 by some of the same engineers who built the original Unix operating system. It was designed to be **simple to learn**, **extremely fast**, and great at handling many tasks at the same time (called *concurrency*).

Go powers some of the most important software in the world: **Docker**, **Kubernetes**, **Terraform**, and large parts of Google, Cloudflare, and Dropbox are all written in Go. If you want to build web servers, command-line tools, or cloud services, Go is one of the best choices you can make.

### Where is Go used?

The diagram below shows the kinds of programs people build with Go.`),
        svg(SVG_GO_MASCOT, "Go is used for web servers, CLI tools, Kubernetes, and concurrent programs"),
        md(`### Your first Go program

Every Go program must have a file that belongs to \`package main\` and contains a \`func main()\` — this is where your program starts running. The \`fmt\` package (short for *format*) provides printing functions.

- \`fmt.Println()\` prints text and adds a new line at the end.
- The \`import "fmt"\` line brings that package into scope.

Press **Open in RoboCode Studio** to run this, then try changing the greeting.`),
        code("go", HELLO_WORLD, { filename: "main.go", openInStudio: true }),
        callout("tip", "Go uses tabs (not spaces) for indentation. The official tool gofmt automatically formats your code the Go way — most editors run it every time you save. You will never argue about code style again!"),
      ),
    },
    {
      title: "Variables & Types",
      slug: "go-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Declaring variables in Go

Go is a **statically typed** language, meaning every variable has a fixed type that is known at compile time. This catches many bugs before your program even runs.

You can declare variables in two ways:

| Style | Syntax | When to use |
|---|---|---|
| **Long form** | \`var name string = "Harare"\` | Package-level variables or when the type is important to show |
| **Short form** | \`name := "Harare"\` | Inside functions — Go infers the type automatically |

### Core types

| Type | What it stores | Example |
|---|---|---|
| \`string\` | Text (UTF-8) | \`"Hello"\` |
| \`int\` | Whole number (64-bit on modern CPUs) | \`42\` |
| \`float64\` | 64-bit decimal number | \`3.14\` |
| \`bool\` | \`true\` or \`false\` | \`true\` |

### Printf format verbs

Go's \`fmt.Printf()\` uses *format verbs* to embed values in strings:

- \`%s\` → string
- \`%d\` → integer
- \`%f\` (or \`%.1f\`) → float (1 decimal place)
- \`%v\` → any value in its default format

Run the example below to see both styles of declaration and \`Printf\` in action.`),
        code("go", VARIABLES_CODE, { filename: "variables.go", openInStudio: true }),
        callout("info", "Go will refuse to compile if you declare a variable and never use it. This seems strict, but it keeps codebases clean — no forgotten variables cluttering up your program."),
      ),
    },
    {
      title: "Control Flow",
      slug: "go-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and looping

Go has a deliberately small set of control-flow statements — \`if\`, \`switch\`, and \`for\`. Yes, just one loop keyword for everything!

### if / else

\`\`\`go
if score >= 80 {
    fmt.Println("Great!")
} else if score >= 50 {
    fmt.Println("Good effort.")
} else {
    fmt.Println("Keep practising!")
}
\`\`\`

Notice: no parentheses around the condition — Go style omits them.

### switch

A \`switch\` without an expression works like a chain of \`if/else if\` checks — pick the first case that is true:

\`\`\`go
switch {
case score >= 80:
    return "A"
case score >= 60:
    return "B"
default:
    return "F"
}
\`\`\`

### The for loop — Go's only loop

Go uses \`for\` for everything: classic C-style counting, while-style conditions, and range-based iteration over slices and maps.

### Flowchart of the grade checker`),
        mermaid(
          `flowchart TD
  A([Start]) --> B[scores slice]
  B --> C{more scores?}
  C -- Yes --> D[s = next score]
  D --> E{s >= 80?}
  E -- Yes --> F[return A]
  E -- No --> G{s >= 60?}
  G -- Yes --> H[return B]
  G -- No --> I{s >= 50?}
  I -- Yes --> J[return C]
  I -- No --> K[return F]
  F & H & J & K --> L[print result]
  L --> C
  C -- No --> M([Done])`,
          "Control flow for the grade checker — switch inside a range loop",
        ),
        code("go", CONTROL_FLOW_CODE, { filename: "control_flow.go", openInStudio: true }),
        callout("tip", "The underscore _ in for _, s := range scores is the blank identifier. Go won't compile if you declare a variable you never use — _ lets you intentionally discard a value (here, the index we don't need)."),
      ),
    },
    {
      title: "Put It Together",
      slug: "go-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a quiz game in Go

Let's combine structs, slices, loops, switch statements, and standard-library input reading into a complete, working quiz game.

### New ideas in this program

- **Structs** — \`type Question struct { ... }\` groups related fields together, like a class in other languages.
- **Slice of structs** — \`[]Question{...}\` creates a list of Question values.
- **bufio.NewReader** — reads a full line of text from the terminal (Go's \`fmt.Scan\` stops at spaces, so we use a buffered reader instead).
- **strings.TrimSpace / strings.ToLower** — cleans up the user's input so "Harare", "harare", and " HARARE " all match.
- **Switch on result** — a clean way to print different messages based on the final score.

Run it in Studio and then try adding two more questions of your own!`),
        code("go", PUT_TOGETHER_CODE, { filename: "quiz.go", openInStudio: true }),
        callout("tip", "Go compiles to a single binary file — no runtime to install, no dependencies to ship. You could take the compiled quiz program and run it on any computer, even one with no Go installed. That is one of Go's superpowers for real-world software."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 5 — What is a Framework?
    // -----------------------------------------------------------------------
    {
      title: "What is a Framework?",
      slug: "go-frameworks-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## What is a web framework — and do you need one?

A **framework** is a collection of pre-written code that gives your program a structure to build on. Instead of solving the same problems from scratch every time (routing URLs, parsing request bodies, writing HTTP headers), a framework handles the boilerplate so you can focus on your application's logic.

### Why use a framework?

Without a framework you write all of this by hand:

- Parse the URL path and decide which function to call
- Read and validate the request body
- Set the correct \`Content-Type\` header on every response
- Handle unexpected panics so the server doesn't crash
- Log every request for debugging

Frameworks solve all of that in a few lines. They also give teams a common vocabulary — a new developer who knows Gin can read any Gin project instantly.

### Three levels of help in Go

Go is famous for having a powerful **standard library**. Its built-in \`net/http\` package can already run an HTTP server — no third-party code required. But as your app grows, hand-rolling routing and middleware gets tedious. That is where external packages come in.

The diagram below shows the spectrum from bare \`net/http\` to full-featured frameworks.`),
        mermaid(
          `flowchart LR
  A["net/http\n(std library)"] -->|add router| B["gorilla/mux\nchi\n(lightweight routers)"]
  B -->|add middleware + helpers| C["Gin · Echo\n(popular web frameworks)"]
  C -->|add fasthttp engine| D["Fiber\n(Express-inspired, very fast)"]

  style A fill:#0f4c81,color:#e0f0ff,stroke:#1a73e8
  style B fill:#1b5e20,color:#e0f0ff,stroke:#4caf50
  style C fill:#4a148c,color:#f3e5f5,stroke:#ab47bc
  style D fill:#b71c1c,color:#ffebee,stroke:#ef5350`,
          "Go web tooling spectrum — from the standard library to full frameworks",
        ),
        md(`### How to choose

| Situation | Recommendation |
|---|---|
| Small internal tool or learning project | \`net/http\` — zero dependencies, ships in the standard library |
| REST API with teams / routing needs | **Gin** — most popular, huge ecosystem, great docs |
| API needing heavy middleware (auth, CORS, logging) | **Echo** — clean middleware API, excellent performance |
| Node.js developer moving to Go, or high-throughput APIs | **Fiber** — Express-style API built on the fastest Go HTTP engine |

Go culture strongly favours **small, composable libraries** over large all-in-one frameworks. You will rarely see a Go project with the kind of "batteries-included" magic common in Rails or Django. That is intentional: Go programs stay transparent and easy to reason about.

### What the next lessons cover

The following three lessons introduce **Gin**, **Echo**, and **Fiber** in depth, each with a real working REST API example you can run in RoboCode Studio.`),
        callout("info", "All three frameworks — Gin, Echo, and Fiber — are production-ready and actively maintained. The choice between them is mostly a matter of API style preference. When in doubt, start with Gin: it has the largest community and the most third-party middleware packages."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 6 — Gin
    // -----------------------------------------------------------------------
    {
      title: "Gin: Fast HTTP Framework",
      slug: "go-fw-gin",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Gin — the most popular Go web framework

**Gin** is a high-performance HTTP web framework for Go. It wraps Go's standard \`net/http\` package and adds a fast router (based on [httprouter](https://github.com/julienschmidt/httprouter)), convenient JSON helpers, middleware support, and request validation — all with an API that feels natural in Go.

### Use cases

Gin is the right choice when you need to:

- Build a **REST API** that will be consumed by a web or mobile frontend
- Create **microservices** that talk to each other over HTTP
- Expose a **public API** that needs versioned routes (\`/v1/...\`, \`/v2/...\`)
- Add **middleware** such as authentication, rate limiting, or structured logging to every route in a group

It is used in production at companies like Bytedance, Docker, and many African fintech startups building modern backends.

### Setup

Install Gin with the Go module system:

\`\`\`bash
go get github.com/gin-gonic/gin
\`\`\`

Then import it in your file:

\`\`\`go
import "github.com/gin-gonic/gin"
\`\`\`

### Key concepts

- **\`gin.Default()\`** — creates a router with the Logger (prints each request) and Recovery (catches panics) middleware already attached.
- **\`c *gin.Context\`** — the single argument every handler receives. It holds the request, the response writer, URL parameters, query strings, and the JSON helpers.
- **\`c.JSON(statusCode, value)\`** — serialises any Go value to JSON and writes it to the response with the correct \`Content-Type\` header.
- **\`c.Param("id")\`** — reads a named URL segment defined as \`:id\` in the route pattern.
- **\`c.ShouldBindJSON(&v)\`** — decodes the request body into a struct and returns an error if the JSON is malformed or required fields are missing.

The example below builds a small music album API with three endpoints.`),
        code("go", GIN_CODE, { filename: "main.go", openInStudio: true }),
        callout("tip", "Try the API with curl once the server is running:\n\ncurl http://localhost:8080/albums\ncurl http://localhost:8080/albums/1\ncurl -X POST http://localhost:8080/albums -H 'Content-Type: application/json' -d '{\"id\":\"4\",\"title\":\"Bira\",\"artist\":\"Epworth Singers\",\"price\":8.00}'\n\nGin's Logger middleware will print a coloured summary of each request in the terminal."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 7 — Echo
    // -----------------------------------------------------------------------
    {
      title: "Echo: Minimalist High-Performance Framework",
      slug: "go-fw-echo",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Echo — clean, minimalist, and fast

**Echo** is a high-performance, minimalist web framework for Go. It is comparable to Gin in speed and popularity but has a notably cleaner **middleware API** and first-class support for request validation, custom binders, and WebSockets.

### Use cases

Echo is a strong choice when you need to:

- Build a **REST API** with a clean, readable middleware chain
- Handle **CORS** headers for a browser-based frontend (the built-in CORS middleware is one of the best in the Go ecosystem)
- Write **WebSocket** endpoints alongside REST routes in the same server
- Work in a team that prefers explicit middleware configuration over convention-over-configuration magic

Many Go backend engineers prefer Echo when the middleware configuration needs to be precise and transparent — for example, applying authentication only to certain route groups, or using different CORS policies for public vs private endpoints.

### Setup

\`\`\`bash
go get github.com/labstack/echo/v4
\`\`\`

Then import:

\`\`\`go
import (
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)
\`\`\`

### Key concepts

- **\`echo.New()\`** — creates the Echo instance (the router and middleware chain).
- **\`e.Use(...)\`** — registers middleware that runs for every request.
- **\`echo.Context\`** — similar to Gin's context: carries the request, response, URL params, and helpers.
- **\`c.Bind(&v)\`** — decodes the request body (JSON, form, query string) into a struct based on the \`Content-Type\` header — no need to pick a specific decoder.
- **\`c.JSON(status, v)\`** — serialises and sends a JSON response.
- **\`e.Logger.Fatal(e.Start(":1323"))\`** — starts the server and exits on error.

The example builds a student management API for a school platform.`),
        code("go", ECHO_CODE, { filename: "main.go", openInStudio: true }),
        callout("tip", "Echo's middleware package ships with Logger, Recover, CORS, JWT, Rate Limiter, Gzip, and more — all with sensible defaults you can override with a Config struct. This makes Echo particularly good for APIs that serve browser frontends, where you need CORS configured correctly from day one."),
      ),
    },
    // -----------------------------------------------------------------------
    // Lesson 8 — Fiber
    // -----------------------------------------------------------------------
    {
      title: "Fiber: Express-Inspired Go Framework",
      slug: "go-fw-fiber",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Fiber — familiar to Node developers, extremely fast

**Fiber** is a web framework for Go that was deliberately modelled after **Express.js** — the most popular Node.js framework. If you have ever written an Express app, Fiber will feel instantly familiar: \`app.Get()\`, \`app.Post()\`, \`c.JSON()\`, \`c.BodyParser()\`.

The key difference is that Fiber is built on **fasthttp**, an alternative to Go's standard \`net/http\` package that is designed for extreme throughput. Benchmarks consistently place Fiber among the fastest web frameworks across all languages.

### Use cases

Fiber is the right choice when you need to:

- Build a **high-throughput API** that must handle tens of thousands of requests per second on modest hardware
- Migrate a **Node.js / Express backend to Go** while keeping the learning curve low for developers already familiar with Express
- Create a **real-time server** (Fiber supports WebSockets and Server-Sent Events natively)
- Build **lightweight microservices** where startup time and memory footprint matter (Fiber's binary footprint is tiny)

It is widely used in gaming backends, IoT data ingestion services, and any API where raw speed is a first-class requirement.

### Setup

\`\`\`bash
go get github.com/gofiber/fiber/v2
\`\`\`

Then import:

\`\`\`go
import "github.com/gofiber/fiber/v2"
\`\`\`

### Key concepts

- **\`fiber.New(fiber.Config{...})\`** — creates the application. The \`Config\` struct lets you customise the error handler, body size limits, and more.
- **\`fiber.Map\`** — a convenience alias for \`map[string]interface{}\` — great for quick JSON error responses.
- **\`c.BodyParser(&v)\`** — decodes the request body into a struct (supports JSON, XML, and form data).
- **\`c.ParamsInt("id")\`** — reads a URL parameter and converts it to \`int\` in one step.
- **\`c.JSON(v)\`** — sends a JSON response (status 200 by default; use \`c.Status(code).JSON(v)\` for other codes).
- **\`app.Listen(":3000")\`** — starts the HTTP server.

The example builds a project management API for RoboCode.`),
        code("go", FIBER_CODE, { filename: "main.go", openInStudio: true }),
        callout("info", "**Comparing the three frameworks:**\n\n| | Gin | Echo | Fiber |\n|---|---|---|---|\n| **HTTP engine** | net/http | net/http | fasthttp |\n| **API style** | Go-idiomatic | Go-idiomatic | Express-like |\n| **Middleware** | Good | Excellent | Good |\n| **Raw speed** | Very fast | Very fast | Fastest |\n| **Best for** | General REST APIs | APIs with complex middleware | High-throughput / Ex-Node devs |\n\n**When is the standard library enough?** If you are writing a small internal tool, a webhook receiver, or a single-endpoint service, `net/http` alone is perfectly fine — add a router like `chi` if you need URL parameters, and you have everything you need without any external dependencies."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Even sum",
      slug: "challenge-go",
      description: "Print the sum of the first 10 even numbers (2 + 4 + 6 + ... + 20).",
      track: "coding", difficulty: "beginner", points: 50, language: "go",
      starterCode: "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tsum := 0\n\t// add the even numbers 2..20 to sum\n\tfmt.Println(sum)\n}\n",
      checks: { rules: [{ type: "stdout_contains", value: "110" }] },
    },
  ],
};
