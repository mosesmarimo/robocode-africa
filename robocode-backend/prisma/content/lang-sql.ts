import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1 — Hello, SQL
// ---------------------------------------------------------------------------

const HELLO_WORLD = `SELECT 'Hello, RoboCode!' AS greeting;`;

const SVG_SQL_EVERYWHERE = `<svg viewBox="0 0 600 200" role="img" aria-label="SQL is used in web apps, data analysis, mobile apps, and backend APIs" xmlns="http://www.w3.org/2000/svg">
  <!-- Central database cylinder -->
  <ellipse cx="300" cy="72" rx="52" ry="16" fill="#2563ff" stroke="#1d4ed8" stroke-width="2"/>
  <rect x="248" y="72" width="104" height="56" fill="#2563ff" stroke="#1d4ed8" stroke-width="2"/>
  <ellipse cx="300" cy="128" rx="52" ry="16" fill="#1d4ed8" stroke="#1e40af" stroke-width="2"/>
  <text x="270" y="104" font-family="monospace" font-size="13" fill="#ffffff" font-weight="bold">Database</text>
  <text x="275" y="120" font-family="monospace" font-size="11" fill="#bfdbfe">SQL</text>
  <!-- Web apps -->
  <rect x="20" y="30" width="110" height="50" rx="8" fill="#0f766e" stroke="#14b8a6" stroke-width="2"/>
  <text x="30" y="52" font-family="sans-serif" font-size="11" fill="#ccfbf1" font-weight="bold">Web Apps</text>
  <text x="30" y="69" font-family="monospace" font-size="10" fill="#99f6e4">Instagram, TikTok</text>
  <line x1="130" y1="55" x2="248" y2="88" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Data science -->
  <rect x="20" y="120" width="110" height="50" rx="8" fill="#7c3aed" stroke="#a78bfa" stroke-width="2"/>
  <text x="30" y="142" font-family="sans-serif" font-size="11" fill="#e9d5ff" font-weight="bold">Data Science</text>
  <text x="30" y="158" font-family="monospace" font-size="10" fill="#c4b5fd">pandas, BigQuery</text>
  <line x1="130" y1="145" x2="248" y2="118" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Mobile -->
  <rect x="470" y="30" width="110" height="50" rx="8" fill="#b45309" stroke="#f59e0b" stroke-width="2"/>
  <text x="480" y="52" font-family="sans-serif" font-size="11" fill="#fef3c7" font-weight="bold">Mobile Apps</text>
  <text x="480" y="68" font-family="monospace" font-size="10" fill="#fde68a">SQLite on-device</text>
  <line x1="470" y1="55" x2="352" y2="88" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5,3"/>
  <!-- Backend APIs -->
  <rect x="470" y="120" width="110" height="50" rx="8" fill="#166534" stroke="#22c55e" stroke-width="2"/>
  <text x="480" y="142" font-family="sans-serif" font-size="11" fill="#dcfce7" font-weight="bold">Backend APIs</text>
  <text x="480" y="158" font-family="monospace" font-size="10" fill="#bbf7d0">Postgres, MySQL</text>
  <line x1="470" y1="145" x2="352" y2="118" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5,3"/>
</svg>`;

// ---------------------------------------------------------------------------
// Lesson 2 — Tables & SELECT
// ---------------------------------------------------------------------------

const TABLES_CODE = `-- A table called students holds rows of data.
-- Each column has a name and a data type.

-- See every row in the table
SELECT * FROM students;

-- See only specific columns
SELECT name, grade FROM students;

-- Give a column a friendlier name with AS
SELECT name AS student_name, score AS exam_score
FROM students;`;

// ---------------------------------------------------------------------------
// Lesson 3 — WHERE / ORDER BY / filtering
// ---------------------------------------------------------------------------

const FILTERING_CODE = `-- WHERE filters rows — only rows where the condition is TRUE are returned

-- Students who scored 70 or higher
SELECT name, score
FROM students
WHERE score >= 70;

-- Students in the 'Robotics' subject
SELECT name, score
FROM students
WHERE subject = 'Robotics';

-- Combine conditions with AND / OR
SELECT name, score
FROM students
WHERE score >= 60 AND subject = 'Maths';

-- ORDER BY sorts the results
-- ASC = smallest first (default), DESC = largest first
SELECT name, score
FROM students
ORDER BY score DESC;

-- LIMIT returns only the top N rows
SELECT name, score
FROM students
ORDER BY score DESC
LIMIT 3;`;

// ---------------------------------------------------------------------------
// Lesson 4 — Put it together
// ---------------------------------------------------------------------------

const PUT_TOGETHER_CODE = `-- A worked SQL mini-project: analyse a school competition table

-- 1. See all entries
SELECT * FROM competition_entries;

-- 2. Find top 5 scorers
SELECT name, school, total_score
FROM competition_entries
ORDER BY total_score DESC
LIMIT 5;

-- 3. How many students entered from each school?
SELECT school, COUNT(*) AS num_students
FROM competition_entries
GROUP BY school
ORDER BY num_students DESC;

-- 4. Average score per school (rounded to 1 decimal place)
SELECT school,
       ROUND(AVG(total_score), 1) AS avg_score
FROM competition_entries
GROUP BY school
ORDER BY avg_score DESC;

-- 5. Students who beat the overall average
SELECT name, school, total_score
FROM competition_entries
WHERE total_score > (SELECT AVG(total_score) FROM competition_entries)
ORDER BY total_score DESC;`;

export const langSql: CourseModule = {
  meta: {
    title: "SQL Basics",
    slug: "lang-sql",
    track: "coding",
    level: "high",
    description: "Learn SQL — the universal language for talking to databases — and discover how apps like Instagram and TikTok store and retrieve millions of records.",
    coverImage: "/covers/coding.svg",
    order: 19,
  },
  lessons: [
    {
      title: "Hello, SQL",
      slug: "hello-sql",
      contentType: "markdown",
      estMinutes: 8,
      body: body(
        md(`## What is SQL?

**SQL** (Structured Query Language, pronounced *sequel* or *S-Q-L*) is the language used to talk to **databases** — organised collections of data stored in tables. Every time you scroll through social media, check your school records, or buy something online, SQL is running behind the scenes to find and store information.

SQL has been around since the 1970s and is still one of the most in-demand skills in the tech world. It is used by web developers, data scientists, app builders, and business analysts alike.

### Where is SQL used?`),
        svg(SVG_SQL_EVERYWHERE, "SQL powers web apps, mobile apps, data science, and backend services"),
        md(`### Your very first SQL query

A SQL **query** is a question you ask the database. The simplest query of all:

\`\`\`sql
SELECT 'Hello, RoboCode!' AS greeting;
\`\`\`

\`SELECT\` is SQL's way of saying "give me this data". The text in quotes is treated as a value, and \`AS greeting\` gives the result column a name.

Press **Open in RoboCode Studio** to run it!`),
        code("sql", HELLO_WORLD, { filename: "hello.sql", openInStudio: true }),
        callout("tip", "SQL keywords like SELECT, FROM, WHERE are written in ALL CAPS by convention — but SQL itself doesn't care about case. Writing them in caps just makes queries easier to read at a glance. Most professionals follow this convention."),
      ),
    },
    {
      title: "Tables & SELECT",
      slug: "sql-tables",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## How data is organised: tables

A **database** stores data in **tables** — think of each table like a spreadsheet. Columns define what kind of information is stored, and rows store individual records.

For example, a \`students\` table might look like this:

| id | name | grade | subject | score |
|----|------|-------|---------|-------|
| 1 | Amara | 9 | Maths | 88 |
| 2 | Tendai | 8 | Science | 74 |
| 3 | Kofi | 9 | Robotics | 92 |
| 4 | Zola | 8 | Maths | 65 |
| 5 | Rudo | 9 | Science | 79 |

### Common SQL data types

| SQL Type | What it stores | Example |
|----------|---------------|---------|
| \`INTEGER\` | Whole numbers | \`88\`, \`42\` |
| \`TEXT\` | Text / strings | \`'Amara'\`, \`'Maths'\` |
| \`REAL\` / \`FLOAT\` | Decimal numbers | \`3.14\`, \`88.5\` |
| \`BOOLEAN\` | True or false | \`true\`, \`false\` |
| \`DATE\` | A calendar date | \`'2025-03-15'\` |

### The SELECT statement

\`SELECT\` is the most important SQL keyword. It retrieves rows from a table:

\`\`\`sql
SELECT * FROM students;        -- * means "all columns"
SELECT name, score FROM students;  -- only these two columns
\`\`\`

Try the queries below — each one fetches the same \`students\` table but in a different way.`),
        code("sql", TABLES_CODE, { filename: "select.sql", openInStudio: true }),
        callout("info", "SQL comments start with -- (two dashes). Everything after -- on that line is ignored by the database. Use comments to explain what your query does — future you will thank present you!"),
      ),
    },
    {
      title: "WHERE, ORDER BY & Filtering",
      slug: "sql-filtering",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Filtering and sorting results

Fetching every row in a table is useful, but most of the time you want **specific** rows. SQL gives you powerful tools to filter and sort data.

### WHERE — filter rows

Add a \`WHERE\` clause to keep only the rows where a condition is **true**:

\`\`\`sql
SELECT name, score FROM students WHERE score >= 70;
\`\`\`

You can combine conditions using \`AND\` (both must be true) and \`OR\` (either can be true):

\`\`\`sql
WHERE score >= 60 AND subject = 'Maths'
\`\`\`

### ORDER BY — sort results

\`ORDER BY column ASC\` sorts smallest-to-largest. \`DESC\` reverses the order:

\`\`\`sql
SELECT name, score FROM students ORDER BY score DESC;
\`\`\`

### LIMIT — cap the number of rows

\`LIMIT 5\` returns only the first 5 rows after sorting — perfect for leaderboards:

\`\`\`sql
SELECT name, score FROM students ORDER BY score DESC LIMIT 5;
\`\`\`

### Flowchart of a filtered query`),
        mermaid(
          `flowchart LR
  A[("students table\n(all rows)")] --> B["WHERE\nscore >= 70"]
  B --> C["ORDER BY\nscore DESC"]
  C --> D["LIMIT 3"]
  D --> E[("Result:\ntop 3 scorers")]`,
          "SQL filters rows, then sorts, then limits the output",
        ),
        code("sql", FILTERING_CODE, { filename: "filter.sql", openInStudio: true }),
        callout("tip", "The order of SQL clauses matters: SELECT → FROM → WHERE → ORDER BY → LIMIT. You don't need all of them every time, but they must appear in this order when you do use them."),
      ),
    },
    {
      title: "Put It Together",
      slug: "sql-put-together",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Analyse a competition leaderboard

Now let's combine SELECT, WHERE, ORDER BY, LIMIT, and two new powerful tools — **GROUP BY** and **aggregate functions** — to analyse a school robotics competition.

### New ideas

**Aggregate functions** crunch many rows into a single summary number:

| Function | What it does | Example |
|----------|-------------|---------|
| \`COUNT(*)\` | Counts rows | How many students entered? |
| \`AVG(col)\` | Average value | Mean score per school |
| \`SUM(col)\` | Total | Total points scored |
| \`MAX(col)\` | Largest value | Highest single score |
| \`MIN(col)\` | Smallest value | Lowest single score |

**GROUP BY** splits rows into groups before aggregating, so you get one result per group (e.g., one average per school).

**Subquery** — the final query uses \`(SELECT AVG(...) FROM ...)\` inside a WHERE clause. This is called a *subquery* — it runs first, then the outer query uses its result.

Try running each query one at a time and read the output carefully before moving to the next one.`),
        code("sql", PUT_TOGETHER_CODE, { filename: "competition.sql", openInStudio: true }),
        callout("tip", "SQL is one of the highest-paid skills in tech. Data analysts, backend engineers, and data scientists all use it every day. If you can write SELECT, WHERE, GROUP BY, and ORDER BY, you can already answer real business questions from real data — that is a superpower."),
      ),
    },
  ],
  tasks: [
    {
      title: "Challenge: Sum a range",
      slug: "challenge-sql",
      description: "Write a query whose single result is the sum of the numbers 1 to 20.",
      track: "coding", difficulty: "beginner", points: 50, language: "sql",
      starterCode: "-- Make this query return 210 (the sum of 1..20)\nSELECT 0 AS total;\n",
      checks: { rules: [{ type: "stdout_contains", value: "210" }] },
    },
  ],
};
