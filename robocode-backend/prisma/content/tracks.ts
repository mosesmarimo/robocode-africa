// Curated Learning Tracks — hand-picked course/challenge paths through the
// content library (see prisma/content/*). Consumed by sync-tracks.ts, which
// resolves each item's slug to a Course/Task id and upserts the
// LearningTrack + LearningTrackItem rows. Progress against a track is always
// derived (see TracksService) — these items carry no user data.

export type TrackDef = {
  slug: string;
  title: string;
  description: string;
  track: "coding" | "robotics" | "ai";
  language?: string;
  level: string;
  icon: string;
  order: number;
  items: Array<{ course?: string; task?: string }>;
};

export const TRACK_DEFS: TrackDef[] = [
  {
    slug: "python-path",
    title: "Python Path 🐍",
    description: "Learn Python from your first script through real frameworks, then prove it with a coding challenge.",
    track: "coding",
    language: "python",
    level: "beginner",
    icon: "🐍",
    order: 1,
    items: [{ course: "tutorial-python" }, { course: "lang-python" }, { task: "challenge-python" }],
  },
  {
    slug: "javascript-path",
    title: "JavaScript Path",
    description: "Learn JavaScript from your first script through modern frameworks, then prove it with a coding challenge.",
    track: "coding",
    language: "javascript",
    level: "beginner",
    icon: "🟨",
    order: 2,
    items: [{ course: "tutorial-javascript" }, { course: "lang-javascript" }, { task: "challenge-javascript" }],
  },
  {
    slug: "web-foundations",
    title: "Web Foundations",
    description: "Learn to build web pages with HTML and style them with CSS, from fundamentals to real layout techniques.",
    track: "coding",
    level: "beginner",
    icon: "🌐",
    order: 3,
    items: [{ course: "tutorial-html" }, { course: "lang-html" }, { course: "tutorial-css" }, { course: "lang-css" }],
  },
  {
    slug: "robotics-starter",
    title: "Robotics Starter",
    description: "Start robotics from first principles through Arduino programming, then prove it with a coding challenge.",
    track: "robotics",
    level: "beginner",
    icon: "🤖",
    order: 4,
    items: [
      { course: "intro-robotics" },
      { course: "coding-arduino" },
      { course: "lang-arduino" },
      { task: "challenge-arduino" },
    ],
  },
  {
    slug: "robotics-explorer",
    title: "Robotics Explorer",
    description: "Go deeper into robotics hardware — ESP32 Wi-Fi boards, the Raspberry Pi Pico, and sensors — with a challenge after each course.",
    track: "robotics",
    level: "intermediate",
    icon: "⚡",
    order: 5,
    items: [
      { course: "robo-esp32" },
      { task: "challenge-esp32" },
      { course: "robo-pico" },
      { task: "challenge-pico" },
      { course: "robo-sensors" },
      { task: "challenge-sensors" },
    ],
  },
  {
    slug: "ai-explorer",
    title: "AI Explorer",
    description: "Explore what AI is and how it works, from a kid-friendly introduction through real AI models and foundational concepts.",
    track: "ai",
    level: "intermediate",
    icon: "🧠",
    order: 6,
    items: [{ course: "ai-junior-appreciation" }, { course: "ai-models" }, { course: "ai-foundations" }],
  },
];
