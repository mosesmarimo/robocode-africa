import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, HTML
// ---------------------------------------------------------------------------

const HELLO_WORLD = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello, RoboCode!</title>
  </head>
  <body>
    <h1>Hello, RoboCode!</h1>
    <p>This is my first web page. It was built with HTML.</p>
    <p>HTML stands for <strong>HyperText Markup Language</strong>.</p>
  </body>
</html>`;

const SVG_HTML_DOCUMENT_TREE = `<svg viewBox="0 0 600 280" role="img" aria-label="HTML document tree showing html as root with head and body children, and their respective children" xmlns="http://www.w3.org/2000/svg">
  <!-- Root: html -->
  <rect x="240" y="10" width="120" height="36" rx="8" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2"/>
  <text x="273" y="33" font-family="monospace" font-size="14" fill="#93c5fd" font-weight="bold">&lt;html&gt;</text>
  <!-- Branch lines from html -->
  <line x1="300" y1="46" x2="300" y2="68" stroke="#475569" stroke-width="2"/>
  <line x1="140" y1="68" x2="460" y2="68" stroke="#475569" stroke-width="2"/>
  <line x1="140" y1="68" x2="140" y2="88" stroke="#475569" stroke-width="2"/>
  <line x1="460" y1="68" x2="460" y2="88" stroke="#475569" stroke-width="2"/>
  <!-- head -->
  <rect x="70" y="88" width="140" height="36" rx="8" fill="#1c2438" stroke="#6366f1" stroke-width="2"/>
  <text x="100" y="111" font-family="monospace" font-size="13" fill="#a5b4fc" font-weight="bold">&lt;head&gt;</text>
  <!-- head children lines -->
  <line x1="140" y1="124" x2="140" y2="144" stroke="#475569" stroke-width="2"/>
  <line x1="80" y1="144" x2="200" y2="144" stroke="#475569" stroke-width="2"/>
  <line x1="80" y1="144" x2="80" y2="162" stroke="#475569" stroke-width="2"/>
  <line x1="200" y1="144" x2="200" y2="162" stroke="#475569" stroke-width="2"/>
  <!-- title -->
  <rect x="28" y="162" width="104" height="30" rx="6" fill="#0f172a" stroke="#6366f1" stroke-width="1.5"/>
  <text x="38" y="181" font-family="monospace" font-size="11" fill="#c7d2fe">&lt;title&gt;</text>
  <!-- meta -->
  <rect x="148" y="162" width="104" height="30" rx="6" fill="#0f172a" stroke="#6366f1" stroke-width="1.5"/>
  <text x="158" y="181" font-family="monospace" font-size="11" fill="#c7d2fe">&lt;meta&gt;</text>
  <!-- body -->
  <rect x="390" y="88" width="140" height="36" rx="8" fill="#1c3830" stroke="#34d399" stroke-width="2"/>
  <text x="418" y="111" font-family="monospace" font-size="13" fill="#6ee7b7" font-weight="bold">&lt;body&gt;</text>
  <!-- body children lines -->
  <line x1="460" y1="124" x2="460" y2="144" stroke="#475569" stroke-width="2"/>
  <line x1="340" y1="144" x2="580" y2="144" stroke="#475569" stroke-width="2"/>
  <line x1="340" y1="144" x2="340" y2="162" stroke="#475569" stroke-width="2"/>
  <line x1="460" y1="144" x2="460" y2="162" stroke="#475569" stroke-width="2"/>
  <line x1="580" y1="144" x2="580" y2="162" stroke="#475569" stroke-width="2"/>
  <!-- h1 -->
  <rect x="290" y="162" width="100" height="30" rx="6" fill="#0f172a" stroke="#34d399" stroke-width="1.5"/>
  <text x="316" y="181" font-family="monospace" font-size="11" fill="#a7f3d0">&lt;h1&gt;</text>
  <!-- p -->
  <rect x="406" y="162" width="100" height="30" rx="6" fill="#0f172a" stroke="#34d399" stroke-width="1.5"/>
  <text x="436" y="181" font-family="monospace" font-size="11" fill="#a7f3d0">&lt;p&gt;</text>
  <!-- img -->
  <rect x="522" y="162" width="100" height="30" rx="6" fill="#0f172a" stroke="#34d399" stroke-width="1.5"/>
  <text x="542" y="181" font-family="monospace" font-size="11" fill="#a7f3d0">&lt;img&gt;</text>
  <!-- Labels -->
  <text x="30" y="226" font-family="sans-serif" font-size="11" fill="#6b7280">Invisible to users:</text>
  <text x="30" y="242" font-family="sans-serif" font-size="11" fill="#818cf8">page title, character set, metadata</text>
  <text x="290" y="226" font-family="sans-serif" font-size="11" fill="#6b7280">Visible to users:</text>
  <text x="290" y="242" font-family="sans-serif" font-size="11" fill="#34d399">headings, paragraphs, images, links</text>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Elements & attributes
// ---------------------------------------------------------------------------

const ELEMENTS_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HTML Elements Demo</title>
</head>
<body>

  <!-- Headings — h1 is the largest, h6 the smallest -->
  <h1>Level 1 Heading</h1>
  <h2>Level 2 Heading</h2>
  <h3>Level 3 Heading</h3>

  <!-- Paragraphs and inline text formatting -->
  <p>This is a paragraph. You can make text <strong>bold</strong>,
  <em>italic</em>, or <mark>highlighted</mark>.</p>

  <!-- Links — href is the destination URL -->
  <p>Visit <a href="https://robocode.africa">RoboCode Africa</a> to learn more.</p>

  <!-- Images — src is the file, alt describes it for screen readers -->
  <img src="https://via.placeholder.com/300x150" alt="A placeholder image" width="300" />

  <!-- Unordered list (bullet points) -->
  <h2>My Favourite Subjects</h2>
  <ul>
    <li>Mathematics</li>
    <li>Computer Science</li>
    <li>Art &amp; Design</li>
  </ul>

  <!-- Ordered list (numbered) -->
  <h2>Steps to Make Tea</h2>
  <ol>
    <li>Boil the kettle</li>
    <li>Add a teabag to the cup</li>
    <li>Pour in hot water</li>
    <li>Add milk and sugar to taste</li>
  </ol>

</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 3 — Forms & structure
// ---------------------------------------------------------------------------

const FORMS_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Profile Form</title>
  <style>
    body { font-family: sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; }
    label { display: block; margin-top: 1rem; font-weight: bold; }
    input, select, textarea { width: 100%; padding: 0.5rem; margin-top: 0.25rem;
      border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    button { margin-top: 1.5rem; padding: 0.6rem 1.5rem;
      background: #2563eb; color: white; border: none;
      border-radius: 4px; cursor: pointer; font-size: 1rem; }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>

  <h1>Student Profile</h1>

  <!-- Semantic sectioning -->
  <main>
    <form action="#" method="get">

      <!-- Text input -->
      <label for="name">Full Name</label>
      <input type="text" id="name" name="name" placeholder="e.g. Tariro Moyo" required />

      <!-- Email input -->
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" placeholder="you@example.com" required />

      <!-- Number input -->
      <label for="age">Age</label>
      <input type="number" id="age" name="age" min="8" max="20" />

      <!-- Dropdown select -->
      <label for="grade">School Grade</label>
      <select id="grade" name="grade">
        <option value="">-- Choose a grade --</option>
        <option value="8">Grade 8</option>
        <option value="9">Grade 9</option>
        <option value="10">Grade 10</option>
        <option value="11">Grade 11</option>
        <option value="12">Grade 12</option>
      </select>

      <!-- Textarea -->
      <label for="bio">Short Bio</label>
      <textarea id="bio" name="bio" rows="4"
        placeholder="Tell us a bit about yourself..."></textarea>

      <!-- Submit button -->
      <button type="submit">Save Profile</button>

    </form>
  </main>

</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My RoboCode Portfolio</title>
  <style>
    /* ── Reset & base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
    }

    /* ── Navigation ── */
    nav {
      background: #1e293b;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      border-bottom: 2px solid #334155;
    }
    nav .logo { font-size: 1.4rem; font-weight: 700; color: #38bdf8; }
    nav a { color: #94a3b8; text-decoration: none; font-size: 0.9rem; }
    nav a:hover { color: #e2e8f0; }

    /* ── Hero section ── */
    .hero {
      text-align: center;
      padding: 4rem 1rem 3rem;
    }
    .hero h1 { font-size: 2.5rem; color: #f8fafc; margin-bottom: 0.5rem; }
    .hero .subtitle { font-size: 1.1rem; color: #94a3b8; margin-bottom: 2rem; }
    .hero .badge {
      display: inline-block;
      background: #1e40af;
      color: #bfdbfe;
      padding: 0.3rem 0.9rem;
      border-radius: 999px;
      font-size: 0.85rem;
      margin: 0.25rem;
    }

    /* ── Project cards ── */
    .projects {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .projects h2 { margin-bottom: 1.5rem; color: #cbd5e1; font-size: 1.5rem; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.25rem;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #38bdf8; }
    .card h3 { font-size: 1rem; margin-bottom: 0.4rem; color: #f1f5f9; }
    .card p  { font-size: 0.87rem; color: #94a3b8; line-height: 1.5; }
    .card .tag {
      display: inline-block;
      background: #0f2a3f;
      color: #38bdf8;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      margin-top: 0.75rem;
      margin-right: 0.25rem;
    }

    /* ── Footer ── */
    footer {
      text-align: center;
      padding: 2rem;
      color: #475569;
      font-size: 0.85rem;
      border-top: 1px solid #1e293b;
      margin-top: 3rem;
    }
  </style>
</head>
<body>

  <!-- Navigation bar -->
  <nav>
    <span class="logo">⚡ RoboCode</span>
    <a href="#">Home</a>
    <a href="#">Projects</a>
    <a href="#">About</a>
  </nav>

  <!-- Hero section -->
  <header class="hero">
    <h1>Hi, I'm Tariro 👋</h1>
    <p class="subtitle">Grade 9 student · Aspiring robotics engineer · RoboCode learner</p>
    <span class="badge">Python</span>
    <span class="badge">JavaScript</span>
    <span class="badge">HTML &amp; CSS</span>
    <span class="badge">Arduino</span>
  </header>

  <!-- Project showcase -->
  <section class="projects">
    <h2>My Projects</h2>
    <div class="card-grid">

      <article class="card">
        <h3>Quiz Game</h3>
        <p>A command-line quiz that tests general knowledge. Built with Python using lists, loops, and conditionals.</p>
        <span class="tag">Python</span>
        <span class="tag">CLI</span>
      </article>

      <article class="card">
        <h3>Weather Report</h3>
        <p>Converts temperatures for African cities and gives weather advice. My first JavaScript program with functions.</p>
        <span class="tag">JavaScript</span>
        <span class="tag">Functions</span>
      </article>

      <article class="card">
        <h3>Report Card</h3>
        <p>A typed TypeScript app that calculates student grades using interfaces and typed functions.</p>
        <span class="tag">TypeScript</span>
        <span class="tag">Interfaces</span>
      </article>

      <article class="card">
        <h3>This Portfolio</h3>
        <p>My personal portfolio page — the very HTML and CSS file you are looking at right now!</p>
        <span class="tag">HTML</span>
        <span class="tag">CSS</span>
      </article>

    </div>
  </section>

  <!-- Footer -->
  <footer>
    <p>Built with HTML &amp; CSS · RoboCode Africa &copy; 2025</p>
  </footer>

</body>
</html>`;

export const langHtml: CourseModule = {
  meta: {
    title: "HTML Basics",
    slug: "lang-html",
    track: "coding",
    level: "high",
    description: "Build real web pages from scratch — learn HTML structure, elements, forms, and finish with your own personal portfolio.",
    coverImage: "/covers/coding.svg",
    order: 13,
  },
  lessons: [
    {
      title: "Hello, HTML",
      slug: "hello-html",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is HTML?

**HTML** stands for *HyperText Markup Language*. It is the skeleton of every web page — it gives content its structure by wrapping text and media in **elements** (also called **tags**).

HTML is not a programming language (it has no variables or loops), but it is the essential first step to understanding the web. Every website you have ever visited — Google, YouTube, Wikipedia — is built on HTML.

### How tags work

An HTML **element** consists of an opening tag, some content, and a closing tag:

\`\`\`
<h1>This is a heading</h1>
  ↑               ↑
opening tag    closing tag (notice the /)
\`\`\`

Some elements are **self-closing** and need no closing tag: \`<img />\`, \`<br />\`, \`<input />\`.

### The document tree

Every HTML document is a tree of nested elements. At the root is \`<html>\`, which contains \`<head>\` (invisible metadata) and \`<body>\` (the visible page).`),
        svg(SVG_HTML_DOCUMENT_TREE, "The HTML document tree: html → head + body, each with their own children"),
        md(`### Your first web page

Run the code below in RoboCode Studio to see a real, working web page rendered instantly.`),
        code("html", HELLO_WORLD, { filename: "index.html", openInStudio: true }),
        callout("info", "The <!DOCTYPE html> declaration on the very first line is not a tag — it is an instruction that tells the browser this is a modern HTML5 document. Always include it. If you forget it, the browser may render the page in a quirky legacy mode."),
      ),
    },
    {
      title: "Elements & Attributes",
      slug: "html-elements",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## The most important HTML elements

HTML has over 100 elements, but you can build a complete website with around 20 of them. Here are the most important ones:

### Text and headings

| Element | Purpose | Example |
|---------|---------|---------|
| \`<h1>\` to \`<h6>\` | Headings (h1 largest, h6 smallest) | \`<h1>Title</h1>\` |
| \`<p>\` | Paragraph of text | \`<p>Hello world.</p>\` |
| \`<strong>\` | Bold / important text | \`<strong>Warning!</strong>\` |
| \`<em>\` | Italic / emphasised text | \`<em>Note:</em>\` |

### Links and images

| Element | Key attribute | Purpose |
|---------|--------------|---------|
| \`<a>\` | \`href="url"\` | Hyperlink to another page |
| \`<img>\` | \`src="file"\`, \`alt="description"\` | Embed an image |

**Attributes** are extra information added inside the opening tag:
\`\`\`html
<a href="https://robocode.africa">Visit RoboCode</a>
<img src="logo.png" alt="RoboCode logo" width="200" />
\`\`\`

### Lists

\`<ul>\` creates bullet-point (unordered) lists; \`<ol>\` creates numbered (ordered) lists. Each item goes inside \`<li>\`.

### Comments

HTML comments are invisible to users — only the developer can see them in the source code:
\`\`\`html
<!-- This is a comment -->
\`\`\`

Run the example below to see all these elements on a real page.`),
        code("html", ELEMENTS_CODE, { filename: "elements.html", openInStudio: true }),
        callout("tip", "Always add an alt attribute to every image. It describes the image for users with screen readers (who may be visually impaired) and also appears if the image fails to load. Writing good alt text is an important web-accessibility habit."),
      ),
    },
    {
      title: "Forms & Page Structure",
      slug: "html-forms",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Forms and semantic structure

Forms let users type information into a web page and submit it. Almost every website uses forms — login pages, search bars, checkout forms, contact pages.

### Key form elements

| Element | Purpose |
|---------|---------|
| \`<form>\` | Container for the whole form |
| \`<input type="text">\` | Single-line text field |
| \`<input type="email">\` | Email field (validates format) |
| \`<input type="number">\` | Number field |
| \`<select>\` + \`<option>\` | Drop-down menu |
| \`<textarea>\` | Multi-line text box |
| \`<button type="submit">\` | Submit the form |
| \`<label for="id">\` | Clickable label linked to an input |

### Linking labels to inputs

The \`for\` attribute on a \`<label>\` must match the \`id\` of the input it describes. This means clicking the label text automatically focuses the input:
\`\`\`html
<label for="name">Full Name</label>
<input type="text" id="name" name="name" />
\`\`\`

### Semantic HTML

Modern HTML has many elements that describe the *meaning* of content, not just its appearance:

| Element | Meaning |
|---------|---------|
| \`<header>\` | Top of a page or section |
| \`<nav>\` | Navigation links |
| \`<main>\` | The main content of the page |
| \`<section>\` | A thematic group of content |
| \`<article>\` | A self-contained piece of content |
| \`<footer>\` | Bottom of a page or section |

Using semantic elements makes your pages more accessible and better understood by search engines.`),
        mermaid(
          `flowchart TD
  A([User fills in form]) --> B[Clicks Submit button]
  B --> C{HTML5 validation passes?}
  C -- No --> D[Browser shows error message]
  D --> A
  C -- Yes --> E[Browser sends form data]
  E --> F[Server receives data]
  F --> G[Server processes & responds]
  G --> H([User sees result page])`,
          "What happens when a user submits an HTML form",
        ),
        code("html", FORMS_CODE, { filename: "profile_form.html", openInStudio: true }),
        callout("info", "The style tag in the head is inline CSS — a way to add styling rules directly in the HTML file. In larger projects, CSS is usually kept in a separate .css file and linked with <link rel=\"stylesheet\" href=\"styles.css\" />. Both approaches are valid."),
      ),
    },
    {
      title: "Put It Together",
      slug: "html-put-together",
      contentType: "markdown",
      estMinutes: 20,
      body: body(
        md(`## Build your personal portfolio page

Time to combine everything — structure, elements, forms, and CSS styling — into a complete personal portfolio page that you could actually publish on the web.

### What this page includes

1. **\`<nav>\`** — a navigation bar with your brand name and links.
2. **\`<header>\` with hero section** — a big welcome message, your subtitle, and skill badges.
3. **\`<section>\` with project cards** — a CSS Grid layout showing off the projects you have built in these courses.
4. **\`<footer>\`** — a simple bottom bar with copyright.
5. **Inline CSS** — variables, grid, hover effects, and responsive columns using \`auto-fit\` / \`minmax\`.

### CSS highlights to look for

\`\`\`css
/* CSS Grid with auto-wrapping columns */
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));

/* Smooth hover transition */
transition: border-color 0.2s;
\`\`\`

The \`auto-fit\` and \`minmax\` trick means the card grid automatically becomes 1, 2, or 3 columns depending on the screen width — without any JavaScript!

### Challenge: personalise it

After running the code, change:
- The name and subtitle in the hero to yours.
- The skill badges to languages you have actually studied.
- The project cards to real projects you have built.

This is real, publishable HTML — if you save it as \`index.html\` and put it on any web server, anyone in the world can see it.`),
        code("html", PUT_TOGETHER_CODE, { filename: "portfolio.html", openInStudio: true }),
        callout("tip", "You can view the HTML source of any website by right-clicking in your browser and choosing View Page Source (or pressing Ctrl+U on Windows / Cmd+U on Mac). Studying real websites is one of the best ways to learn HTML and CSS tricks — every professional web developer does it."),
      ),
    },
  ],
};
