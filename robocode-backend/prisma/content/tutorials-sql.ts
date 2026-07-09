import { md, callout, tryit, exercise, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Shared seed data used by every lesson (each tryit recreates it so every
// example is fully self-contained and runs against a fresh in-browser
// SQLite database).
// ---------------------------------------------------------------------------

const STUDENTS_SCHEMA = `CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER,
  grade TEXT
);

INSERT INTO students (id, name, age, grade) VALUES
  (1, 'Tariro', 14, 'A'),
  (2, 'Farai', 15, 'B'),
  (3, 'Rudo', 13, 'A'),
  (4, 'Tino', 16, 'C');`;

// ---------------------------------------------------------------------------
// Lesson 1 — SELECT Basics
// ---------------------------------------------------------------------------

const SELECT_BASICS_CODE = `${STUDENTS_SCHEMA}

SELECT name, age FROM students;`;

const SELECT_BASICS_EXPECTED =
  "name   | age\n-------+----\nTariro | 14 \nFarai  | 15 \nRudo   | 13 \nTino   | 16 ";

// ---------------------------------------------------------------------------
// Lesson 2 — WHERE & Filtering
// ---------------------------------------------------------------------------

const WHERE_FILTERING_CODE = `${STUDENTS_SCHEMA}

SELECT name, age FROM students WHERE age >= 15;`;

const WHERE_FILTERING_EXPECTED = "name  | age\n------+----\nFarai | 15 \nTino  | 16 ";

// ---------------------------------------------------------------------------
// Lesson 3 — ORDER BY & LIMIT
// ---------------------------------------------------------------------------

const ORDER_LIMIT_CODE = `${STUDENTS_SCHEMA}

SELECT name, age FROM students ORDER BY age DESC LIMIT 2;`;

const ORDER_LIMIT_EXPECTED = "name  | age\n------+----\nTino  | 16 \nFarai | 15 ";

// ---------------------------------------------------------------------------
// Lesson 4 — INSERT & CREATE TABLE
// ---------------------------------------------------------------------------

const INSERT_CREATE_CODE = `CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER,
  grade TEXT
);

INSERT INTO students (id, name, age, grade) VALUES
  (1, 'Tariro', 14, 'A'),
  (2, 'Farai', 15, 'B'),
  (3, 'Rudo', 13, 'A');

-- Add one more student after the table already has rows
INSERT INTO students (id, name, age, grade) VALUES (4, 'Tino', 16, 'C');

SELECT id, name, age, grade FROM students ORDER BY id;`;

const INSERT_CREATE_EXPECTED =
  "id | name   | age | grade\n---+--------+-----+------\n1  | Tariro | 14  | A    \n2  | Farai  | 15  | B    \n3  | Rudo   | 13  | A    \n4  | Tino   | 16  | C    ";

// ---------------------------------------------------------------------------
// Lesson 5 — Aggregates: COUNT, SUM, GROUP BY
// ---------------------------------------------------------------------------

const AGGREGATES_CODE = `${STUDENTS_SCHEMA}

SELECT grade, COUNT(*) AS num_students, ROUND(AVG(age), 1) AS avg_age
FROM students
GROUP BY grade
ORDER BY grade;`;

const AGGREGATES_EXPECTED =
  "grade | num_students | avg_age\n------+--------------+--------\nA     | 2            | 13.5   \nB     | 1            | 15     \nC     | 1            | 16     ";

// ---------------------------------------------------------------------------
// Lesson 6 — JOIN
// ---------------------------------------------------------------------------

const JOIN_CODE = `${STUDENTS_SCHEMA}

CREATE TABLE clubs (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,
  club_name TEXT
);

INSERT INTO clubs (id, student_id, club_name) VALUES
  (1, 1, 'Robotics'),
  (2, 2, 'Chess'),
  (3, 1, 'Coding');

SELECT students.name AS student, clubs.club_name AS club
FROM students
JOIN clubs ON students.id = clubs.student_id
ORDER BY students.name, clubs.club_name;`;

const JOIN_EXPECTED =
  "student | club    \n--------+---------\nFarai   | Chess   \nTariro  | Coding  \nTariro  | Robotics";

export const sqlTutorialCourse: CourseModule = {
  meta: {
    title: "SQL Tutorial",
    slug: "tutorial-sql",
    track: "coding",
    level: "primary",
    description:
      "Learn SQL — the language of databases — from your first SELECT to filtering, sorting, aggregates, and joins, with runnable examples in every lesson.",
    coverImage: "/covers/coding.svg",
    order: 53,
    language: "sql",
  },
  lessons: [
    {
      title: "SELECT Basics",
      slug: "select-basics",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## What is SQL?

**SQL** (Structured Query Language) is how you talk to a relational database — a program that stores data in **tables** made of rows and columns, much like a spreadsheet. Every major app you use (school systems, social networks, banking apps) stores its data in a database and reads it back out using SQL.

### Creating a table

A table's columns and their types are defined with \`CREATE TABLE\`:

\`\`\`sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER,
  grade TEXT
);
\`\`\`

Each row of a table is one record — here, one student. \`id INTEGER PRIMARY KEY\` means every student has a unique whole-number ID.

### Adding rows with INSERT

\`\`\`sql
INSERT INTO students (id, name, age, grade) VALUES (1, 'Tariro', 14, 'A');
\`\`\`

### Reading rows with SELECT

The \`SELECT\` statement is how you read data back out. Its basic shape is:

\`\`\`sql
SELECT column1, column2 FROM table_name;
\`\`\`

- \`SELECT name, age\` picks which columns to return.
- \`SELECT *\` returns **all** columns.
- \`FROM students\` says which table to read from.

Run the example below — it creates the \`students\` table, adds four rows, then selects just the \`name\` and \`age\` columns.`),
        tryit("sql", SELECT_BASICS_CODE, {
          expectedOutput: SELECT_BASICS_EXPECTED,
          caption: "Create a table, insert rows, then SELECT two columns",
        }),
        md(`### Quick reference

| Statement | Purpose |
|-----------|---------|
| \`CREATE TABLE t (col TYPE, ...);\` | Define a new table and its columns |
| \`INSERT INTO t (cols) VALUES (...);\` | Add a row |
| \`SELECT col1, col2 FROM t;\` | Read specific columns |
| \`SELECT * FROM t;\` | Read every column |`),
        callout(
          "tip",
          "SQL keywords like SELECT, FROM, and CREATE TABLE are traditionally written in UPPERCASE to make them stand out from table and column names, but SQL itself is not case-sensitive for keywords. Every statement ends with a semicolon (;).",
        ),
        exercise(
          "sql",
          "Using the same `students` table (id, name, age, grade) with the four rows from the lesson, write a SELECT that returns only the `name` column for every student.",
          `${STUDENTS_SCHEMA}\n\n-- TODO: select only the name column\nSELECT * FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT name FROM students;`,
          { check: "Result should be a single 'name' column with 4 rows: Tariro, Farai, Rudo, Tino" },
        ),
        exercise(
          "sql",
          "Write a SELECT that returns the `name` and `grade` columns for every student.",
          `${STUDENTS_SCHEMA}\n\n-- TODO: select name and grade\nSELECT * FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT name, grade FROM students;`,
          { check: "Result should have two columns: name and grade, 4 rows" },
        ),
      ),
    },
    {
      title: "WHERE & Filtering",
      slug: "where-filtering",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Filtering rows with WHERE

\`SELECT\` without any filter returns every row. Add a \`WHERE\` clause to keep only the rows that match a condition:

\`\`\`sql
SELECT name, age FROM students WHERE age >= 15;
\`\`\`

This reads a row, checks \`age >= 15\`, and includes the row only if that condition is true.

### Comparison operators

| Operator | Meaning |
|----------|---------|
| \`=\` | Equal to |
| \`!=\` or \`<>\` | Not equal to |
| \`>\`, \`<\` | Greater than, less than |
| \`>=\`, \`<=\` | Greater than or equal, less than or equal |

### Combining conditions

Use \`AND\` to require every condition to be true, and \`OR\` to require at least one:

\`\`\`sql
SELECT name FROM students WHERE grade = 'A' AND age < 14;
SELECT name FROM students WHERE grade = 'A' OR grade = 'B';
\`\`\`

### Matching text

Use single quotes around text values, e.g. \`grade = 'A'\`. Column names are never quoted.

Run the example below to filter students by age.`),
        tryit("sql", WHERE_FILTERING_CODE, {
          expectedOutput: WHERE_FILTERING_EXPECTED,
          caption: "WHERE filters rows by a condition",
        }),
        md(`### Quick reference

| Clause | Example |
|--------|---------|
| Filter by number | \`WHERE age >= 15\` |
| Filter by text | \`WHERE grade = 'A'\` |
| Both conditions must hold | \`WHERE age >= 15 AND grade = 'B'\` |
| Either condition holds | \`WHERE grade = 'A' OR grade = 'C'\` |`),
        callout(
          "info",
          "WHERE is applied while SQLite reads the table, before any column list or ordering is considered — so you can filter on a column even if you don't SELECT it back out.",
        ),
        exercise(
          "sql",
          "Write a SELECT that returns the `name` and `grade` of students whose `grade` is exactly `'A'`.",
          `${STUDENTS_SCHEMA}\n\n-- TODO: filter to grade = 'A'\nSELECT name, grade FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT name, grade FROM students WHERE grade = 'A';`,
          { check: "Result should be Tariro and Rudo, both grade A" },
        ),
        exercise(
          "sql",
          "Write a SELECT that returns the `name` and `age` of students younger than 15 (`age < 15`).",
          `${STUDENTS_SCHEMA}\n\n-- TODO: filter to age < 15\nSELECT name, age FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT name, age FROM students WHERE age < 15;`,
          { check: "Result should be Tariro (14) and Rudo (13)" },
        ),
      ),
    },
    {
      title: "ORDER BY & LIMIT",
      slug: "order-by-limit",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## Sorting results with ORDER BY

By default, a database does not guarantee any particular row order. To sort results, add \`ORDER BY\`:

\`\`\`sql
SELECT name, age FROM students ORDER BY age ASC;  -- smallest first (default)
SELECT name, age FROM students ORDER BY age DESC; -- largest first
\`\`\`

\`ASC\` (ascending) is the default if you omit it; \`DESC\` (descending) reverses the order.

### Limiting how many rows come back

\`LIMIT\` caps the number of rows returned — useful for "top N" queries. It is applied **after** sorting:

\`\`\`sql
SELECT name, age FROM students ORDER BY age DESC LIMIT 2; -- the two oldest students
\`\`\`

Combining \`ORDER BY\` with \`LIMIT\` is one of the most common SQL patterns: "give me the top 2 by some measure."

Run the example below to find the two oldest students.`),
        tryit("sql", ORDER_LIMIT_CODE, {
          expectedOutput: ORDER_LIMIT_EXPECTED,
          caption: "ORDER BY ... DESC combined with LIMIT",
        }),
        md(`### Quick reference

| Clause | Effect |
|--------|--------|
| \`ORDER BY col\` | Sort ascending by \`col\` (default) |
| \`ORDER BY col ASC\` | Sort ascending explicitly |
| \`ORDER BY col DESC\` | Sort descending |
| \`ORDER BY col1, col2\` | Sort by \`col1\`; break ties using \`col2\` |
| \`LIMIT n\` | Return only the first \`n\` rows |`),
        callout(
          "tip",
          "Without ORDER BY, a query's row order is not guaranteed to be consistent across databases or even across runs of the same database. If the order matters to your result, always add an explicit ORDER BY.",
        ),
        exercise(
          "sql",
          "Write a SELECT that returns `name` and `age` for all students, sorted alphabetically by `name` (ascending).",
          `${STUDENTS_SCHEMA}\n\n-- TODO: order by name ascending\nSELECT name, age FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT name, age FROM students ORDER BY name ASC;`,
          { check: "Rows should appear in alphabetical order: Farai, Rudo, Tariro, Tino" },
        ),
        exercise(
          "sql",
          "Write a SELECT that returns just the single oldest student's `name` and `age` (sort by age descending and keep only 1 row).",
          `${STUDENTS_SCHEMA}\n\n-- TODO: get only the oldest student\nSELECT name, age FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT name, age FROM students ORDER BY age DESC LIMIT 1;`,
          { check: "Result should be exactly one row: Tino, 16" },
        ),
      ),
    },
    {
      title: "INSERT & CREATE TABLE",
      slug: "insert-create-table",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Designing a table with CREATE TABLE

Every column in \`CREATE TABLE\` has a name and a **type**. SQLite's core types are:

| Type | Holds |
|------|-------|
| \`INTEGER\` | Whole numbers |
| \`REAL\` | Decimal numbers |
| \`TEXT\` | Text strings |

Marking a column \`PRIMARY KEY\` tells the database that column uniquely identifies each row — no two rows can share the same value there.

\`\`\`sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER,
  grade TEXT
);
\`\`\`

### Adding rows over time with INSERT

A real application adds rows over time, not all at once. You can run \`INSERT\` again later to add more rows to a table that already has data:

\`\`\`sql
INSERT INTO students (id, name, age, grade) VALUES
  (1, 'Tariro', 14, 'A'),
  (2, 'Farai', 15, 'B'),
  (3, 'Rudo', 13, 'A');

-- later...
INSERT INTO students (id, name, age, grade) VALUES (4, 'Tino', 16, 'C');
\`\`\`

Each \`INSERT\` can add one row or several rows at once, separated by commas.

Run the example below — it inserts three students, then inserts a fourth afterward, and selects everything to show all four are present.`),
        tryit("sql", INSERT_CREATE_CODE, {
          expectedOutput: INSERT_CREATE_EXPECTED,
          caption: "CREATE TABLE, two separate INSERTs, then SELECT everything",
        }),
        md(`### Quick reference

| Task | Syntax |
|------|--------|
| Create a table | \`CREATE TABLE t (col1 TYPE, col2 TYPE, ...);\` |
| Mark a unique ID column | \`id INTEGER PRIMARY KEY\` |
| Insert one row | \`INSERT INTO t (cols) VALUES (v1, v2, ...);\` |
| Insert several rows at once | \`INSERT INTO t (cols) VALUES (...), (...), (...);\` |`),
        callout(
          "warning",
          "The order columns are listed in CREATE TABLE has nothing to do with the order you must INSERT them in — as long as you name the columns explicitly in INSERT INTO t (col_a, col_b), you can list the VALUES in that same order regardless of how the table was defined.",
        ),
        exercise(
          "sql",
          "Create a table `pets` with columns `id INTEGER PRIMARY KEY`, `name TEXT`, and `species TEXT`. Insert two rows: (1, 'Rex', 'Dog') and (2, 'Milo', 'Cat'). Then SELECT * FROM pets.",
          "-- TODO: CREATE TABLE pets and INSERT two rows\n\nSELECT * FROM pets;",
          "CREATE TABLE pets (\n  id INTEGER PRIMARY KEY,\n  name TEXT,\n  species TEXT\n);\n\nINSERT INTO pets (id, name, species) VALUES\n  (1, 'Rex', 'Dog'),\n  (2, 'Milo', 'Cat');\n\nSELECT * FROM pets;",
          { check: "Result should have 2 rows: Rex/Dog and Milo/Cat" },
        ),
        exercise(
          "sql",
          "Starting from the `pets` table with Rex and Milo already inserted, add a third pet (3, 'Coco', 'Parrot') with a second INSERT statement, then SELECT * FROM pets ORDER BY id.",
          "CREATE TABLE pets (\n  id INTEGER PRIMARY KEY,\n  name TEXT,\n  species TEXT\n);\n\nINSERT INTO pets (id, name, species) VALUES\n  (1, 'Rex', 'Dog'),\n  (2, 'Milo', 'Cat');\n\n-- TODO: insert Coco the Parrot (id 3)\n\nSELECT * FROM pets ORDER BY id;",
          "CREATE TABLE pets (\n  id INTEGER PRIMARY KEY,\n  name TEXT,\n  species TEXT\n);\n\nINSERT INTO pets (id, name, species) VALUES\n  (1, 'Rex', 'Dog'),\n  (2, 'Milo', 'Cat');\n\nINSERT INTO pets (id, name, species) VALUES (3, 'Coco', 'Parrot');\n\nSELECT * FROM pets ORDER BY id;",
          { check: "Result should have 3 rows ending with Coco, Parrot" },
        ),
      ),
    },
    {
      title: "Aggregates: COUNT, SUM & GROUP BY",
      slug: "aggregates-group-by",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Summarizing data with aggregate functions

An **aggregate function** combines many rows into a single value. The most common ones are:

| Function | Returns |
|----------|---------|
| \`COUNT(*)\` | How many rows |
| \`SUM(col)\` | The total of a numeric column |
| \`AVG(col)\` | The average of a numeric column |
| \`MIN(col)\` / \`MAX(col)\` | The smallest / largest value |

\`\`\`sql
SELECT COUNT(*) AS total_students FROM students;
\`\`\`

\`AS\` gives the result column a friendlier name — here, \`total_students\` instead of the raw expression.

### Grouping rows with GROUP BY

\`GROUP BY\` splits the table into groups sharing the same value in a column, then computes the aggregate **per group** instead of over the whole table:

\`\`\`sql
SELECT grade, COUNT(*) AS num_students, ROUND(AVG(age), 1) AS avg_age
FROM students
GROUP BY grade
ORDER BY grade;
\`\`\`

This produces one output row **per distinct grade**, each showing how many students have that grade and their average age. \`ROUND(x, 1)\` rounds a decimal to 1 place.

Run the example below to see grades summarized with counts and average ages.`),
        tryit("sql", AGGREGATES_CODE, {
          expectedOutput: AGGREGATES_EXPECTED,
          caption: "GROUP BY grade with COUNT and AVG",
        }),
        md(`### Quick reference

| Task | Syntax |
|------|--------|
| Count all rows | \`SELECT COUNT(*) FROM t;\` |
| Total of a column | \`SELECT SUM(col) FROM t;\` |
| One row per group | \`SELECT col, COUNT(*) FROM t GROUP BY col;\` |
| Rename a result column | \`SELECT COUNT(*) AS total FROM t;\` |`),
        callout(
          "info",
          "Whenever you use GROUP BY, every column in your SELECT list must either be the grouped column itself (like grade) or the result of an aggregate function (like COUNT(*) or AVG(age)) — you can't mix in a plain, ungrouped column, because SQL wouldn't know which row's value to show for a group with several rows.",
        ),
        exercise(
          "sql",
          "Write a SELECT that returns the total number of students as a column named `total_students`, using COUNT(*) AS total_students.",
          `${STUDENTS_SCHEMA}\n\n-- TODO: count all students\nSELECT * FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT COUNT(*) AS total_students FROM students;`,
          { check: "Result should be one row: total_students = 4" },
        ),
        exercise(
          "sql",
          "Write a SELECT that returns each `grade` alongside the SUM of `age` for that grade, named `total_age`, grouped and ordered by grade.",
          `${STUDENTS_SCHEMA}\n\n-- TODO: sum ages per grade\nSELECT * FROM students;`,
          `${STUDENTS_SCHEMA}\n\nSELECT grade, SUM(age) AS total_age FROM students GROUP BY grade ORDER BY grade;`,
          { check: "Result should have 3 rows: A=27, B=15, C=16" },
        ),
      ),
    },
    {
      title: "JOIN",
      slug: "joins",
      contentType: "markdown",
      estMinutes: 14,
      body: body(
        md(`## Combining data from two tables

Real databases split related data across multiple tables instead of repeating it. For example, a \`students\` table and a separate \`clubs\` table, linked by a shared \`student_id\`:

\`\`\`sql
CREATE TABLE clubs (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,
  club_name TEXT
);
\`\`\`

Each row in \`clubs\` points back to a student via \`student_id\` — this is called a **foreign key** relationship, even though SQLite doesn't require you to declare it specially.

### JOIN — matching rows across tables

A \`JOIN\` combines rows from two tables where a condition matches — usually an ID in one table equalling an ID in the other:

\`\`\`sql
SELECT students.name AS student, clubs.club_name AS club
FROM students
JOIN clubs ON students.id = clubs.student_id;
\`\`\`

Read this as: *"for every row in \`clubs\`, find the \`students\` row whose \`id\` matches \`student_id\`, and return both together."* If a student belongs to two clubs, that student appears twice — once per club.

### Why prefix column names?

\`students.name\` and \`clubs.club_name\` use \`table.column\` syntax to avoid ambiguity — useful whenever two joined tables might have columns with the same name.

Run the example below to see students joined with the clubs they belong to.`),
        tryit("sql", JOIN_CODE, {
          expectedOutput: JOIN_EXPECTED,
          caption: "JOIN students to clubs on a shared id",
        }),
        md(`### Quick reference

| Task | Syntax |
|------|--------|
| Join two tables | \`SELECT ... FROM a JOIN b ON a.id = b.a_id;\` |
| Disambiguate a column name | \`table_name.column_name\` |
| Rename a joined column | \`table_name.column_name AS alias\` |`),
        callout(
          "tip",
          "This kind of JOIN is called an INNER JOIN (JOIN alone means INNER JOIN in SQL) — it only returns rows where a match is found in both tables. A student with no club at all would not appear in the result. There are other join types (LEFT JOIN, for instance) that also include unmatched rows, useful once you need to see students with zero clubs too.",
        ),
        exercise(
          "sql",
          "Using the `students` and `clubs` tables from the lesson, write a JOIN that returns `club_name` (as `club`) and student `name` (as `student`), ordered by `club_name` then `name`.",
          `${STUDENTS_SCHEMA}\n\nCREATE TABLE clubs (\n  id INTEGER PRIMARY KEY,\n  student_id INTEGER,\n  club_name TEXT\n);\n\nINSERT INTO clubs (id, student_id, club_name) VALUES\n  (1, 1, 'Robotics'),\n  (2, 2, 'Chess'),\n  (3, 1, 'Coding');\n\n-- TODO: join clubs to students, select club_name AS club, students.name AS student\nSELECT * FROM clubs;`,
          `${STUDENTS_SCHEMA}\n\nCREATE TABLE clubs (\n  id INTEGER PRIMARY KEY,\n  student_id INTEGER,\n  club_name TEXT\n);\n\nINSERT INTO clubs (id, student_id, club_name) VALUES\n  (1, 1, 'Robotics'),\n  (2, 2, 'Chess'),\n  (3, 1, 'Coding');\n\nSELECT clubs.club_name AS club, students.name AS student\nFROM clubs\nJOIN students ON clubs.student_id = students.id\nORDER BY clubs.club_name, students.name;`,
          { check: "Result should have 3 rows: Chess/Farai, Coding/Tariro, Robotics/Tariro" },
        ),
      ),
    },
  ],
};
