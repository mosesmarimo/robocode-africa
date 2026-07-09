import { md, callout, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — CSS Introduction (syntax & selectors)
// ---------------------------------------------------------------------------

const INTRO_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CSS Selectors</title>
<style>
  p {
    color: #374151;
    font-family: sans-serif;
  }
  .highlight {
    background-color: #fef9c3;
    padding: 2px 6px;
    border-radius: 4px;
  }
  #main-title {
    color: #2563eb;
    text-transform: uppercase;
  }
</style>
</head>
<body>
  <h1 id="main-title">Welcome to CSS</h1>
  <p>This paragraph is styled by the element selector, p.</p>
  <p class="highlight">This paragraph is styled by the class selector, .highlight.</p>
</body>
</html>`;

const SELECTOR_FIX_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .title {
    color: #2563eb;
  }
</style>
</head>
<body>
  <h1 id="title">Page Title</h1>
</body>
</html>`;

const SELECTOR_FIX_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  #title {
    color: #2563eb;
  }
</style>
</head>
<body>
  <h1 id="title">Page Title</h1>
</body>
</html>`;

const NOTE_CLASS_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  body { font-family: sans-serif; }
  /* add a rule for .note below */
</style>
</head>
<body>
  <p class="note">Remember to save your work often!</p>
</body>
</html>`;

const NOTE_CLASS_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  body { font-family: sans-serif; }
  .note {
    color: #dc2626;
    background-color: #fef9c3;
    padding: 8px;
  }
</style>
</head>
<body>
  <p class="note">Remember to save your work often!</p>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Colors & Backgrounds
// ---------------------------------------------------------------------------

const COLORS_BACKGROUNDS_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Colors &amp; Backgrounds</title>
<style>
  body { font-family: sans-serif; }
  .named { color: rebeccapurple; }
  .hex { color: #16a34a; }
  .rgb { color: rgb(220, 38, 38); }
  .box {
    background-color: #eff6ff;
    border: 2px solid #2563eb;
    padding: 12px;
    margin-top: 12px;
  }
  .gradient {
    background: linear-gradient(90deg, #2563eb, #7c3aed);
    color: white;
    padding: 12px;
    margin-top: 12px;
    border-radius: 8px;
  }
</style>
</head>
<body>
  <h1>Ways to Write a Color</h1>
  <p class="named">Named color: rebeccapurple</p>
  <p class="hex">Hex color: #16a34a</p>
  <p class="rgb">RGB color: rgb(220, 38, 38)</p>
  <div class="box">A box with a background-color and a matching border color.</div>
  <div class="gradient">A box with a linear-gradient background.</div>
</body>
</html>`;

const BOX_COLOR_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .alert {
    padding: 12px;
    color: #7f1d1d;
    /* add a background-color and a border below */
  }
</style>
</head>
<body>
  <div class="alert">Battery low — please recharge the robot.</div>
</body>
</html>`;

const BOX_COLOR_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .alert {
    padding: 12px;
    color: #7f1d1d;
    background-color: #fee2e2;
    border: 2px solid #dc2626;
  }
</style>
</head>
<body>
  <div class="alert">Battery low — please recharge the robot.</div>
</body>
</html>`;

const GRADIENT_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .banner {
    padding: 24px;
    color: white;
    text-align: center;
    font-family: sans-serif;
    /* replace with a linear-gradient background below */
    background-color: #2563eb;
  }
</style>
</head>
<body>
  <div class="banner">RoboCode Summer Camp — Sign Up Now!</div>
</body>
</html>`;

const GRADIENT_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .banner {
    padding: 24px;
    color: white;
    text-align: center;
    font-family: sans-serif;
    background: linear-gradient(90deg, #2563eb, #7c3aed);
  }
</style>
</head>
<body>
  <div class="banner">RoboCode Summer Camp — Sign Up Now!</div>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 3 — Text & Fonts
// ---------------------------------------------------------------------------

const TEXT_FONTS_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Text &amp; Fonts</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; }
  h1 {
    font-family: Verdana, Arial, sans-serif;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    letter-spacing: 1px;
  }
  p {
    font-size: 1rem;
    line-height: 1.6;
    text-align: justify;
  }
  .caps { text-transform: uppercase; }
  .underline { text-decoration: underline; }
</style>
</head>
<body>
  <h1>Typography Matters</h1>
  <p>Good line-height and font choices make paragraphs far easier to read, especially on longer pages of text. This paragraph uses line-height: 1.6.</p>
  <p class="caps">this line is styled with text-transform: uppercase</p>
  <p class="underline">This line is underlined with text-decoration.</p>
</body>
</html>`;

const FONT_STACK_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  h1 {
    /* change the font-family to Verdana, falling back to Arial, then sans-serif */
    font-family: serif;
    font-weight: normal;
  }
</style>
</head>
<body>
  <h1>Robotics Club</h1>
</body>
</html>`;

const FONT_STACK_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  h1 {
    font-family: Verdana, Arial, sans-serif;
    font-weight: bold;
  }
</style>
</head>
<body>
  <h1>Robotics Club</h1>
</body>
</html>`;

const LINK_STYLE_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  a {
    color: #2563eb;
    /* add a text-decoration rule below */
  }
  p {
    /* set a comfortable line-height below */
  }
</style>
</head>
<body>
  <p>Read our <a href="#">safety guidelines</a> before switching on any robot.</p>
</body>
</html>`;

const LINK_STYLE_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  a {
    color: #2563eb;
    text-decoration: underline;
  }
  p {
    line-height: 1.6;
  }
</style>
</head>
<body>
  <p>Read our <a href="#">safety guidelines</a> before switching on any robot.</p>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 4 — The Box Model
// ---------------------------------------------------------------------------

const BOX_MODEL_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>The Box Model</title>
<style>
  body { font-family: sans-serif; background: #f1f5f9; }
  .card {
    width: 240px;
    padding: 16px;
    border: 4px solid #2563eb;
    margin: 24px;
    background-color: white;
  }
  .card.border-box {
    box-sizing: border-box;
  }
</style>
</head>
<body>
  <h1>content-box vs border-box</h1>
  <div class="card">width: 240px + padding: 16px + border: 4px (default content-box) — this box actually renders 288px wide.</div>
  <div class="card border-box">width: 240px + padding: 16px + border: 4px, but with box-sizing: border-box — this box stays exactly 240px wide.</div>
</body>
</html>`;

const BORDER_BOX_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .container {
    width: 200px;
    border: 2px solid #94a3b8;
    padding: 10px;
  }
  .panel {
    width: 200px;
    padding: 20px;
    border: 3px solid #2563eb;
    background: #eff6ff;
    /* this panel overflows its container — add box-sizing below to fix it */
  }
</style>
</head>
<body>
  <div class="container">
    <div class="panel">This panel is too wide for its container.</div>
  </div>
</body>
</html>`;

const BORDER_BOX_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .container {
    width: 200px;
    border: 2px solid #94a3b8;
    padding: 10px;
  }
  .panel {
    width: 200px;
    padding: 20px;
    border: 3px solid #2563eb;
    background: #eff6ff;
    box-sizing: border-box;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="panel">This panel now fits its container exactly.</div>
  </div>
</body>
</html>`;

const MARGIN_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .box {
    background: #2563eb;
    color: white;
    padding: 12px;
    /* add space between the two boxes below */
    margin-bottom: 0;
  }
</style>
</head>
<body>
  <div class="box">Box One</div>
  <div class="box">Box Two</div>
</body>
</html>`;

const MARGIN_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .box {
    background: #2563eb;
    color: white;
    padding: 12px;
    margin-bottom: 16px;
  }
</style>
</head>
<body>
  <div class="box">Box One</div>
  <div class="box">Box Two</div>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 5 — Layout: Flexbox
// ---------------------------------------------------------------------------

const FLEXBOX_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Flexbox Layout</title>
<style>
  body { font-family: sans-serif; }
  .row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }
  .row.centered {
    justify-content: center;
    align-items: center;
    height: 100px;
    background: #f1f5f9;
  }
  .box {
    background: #2563eb;
    color: white;
    padding: 16px;
    border-radius: 8px;
    flex: 1;
    text-align: center;
  }
</style>
</head>
<body>
  <h1>Flexbox Basics</h1>

  <p>display: flex, gap: 12px, three equal-width boxes (flex: 1):</p>
  <div class="row">
    <div class="box">1</div>
    <div class="box">2</div>
    <div class="box">3</div>
  </div>

  <p>justify-content: center + align-items: center inside a taller row:</p>
  <div class="row centered">
    <div class="box" style="flex: none; width: 120px;">Centered</div>
  </div>
</body>
</html>`;

const FLEX_DIRECTION_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .stack {
    display: flex;
    /* change this so the boxes stack vertically instead of side-by-side */
    gap: 8px;
  }
  .box { background: #2563eb; color: white; padding: 12px; border-radius: 6px; }
</style>
</head>
<body>
  <div class="stack">
    <div class="box">Step 1</div>
    <div class="box">Step 2</div>
    <div class="box">Step 3</div>
  </div>
</body>
</html>`;

const FLEX_DIRECTION_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .box { background: #2563eb; color: white; padding: 12px; border-radius: 6px; }
</style>
</head>
<body>
  <div class="stack">
    <div class="box">Step 1</div>
    <div class="box">Step 2</div>
    <div class="box">Step 3</div>
  </div>
</body>
</html>`;

const JUSTIFY_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .toolbar {
    display: flex;
    /* change this so the buttons sit at opposite ends of the toolbar */
    justify-content: center;
    background: #1e293b;
    padding: 12px;
  }
  button { padding: 6px 14px; }
</style>
</head>
<body>
  <div class="toolbar">
    <button>Back</button>
    <button>Next</button>
  </div>
</body>
</html>`;

const JUSTIFY_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    background: #1e293b;
    padding: 12px;
  }
  button { padding: 6px 14px; }
</style>
</head>
<body>
  <div class="toolbar">
    <button>Back</button>
    <button>Next</button>
  </div>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Lesson 6 — Simple Styling Project
// ---------------------------------------------------------------------------

const STYLING_PROJECT_TRYIT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RoboCode Club Flyer</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', sans-serif;
    background: #0f172a;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flyer {
    width: 340px;
    background: linear-gradient(160deg, #1e293b, #0f172a);
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 24px;
    color: #e2e8f0;
    text-align: center;
  }
  .flyer h1 {
    color: #38bdf8;
    font-size: 1.5rem;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .flyer p {
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .tags {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .tag {
    background: #1e40af;
    color: #bfdbfe;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.8rem;
  }
</style>
</head>
<body>
  <div class="flyer">
    <h1>RoboCode Club</h1>
    <p>Join us every Friday after school to build robots, learn to code, and compete in challenges.</p>
    <div class="tags">
      <span class="tag">HTML</span>
      <span class="tag">CSS</span>
      <span class="tag">Robotics</span>
    </div>
  </div>
</body>
</html>`;

const FLYER_COLOR_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: sans-serif;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
  .flyer {
    width: 300px;
    /* change this gradient to shades of green instead of blue/purple */
    background: linear-gradient(160deg, #1e293b, #0f172a);
    border-radius: 16px;
    padding: 20px;
    color: white;
    text-align: center;
  }
  .tag {
    background: #1e40af;
    color: #bfdbfe;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    display: inline-block;
  }
</style>
</head>
<body>
  <div class="flyer">
    <h2>Eco Club</h2>
    <p>Meet every Wednesday to plan our recycling drive.</p>
    <span class="tag">Environment</span>
  </div>
</body>
</html>`;

const FLYER_COLOR_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: sans-serif;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
  .flyer {
    width: 300px;
    background: linear-gradient(160deg, #14532d, #052e16);
    border-radius: 16px;
    padding: 20px;
    color: white;
    text-align: center;
  }
  .tag {
    background: #166534;
    color: #bbf7d0;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    display: inline-block;
  }
</style>
</head>
<body>
  <div class="flyer">
    <h2>Eco Club</h2>
    <p>Meet every Wednesday to plan our recycling drive.</p>
    <span class="tag">Environment</span>
  </div>
</body>
</html>`;

const FLYER_TAG_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .tag {
    background: #1e40af;
    color: #bfdbfe;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-family: sans-serif;
  }
</style>
</head>
<body>
  <div class="tags">
    <span class="tag">HTML</span>
    <span class="tag">CSS</span>
    <!-- add a third tag that says "Python" below -->
  </div>
</body>
</html>`;

const FLYER_TAG_SOLUTION = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  .tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .tag {
    background: #1e40af;
    color: #bfdbfe;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-family: sans-serif;
  }
</style>
</head>
<body>
  <div class="tags">
    <span class="tag">HTML</span>
    <span class="tag">CSS</span>
    <span class="tag">Python</span>
  </div>
</body>
</html>`;

export const cssTutorialCourse: CourseModule = {
  meta: {
    title: "CSS Tutorial",
    slug: "tutorial-css",
    track: "coding",
    level: "primary",
    description:
      "A W3Schools-style, hands-on introduction to CSS — syntax, selectors, colors, fonts, the box model, and Flexbox layout — with live Try it Yourself examples and exercises.",
    coverImage: "/covers/coding.svg",
    order: 55,
    language: "css",
  },
  lessons: [
    // -------------------------------------------------------------------
    // Lesson 1 — CSS Introduction
    // -------------------------------------------------------------------
    {
      title: "CSS Introduction",
      slug: "css-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## What is CSS?

**CSS** stands for **C**ascading **S**tyle **S**heets. CSS describes *how* HTML elements should be displayed — their colors, fonts, spacing, and layout. HTML builds the page; CSS makes it look good.

### CSS Syntax

A CSS rule has two parts:

\`\`\`css
selector {
  property: value;
  property: value;
}
\`\`\`

- The **selector** points to the HTML element(s) you want to style.
- Each **declaration** is a \`property: value\` pair, ending with a semicolon.
- All declarations for a selector are wrapped in curly braces \`{ }\`.

\`\`\`css
p {
  color: red;
  text-align: center;
}
\`\`\`

This rule tells the browser: "every \`<p>\` element should have red, centered text."

### Three Ways to Add CSS

| Method | How | When to use |
|---|---|---|
| **External** | \`<link rel="stylesheet" href="styles.css">\` in \`<head>\` | Best practice — one stylesheet shared across many pages |
| **Internal** | A \`<style>\` block inside \`<head>\` | A single page with its own styles (used in every example on this page) |
| **Inline** | A \`style="..."\` attribute on one element | Quick one-off tweaks — avoid for real projects |

### CSS Selectors

| Selector | Syntax | Selects |
|---|---|---|
| **Element** | \`p\` | Every \`<p>\` element |
| **Class** | \`.highlight\` | Every element with \`class="highlight"\` |
| **ID** | \`#main-title\` | The one element with \`id="main-title"\` |
| **Universal** | \`*\` | Every element on the page |

An element can have a class *and* an ID. Use classes for reusable styles you apply to many elements, and IDs sparingly — an ID must be unique on the page.

Run the example below — it uses an element selector, a class selector, and an ID selector together.`),
        tryit("css", INTRO_TRYIT, { caption: "One heading styled by ID, one paragraph styled by the element selector, one paragraph styled by a class." }),
        md(`### Reference: Selector Types

| Selector | Example | Matches |
|---|---|---|
| Element | \`h1 { }\` | Every \`<h1>\` |
| Class | \`.card { }\` | Every element with \`class="card"\` |
| ID | \`#header { }\` | The element with \`id="header"\` |
| Universal | \`* { }\` | Every element |
| Pseudo-class | \`a:hover { }\` | A link while the mouse is over it |`),
        exercise(
          "css",
          "The selector below uses class syntax (.title) but the h1 has an id, not a class. Fix the CSS selector so the blue color is actually applied.",
          SELECTOR_FIX_STARTER,
          SELECTOR_FIX_SOLUTION,
          { caption: "The heading \"Page Title\" should turn blue once the selector is fixed." },
        ),
        exercise(
          "css",
          "Add a CSS rule for the .note class that sets color to #dc2626 (red) and background-color to #fef9c3 (pale yellow), with some padding.",
          NOTE_CLASS_STARTER,
          NOTE_CLASS_SOLUTION,
        ),
        callout("tip", "CSS is called \"cascading\" because when two rules could apply to the same element, specific rules like IDs and inline styles usually win over general ones like element selectors. You will learn the full cascade rules as you get more advanced, but for now: prefer classes, and keep IDs and inline styles rare."),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 2 — Colors & Backgrounds
    // -------------------------------------------------------------------
    {
      title: "Colors & Backgrounds",
      slug: "css-colors-backgrounds",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## CSS Colors

CSS colors can be written in several equivalent ways:

- **Named colors** — over 140 built-in keywords: \`red\`, \`blue\`, \`tomato\`, \`rebeccapurple\`.
- **Hex codes** — six hexadecimal digits for red, green, and blue: \`#2563eb\`. A shorter three-digit form also exists: \`#f00\` = \`#ff0000\`.
- **RGB** — \`rgb(220, 38, 38)\` — each of red, green, blue is a number from 0 to 255.
- **RGBA** — like RGB but with a fourth *alpha* (opacity) value from 0 (invisible) to 1 (solid): \`rgba(220, 38, 38, 0.5)\`.

Hex codes are the most common in real projects because color-picker tools (like the one built into VS Code) copy colors in hex form.

### CSS Backgrounds

- \`background-color\` — fills an element with a solid color.
- \`border\` — draws a line around an element: \`border: 2px solid #2563eb;\` (width, style, then color).
- \`background\` (shorthand) can also take a **gradient** instead of a solid color:

\`\`\`css
.banner {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
}
\`\`\`

\`linear-gradient()\` blends smoothly between two or more colors. The first value (\`90deg\`) is the direction — \`90deg\` goes left to right, \`180deg\` goes top to bottom.

Run the example below to compare named, hex, and RGB text colors alongside a bordered box and a gradient box.`),
        tryit("css", COLORS_BACKGROUNDS_TRYIT, { caption: "Three color formats applied to text, plus a bordered box and a gradient box." }),
        md(`### Reference: Color & Background Properties

| Property | Example value | Effect |
|---|---|---|
| \`color\` | \`#374151\` | Text color |
| \`background-color\` | \`#eff6ff\` | Solid background fill |
| \`background\` | \`linear-gradient(90deg, #2563eb, #7c3aed)\` | Solid color or gradient background |
| \`border\` | \`2px solid #2563eb\` | Width, style, and color of an element's border |
| \`border-radius\` | \`8px\` | Rounds the corners of a box |`),
        exercise(
          "css",
          "This alert box needs a light red background-color (#fee2e2) and a solid 2px red border (#dc2626) to match its dark red text.",
          BOX_COLOR_STARTER,
          BOX_COLOR_SOLUTION,
        ),
        exercise(
          "css",
          "Replace the solid background-color on .banner with a linear-gradient from #2563eb to #7c3aed, going left to right (90deg).",
          GRADIENT_STARTER,
          GRADIENT_SOLUTION,
          { caption: "The banner should smoothly blend from blue to purple." },
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 3 — Text & Fonts
    // -------------------------------------------------------------------
    {
      title: "Text & Fonts",
      slug: "css-text-fonts",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Styling Text

### Fonts

\`font-family\` sets the typeface. Always provide a **fallback stack** — a comma-separated list the browser tries in order, ending with a generic family:

\`\`\`css
h1 {
  font-family: Verdana, Arial, sans-serif;
}
\`\`\`

If the visitor's device does not have Verdana, the browser tries Arial, and finally falls back to whatever \`sans-serif\` font is installed. The three generic families are \`serif\` (has small decorative strokes), \`sans-serif\` (clean, no strokes), and \`monospace\` (fixed-width, used for code).

### Sizing and weight

- \`font-size\` — how big the text is. \`rem\` units (relative to the page's root font size) are recommended over fixed \`px\` values, because they respect a visitor's browser zoom/accessibility settings.
- \`font-weight\` — boldness: \`normal\`, \`bold\`, or a number like \`400\` (normal) to \`700\` (bold).
- \`font-style: italic\` — slants the text.

### Alignment, decoration, and spacing

- \`text-align\` — \`left\`, \`right\`, \`center\`, or \`justify\`.
- \`text-decoration\` — \`underline\`, \`line-through\`, or \`none\` (commonly used to remove the default underline from links).
- \`text-transform\` — \`uppercase\`, \`lowercase\`, or \`capitalize\`.
- \`line-height\` — the vertical space a line of text occupies. A value like \`1.6\` (1.6× the font size) makes paragraphs much easier to read than the browser default.

Run the example below — it combines a font stack, sizing, alignment, and \`line-height\` on real paragraphs.`),
        tryit("css", TEXT_FONTS_TRYIT, { caption: "A centered heading in a sans-serif font stack, and body text with comfortable line-height." }),
        md(`### Reference: Text Properties

| Property | Example value | Effect |
|---|---|---|
| \`font-family\` | \`Verdana, Arial, sans-serif\` | Typeface, with fallbacks |
| \`font-size\` | \`1.25rem\` | Text size |
| \`font-weight\` | \`bold\` or \`600\` | Boldness |
| \`text-align\` | \`center\` | Horizontal alignment |
| \`text-decoration\` | \`underline\` | Underline / strikethrough / none |
| \`text-transform\` | \`uppercase\` | Changes letter case for display |
| \`line-height\` | \`1.6\` | Vertical spacing within a paragraph |`),
        exercise(
          "css",
          "Change the h1's font-family to Verdana, falling back to Arial, then sans-serif, and make it bold.",
          FONT_STACK_STARTER,
          FONT_STACK_SOLUTION,
        ),
        exercise(
          "css",
          "Underline the link with text-decoration, and give the paragraph a comfortable line-height of 1.6.",
          LINK_STYLE_STARTER,
          LINK_STYLE_SOLUTION,
        ),
        callout("info", "Real websites almost never rely only on the three generic font families. Services like Google Fonts let you load custom typefaces with a single <link> tag — but always keep a generic fallback (sans-serif, serif, or monospace) at the end of your stack in case the custom font fails to load."),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 4 — The Box Model
    // -------------------------------------------------------------------
    {
      title: "The Box Model",
      slug: "css-box-model-tutorial",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## The CSS Box Model

Every HTML element is rendered as a rectangular **box** made of four areas, from the inside out:

1. **Content** — the text or image itself, sized by \`width\` and \`height\`.
2. **Padding** — transparent space between the content and the border.
3. **Border** — a visible (or invisible) line around the padding.
4. **Margin** — transparent space *outside* the border that pushes other elements away.

\`\`\`css
.card {
  width: 240px;
  padding: 16px;
  border: 4px solid #2563eb;
  margin: 24px;
}
\`\`\`

### box-sizing — a crucial detail

By default (\`box-sizing: content-box\`), \`width\` only sets the size of the **content** area — padding and border are added *on top*. That means the box above actually renders at 240 + 16 + 16 + 4 + 4 = **284px** wide, which often surprises beginners.

Setting \`box-sizing: border-box\` changes the rule so that \`width\` includes the padding and border — the box stays exactly the width you set. Most modern CSS starts with this reset:

\`\`\`css
* {
  box-sizing: border-box;
}
\`\`\`

Run the example below to see the same box rendered both ways, side by side.`),
        tryit("css", BOX_MODEL_TRYIT, { caption: "Two identical boxes — the second uses box-sizing: border-box and stays exactly 240px wide." }),
        md(`### Reference: Box Model Properties

| Property | Description |
|---|---|
| \`width\` / \`height\` | Size of the content area |
| \`padding\` | Space between content and border |
| \`border\` | Visible edge: width, style, and color |
| \`margin\` | Space outside the border, pushing other elements away |
| \`box-sizing: border-box\` | Makes width/height include padding and border |`),
        exercise(
          "css",
          "This panel overflows its 200px container because its padding and border are added on top of its width. Add box-sizing: border-box to .panel to fix it.",
          BORDER_BOX_STARTER,
          BORDER_BOX_SOLUTION,
          { caption: "The blue panel should now fit exactly inside the grey container." },
        ),
        exercise(
          "css",
          "Add margin-bottom: 16px to .box so there is visible space between Box One and Box Two.",
          MARGIN_STARTER,
          MARGIN_SOLUTION,
        ),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 5 — Layout: Flexbox
    // -------------------------------------------------------------------
    {
      title: "Layout: Flexbox",
      slug: "css-flexbox",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## CSS Layout with Flexbox

**Flexbox** is the modern way to arrange elements in a row or column, with easy alignment and spacing — no floats or hacky positioning tricks required.

### Turning on Flexbox

Add \`display: flex\` to a **container**. All of its direct children automatically line up side by side:

\`\`\`css
.row {
  display: flex;
  gap: 12px;
}
\`\`\`

- \`gap\` — sets consistent spacing *between* the children, without needing margins.
- \`flex-direction: column\` — stacks the children vertically instead of horizontally.

### Aligning children

Flexbox gives you two alignment axes:

- \`justify-content\` — aligns children along the **main axis** (horizontally, by default): \`flex-start\`, \`center\`, \`space-between\`, \`space-around\`.
- \`align-items\` — aligns children along the **cross axis** (vertically, by default): \`flex-start\`, \`center\`, \`stretch\`.

\`\`\`css
.row {
  display: flex;
  justify-content: center;
  align-items: center;
}
\`\`\`

### Sizing children

\`flex: 1\` on a child means "grow to fill an equal share of the remaining space." Give every child in a row \`flex: 1\` and they will all become the same width automatically.

Run the example below — a row of three equal boxes, and a second row where a single box is centered both ways.`),
        tryit("css", FLEXBOX_TRYIT, { caption: "Three equal-width flex boxes in a row, and one box centered inside a taller row." }),
        md(`### Reference: Flexbox Properties

| Property | Applied to | Example value | Effect |
|---|---|---|---|
| \`display\` | Container | \`flex\` | Turns on flexbox for direct children |
| \`flex-direction\` | Container | \`column\` | Stack children vertically instead of horizontally |
| \`justify-content\` | Container | \`space-between\` | Aligns children along the main axis |
| \`align-items\` | Container | \`center\` | Aligns children along the cross axis |
| \`gap\` | Container | \`12px\` | Space between children |
| \`flex\` | Child | \`1\` | Share of remaining space the child should grow to fill |`),
        exercise(
          "css",
          "Change .stack so the three steps are arranged in a vertical column instead of side by side, using flex-direction.",
          FLEX_DIRECTION_STARTER,
          FLEX_DIRECTION_SOLUTION,
        ),
        exercise(
          "css",
          "Change .toolbar so the Back and Next buttons sit at opposite ends, using justify-content: space-between instead of center.",
          JUSTIFY_STARTER,
          JUSTIFY_SOLUTION,
        ),
        callout("tip", "Flexbox only controls the direct children of the flex container — grandchildren are unaffected until you make them flex containers too. If your layout looks wrong, check you added display: flex to the right element."),
      ),
    },

    // -------------------------------------------------------------------
    // Lesson 6 — Simple Styling Project
    // -------------------------------------------------------------------
    {
      title: "Simple Styling Project",
      slug: "css-styling-project",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Put It All Together: Style a Flyer

Time to combine everything from this course — colors and gradients, fonts, the box model, and Flexbox — into one small, polished project: a club announcement flyer.

### How the flyer is built

1. **Reset** — \`* { box-sizing: border-box; margin: 0; padding: 0; }\` makes every element's sizing predictable and removes browser default spacing.
2. **Centering the flyer on the page** — the \`<body>\` is a flex container with \`align-items: center\` and \`justify-content: center\`, so the flyer sits in the middle of the screen no matter the window size.
3. **The card itself** — a \`linear-gradient\` background, a subtle \`border\`, and \`border-radius\` give it a polished, modern look.
4. **Typography** — the heading and paragraph use different colors and \`line-height\` for readability against the dark background.
5. **Tag pills** — \`.tags\` is its own flex container (\`display: flex; gap: 8px; flex-wrap: wrap\`), and each \`.tag\` uses \`border-radius: 999px\` to become a fully rounded pill shape.

Run the example below, then try the exercises to make it your own.`),
        tryit("css", STYLING_PROJECT_TRYIT, { caption: "A dark, centered club-announcement card with a gradient background and rounded tag pills." }),
        md(`### Reference: Where Each Topic Is Used

| Topic from this course | Used in the flyer for |
|---|---|
| Colors & backgrounds | The \`linear-gradient\` card background and tag pill colors |
| Text & fonts | The heading color, \`line-height\`, and \`letter-spacing\` |
| The box model | \`padding\`, \`border\`, \`border-radius\`, and the \`box-sizing\` reset |
| Flexbox | Centering the flyer on the page, and laying out the tag pills |`),
        exercise(
          "css",
          "This Eco Club flyer currently uses a blue/purple gradient and blue tags — restyle it with shades of green instead: change the .flyer gradient to go from #14532d to #052e16, and the .tag background to #166534 with text color #bbf7d0.",
          FLYER_COLOR_STARTER,
          FLYER_COLOR_SOLUTION,
          { caption: "The flyer should now use a dark green gradient and green tag pills." },
        ),
        exercise(
          "css",
          "Add a third tag pill that says \"Python\" to match the existing HTML and CSS tags.",
          FLYER_TAG_STARTER,
          FLYER_TAG_SOLUTION,
        ),
        callout("tip", "This flyer is a real, complete web page — save it as index.html and it would work on any web server. Try changing the club name, the description, and the tags to advertise a club or event you actually care about."),
      ),
    },
  ],
};
