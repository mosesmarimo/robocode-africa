import { md, callout, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — HTML Introduction
// ---------------------------------------------------------------------------

const INTRO_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My First HTML Page</title>
</head>
<body>

  <h1>My First Heading</h1>
  <p>My first paragraph.</p>
  <p>This page has a doctype, a head, and a body — the three ingredients every HTML page needs.</p>

</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Headings & Paragraphs
// ---------------------------------------------------------------------------

const HEADINGS_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Headings &amp; Paragraphs</title>
</head>
<body>

  <h1>Heading Level 1</h1>
  <h2>Heading Level 2</h2>
  <h3>Heading Level 3</h3>
  <h4>Heading Level 4</h4>

  <p>This is a normal paragraph. Browsers automatically add a little space above and below every paragraph.</p>

  <p>
    RoboCode Africa<br>
    12 Example Street<br>
    Harare, Zimbabwe
  </p>

  <hr>

  <p>The line above was drawn with an &lt;hr&gt; element — useful for separating sections of content.</p>

</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 3 — Links & Images
// ---------------------------------------------------------------------------

const LINKS_IMAGES_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Links &amp; Images</title>
</head>
<body>

  <h1>Links &amp; Images</h1>

  <p>
    Visit <a href="https://developer.mozilla.org" target="_blank" rel="noopener">MDN Web Docs</a>
    to explore the full list of HTML elements.
  </p>

  <p>
    Jump straight to the <a href="#gallery">image gallery</a> further down this page.
  </p>

  <h2 id="gallery">Image Gallery</h2>
  <img src="https://placehold.co/300x150/2563eb/white?text=RoboCode" alt="A placeholder banner reading RoboCode" width="300" height="150">

</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 4 — Lists
// ---------------------------------------------------------------------------

const LISTS_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Lists</title>
</head>
<body>

  <h1>Shopping List</h1>
  <ul>
    <li>Bread</li>
    <li>Milk</li>
    <li>Eggs</li>
  </ul>

  <h1>Steps to Boil an Egg</h1>
  <ol>
    <li>Place the egg in a pot of water</li>
    <li>Bring the water to a boil</li>
    <li>Boil for 8–10 minutes</li>
    <li>Cool the egg under cold water</li>
  </ol>

  <h1>A Nested List</h1>
  <ul>
    <li>Fruits
      <ul>
        <li>Banana</li>
        <li>Mango</li>
      </ul>
    </li>
    <li>Vegetables
      <ul>
        <li>Carrot</li>
        <li>Spinach</li>
      </ul>
    </li>
  </ul>

</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 5 — Tables
// ---------------------------------------------------------------------------

const TABLES_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Tables</title>
  <style>
    table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
    th, td { border: 1px solid #94a3b8; padding: 8px 12px; text-align: left; }
    th { background-color: #e2e8f0; }
  </style>
</head>
<body>

  <h1>Term Results</h1>
  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Term 1</th>
        <th>Term 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Mathematics</td>
        <td>78</td>
        <td>84</td>
      </tr>
      <tr>
        <td>Computer Science</td>
        <td>91</td>
        <td>95</td>
      </tr>
      <tr>
        <td colspan="2">Overall Average</td>
        <td>87</td>
      </tr>
    </tbody>
  </table>

</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 6 — Forms (basic)
// ---------------------------------------------------------------------------

const FORMS_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sign Up Form</title>
  <style>
    body { font-family: sans-serif; max-width: 360px; margin: 2rem auto; }
    label { display: block; margin-top: 12px; font-weight: bold; }
    input, select { width: 100%; padding: 6px; margin-top: 4px; box-sizing: border-box; }
    button { margin-top: 16px; padding: 8px 16px; }
  </style>
</head>
<body>

  <h1>Sign Up</h1>
  <form action="#" method="get">

    <label for="username">Username</label>
    <input type="text" id="username" name="username" required>

    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>

    <label for="password">Password</label>
    <input type="password" id="password" name="password" required>

    <label><input type="checkbox" name="subscribe"> Send me updates</label>

    <button type="submit">Create Account</button>

  </form>

</body>
</html>`;

export const htmlTutorialCourse: CourseModule = {
  meta: {
    title: "HTML Tutorial",
    slug: "tutorial-html",
    track: "coding",
    level: "primary",
    description:
      "A W3Schools-style, hands-on introduction to HTML — page structure, headings, links, images, lists, tables, and forms — with live Try it Yourself examples and exercises.",
    coverImage: "/covers/coding.svg",
    order: 54,
    language: "html",
  },
  lessons: [
    // -------------------------------------------------------------------
    // Lesson 1 — HTML Introduction
    // -------------------------------------------------------------------
    {
      title: "HTML Introduction",
      slug: "html-intro",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## HTML Introduction

**HTML** stands for **H**yper**T**ext **M**arkup **L**anguage. It is the standard markup language used to create web pages.

- HTML describes the *structure* of a web page using **elements**, also called **tags**.
- Elements tell the browser how to display content — as a heading, a paragraph, a link, and so on.
- HTML is not a programming language. It has no variables and no logic — only structure.

### A Basic HTML Document

Every HTML page is built from the same four building blocks:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Page Title</title>
</head>
<body>

  <h1>My First Heading</h1>
  <p>My first paragraph.</p>

</body>
</html>
\`\`\`

**Example explained**

- \`<!DOCTYPE html>\` — declares this document as HTML5. It must be the very first line in the file.
- \`<html>\` — the root element that wraps the entire page.
- \`<head>\` — holds information *about* the page (like the title) that is not shown on the page itself.
- \`<title>\` — the text shown in the browser's tab or bookmark.
- \`<body>\` — contains everything visitors actually see.
- \`<h1>\` — a top-level heading.
- \`<p>\` — a paragraph.

### HTML Tags

An HTML tag is an element name wrapped in angle brackets:

\`\`\`
<tagname>content goes here...</tagname>
\`\`\`

- Tags usually come in pairs — a **start tag** (\`<p>\`) and an **end tag** (\`</p>\`) with a forward slash.
- **Empty elements** have no content and no end tag, e.g. \`<br>\` and \`<img>\`.
- **Attributes** add extra information inside the start tag, e.g. \`<html lang="en">\`.

Run the example below to see a complete, working HTML page.`),
        tryit("html", INTRO_TRYIT, { caption: "A minimal HTML5 page with a heading and two paragraphs." }),
        md(`### Reference: Document Structure Tags

| Tag | Description |
|---|---|
| \`<!DOCTYPE html>\` | Defines the document type. Must be the first line of the file. |
| \`<html>\` | The root element that wraps the whole page. |
| \`<head>\` | Container for metadata — title, character set, links to stylesheets. |
| \`<title>\` | The title shown in the browser tab. |
| \`<meta charset="UTF-8">\` | Declares the character encoding of the page. |
| \`<body>\` | Contains everything visitors actually see. |`),
        exercise(
          "html",
          "Complete the page skeleton below: add the missing <!DOCTYPE html> declaration on the first line, and give the page a <title> of \"Practice Page\".",
          `<html>
<head>

</head>
<body>
  <h1>Hello!</h1>
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head>
  <title>Practice Page</title>
</head>
<body>
  <h1>Hello!</h1>
</body>
</html>`,
          { caption: "The browser tab should read \"Practice Page\"." },
        ),
        exercise(
          "html",
          "Add a <p> paragraph under the heading that introduces yourself in one sentence.",
          `<!DOCTYPE html>
<html>
<head>
  <title>About Me</title>
</head>
<body>
  <h1>About Me</h1>
  <!-- add your paragraph below -->
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head>
  <title>About Me</title>
</head>
<body>
  <h1>About Me</h1>
  <p>Hi, I'm Tariro and I'm learning to build web pages with RoboCode!</p>
</body>
</html>`,
        ),
        callout("tip", "Browsers are very forgiving — many pages still work even with missing tags. But don't rely on that! Always write complete, well-formed HTML so your pages behave the same way in every browser."),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 2 — Headings & Paragraphs
    // -------------------------------------------------------------------
    {
      title: "Headings & Paragraphs",
      slug: "html-headings-paragraphs",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## HTML Headings

HTML headings are defined with the \`<h1>\` to \`<h6>\` tags.

- \`<h1>\` defines the *most* important heading; \`<h6>\` defines the *least* important heading.
- Browsers automatically add space before and after every heading.
- Search engines read your headings to understand the structure of your page — use only **one** \`<h1>\` per page, for the page's main title.

\`\`\`html
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
\`\`\`

**Important:** Only use headings for actual headings — never to make text bigger or bold. Use CSS for that (you'll meet CSS in the next course).

### HTML Paragraphs

The \`<p>\` element defines a paragraph. Browsers automatically add space before and after every paragraph.

Browsers also **ignore** extra whitespace and line breaks written in your source code:

\`\`\`html
<p>This paragraph
has line breaks
in the source code — but the browser displays it as one line.</p>
\`\`\`

To force a line break where you actually want one, use \`<br>\`. To draw a horizontal divider between sections, use \`<hr>\`. Both are empty elements — they never have a closing tag.

Run the example below to see headings, paragraphs, \`<br>\`, and \`<hr>\` together.`),
        tryit("html", HEADINGS_TRYIT, { caption: "Four heading levels, a paragraph, a line-broken address, and a horizontal rule." }),
        md(`### Reference: Text Tags

| Tag | Description |
|---|---|
| \`<h1>\` to \`<h6>\` | Headings, from most (\`h1\`) to least (\`h6\`) important |
| \`<p>\` | A paragraph of text |
| \`<br>\` | A single line break (empty element) |
| \`<hr>\` | A horizontal divider line (empty element) |
| \`<strong>\` | Important text — rendered bold |
| \`<em>\` | Emphasised text — rendered italic |`),
        exercise(
          "html",
          "This recipe page is missing its section headings. Add an <h2>Ingredients</h2> above the ingredients list, and an <h2>Steps</h2> above the numbered steps.",
          `<!DOCTYPE html>
<html>
<head><title>Tea Recipe</title></head>
<body>
  <h1>How to Make Tea</h1>

  <p>Boil water, add a teabag, and enjoy.</p>

</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>Tea Recipe</title></head>
<body>
  <h1>How to Make Tea</h1>

  <h2>Ingredients</h2>
  <p>Water, a teabag, milk, and sugar.</p>

  <h2>Steps</h2>
  <p>Boil water, add a teabag, and enjoy.</p>

</body>
</html>`,
        ),
        exercise(
          "html",
          "Use <br> to split the address below onto three separate lines inside a single <p> element.",
          `<!DOCTYPE html>
<html>
<head><title>Contact</title></head>
<body>
  <h1>Contact Us</h1>
  <p>RoboCode Africa 12 Example Street Harare, Zimbabwe</p>
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>Contact</title></head>
<body>
  <h1>Contact Us</h1>
  <p>RoboCode Africa<br>12 Example Street<br>Harare, Zimbabwe</p>
</body>
</html>`,
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 3 — Links & Images
    // -------------------------------------------------------------------
    {
      title: "Links & Images",
      slug: "html-links-images",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## HTML Links

The \`<a>\` (anchor) tag defines a hyperlink. Its most important attribute is \`href\`, which specifies the destination:

\`\`\`html
<a href="https://robocode.africa">Visit RoboCode</a>
\`\`\`

- By default, clicking a link opens the destination in the **same tab**.
- Add \`target="_blank"\` to open the link in a **new tab**. When you do, also add \`rel="noopener"\` — this is a security best practice that stops the new page from being able to control the original one.
- A link's \`href\` can also point to a section *within* the same page using an \`id\`: \`<a href="#gallery">\` jumps to the element with \`id="gallery"\`.

### HTML Images

The \`<img>\` tag embeds an image. It is an **empty element** — it has no closing tag and no content, only attributes:

\`\`\`html
<img src="photo.jpg" alt="A description of the photo" width="300" height="150">
\`\`\`

- \`src\` — the path or URL to the image file.
- \`alt\` — describes the image in words. It is shown if the image fails to load, and read aloud by screen readers for visually impaired users.
- \`width\` and \`height\` — reserve space for the image before it loads, which prevents the page from jumping around.

Run the example below — it combines an external link, an in-page link, and an image.`),
        tryit("html", LINKS_IMAGES_TRYIT, { caption: "A link that opens in a new tab, a jump link to an in-page section, and an image." }),
        md(`### Reference: Links & Images

| Tag / Attribute | Description |
|---|---|
| \`<a href="...">\` | Defines a hyperlink to the given destination |
| \`target="_blank"\` | Opens the link in a new browser tab |
| \`rel="noopener"\` | Security best practice alongside \`target="_blank"\` |
| \`<img src="..." alt="...">\` | Embeds an image; \`alt\` describes it |
| \`width\` / \`height\` | Reserves the image's display size on the page |`),
        exercise(
          "html",
          "This image is missing its alt attribute. Add a short, descriptive alt attribute to it.",
          `<!DOCTYPE html>
<html>
<head><title>School Robot</title></head>
<body>
  <h1>Our Robot</h1>
  <img src="https://placehold.co/300x150/065f46/white?text=Robot" width="300" height="150">
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>School Robot</title></head>
<body>
  <h1>Our Robot</h1>
  <img src="https://placehold.co/300x150/065f46/white?text=Robot" alt="Our school's line-following robot" width="300" height="150">
</body>
</html>`,
        ),
        exercise(
          "html",
          "Make the link below open safely in a new tab: add target=\"_blank\" and rel=\"noopener\" to it.",
          `<!DOCTYPE html>
<html>
<head><title>Resources</title></head>
<body>
  <h1>Resources</h1>
  <p>Learn more at <a href="https://developer.mozilla.org">MDN Web Docs</a>.</p>
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>Resources</title></head>
<body>
  <h1>Resources</h1>
  <p>Learn more at <a href="https://developer.mozilla.org" target="_blank" rel="noopener">MDN Web Docs</a>.</p>
</body>
</html>`,
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 4 — Lists
    // -------------------------------------------------------------------
    {
      title: "Lists",
      slug: "html-lists",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## HTML Lists

HTML supports two common types of list, and both are built from list *items*.

### Unordered lists

An **unordered list** starts with \`<ul>\` and shows bullet points. Each item is wrapped in \`<li>\`:

\`\`\`html
<ul>
  <li>Bread</li>
  <li>Milk</li>
</ul>
\`\`\`

### Ordered lists

An **ordered list** starts with \`<ol>\` and shows numbers automatically — you never write the numbers yourself:

\`\`\`html
<ol>
  <li>Boil the water</li>
  <li>Add the teabag</li>
</ol>
\`\`\`

### Nesting lists

You can put a whole list *inside* an \`<li>\` to create sub-items. Just make sure the inner \`<ul>\` or \`<ol>\` is placed inside the \`<li>\` it belongs to.

Run the example below to see an unordered list, an ordered list, and a nested list.`),
        tryit("html", LISTS_TRYIT, { caption: "A shopping list (unordered), numbered steps (ordered), and a nested list of fruits and vegetables." }),
        md(`### Reference: List Tags

| Tag | Description |
|---|---|
| \`<ul>\` | An unordered (bulleted) list |
| \`<ol>\` | An ordered (numbered) list |
| \`<li>\` | A single list item, used inside \`<ul>\` or \`<ol>\` |
| \`<dl>\` | A description list (pairs of terms and descriptions) |
| \`<dt>\` / \`<dd>\` | A term / its description, used inside \`<dl>\` |`),
        exercise(
          "html",
          "Turn these three plain lines into a proper unordered list using <ul> and <li>.",
          `<!DOCTYPE html>
<html>
<head><title>Packing List</title></head>
<body>
  <h1>Packing List</h1>
  Passport
  Charger
  Water bottle
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>Packing List</title></head>
<body>
  <h1>Packing List</h1>
  <ul>
    <li>Passport</li>
    <li>Charger</li>
    <li>Water bottle</li>
  </ul>
</body>
</html>`,
        ),
        exercise(
          "html",
          "Add an ordered list (<ol>) below the heading with three steps for starting a robot: 1) Connect the battery 2) Press the power button 3) Wait for the light to turn green.",
          `<!DOCTYPE html>
<html>
<head><title>Startup Steps</title></head>
<body>
  <h1>Starting Your Robot</h1>
  <!-- add an ordered list here -->
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>Startup Steps</title></head>
<body>
  <h1>Starting Your Robot</h1>
  <ol>
    <li>Connect the battery</li>
    <li>Press the power button</li>
    <li>Wait for the light to turn green</li>
  </ol>
</body>
</html>`,
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 5 — Tables
    // -------------------------------------------------------------------
    {
      title: "Tables",
      slug: "html-tables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## HTML Tables

A table displays data in rows and columns. Three tags do all the work:

- \`<table>\` — wraps the whole table.
- \`<tr>\` — defines a table **row**.
- \`<td>\` — defines a table **data cell** inside a row. \`<th>\` defines a **header cell** (bold and centred by default) — use it for column titles.

\`\`\`html
<table>
  <tr>
    <th>Name</th>
    <th>Score</th>
  </tr>
  <tr>
    <td>Tariro</td>
    <td>95</td>
  </tr>
</table>
\`\`\`

You can also group rows semantically with \`<thead>\` (header rows) and \`<tbody>\` (data rows).

### Merging cells

- \`colspan="2"\` makes a cell span **two columns**.
- \`rowspan="2"\` makes a cell span **two rows**.

### Styling tables

Modern HTML tables have no visible borders by default — border styling is CSS's job, not HTML's. The most common starter rule is:

\`\`\`css
table { border-collapse: collapse; }
th, td { border: 1px solid #94a3b8; padding: 8px; }
\`\`\`

\`border-collapse: collapse\` merges each cell's border with its neighbours into a single clean line, instead of doubled-up borders.

Run the example below — a small table of term results, with a merged cell for the total row.`),
        tryit("html", TABLES_TRYIT, { caption: "A results table with header cells and a merged (colspan) total row." }),
        md(`### Reference: Table Tags

| Tag / Attribute | Description |
|---|---|
| \`<table>\` | Defines a table |
| \`<tr>\` | A table row |
| \`<th>\` | A header cell (bold, centred by default) |
| \`<td>\` | A standard data cell |
| \`<thead>\` / \`<tbody>\` | Groups header rows / body rows |
| \`colspan="n"\` | Makes a cell span \`n\` columns |
| \`rowspan="n"\` | Makes a cell span \`n\` rows |`),
        exercise(
          "html",
          "Add a header row to this table using <th> cells for \"Day\" and \"Chore\".",
          `<!DOCTYPE html>
<html>
<head>
<style>table{border-collapse:collapse}td,th{border:1px solid #94a3b8;padding:6px}</style>
</head>
<body>
  <h1>Chore Chart</h1>
  <table>
    <!-- add header row here -->
    <tr><td>Monday</td><td>Sweep the yard</td></tr>
    <tr><td>Tuesday</td><td>Wash the dishes</td></tr>
  </table>
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head>
<style>table{border-collapse:collapse}td,th{border:1px solid #94a3b8;padding:6px}</style>
</head>
<body>
  <h1>Chore Chart</h1>
  <table>
    <tr><th>Day</th><th>Chore</th></tr>
    <tr><td>Monday</td><td>Sweep the yard</td></tr>
    <tr><td>Tuesday</td><td>Wash the dishes</td></tr>
  </table>
</body>
</html>`,
        ),
        exercise(
          "html",
          "The bottom row should show a total that spans both the Subject and Score columns. Add colspan=\"2\" to its first cell and remove the now-empty second cell.",
          `<!DOCTYPE html>
<html>
<head>
<style>table{border-collapse:collapse}td,th{border:1px solid #94a3b8;padding:6px}</style>
</head>
<body>
  <table>
    <tr><th>Subject</th><th>Score</th><th>Grade</th></tr>
    <tr><td>Maths</td><td>80</td><td>A</td></tr>
    <tr><td>Total</td><td></td><td>80</td></tr>
  </table>
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head>
<style>table{border-collapse:collapse}td,th{border:1px solid #94a3b8;padding:6px}</style>
</head>
<body>
  <table>
    <tr><th>Subject</th><th>Score</th><th>Grade</th></tr>
    <tr><td>Maths</td><td>80</td><td>A</td></tr>
    <tr><td colspan="2">Total</td><td>80</td></tr>
  </table>
</body>
</html>`,
        ),
        callout("info", "Long ago, developers used the border attribute (<table border=\"1\">) to draw table lines. It still works in every browser, but it is considered outdated — modern HTML keeps structure (HTML) and appearance (CSS) separate."),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 6 — Forms (basic)
    // -------------------------------------------------------------------
    {
      title: "Forms",
      slug: "html-forms-basic",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## HTML Forms

A **form** lets visitors type in information and send it somewhere — a login box, a search bar, a sign-up page. The \`<form>\` element wraps all the input controls.

### The <input> element

\`<input>\` is the most-used form element. Its \`type\` attribute decides what kind of control it becomes:

| \`type\` value | Renders as |
|---|---|
| \`text\` | A single-line text box |
| \`email\` | A text box that checks for a valid email shape |
| \`password\` | A text box that hides what you type |
| \`checkbox\` | A tickable box |
| \`radio\` | A single choice from a group |

### Labels

A \`<label>\` describes what an input is for. Linking a label's \`for\` attribute to an input's \`id\` means clicking the label text focuses the input — this also helps screen-reader users a great deal:

\`\`\`html
<label for="email">Email</label>
<input type="email" id="email" name="email">
\`\`\`

### Useful attributes

- \`required\` — the browser will not submit the form until this field is filled in.
- \`placeholder="..."\` — light grey example text shown inside an empty input.
- \`name="..."\` — the field's name when the form's data is sent — every input you want to submit needs one.

Run the example below — a small sign-up form using text, email, password, and checkbox inputs.`),
        tryit("html", FORMS_TRYIT, { caption: "A sign-up form with labelled text, email, password, and checkbox inputs, plus a submit button." }),
        md(`### Reference: Form Tags & Attributes

| Tag / Attribute | Description |
|---|---|
| \`<form>\` | Container for a whole form |
| \`<input type="...">\` | A single form control; type decides its behaviour |
| \`<label for="id">\` | A caption linked to the input with the matching \`id\` |
| \`<select>\` / \`<option>\` | A drop-down menu and its choices |
| \`<textarea>\` | A multi-line text box |
| \`<button type="submit">\` | Submits the form |
| \`required\` | Field must be filled in before submitting |`),
        exercise(
          "html",
          "This age input is optional but should not be. Add the required attribute to it.",
          `<!DOCTYPE html>
<html>
<head><title>Registration</title></head>
<body>
  <h1>Registration</h1>
  <form>
    <label for="age">Age</label>
    <input type="number" id="age" name="age">
    <button type="submit">Register</button>
  </form>
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>Registration</title></head>
<body>
  <h1>Registration</h1>
  <form>
    <label for="age">Age</label>
    <input type="number" id="age" name="age" required>
    <button type="submit">Register</button>
  </form>
</body>
</html>`,
        ),
        exercise(
          "html",
          "This input is missing a linked <label>. Add a <label for=\"school\"> element with the text \"School Name\" right before it.",
          `<!DOCTYPE html>
<html>
<head><title>Student Details</title></head>
<body>
  <h1>Student Details</h1>
  <form>
    <input type="text" id="school" name="school">
    <button type="submit">Save</button>
  </form>
</body>
</html>`,
          `<!DOCTYPE html>
<html>
<head><title>Student Details</title></head>
<body>
  <h1>Student Details</h1>
  <form>
    <label for="school">School Name</label>
    <input type="text" id="school" name="school">
    <button type="submit">Save</button>
  </form>
</body>
</html>`,
        ),
        callout("tip", "A form's action attribute tells the browser where to send the data, and method decides how (get appends it to the URL; post sends it hidden in the request body). For a form that only reads data — like a search box — get is fine. For anything sensitive, like a password, always use post."),
      ),
    },
  ],
};
