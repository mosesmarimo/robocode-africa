import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, CSS
// ---------------------------------------------------------------------------

const HELLO_CSS = `/* Style an h1 heading with colour, font size, and centre-alignment */
h1 {
  color: #2563eb;        /* a nice blue */
  font-size: 2.5rem;     /* 2.5× the root font size */
  text-align: center;
  font-family: sans-serif;
  letter-spacing: 2px;
}`;

const SVG_CSS_LAYERS = `<svg viewBox="0 0 600 220" role="img" aria-label="HTML provides structure, CSS adds style, JavaScript adds behaviour" xmlns="http://www.w3.org/2000/svg">
  <!-- Layer 1: HTML -->
  <rect x="60" y="150" width="480" height="50" rx="8" fill="#f97316" opacity="0.9"/>
  <text x="290" y="181" font-family="sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">HTML — Structure</text>
  <!-- Layer 2: CSS -->
  <rect x="80" y="90" width="440" height="50" rx="8" fill="#2563eb" opacity="0.9"/>
  <text x="290" y="121" font-family="sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">CSS — Style &amp; Layout</text>
  <!-- Layer 3: JS -->
  <rect x="100" y="30" width="400" height="50" rx="8" fill="#eab308" opacity="0.9"/>
  <text x="290" y="61" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1a1a1a" text-anchor="middle">JavaScript — Behaviour</text>
  <!-- arrows -->
  <polygon points="290,28 280,10 300,10" fill="#6b7280"/>
  <line x1="290" y1="10" x2="290" y2="28" stroke="#6b7280" stroke-width="2"/>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Selectors & Properties
// ---------------------------------------------------------------------------

const SELECTORS_CODE = `/* ── Element selector ──────────────────────────────── */
p {
  color: #374151;
  line-height: 1.7;
}

/* ── Class selector (the dot) ──────────────────────── */
.highlight {
  background-color: #fef9c3;   /* pale yellow */
  padding: 4px 8px;
  border-radius: 4px;
}

/* ── ID selector (the hash) ────────────────────────── */
#main-title {
  font-size: 2rem;
  text-transform: uppercase;
  color: #1e40af;
}

/* ── Pseudo-class — style on hover ─────────────────── */
a:hover {
  color: #dc2626;
  text-decoration: underline;
}`;

// ---------------------------------------------------------------------------
// Lesson 3 — The Box Model & Layout
// ---------------------------------------------------------------------------

const BOX_MODEL_CODE = `/* Every HTML element is a box with four areas */

.card {
  /* Content area */
  width: 280px;

  /* Padding — space inside the border */
  padding: 16px 24px;

  /* Border — the visible edge */
  border: 2px solid #2563eb;
  border-radius: 12px;

  /* Margin — space outside the border */
  margin: 20px auto;

  /* Background fills the content + padding areas */
  background-color: #eff6ff;

  /* Flexbox to centre the text */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.card h2 {
  margin: 0;
  color: #1e40af;
}

.card p {
  margin: 0;
  color: #4b5563;
  font-size: 0.95rem;
}`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put It Together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `/* ══════════════════════════════════════════
   A simple styled "profile card" page
   ══════════════════════════════════════════ */

/* Reset browser defaults */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: sans-serif;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* The card */
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 32px 40px;
  width: 320px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* Avatar circle */
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.profile-card h1 {
  font-size: 1.4rem;
  color: #111827;
  margin-bottom: 4px;
}

.profile-card .role {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

/* Tag badges */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.tag {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 4px 14px;
  font-size: 0.8rem;
}`;

export const langCss: CourseModule = {
  meta: {
    title: "CSS Basics",
    slug: "lang-css",
    track: "coding",
    level: "high",
    description: "Learn how to make web pages beautiful — colours, layouts, animations, and more — using CSS.",
    coverImage: "/covers/coding.svg",
    order: 14,
  },
  lessons: [
    {
      title: "Hello, CSS",
      slug: "hello-css",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is CSS?

**CSS** stands for *Cascading Style Sheets*. It is the language that makes web pages look good — controlling colours, fonts, spacing, and layout.

Think of building a web page like building a house. **HTML** is the bricks and timber (the structure), **CSS** is the paint and furniture (the style), and **JavaScript** is the electricity and plumbing (the behaviour). The diagram below shows how the three layers stack up.`),
        svg(SVG_CSS_LAYERS, "The three layers of a web page: HTML, CSS, and JavaScript"),
        md(`### How CSS works

A CSS file is made up of **rules**. Each rule has two parts:

1. A **selector** — which HTML element(s) to style.
2. A **declaration block** — one or more *property: value* pairs inside \`{}\`.

\`\`\`css
h1 {
  color: blue;
  font-size: 2rem;
}
\`\`\`

Here \`h1\` is the selector, \`color\` and \`font-size\` are properties, and \`blue\` / \`2rem\` are the values.

### Your first CSS snippet

The code below styles an \`<h1>\` tag — the same one you would put in an HTML file like \`<h1>Hello!</h1>\`. Press **Open in RoboCode Studio** to see the styles applied live, then try changing the \`color\` or \`font-size\`.`),
        code("css", HELLO_CSS, { filename: "style.css", openInStudio: true }),
        callout("tip", "CSS colours can be written as named colours (red, blue, green), hex codes (#2563eb), or rgb() values. Hex codes give you millions of exact shades — tools like coolors.co or the VS Code colour picker make choosing them easy."),
      ),
    },
    {
      title: "Selectors & Properties",
      slug: "css-selectors",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Targeting elements with selectors

A **selector** tells the browser which HTML elements a rule applies to. There are three core selector types you will use constantly.

| Selector type | Syntax | Example target |
|---|---|---|
| **Element** | \`tagname\` | \`p { }\` → every \`<p>\` tag |
| **Class** | \`.classname\` | \`.highlight { }\` → any element with \`class="highlight"\` |
| **ID** | \`#idname\` | \`#main-title { }\` → the unique element with \`id="main-title"\` |
| **Pseudo-class** | \`selector:state\` | \`a:hover { }\` → a link while the mouse is over it |

**When to use which?**
- Use *element selectors* for global defaults (all paragraphs, all headings).
- Use *class selectors* for reusable styles you apply to many elements.
- Use *ID selectors* sparingly — IDs must be unique on a page.

### Common properties

Here are some of the most useful CSS properties for beginners:

- \`color\` — text colour
- \`background-color\` — background fill
- \`font-size\` — text size (\`rem\`, \`px\`, or \`%\`)
- \`font-weight\` — boldness (\`normal\`, \`bold\`, or a number like \`600\`)
- \`padding\` — inner spacing between content and border
- \`margin\` — outer spacing around an element
- \`border-radius\` — rounds the corners of a box

Run the example to see all four selector types in action.`),
        code("css", SELECTORS_CODE, { filename: "selectors.css", openInStudio: true }),
        callout("info", "CSS has hundreds of properties, but you only need about 30 of them for 90% of everyday work. Focus on colour, typography, spacing, and layout — the rest you can look up as you need them."),
      ),
    },
    {
      title: "The Box Model & Layout",
      slug: "css-box-model",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## The Box Model

Every element in a web page is a rectangular **box**. CSS's *box model* defines four areas around that box — from the inside out:

1. **Content** — the actual text or image.
2. **Padding** — transparent space between the content and the border.
3. **Border** — a visible line (or invisible, if you set it to none).
4. **Margin** — transparent space that pushes other elements away.

The diagram below shows these layers:`),
        mermaid(
          `block-beta
  columns 1
  M["Margin (pushes other elements away)"]
  B["Border (the visible edge)"]
  P["Padding (inside the border)"]
  C["Content (text / image)"]`,
          "The four areas of the CSS Box Model, from outside to inside",
        ),
        md(`### Flexbox — modern layout in one line

Before Flexbox, arranging items side-by-side required hacky workarounds. Today you just write:

\`\`\`css
.container {
  display: flex;
  gap: 16px;            /* space between children */
  justify-content: center; /* horizontal alignment */
  align-items: center;     /* vertical alignment */
}
\`\`\`

The example below builds a card using both the box model and Flexbox. Open it in Studio and try adjusting the \`padding\`, \`border-radius\`, and \`gap\` values.`),
        code("css", BOX_MODEL_CODE, { filename: "box-model.css", openInStudio: true }),
      ),
    },
    {
      title: "Put It Together",
      slug: "css-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Build a profile card

Let's use everything you have learned — selectors, box model, Flexbox, and typography — to build a polished profile card.

### What this page does

- **Reset** — \`* { box-sizing: border-box }\` makes sizing predictable for every element.
- **Body as a Flex container** — centres the card both vertically and horizontally on the screen.
- **Card** — \`border-radius\` and \`box-shadow\` give it a modern, "floating" look.
- **Avatar circle** — a \`border-radius: 50%\` on a square \`div\` creates a perfect circle.
- **Tag badges** — \`border-radius: 999px\` on small spans creates pill-shaped labels.

### Things to try

1. Change the avatar's \`background\` colour and the emoji inside it.
2. Add more \`.tag\` spans with your own interests.
3. Change \`box-shadow\` intensity to \`0 8px 40px rgba(0,0,0,0.2)\`.

Open in Studio and make it your own!`),
        code("css", PUT_TOGETHER_CODE, { filename: "profile-card.css", openInStudio: true }),
        callout("tip", "Real-world CSS is almost always combined with HTML. In your Studio project, create an index.html that links to this stylesheet with <link rel=\"stylesheet\" href=\"profile-card.css\"> and add the matching HTML elements to see everything come to life."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 5 — What is a CSS Framework?
    // -------------------------------------------------------------------------
    {
      title: "What is a CSS Framework?",
      slug: "css-frameworks-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## CSS Frameworks — ready-made styles for the web

Writing CSS from scratch is powerful, but it takes time. A **CSS framework** is a pre-built collection of styles, utility classes, and sometimes interactive components that you drop into your project so you can build good-looking, consistent interfaces without writing every rule by hand.

### Why use a framework?

- **Speed** — common patterns (buttons, cards, navbars, grids) already exist. You assemble them rather than invent them.
- **Consistency** — every page uses the same spacing scale, colour palette, and typography rules, so your UI looks coherent without extra effort.
- **Responsive grids** — most frameworks include a 12-column or flexbox/grid system that automatically adapts to phone, tablet, and desktop screen sizes.
- **Cross-browser stability** — framework authors have already tested their styles across browsers and ironed out the quirks.

### The three main types of CSS framework

There are three philosophies, and understanding the difference helps you pick the right tool.

**1. Component frameworks (e.g. Bootstrap, Foundation)**
Ship ready-made UI components with fixed HTML structure and class names. Add the right classes and you instantly get a styled navbar, modal, or accordion. Great for speed; can be harder to customise to a unique brand.

**2. Utility-first frameworks (e.g. Tailwind CSS)**
Provide hundreds of tiny single-purpose classes (e.g. \`p-4\` for padding, \`text-blue-500\` for colour). You compose designs directly in HTML without ever writing a separate CSS file. Highly flexible; the HTML can look verbose to beginners.

**3. Lightweight / minimalist frameworks (e.g. Bulma, Pico CSS)**
A middle ground — clean defaults, a readable class system, no or minimal JavaScript dependency, and a smaller file size. Good for learners and projects that need a clean base without the full Bootstrap machinery.

### How to choose

The diagram below maps the three types against two axes — how much customisation you need vs. how quickly you want to start:`),
        mermaid(
          `quadrantChart
  title CSS Framework Types
  x-axis "Low customisation need" --> "High customisation need"
  y-axis "Slower to start" --> "Faster to start"
  quadrant-1 Utility-first (Tailwind)
  quadrant-2 Component (Bootstrap)
  quadrant-3 Lightweight (Bulma)
  quadrant-4 Raw CSS
  Bootstrap: [0.25, 0.85]
  Tailwind: [0.80, 0.70]
  Bulma: [0.45, 0.65]
  Raw CSS: [0.90, 0.15]`,
          "Where the major CSS frameworks sit on the speed-vs-customisation spectrum",
        ),
        md(`### Quick reference

| Framework | Type | JS included? | Best for |
|---|---|---|---|
| **Bootstrap** | Component | Yes (optional) | Dashboards, admin panels, quick prototypes |
| **Tailwind CSS** | Utility-first | No | Custom designs, design systems, long-lived projects |
| **Bulma** | Lightweight component | No | Clean responsive layouts, beginners, no-JS projects |

The next three lessons take each framework hands-on. You will build a real HTML page with each one.`),
        callout("info", "You do not have to choose just one forever. Many teams use Tailwind for custom public-facing pages and Bootstrap or Bulma for internal admin tools. Understanding all three makes you a more versatile developer."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 6 — Bootstrap
    // -------------------------------------------------------------------------
    {
      title: "Bootstrap",
      slug: "css-fw-bootstrap",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Bootstrap — the classic component framework

**Bootstrap** was created by Twitter engineers in 2011 and is still one of the most widely used CSS frameworks in the world. It ships a complete set of styled HTML components — navbars, buttons, cards, modals, forms, alerts, badges, and more — along with a powerful 12-column responsive grid system.

### Use cases

Bootstrap shines when you need to move fast and the design does not need to be radically unique:

- **Admin dashboards and back-office tools** — the component library covers 95% of what you need without any custom CSS.
- **Rapid prototypes** — spin up a visually coherent multi-page prototype in an afternoon.
- **Team projects** — Bootstrap's well-documented classes give every team member a shared vocabulary.
- **Legacy enterprise projects** — Bootstrap 3/4/5 has enormous community and Stack Overflow support.

Bootstrap is a poorer fit when your design brief demands something visually distinct, because the "Bootstrap look" is recognisable and overriding its opinionated defaults takes extra effort.

### Setup — CDN (quickest)

No installation needed. Add one \`<link>\` in your HTML \`<head>\` and you are done:

\`\`\`html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
>
\`\`\`

For interactive components (dropdowns, modals), also add the JS bundle before \`</body>\`:

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
\`\`\`

For production projects, install via npm (\`npm install bootstrap\`) and import only what you use.

### Key class patterns

| Pattern | Example class | Effect |
|---|---|---|
| Grid column | \`col-md-6\` | Half-width column on medium+ screens |
| Button | \`btn btn-primary\` | Solid blue button |
| Alert | \`alert alert-warning\` | Yellow warning banner |
| Card | \`card\`, \`card-body\` | White card with padding |
| Spacing | \`mt-3\`, \`px-4\` | Margin-top / padding-x using a 0–5 scale |

### Hands-on example

The page below builds a realistic Bootstrap layout: a fixed top navbar, a hero section, and a three-column card grid. Open it in Studio and try swapping \`btn-primary\` for \`btn-success\` or adding \`shadow-sm\` to the cards.`),
        code("html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bootstrap Demo</title>
  <!-- Bootstrap 5 CSS via CDN -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
  />
</head>
<body>

  <!-- ── Navbar ─────────────────────────────────────────────────────── -->
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand fw-bold" href="#">RoboCode</a>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navMenu"
        aria-controls="navMenu"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><a class="nav-link active" href="#">Home</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Courses</a></li>
          <li class="nav-item"><a class="nav-link" href="#">About</a></li>
        </ul>
      </div>
    </div>
  </nav>

  <!-- ── Hero ───────────────────────────────────────────────────────── -->
  <div class="bg-light py-5 text-center">
    <div class="container">
      <h1 class="display-5 fw-bold text-primary mb-3">Learn to code with Bootstrap</h1>
      <p class="lead text-secondary mb-4">
        Bootstrap gives you a 12-column responsive grid, polished components,
        and consistent spacing — all without writing a single line of CSS.
      </p>
      <a href="#courses" class="btn btn-primary btn-lg me-2">Get started</a>
      <a href="#" class="btn btn-outline-secondary btn-lg">View docs</a>
    </div>
  </div>

  <!-- ── Card grid ──────────────────────────────────────────────────── -->
  <div class="container py-5" id="courses">
    <h2 class="text-center mb-4">Popular Courses</h2>
    <div class="row g-4">

      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">HTML Basics</h5>
            <p class="card-text text-muted">
              Build the structure of any web page from scratch using semantic HTML5 elements.
            </p>
          </div>
          <div class="card-footer">
            <span class="badge bg-success">Beginner</span>
            <span class="ms-2 text-muted small">8 lessons</span>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">CSS Fundamentals</h5>
            <p class="card-text text-muted">
              Style your pages with colours, fonts, the box model, and Flexbox layout.
            </p>
          </div>
          <div class="card-footer">
            <span class="badge bg-success">Beginner</span>
            <span class="ms-2 text-muted small">10 lessons</span>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">JavaScript Essentials</h5>
            <p class="card-text text-muted">
              Add interactivity — handle events, manipulate the DOM, and fetch data from APIs.
            </p>
          </div>
          <div class="card-footer">
            <span class="badge bg-warning text-dark">Intermediate</span>
            <span class="ms-2 text-muted small">12 lessons</span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Bootstrap JS bundle (needed for navbar collapse on mobile) -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`, { filename: "bootstrap-demo.html", openInStudio: true }),
        callout("tip", "Bootstrap's spacing classes follow a 0–5 scale where each step is 0.25 rem (4 px). So mt-3 means margin-top: 0.75rem, px-4 means padding-left + padding-right: 1.5rem each. Memorise the scale and you will rarely need to write custom spacing CSS again."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 7 — Tailwind CSS
    // -------------------------------------------------------------------------
    {
      title: "Tailwind CSS",
      slug: "css-fw-tailwind",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Tailwind CSS — utility-first design

**Tailwind CSS** takes a different approach from Bootstrap. Instead of giving you pre-built components, Tailwind gives you hundreds of small, single-purpose **utility classes** — one class for each CSS property value — and you compose your design directly in HTML.

For example, instead of writing this custom CSS:

\`\`\`css
.button {
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
}
\`\`\`

You write this in HTML:

\`\`\`html
<button class="bg-blue-600 text-white px-4 py-2 rounded font-semibold">
  Click me
</button>
\`\`\`

### Use cases

Tailwind is the right choice when:

- You are building a **custom-branded product** and do not want to fight framework defaults.
- You are working on a **design system** where each component needs precise, repeatable styling.
- You want **co-location** — keeping styles right next to the markup that uses them, so you never lose track of what CSS applies where.
- You are using a **component framework** like React or Vue, where each component is self-contained anyway.
- You want to **avoid dead CSS** — Tailwind's build step scans your files and ships only the classes you actually used (often < 10 kB gzipped).

Tailwind is a poorer fit for quick throw-away prototypes where typing lots of class names feels slow, or for teams that strongly prefer writing traditional CSS files.

### Setup

**Quick start with CDN (no build step):**

\`\`\`html
<script src="https://cdn.tailwindcss.com"></script>
\`\`\`

Add that one script tag and every Tailwind utility class is available instantly. This is great for learning and prototyping, but the CDN version is large (~350 kB) because it includes every possible class.

**Production setup with Vite (recommended):**

\`\`\`bash
npm create vite@latest my-app
npm install tailwindcss @tailwindcss/vite
\`\`\`

Then import Tailwind in your CSS entry point:

\`\`\`css
@import "tailwindcss";
\`\`\`

The build step tree-shakes unused classes, leaving a tiny CSS file.

### Key utility class groups

| Category | Example classes | What they do |
|---|---|---|
| **Spacing** | \`p-4\`, \`mt-2\`, \`gap-6\` | Padding, margin, grid/flex gap |
| **Colour** | \`bg-slate-100\`, \`text-blue-600\` | Background and text colour |
| **Typography** | \`text-xl\`, \`font-bold\`, \`tracking-wide\` | Size, weight, letter-spacing |
| **Layout** | \`flex\`, \`grid\`, \`items-center\`, \`justify-between\` | Flexbox and Grid |
| **Borders** | \`border\`, \`rounded-lg\`, \`border-gray-200\` | Border width, radius, colour |
| **Responsive** | \`md:grid-cols-2\`, \`lg:text-2xl\` | Apply classes at breakpoints |

### Hands-on example

The page below is styled **entirely with Tailwind utility classes** — no separate CSS file at all. Notice how every design decision (colour, spacing, layout) is visible directly in the HTML.`),
        code("html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tailwind CSS Demo</title>
  <!-- Tailwind CSS via CDN (great for learning; use a build step in production) -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 min-h-screen font-sans text-slate-800">

  <!-- ── Navbar ─────────────────────────────────────────────────────── -->
  <header class="bg-white border-b border-slate-200 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <span class="text-xl font-bold text-blue-600">RoboCode</span>
      <nav class="flex gap-6 text-sm font-medium text-slate-600">
        <a href="#" class="hover:text-blue-600 transition-colors">Home</a>
        <a href="#" class="hover:text-blue-600 transition-colors">Courses</a>
        <a href="#" class="hover:text-blue-600 transition-colors">About</a>
      </nav>
      <a
        href="#"
        class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        Sign up free
      </a>
    </div>
  </header>

  <!-- ── Hero ───────────────────────────────────────────────────────── -->
  <section class="max-w-3xl mx-auto text-center px-6 py-20">
    <span class="inline-block bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
      Utility-first CSS
    </span>
    <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
      Build anything without<br/>writing CSS
    </h1>
    <p class="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
      Tailwind's utility classes let you design directly in HTML.
      Every spacing value, colour, and layout decision is one class away.
    </p>
    <div class="flex flex-wrap gap-3 justify-center">
      <a href="#" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow">
        Get started
      </a>
      <a href="#" class="bg-white hover:bg-slate-100 text-slate-700 font-semibold px-6 py-3 rounded-xl border border-slate-200 transition-colors">
        Read the docs
      </a>
    </div>
  </section>

  <!-- ── Feature cards ──────────────────────────────────────────────── -->
  <section class="max-w-5xl mx-auto px-6 pb-20">
    <h2 class="text-2xl font-bold text-center text-slate-900 mb-10">Why developers love Tailwind</h2>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl mb-4">
          ⚡
        </div>
        <h3 class="font-semibold text-slate-900 mb-2">No more context switching</h3>
        <p class="text-sm text-slate-500 leading-relaxed">
          Style elements directly in HTML. No jumping between files to find where a class is defined.
        </p>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div class="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl mb-4">
          📦
        </div>
        <h3 class="font-semibold text-slate-900 mb-2">Tiny production builds</h3>
        <p class="text-sm text-slate-500 leading-relaxed">
          The build tool removes every class you did not use. Most production sites ship under 10 kB of CSS.
        </p>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xl mb-4">
          🎨
        </div>
        <h3 class="font-semibold text-slate-900 mb-2">Fully customisable</h3>
        <p class="text-sm text-slate-500 leading-relaxed">
          Define your own colour palette, font sizes, and spacing scale. Tailwind adapts to your brand.
        </p>
      </div>

    </div>
  </section>

</body>
</html>`, { filename: "tailwind-demo.html", openInStudio: true }),
        callout("info", "Utility-first vs component classes: Bootstrap gives you btn btn-primary — a pre-styled component class. Tailwind gives you bg-blue-600 text-white px-4 py-2 rounded — individual utilities you compose yourself. The component approach is faster to start; the utility approach gives you more design freedom and produces less dead CSS over time."),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 8 — Bulma
    // -------------------------------------------------------------------------
    {
      title: "Bulma",
      slug: "css-fw-bulma",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Bulma — modern, lightweight, and JavaScript-free

**Bulma** is an open-source CSS framework built entirely on **Flexbox**. It was designed from the ground up to be clean, readable, and easy to learn — with no JavaScript bundled at all. Every component is pure CSS, which means it works with any JavaScript library (or none).

Bulma's class names read almost like plain English: \`column is-half\`, \`button is-primary is-large\`, \`notification is-warning\`. This makes it especially approachable for beginners coming from HTML.

### Use cases

Bulma is a great fit when:

- You need a **clean, responsive layout** without Bootstrap's heavier aesthetic.
- You are building a project that already has its own JavaScript (React, Vue, plain JS) and you do not want a framework's JS bundle interfering.
- You want a **fast learning curve** — Bulma's modifier system (\`is-*\`, \`has-*\`) is very consistent, so once you learn the pattern it applies everywhere.
- You are building **documentation sites, portfolios, or small SaaS landing pages** that benefit from a polished base without a heavy footprint.
- You are teaching or learning CSS frameworks, because Bulma's structure makes the relationship between classes and layout immediately visible.

Bulma is a poorer fit if you need rich interactive widgets (modals, dropdowns with keyboard support) out of the box — you would need to add JavaScript yourself or reach for a Bulma extension library.

### Setup

**CDN (quickest):**

\`\`\`html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css"
/>
\`\`\`

**npm:**

\`\`\`bash
npm install bulma
\`\`\`

Then import in your CSS or JS entry point:

\`\`\`css
@import "bulma/css/bulma.css";
\`\`\`

Bulma also ships Sass source files, so you can override variables (colours, fonts, border radii) before the framework compiles.

### Key class patterns

| Pattern | Example | Effect |
|---|---|---|
| Column grid | \`columns\` + \`column is-4\` | Flexbox grid; \`is-4\` = 4/12 width |
| Button | \`button is-link\` | Styled button |
| Card | \`card\`, \`card-content\` | Bordered card container |
| Notification | \`notification is-info\` | Coloured alert box |
| Hero | \`hero is-primary\`, \`hero-body\` | Full-width coloured banner section |
| Modifier sizes | \`is-small\`, \`is-medium\`, \`is-large\` | Resize most components |

### Hands-on example

The page below uses Bulma's hero, columns, and card components to create a clean responsive layout. No JavaScript needed — every component is pure CSS.`),
        code("html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bulma Demo</title>
  <!-- Bulma CSS via CDN — no JavaScript required -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css"
  />
</head>
<body>

  <!-- ── Navbar ─────────────────────────────────────────────────────── -->
  <nav class="navbar is-white has-shadow" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item has-text-weight-bold has-text-primary" href="#">
        RoboCode
      </a>
    </div>
    <div class="navbar-menu">
      <div class="navbar-end">
        <a class="navbar-item" href="#">Home</a>
        <a class="navbar-item" href="#">Courses</a>
        <a class="navbar-item" href="#">About</a>
        <div class="navbar-item">
          <a class="button is-primary is-small" href="#">Sign up free</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- ── Hero ───────────────────────────────────────────────────────── -->
  <section class="hero is-primary is-medium">
    <div class="hero-body">
      <div class="container has-text-centered">
        <p class="title is-2">Learn web development with Bulma</p>
        <p class="subtitle is-5 mt-3">
          Bulma is a modern CSS framework that uses Flexbox — no JavaScript required.
          Clean classes, beautiful defaults, and easy to customise.
        </p>
        <div class="buttons is-centered mt-5">
          <a class="button is-white is-medium" href="#">Get started</a>
          <a class="button is-light is-outlined is-medium" href="#">View courses</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Course cards ───────────────────────────────────────────────── -->
  <section class="section">
    <div class="container">
      <h2 class="title is-4 has-text-centered mb-6">Popular Courses</h2>
      <div class="columns is-multiline">

        <div class="column is-4">
          <div class="card">
            <div class="card-content">
              <p class="title is-5">HTML Basics</p>
              <p class="subtitle is-6 has-text-grey">
                Learn to structure web pages with semantic HTML5 elements like
                headings, paragraphs, lists, links, and images.
              </p>
            </div>
            <footer class="card-footer">
              <span class="card-footer-item">
                <span class="tag is-success is-light">Beginner</span>
              </span>
              <span class="card-footer-item has-text-grey is-size-7">8 lessons</span>
            </footer>
          </div>
        </div>

        <div class="column is-4">
          <div class="card">
            <div class="card-content">
              <p class="title is-5">CSS Fundamentals</p>
              <p class="subtitle is-6 has-text-grey">
                Style your pages with colours, typography, the box model,
                Flexbox, and now — CSS frameworks.
              </p>
            </div>
            <footer class="card-footer">
              <span class="card-footer-item">
                <span class="tag is-success is-light">Beginner</span>
              </span>
              <span class="card-footer-item has-text-grey is-size-7">10 lessons</span>
            </footer>
          </div>
        </div>

        <div class="column is-4">
          <div class="card">
            <div class="card-content">
              <p class="title is-5">JavaScript Essentials</p>
              <p class="subtitle is-6 has-text-grey">
                Add interactivity — handle browser events, update the DOM,
                and call external APIs with fetch().
              </p>
            </div>
            <footer class="card-footer">
              <span class="card-footer-item">
                <span class="tag is-warning is-light">Intermediate</span>
              </span>
              <span class="card-footer-item has-text-grey is-size-7">12 lessons</span>
            </footer>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ── Comparison notification ────────────────────────────────────── -->
  <section class="section pt-0">
    <div class="container">
      <div class="notification is-info is-light">
        <p class="has-text-weight-semibold mb-2">Framework comparison at a glance:</p>
        <p>
          <strong>Bootstrap</strong> — the most widely used; ships many ready-made components and optional JS.
          Best for dashboards and quick prototypes.<br/>
          <strong>Tailwind</strong> — utility-first; compose designs in HTML with no separate CSS file.
          Best for custom branded products.<br/>
          <strong>Bulma</strong> — readable class names, Flexbox-based, zero JS.
          Best for clean layouts and projects with their own JS stack.
        </p>
      </div>
    </div>
  </section>

</body>
</html>`, { filename: "bulma-demo.html", openInStudio: true }),
        callout("tip", "Bulma's modifier system is wonderfully consistent: is-primary, is-success, is-warning, is-danger work on buttons, tags, notifications, heroes, and more. And is-small, is-medium, is-large resize almost every component. Learn these two patterns and you can style the entire framework from memory."),
      ),
    },
  ],
};
