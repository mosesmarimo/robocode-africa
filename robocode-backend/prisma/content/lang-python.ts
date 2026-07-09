import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, Python
// ---------------------------------------------------------------------------

const HELLO_WORLD = `# Your first Python program
print("Hello, RoboCode!")

# Python can also do maths — try changing these numbers
result = 7 * 6
print("7 times 6 is", result)`;

const SVG_PYTHON_RUNS_EVERYWHERE = `<svg viewBox="0 0 600 200" role="img" aria-label="Python runs on many platforms: web server, laptop, robot, and phone" xmlns="http://www.w3.org/2000/svg">
  <!-- Central Python logo circle -->
  <circle cx="300" cy="100" r="48" fill="#3776ab" stroke="#ffd343" stroke-width="4"/>
  <text x="278" y="94" font-family="monospace" font-size="22" fill="#ffd343" font-weight="bold">Py</text>
  <text x="272" y="116" font-family="monospace" font-size="13" fill="#ffffff">Python</text>
  <!-- Laptop -->
  <rect x="30" y="60" width="90" height="60" rx="6" fill="#374151" stroke="#6b7280" stroke-width="2"/>
  <rect x="20" y="120" width="110" height="10" rx="3" fill="#4b5563"/>
  <text x="52" y="97" font-family="sans-serif" font-size="11" fill="#34d399">Laptop</text>
  <line x1="120" y1="100" x2="252" y2="100" stroke="#ffd343" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Web server -->
  <rect x="30" y="150" width="90" height="44" rx="6" fill="#1e40af" stroke="#3b82f6" stroke-width="2"/>
  <text x="38" y="168" font-family="sans-serif" font-size="10" fill="#bfdbfe">Web Server</text>
  <text x="44" y="183" font-family="monospace" font-size="9" fill="#93c5fd">Flask / Django</text>
  <line x1="120" y1="172" x2="252" y2="120" stroke="#ffd343" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Robot -->
  <rect x="480" y="55" width="90" height="70" rx="6" fill="#065f46" stroke="#34d399" stroke-width="2"/>
  <circle cx="503" cy="75" r="7" fill="#34d399"/>
  <circle cx="547" cy="75" r="7" fill="#34d399"/>
  <rect x="495" y="95" width="60" height="22" rx="4" fill="#047857"/>
  <text x="500" y="111" font-family="sans-serif" font-size="10" fill="#d1fae5">Robot / Pi</text>
  <line x1="480" y1="90" x2="348" y2="100" stroke="#ffd343" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Data science -->
  <rect x="480" y="150" width="90" height="44" rx="6" fill="#7c3aed" stroke="#a78bfa" stroke-width="2"/>
  <text x="490" y="168" font-family="sans-serif" font-size="10" fill="#e9d5ff">Data Science</text>
  <text x="494" y="183" font-family="monospace" font-size="9" fill="#c4b5fd">NumPy / AI</text>
  <line x1="480" y1="172" x2="348" y2="120" stroke="#ffd343" stroke-width="2" stroke-dasharray="5,3"/>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Variables & types
// ---------------------------------------------------------------------------

const VARIABLES_CODE = `# Python variables — no type declaration needed!
name = "Tariro"          # str  — text (string)
age = 14                 # int  — whole number
height = 1.62            # float — decimal number
is_student = True        # bool — True or False

# f-strings let you embed variables inside text
print(f"My name is {name} and I am {age} years old.")
print(f"I am {height} metres tall.")
print(f"Am I a student? {is_student}")

# You can change a variable's value at any time
age = age + 1
print(f"Next year I will be {age}.")`;

// ---------------------------------------------------------------------------
// Lesson 3 — Control flow
// ---------------------------------------------------------------------------

const CONTROL_FLOW_CODE = `# Control flow: if / elif / else + for loop

score = 73

# Conditional — decide which grade to print
if score >= 80:
    grade = "A"
elif score >= 60:
    grade = "B"
elif score >= 50:
    grade = "C"
else:
    grade = "F"

print(f"Score: {score} → Grade: {grade}")

# For loop — repeat for each item in a list
subjects = ["Maths", "Science", "English", "Art"]
print("\\nSubjects studied:")
for subject in subjects:
    print(f"  • {subject}")

# Range loop — count from 1 to 5
print("\\nCounting:")
for i in range(1, 6):
    print(i, end=" ")
print()  # newline at the end`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `# Mini quiz game — combines variables, input, conditions & loops

questions = [
    ("What is the capital of Zimbabwe?", "Harare"),
    ("How many sides does a hexagon have?", "6"),
    ("What color do you get mixing red and blue?", "purple"),
]

score = 0

print("=== RoboCode Quiz ===\\n")

for question, answer in questions:
    guess = input(question + " ").strip().lower()
    if guess == answer.lower():
        print("  Correct!\\n")
        score += 1
    else:
        print(f"  Not quite — the answer was: {answer}\\n")

print(f"You scored {score} out of {len(questions)}.")

if score == len(questions):
    print("Perfect score! Amazing work!")
elif score >= 1:
    print("Good effort — keep practising!")
else:
    print("Don't give up — try again!")`;

export const langPython: CourseModule = {
  meta: {
    title: "Python Basics",
    slug: "lang-python",
    track: "coding",
    level: "high",
    description: "Learn Python — the world's most popular beginner language — from your very first print() to a working quiz game.",
    coverImage: "/covers/coding.svg",
    order: 10,
  },
  lessons: [
    {
      title: "Hello, Python",
      slug: "hello-python",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is Python?

**Python** is a programming language invented in 1991 by Guido van Rossum. Today it is used everywhere — from web servers and robots to artificial intelligence and scientific research. You might have already used a tool powered by Python without knowing it!

Python is famous for reading almost like plain English, which makes it a brilliant first language. There are no curly braces or semicolons to worry about — just clean, readable lines of code.

### Where does Python run?

Python programs can run on almost any device: your laptop, a Raspberry Pi robot, a cloud server, or a data-science notebook. The diagram below shows a few places Python is used.`),
        svg(SVG_PYTHON_RUNS_EVERYWHERE, "Python powers laptops, servers, robots, and data science tools"),
        md(`### Your first program

The code below does two things:
1. Prints a greeting using \`print()\` — Python's built-in function for displaying text.
2. Calculates \`7 × 6\` and prints the result.

Press **Open in RoboCode Studio** to run it straight away, then try changing the numbers or the greeting text.`),
        code("python", HELLO_WORLD, { filename: "hello.py", openInStudio: true }),
        callout("tip", "In Python, indentation (the spaces at the start of a line) is part of the language. Everything inside a block — like the body of an if-statement or a loop — must be indented by the same amount. Four spaces is the standard."),
      ),
    },
    {
      title: "Variables & Types",
      slug: "python-variables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Storing data in variables

A **variable** is a name that points to a value stored in your computer's memory. In Python you create a variable simply by writing its name, an equals sign, and a value — no type declaration needed!

\`\`\`python
age = 14
\`\`\`

Python figures out the type automatically. This is called **dynamic typing**.

### The four core types

| Type | What it stores | Example |
|------|---------------|---------|
| \`str\` | Text (zero or more characters) | \`name = "Tariro"\` |
| \`int\` | Whole numbers | \`age = 14\` |
| \`float\` | Decimal numbers | \`height = 1.62\` |
| \`bool\` | True or False | \`is_student = True\` |

You can check a variable's type at any time with the built-in \`type()\` function:
\`\`\`python
print(type(age))    # <class 'int'>
\`\`\`

### f-strings — the easy way to mix text and variables

Prefix a string with \`f\` and put variable names inside \`{}\` curly braces:
\`\`\`python
print(f"My name is {name} and I am {age} years old.")
\`\`\`

Run the example below to see all of this in action.`),
        code("python", VARIABLES_CODE, { filename: "variables.py", openInStudio: true }),
        callout("info", "Variable names in Python are case-sensitive: score, Score, and SCORE are three different variables. By convention, use lowercase_with_underscores for variable names (this style is called snake_case)."),
      ),
    },
    {
      title: "Control Flow",
      slug: "python-control-flow",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Making decisions and repeating actions

Programs become powerful when they can **make choices** (conditionals) and **repeat actions** (loops).

### if / elif / else

Python's conditional uses \`if\`, \`elif\` (short for *else if*), and \`else\`:

\`\`\`python
if score >= 80:
    print("Great job!")
elif score >= 50:
    print("Keep practising.")
else:
    print("Don't give up!")
\`\`\`

Python checks conditions from top to bottom and runs the first block that is **True**.

### The for loop

A \`for\` loop repeats once for each item in a list or range:

\`\`\`python
for subject in ["Maths", "Science", "Art"]:
    print(subject)
\`\`\`

\`range(1, 6)\` produces the numbers 1, 2, 3, 4, 5 — useful for counting.

### Flowchart of the grade checker`),
        mermaid(
          `flowchart TD
  A([Start]) --> B[score = 73]
  B --> C{score >= 80?}
  C -- Yes --> D[grade = A]
  C -- No --> E{score >= 60?}
  E -- Yes --> F[grade = B]
  E -- No --> G{score >= 50?}
  G -- Yes --> H[grade = C]
  G -- No --> I[grade = F]
  D & F & H & I --> J[print grade]
  J --> K([Done])`,
          "Decision tree for the grade checker",
        ),
        code("python", CONTROL_FLOW_CODE, { filename: "control_flow.py", openInStudio: true }),
        callout("tip", "Notice that Python uses a colon (:) at the end of every if, elif, else, and for line. Forgetting the colon is one of the most common beginner mistakes — Python will tell you with a SyntaxError."),
      ),
    },
    {
      title: "Put It Together",
      slug: "python-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a mini quiz game

Now let's combine everything you have learned — variables, lists, loops, and conditionals — into a small but complete program: a quiz game.

### How it works

1. We store questions and their answers as pairs inside a **list of tuples**.
2. A \`for\` loop works through each question one at a time.
3. We read the player's answer with \`input()\`, then compare it to the correct answer.
4. A running \`score\` variable keeps track of correct answers.
5. At the end, an \`if / elif / else\` block prints a personalised message.

### Key new ideas

- **Tuples** — pairs written as \`(question, answer)\` that group related values.
- \`input()\` — reads a line of text typed by the user and returns it as a string.
- \`.strip().lower()\` — removes extra spaces and converts to lowercase so "Harare", "harare", and " HARARE " all match.
- \`len(list)\` — returns how many items are in a list.

Give it a try — you can add your own questions too!`),
        code("python", PUT_TOGETHER_CODE, { filename: "quiz_game.py", openInStudio: true }),
        callout("tip", "Real programs often start as simple scripts like this. Instagram, YouTube, and Spotify all started with small Python programs before they grew into the massive apps you use today. Every expert programmer began here — with a print() and a bit of curiosity."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 5 — What is a Framework?
    // -----------------------------------------------------------------------
    {
      title: "What is a Framework?",
      slug: "python-frameworks-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Frameworks: don't reinvent the wheel

Every web application needs the same building blocks: a way to handle HTTP requests, a way to talk to a database, a way to check whether a user is logged in, and a way to return responses. If you wrote all of that from scratch for every project, you would spend weeks before writing a single line of business logic.

A **framework** is a reusable foundation that provides those common building blocks for you. You add your own code on top; the framework handles the plumbing underneath.

Think of it like building a house. You could dig clay, fire bricks, and smelt steel yourself — or you could buy pre-made materials and focus on designing the rooms. Frameworks are those pre-made materials for software.

### Why frameworks matter

- **Speed** — Features that would take days to build from scratch are available in minutes.
- **Security** — Mature frameworks have already solved common vulnerabilities (SQL injection, cross-site scripting, session hijacking). Solving them yourself correctly is very hard.
- **Conventions** — A framework gives your project a standard structure. Any developer familiar with the framework can navigate your code immediately.
- **Community** — Popular frameworks have thousands of packages, tutorials, and answered questions on Stack Overflow.

### Types of Python frameworks

| Category | Description | Examples |
|----------|-------------|---------|
| Full-stack web | Routing, ORM, templates, admin panel — everything included | Django |
| Micro / minimal | Just routing and request handling — you choose the rest | Flask, Bottle |
| Async API | Built for high-throughput, non-blocking APIs | FastAPI, Starlette |
| Data / ML | Tools for data pipelines, model training, deployment | NumPy, scikit-learn, Keras |

**Micro frameworks** give you maximum flexibility — great for small APIs and learning. **Full-stack frameworks** ("batteries-included") give you everything configured out of the box — great for content-heavy sites and admin tools. **Async frameworks** are designed for handling thousands of simultaneous connections efficiently.

### How your code fits in`),
        mermaid(
          `flowchart LR
  A([Your Code]) --> B[Framework]
  B --> C[Routing]
  B --> D[Database ORM]
  B --> E[Authentication]
  B --> F[Request / Response]
  C & D & E & F --> G([HTTP Response to Browser])`,
          "Your code sits on top of the framework, which handles routing, database access, authentication, and HTTP responses",
        ),
        md(`### How to choose a framework

Ask yourself these questions:

1. **What am I building?** — A content website with an admin panel? Choose Django. A small REST API? Flask or FastAPI. A high-performance ML inference service? FastAPI.
2. **Do I need async?** — If you expect thousands of simultaneous users, or you are calling other APIs inside your handlers, an async framework (FastAPI) will serve you much better.
3. **How much do I want the framework to decide?** — Full-stack frameworks make many decisions for you (database adapter, template engine, admin). Micro-frameworks let you pick every component yourself.
4. **What does the team already know?** — The best framework is often the one your teammates are most productive with.

The next three lessons cover the three most important Python web frameworks: **Django**, **Flask**, and **FastAPI**. Each one targets a different sweet spot.`),
        callout("info", "A framework is not magic — it is just code written by other people that you import into your project. You can always read the framework's source code on GitHub to understand exactly what it is doing. This is one of the best ways to become a better programmer."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 6 — Django
    // -----------------------------------------------------------------------
    {
      title: "Django",
      slug: "python-fw-django",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Django: batteries included

**Django** is a full-stack web framework released in 2005. Its motto is *"the web framework for perfectionists with deadlines"* — it ships with almost everything a web application could need, configured and ready to go.

### Use cases — when to pick Django

- **Content-driven websites** — blogs, news sites, e-commerce stores where you have many database models and need an admin interface fast.
- **Admin-heavy applications** — Django's auto-generated admin panel lets non-technical staff manage data without writing any code.
- **Projects that follow conventions** — Django enforces a clear project structure (models → views → URLs → templates), making it easy for a new developer to understand the codebase.
- **Teams that want an ORM included** — Django's ORM maps Python classes directly to database tables; you rarely write raw SQL.

Django is used in production by Instagram, Pinterest, Disqus, and the Washington Post.

### Key components

| Component | What it does |
|-----------|-------------|
| ORM | Maps Python classes to database tables; handles migrations |
| Views | Python functions or classes that receive a request and return a response |
| URL dispatcher | Maps URL patterns to view functions |
| Templates | HTML files with a simple template language for dynamic content |
| Admin | Auto-generated management interface for your database models |
| Auth | User registration, login, logout, permissions — all built in |

### Getting started

\`\`\`bash
pip install django
django-admin startproject mysite
cd mysite
python manage.py runserver
\`\`\`

Open \`http://127.0.0.1:8000/\` in your browser — you will see the Django welcome page.

### A minimal view and URL

The example below creates a single page that says hello. In Django you write a **view** function, then wire it to a URL pattern.`),
        code("python", "# views.py\nfrom django.http import HttpResponse\nfrom django.urls import path\n\n# A view is any callable that takes a request and returns a response.\ndef hello(request):\n    name = request.GET.get(\"name\", \"World\")\n    return HttpResponse(f\"<h1>Hello, {name}!</h1>\")\n\n# urls.py  (wire the view to a URL path)\nurlpatterns = [\n    path(\"hello/\", hello),\n]\n\n# Run with:\n#   python manage.py runserver\n# Then visit: http://127.0.0.1:8000/hello/?name=Tariro", { filename: "django_hello.py", openInStudio: true }),
        md(`### Models — the heart of Django

Django's ORM lets you describe your database tables as Python classes:

\`\`\`python
# models.py
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    published_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
\`\`\`

Run \`python manage.py makemigrations\` and \`python manage.py migrate\` to create the corresponding database table. From that point on you can query articles like this:

\`\`\`python
Article.objects.all()                          # all articles
Article.objects.filter(title__contains="AI")  # filtered
\`\`\`

No SQL required.`),
        callout("tip", "Django's built-in admin panel is one of its killer features. After registering your model with admin.site.register(Article), visiting /admin/ gives you a full create/read/update/delete interface for free. It is perfect for internal tools and content management."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 7 — Flask
    // -----------------------------------------------------------------------
    {
      title: "Flask",
      slug: "python-fw-flask",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Flask: the micro-framework

**Flask** is a lightweight web framework released in 2010. Where Django gives you everything, Flask gives you only the essentials: URL routing and request/response handling. Every other component — database layer, authentication, form validation — is optional, and you choose which library to add.

### Use cases — when to pick Flask

- **Small REST APIs** — a handful of endpoints that serve JSON to a mobile app or a React frontend.
- **Rapid prototypes** — you can have a working server in under 20 lines of code.
- **Learning projects** — Flask's simplicity makes it easier to understand what is actually happening under the hood.
- **Flexible architectures** — when you want to pick your own ORM (SQLAlchemy, Peewee), your own auth library, and your own templating engine.
- **Microservices** — one Flask app per service, each doing one thing well.

### Getting started

\`\`\`bash
pip install flask
\`\`\`

No project generator needed — just create a single Python file and run it.

### Hello World and a JSON endpoint`),
        code("python", "# app.py\nfrom flask import Flask, jsonify, request\n\napp = Flask(__name__)\n\n# Route 1 — plain HTML response\n@app.route(\"/\")\ndef home():\n    return \"<h1>Hello from Flask!</h1>\"\n\n# Route 2 — JSON response (great for APIs)\n@app.route(\"/greet\")\ndef greet():\n    name = request.args.get(\"name\", \"World\")\n    return jsonify({\"message\": f\"Hello, {name}!\", \"status\": \"ok\"})\n\n# Route 3 — POST endpoint that reads JSON from the request body\n@app.route(\"/echo\", methods=[\"POST\"])\ndef echo():\n    data = request.get_json()\n    return jsonify({\"you_sent\": data})\n\nif __name__ == \"__main__\":\n    # Run with: python app.py\n    # Visit: http://127.0.0.1:5000/greet?name=Tariro\n    app.run(debug=True)", { filename: "flask_app.py", openInStudio: true }),
        md(`### Adding a database with Flask-SQLAlchemy

Flask does not include an ORM, but the popular \`Flask-SQLAlchemy\` extension adds one:

\`\`\`bash
pip install flask-sqlalchemy
\`\`\`

\`\`\`python
from flask_sqlalchemy import SQLAlchemy

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data.db"
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
\`\`\`

This pattern — a small core with optional extensions — is Flask's philosophy. You only add what you actually need.

### Flask vs Django at a glance

| | Flask | Django |
|---|---|---|
| Size | ~2 000 lines of core code | ~250 000+ lines |
| Includes ORM | No (choose your own) | Yes |
| Includes admin panel | No | Yes |
| Includes auth | No | Yes |
| Best for | APIs, microservices, prototypes | Full-featured web apps |
| Learning curve | Lower | Higher (more to learn upfront) |`),
        callout("info", "Flask's debug mode (app.run(debug=True)) automatically reloads the server when you save a file, and shows a detailed error page in the browser when something goes wrong. Only use debug mode during development — never in production, because it exposes your source code to anyone who triggers an error."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 8 — FastAPI
    // -----------------------------------------------------------------------
    {
      title: "FastAPI",
      slug: "python-fw-fastapi",
      contentType: "markdown",
      estMinutes: 13,
      body: body(
        md(`## FastAPI: modern, fast, and self-documenting

**FastAPI** is an async web framework released in 2018. It is built on top of **Starlette** (for the async web layer) and **Pydantic** (for data validation), and it uses Python's **type hints** to automatically validate requests, serialize responses, and generate interactive documentation.

It is one of the fastest Python web frameworks available — benchmarks consistently put it alongside Node.js and Go for raw throughput.

### Use cases — when to pick FastAPI

- **High-performance REST APIs** — async I/O means a single process can handle thousands of simultaneous requests without blocking.
- **ML model serving** — expose a machine-learning model as an HTTP endpoint; FastAPI handles batching, validation, and serialization cleanly.
- **Microservices that talk to databases or other APIs** — async makes it efficient to await many operations concurrently.
- **Teams that value type safety** — type hints catch bugs at development time and serve as living documentation.
- **Any project that needs automatic OpenAPI documentation** — FastAPI generates a /docs page with a full interactive API explorer at zero extra cost.

### Getting started

\`\`\`bash
pip install fastapi uvicorn
\`\`\`

**Uvicorn** is a lightning-fast ASGI server that runs your FastAPI application.

### A typed endpoint with automatic validation`),
        code("python", "# main.py\nfrom fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\nfrom typing import Optional\n\napp = FastAPI(title=\"RoboCode API\", version=\"1.0\")\n\n# Pydantic model — defines the shape of a request body\nclass Student(BaseModel):\n    name: str\n    age: int\n    school: Optional[str] = None\n\n# GET endpoint — path parameter is automatically validated as int\n@app.get(\"/students/{student_id}\")\nasync def get_student(student_id: int):\n    if student_id < 1:\n        raise HTTPException(status_code=404, detail=\"Student not found\")\n    # In a real app you would query the database here\n    return {\"id\": student_id, \"name\": \"Tariro\", \"school\": \"RoboCode Academy\"}\n\n# POST endpoint — FastAPI validates the request body against Student automatically\n@app.post(\"/students\", status_code=201)\nasync def create_student(student: Student):\n    # FastAPI guarantees student.name is a str and student.age is an int\n    return {\"message\": f\"Created student {student.name}\", \"data\": student}\n\n# Run with:\n#   uvicorn main:app --reload\n# Then visit:\n#   http://127.0.0.1:8000/docs   <-- interactive Swagger UI\n#   http://127.0.0.1:8000/redoc <-- ReDoc documentation", { filename: "fastapi_main.py", openInStudio: true }),
        md(`### Why type hints matter here

In vanilla Python, type hints are optional comments that most tools ignore at runtime. FastAPI is different — it reads your type hints at startup and uses them to:

1. **Validate** incoming data (if a client sends \`age: "hello"\` FastAPI automatically returns a 422 error with a clear message).
2. **Serialize** your return values to JSON.
3. **Document** every field — name, type, whether it is required, and what the default is.

This means the \`Student\` model above doubles as both a validator and documentation with no extra effort.

### Async I/O — why it matters

Traditional web frameworks handle each request in its own thread. Threads have overhead, and you can only run so many at once. FastAPI uses Python's \`async/await\` syntax to handle many requests in a single thread:

\`\`\`python
@app.get("/data")
async def fetch_data():
    result = await database.fetch_one("SELECT * FROM table WHERE id = 1")
    return result
\`\`\`

While waiting for the database, FastAPI's event loop handles other incoming requests. This makes FastAPI extremely efficient for I/O-bound workloads like APIs that read from databases or call third-party services.`),
        callout("tip", "After starting your FastAPI app with uvicorn, navigate to http://127.0.0.1:8000/docs. You will see a full interactive Swagger UI where you can try every endpoint directly in the browser — no Postman or curl needed. This automatic documentation is generated entirely from your code's type hints and is always up to date."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Sum to 100",
      slug: "challenge-python",
      description: "Write a program that prints the sum of all whole numbers from 1 to 100.",
      track: "coding",
      difficulty: "beginner",
      points: 50,
      language: "python",
      starterCode: "# Print the sum of every number from 1 to 100\ntotal = 0\nfor n in range(1, 101):\n    pass  # add n to total\nprint(total)\n",
      checks: { rules: [{ type: "stdout_contains", value: "5050" }] },
    },
  ],
};
