import { md, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// ai-junior.ts — AI Appreciation for Junior School (ages ~7–11)
// ---------------------------------------------------------------------------

export const aiJunior: CourseModule = {
  meta: {
    title: "AI Appreciation for Junior School",
    slug: "ai-junior-appreciation",
    track: "ai",
    level: "primary",
    description:
      "A fun, colourful introduction to AI for younger learners — what it is, how it learns, and how to use it safely.",
    coverImage: "/covers/ai.svg",
    order: 41,
  },
  lessons: [
    // -------------------------------------------------------------------------
    // Lesson 1 — What is AI?
    // -------------------------------------------------------------------------
    {
      title: "What is AI?",
      slug: "ai-junior-what",
      estMinutes: 8,
      body: body(
        md(`## Meet your clever computer helper!

Have you ever talked to a phone that talks back? Or seen a game where the computer plays against you?

**That is AI — Artificial Intelligence!**

AI is a special kind of computer program that can **learn** things and **make choices** — a bit like a robot brain inside the computer.

The word *artificial* just means "made by people". The word *intelligence* means "able to think and learn". So AI is thinking and learning made by people!

Here are some things AI can do:
- Understand what you say 🗣️
- Recognise pictures of cats, dogs, or faces 📸
- Suggest songs you might like 🎵
- Play games — and sometimes win! 🎮

AI cannot feel happy or sad. It does not have feelings. But it is very, very good at spotting **patterns** — things that repeat — and using those patterns to make clever guesses.`),
        svg(
          `<svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A friendly cartoon robot with blinking eyes and a pulsing antenna">
  <!-- Body -->
  <rect x="90" y="110" width="140" height="100" rx="18" fill="#4F8EF7" />
  <!-- Head -->
  <rect x="100" y="48" width="120" height="80" rx="20" fill="#4F8EF7" />
  <!-- Antenna base -->
  <rect x="154" y="30" width="12" height="22" rx="4" fill="#2C5FBF" />
  <!-- Antenna ball — pulses -->
  <circle cx="160" cy="24" r="10" fill="#FFD600">
    <animate attributeName="r" values="10;14;10" dur="1.2s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.6;1" dur="1.2s" repeatCount="indefinite" />
  </circle>
  <!-- Eyes (white) -->
  <ellipse cx="130" cy="82" rx="16" ry="16" fill="#FFFFFF" />
  <ellipse cx="190" cy="82" rx="16" ry="16" fill="#FFFFFF" />
  <!-- Pupils -->
  <circle cx="130" cy="82" r="8" fill="#222">
    <animate attributeName="ry" values="8;1;8" dur="3s" repeatCount="indefinite" begin="0.5s" />
  </circle>
  <circle cx="190" cy="82" r="8" fill="#222">
    <animate attributeName="ry" values="8;1;8" dur="3s" repeatCount="indefinite" begin="0.5s" />
  </circle>
  <!-- Mouth — happy arc -->
  <path d="M130 108 Q160 126 190 108" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" />
  <!-- Arms -->
  <rect x="44" y="118" width="46" height="18" rx="9" fill="#2C5FBF" />
  <rect x="230" y="118" width="46" height="18" rx="9" fill="#2C5FBF" />
  <!-- Legs -->
  <rect x="112" y="205" width="30" height="36" rx="10" fill="#2C5FBF" />
  <rect x="178" y="205" width="30" height="36" rx="10" fill="#2C5FBF" />
  <!-- Belly panel -->
  <rect x="116" y="130" width="88" height="56" rx="10" fill="#2C5FBF" />
  <!-- Panel lights -->
  <circle cx="135" cy="148" r="7" fill="#FF4F4F">
    <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />
  </circle>
  <circle cx="160" cy="148" r="7" fill="#FFD600">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.1s" repeatCount="indefinite" begin="0.3s" />
  </circle>
  <circle cx="185" cy="148" r="7" fill="#4FE07A">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" begin="0.6s" />
  </circle>
  <!-- Label -->
  <text x="160" y="256" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#4F8EF7" font-weight="bold">Hello! I am an AI robot 🤖</text>
</svg>`,
          "A friendly robot with blinking eyes and a glowing antenna",
        ),
        callout(
          "info",
          "AI stands for Artificial Intelligence. It is a computer program that can learn from examples and help us with all sorts of tasks — but it always needs a person to build it and check its work!",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 2 — How Does AI Learn?
    // -------------------------------------------------------------------------
    {
      title: "How Does AI Learn?",
      slug: "ai-junior-learn",
      estMinutes: 10,
      body: body(
        md(`## Learning by looking at LOTS of examples

Imagine you have never seen a cat before. How would you learn what one looks like?

You would look at lots and lots of cats — big cats, tiny cats, orange cats, stripy cats. After a while your brain would notice the pattern: pointy ears, whiskers, fluffy tail!

**AI learns the exact same way.** We show it thousands and thousands of pictures, and it slowly learns to spot the patterns. We call this **training** the AI.

Here is how it works, step by step:

1. 📷 Show the AI **lots of pictures** (for example, 10 000 pictures of cats and 10 000 of dogs)
2. 🏷️ Tell the AI what each picture is — this is called a **label**
3. 🧠 The AI looks for **patterns** — things cats have that dogs don't
4. ✅ Test it with new pictures it has never seen before
5. 🎉 If it gets most right, the AI is trained!

The more examples you give it, the better it gets. A little child learns to recognise cats after seeing a few. AI usually needs thousands — but it never forgets any of them!`),
        svg(
          `<svg viewBox="0 0 380 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pictures of cats appearing one by one, then the robot says Cat!">
  <!-- Background -->
  <rect width="380" height="270" fill="#FFF9EC" rx="16" />

  <!-- Picture frame 1 -->
  <g>
    <rect x="18" y="30" width="72" height="72" rx="8" fill="#FFE0B2" stroke="#FFA726" stroke-width="2" />
    <text x="54" y="76" text-anchor="middle" font-size="36">🐱</text>
    <animate attributeName="opacity" values="0;0;1;1;1;1" dur="5s" repeatCount="indefinite" calcMode="discrete" />
  </g>

  <!-- Picture frame 2 -->
  <g opacity="0">
    <rect x="108" y="30" width="72" height="72" rx="8" fill="#FFE0B2" stroke="#FFA726" stroke-width="2" />
    <text x="144" y="76" text-anchor="middle" font-size="36">🐈</text>
    <animate attributeName="opacity" values="0;0;0;1;1;1" dur="5s" repeatCount="indefinite" calcMode="discrete" />
  </g>

  <!-- Picture frame 3 -->
  <g opacity="0">
    <rect x="198" y="30" width="72" height="72" rx="8" fill="#FFE0B2" stroke="#FFA726" stroke-width="2" />
    <text x="234" y="76" text-anchor="middle" font-size="36">🐈‍⬛</text>
    <animate attributeName="opacity" values="0;0;0;0;1;1" dur="5s" repeatCount="indefinite" calcMode="discrete" />
  </g>

  <!-- Arrow pointing to robot -->
  <path d="M290 66 L318 66" stroke="#888" stroke-width="3" stroke-linecap="round">
    <animate attributeName="opacity" values="0;0;0;0;0;1" dur="5s" repeatCount="indefinite" calcMode="discrete" />
  </path>
  <polygon points="318,60 330,66 318,72" fill="#888">
    <animate attributeName="opacity" values="0;0;0;0;0;1" dur="5s" repeatCount="indefinite" calcMode="discrete" />
  </polygon>

  <!-- Robot head (small) -->
  <rect x="335" y="42" width="36" height="36" rx="8" fill="#4F8EF7" />
  <circle cx="348" cy="58" r="5" fill="#FFFFFF" />
  <circle cx="358" cy="58" r="5" fill="#FFFFFF" />
  <circle cx="348" cy="58" r="3" fill="#222" />
  <circle cx="358" cy="58" r="3" fill="#222" />

  <!-- Speech bubble -->
  <g opacity="0">
    <rect x="288" y="90" width="82" height="32" rx="10" fill="#4FE07A" />
    <polygon points="315,90 325,78 335,90" fill="#4FE07A" />
    <text x="329" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#155724">Cat! 🐱</text>
    <animate attributeName="opacity" values="0;0;0;0;0;1" dur="5s" repeatCount="indefinite" calcMode="discrete" />
  </g>

  <!-- Divider -->
  <line x1="20" y1="132" x2="360" y2="132" stroke="#FFD6A0" stroke-width="2" stroke-dasharray="6,4" />

  <!-- Explanation text -->
  <text x="20" y="156" font-family="Arial, sans-serif" font-size="13" fill="#555">1. Show the AI many pictures...</text>
  <text x="20" y="176" font-family="Arial, sans-serif" font-size="13" fill="#555">2. Tell it what each one is (label it).</text>
  <text x="20" y="196" font-family="Arial, sans-serif" font-size="13" fill="#555">3. AI spots the pattern!</text>
  <text x="20" y="220" font-family="Arial, sans-serif" font-size="13" fill="#4F8EF7" font-weight="bold">4. Now it can recognise cats on its own. 🎉</text>
</svg>`,
          "Pictures appearing one by one as the AI learns, then the robot recognises a cat",
        ),
        callout(
          "info",
          "AI needs LOTS of examples to learn. The more pictures, words, or sounds you show it, the better it gets. This is called training. Just like practising a sport, practice makes perfect — even for AI!",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 3 — AI All Around Us
    // -------------------------------------------------------------------------
    {
      title: "AI All Around Us",
      slug: "ai-junior-everywhere",
      estMinutes: 7,
      body: body(
        md(`## AI is everywhere — you use it every day!

You might not notice it, but AI is busy helping you all the time. Here are some places you have probably already met it:

| Where | What it does |
|---|---|
| 🎵 Music apps | Suggests songs you will like |
| 📺 Video apps | Recommends shows to watch next |
| 🗣️ Voice assistants | Understands what you say |
| 📸 Phone camera | Recognises faces and smiles |
| 🗺️ Maps apps | Finds the fastest route |
| 🎮 Video games | Makes characters move and react |
| 🌐 Translator | Changes words into another language |

Pretty amazing, right? All of these apps have an AI working quietly behind the scenes.

Every time you watch a video or listen to a song, the AI watches what you choose and learns what you enjoy. Next time it uses that knowledge to suggest something new.`),
        svg(
          `<svg viewBox="0 0 380 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Colourful collage of AI uses: music, video, maps, games, and voice assistants">
  <rect width="380" height="260" fill="#F0F8FF" rx="16" />

  <!-- Music note card -->
  <rect x="16" y="16" width="80" height="80" rx="12" fill="#FF6B9D" />
  <text x="56" y="64" text-anchor="middle" font-size="38">🎵</text>
  <text x="56" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFFFFF">Music</text>

  <!-- Video card -->
  <rect x="108" y="16" width="80" height="80" rx="12" fill="#FF9944" />
  <text x="148" y="64" text-anchor="middle" font-size="38">📺</text>
  <text x="148" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFFFFF">Videos</text>

  <!-- Maps card -->
  <rect x="200" y="16" width="80" height="80" rx="12" fill="#4CAF50" />
  <text x="240" y="64" text-anchor="middle" font-size="38">🗺️</text>
  <text x="240" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFFFFF">Maps</text>

  <!-- Games card -->
  <rect x="292" y="16" width="72" height="80" rx="12" fill="#9C27B0" />
  <text x="328" y="64" text-anchor="middle" font-size="38">🎮</text>
  <text x="328" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFFFFF">Games</text>

  <!-- Voice assistant card -->
  <rect x="16" y="112" width="80" height="80" rx="12" fill="#2196F3" />
  <text x="56" y="160" text-anchor="middle" font-size="38">🗣️</text>
  <text x="56" y="183" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFFFFF">Voice AI</text>

  <!-- Camera card -->
  <rect x="108" y="112" width="80" height="80" rx="12" fill="#009688" />
  <text x="148" y="160" text-anchor="middle" font-size="38">📸</text>
  <text x="148" y="183" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFFFFF">Camera</text>

  <!-- Translate card -->
  <rect x="200" y="112" width="80" height="80" rx="12" fill="#F44336" />
  <text x="240" y="160" text-anchor="middle" font-size="38">🌐</text>
  <text x="240" y="183" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFFFFF">Translate</text>

  <!-- AI brain in centre-right -->
  <circle cx="332" cy="152" r="34" fill="#FFD600" />
  <text x="332" y="162" text-anchor="middle" font-size="34">🧠</text>

  <!-- Connecting lines from brain to cards, animated -->
  <line x1="300" y1="130" x2="280" y2="100" stroke="#FFD600" stroke-width="2" stroke-dasharray="4,4">
    <animate attributeName="stroke-dashoffset" values="0;-16" dur="1s" repeatCount="indefinite" />
  </line>
  <line x1="298" y1="158" x2="280" y2="158" stroke="#FFD600" stroke-width="2" stroke-dasharray="4,4">
    <animate attributeName="stroke-dashoffset" values="0;-16" dur="1.2s" repeatCount="indefinite" />
  </line>
  <line x1="310" y1="120" x2="240" y2="96" stroke="#FFD600" stroke-width="2" stroke-dasharray="4,4">
    <animate attributeName="stroke-dashoffset" values="0;-16" dur="0.9s" repeatCount="indefinite" />
  </line>

  <text x="190" y="248" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#555" font-style="italic">AI powers all of these — every single day!</text>
</svg>`,
          "Colourful cards showing AI in music, videos, maps, games, voice assistants, cameras, and translation",
        ),
        callout(
          "tip",
          "Look around you today! Can you spot AI helping you? Check your favourite app, your TV remote, or even the auto-correct on a phone keyboard. AI is everywhere!",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 4 — AI is Clever, but Not Perfect
    // -------------------------------------------------------------------------
    {
      title: "AI is Clever, but Not Perfect",
      slug: "ai-junior-smart",
      estMinutes: 8,
      body: body(
        md(`## Even clever things make mistakes!

AI is amazingly clever at many things. But it is important to know it is **not perfect** — and it is definitely **not magic**.

Here are some things to remember:

### AI can be wrong
AI makes mistakes, especially when it has not seen enough examples, or when something is unusual. A photo translator might mix up two similar words. A voice assistant might mishear you.

### AI does not have feelings
AI does not feel happy, sad, excited, or bored. When it says "Great question!" it is not actually excited — it has just learned that saying that is polite. It is all patterns and maths, not real feelings.

### AI does not know everything
AI only knows what it was trained on. If nobody taught it about something new, it will not know about it. It might even make up an answer — this is called a **hallucination** (a fancy word for "the AI got confused and invented something").

### AI is a tool
A hammer is great for hitting nails. But you would not use a hammer to eat soup! AI is a brilliant tool, but you still need a **human** to decide when to use it and to check whether the answer is right.

Always use your own brain too! 🧠`),
        svg(
          `<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Robot with a thought bubble containing a question mark, looking uncertain">
  <rect width="320" height="240" fill="#FFF3E0" rx="16" />

  <!-- Robot body -->
  <rect x="110" y="130" width="100" height="75" rx="14" fill="#78909C" />
  <!-- Robot head -->
  <rect x="120" y="68" width="80" height="68" rx="14" fill="#78909C" />
  <!-- Eyes — one normal, one raised (uncertain) -->
  <ellipse cx="148" cy="96" rx="12" ry="12" fill="#FFFFFF" />
  <ellipse cx="172" cy="96" rx="12" ry="12" fill="#FFFFFF" />
  <circle cx="148" cy="96" r="6" fill="#333" />
  <circle cx="172" cy="96" r="6" fill="#333" />
  <!-- Wavy uncertain mouth -->
  <path d="M138 122 Q148 130 158 122 Q168 114 178 122" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" />
  <!-- Legs -->
  <rect x="122" y="200" width="24" height="28" rx="8" fill="#546E7A" />
  <rect x="174" y="200" width="24" height="28" rx="8" fill="#546E7A" />
  <!-- Arms -->
  <rect x="64" y="138" width="46" height="14" rx="7" fill="#546E7A" />
  <rect x="210" y="138" width="46" height="14" rx="7" fill="#546E7A" />

  <!-- Thought bubble circles -->
  <circle cx="222" cy="112" r="5" fill="#FFD600" opacity="0.7" />
  <circle cx="236" cy="96" r="8" fill="#FFD600" opacity="0.8" />
  <circle cx="254" cy="80" r="12" fill="#FFD600" opacity="0.9" />
  <!-- Large thought cloud -->
  <ellipse cx="276" cy="52" rx="34" ry="26" fill="#FFD600" />
  <ellipse cx="252" cy="52" rx="22" ry="22" fill="#FFD600" />
  <ellipse cx="264" cy="38" rx="20" ry="18" fill="#FFD600" />
  <!-- Question mark -->
  <text x="268" y="62" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="bold" fill="#E65100">?</text>

  <!-- Floating error sparks -->
  <text x="44" y="86" font-size="18">❌</text>
  <text x="22" y="120" font-size="14" opacity="0.7">Hmm...</text>

  <text x="160" y="236" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#666" font-style="italic">AI is clever, but it can be confused too!</text>
</svg>`,
          "A robot with a thought bubble and a question mark, looking uncertain",
        ),
        callout(
          "warning",
          "Always double-check what AI tells you! AI can make mistakes and even make things up. If AI gives you information for school or homework, ask a grown-up or check another source to make sure it is right.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 5 — Talking to AI
    // -------------------------------------------------------------------------
    {
      title: "Talking to AI",
      slug: "ai-junior-talk",
      estMinutes: 9,
      body: body(
        md(`## Asking great questions!

When you talk to an AI (like a chatbot or a voice assistant), the clearer your question is, the better the answer you will get.

Imagine asking a friend: *"Tell me something."*
Your friend would say: *"About what?"*

AI is the same! If you give it a vague question, it gives a vague answer. If you give it a clear, detailed question, it gives a much better answer.

### A good question has three parts:
1. **Who** you are talking to / what you want it to do
2. **What** you are asking about
3. **Details** that help it understand

**Weak question:** *"Tell me about animals."*
**Better question:** *"Can you tell me three fun facts about elephants that a 9-year-old would enjoy?"*

See the difference? The better question says what kind of animal, how many facts, and who it is for. The AI can then give you a perfect answer!

### Being kind matters too
You do not have to say "please" for AI to work, but it is good practice. Being polite teaches us good habits — and some AIs actually respond better when you are friendly!`),
        svg(
          `<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A child chatting with a robot, with speech bubbles gently bouncing">
  <rect width="360" height="260" fill="#E8F5E9" rx="16" />

  <!-- Child figure -->
  <!-- Head -->
  <circle cx="72" cy="68" r="32" fill="#FFCC80" />
  <!-- Hair -->
  <ellipse cx="72" cy="44" rx="28" ry="14" fill="#5D4037" />
  <!-- Eyes -->
  <circle cx="61" cy="66" r="4" fill="#333" />
  <circle cx="83" cy="66" r="4" fill="#333" />
  <!-- Smile -->
  <path d="M60 80 Q72 92 84 80" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <!-- Body -->
  <rect x="48" y="102" width="48" height="56" rx="10" fill="#FF8A65" />
  <!-- Legs -->
  <rect x="52" y="152" width="16" height="36" rx="8" fill="#42A5F5" />
  <rect x="76" y="152" width="16" height="36" rx="8" fill="#42A5F5" />
  <!-- Arms (raised toward robot) -->
  <path d="M48 120 Q30 110 20 124" stroke="#FFCC80" stroke-width="12" fill="none" stroke-linecap="round" />
  <path d="M96 120 Q114 108 128 118" stroke="#FFCC80" stroke-width="12" fill="none" stroke-linecap="round" />

  <!-- Child speech bubble — bouncing gently -->
  <g>
    <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="2s" repeatCount="indefinite" />
    <rect x="10" y="8" width="138" height="44" rx="12" fill="#FFFFFF" stroke="#4CAF50" stroke-width="2" />
    <polygon points="52,52 62,52 57,62" fill="#FFFFFF" stroke="#4CAF50" stroke-width="2" />
    <text x="79" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#2E7D32">"Can you tell me</text>
    <text x="79" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#2E7D32">3 facts about lions?"</text>
  </g>

  <!-- Robot figure -->
  <!-- Head -->
  <rect x="248" y="44" width="80" height="64" rx="14" fill="#4F8EF7" />
  <!-- Antenna -->
  <rect x="283" y="28" width="10" height="18" rx="4" fill="#2C5FBF" />
  <circle cx="288" cy="22" r="8" fill="#FFD600">
    <animate attributeName="r" values="8;11;8" dur="1.5s" repeatCount="indefinite" />
  </circle>
  <!-- Eyes -->
  <ellipse cx="272" cy="72" rx="12" ry="12" fill="#FFFFFF" />
  <ellipse cx="304" cy="72" rx="12" ry="12" fill="#FFFFFF" />
  <circle cx="272" cy="72" r="6" fill="#222" />
  <circle cx="304" cy="72" r="6" fill="#222" />
  <!-- Mouth — smile -->
  <path d="M264 98 Q288 114 312 98" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" />
  <!-- Body -->
  <rect x="248" y="112" width="80" height="70" rx="12" fill="#4F8EF7" />
  <!-- Legs -->
  <rect x="256" y="178" width="24" height="32" rx="8" fill="#2C5FBF" />
  <rect x="296" y="178" width="24" height="32" rx="8" fill="#2C5FBF" />

  <!-- Robot speech bubble — bouncing at different pace -->
  <g>
    <animateTransform attributeName="transform" type="translate" values="0,0;0,-5;0,0" dur="2.6s" repeatCount="indefinite" begin="0.5s" />
    <rect x="196" y="8" width="148" height="44" rx="12" fill="#FFFFFF" stroke="#4F8EF7" stroke-width="2" />
    <polygon points="290,52 300,52 295,62" fill="#FFFFFF" stroke="#4F8EF7" stroke-width="2" />
    <text x="270" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#1565C0">"Sure! Lions live in</text>
    <text x="270" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#1565C0">Africa and live in groups..."</text>
  </g>

  <text x="180" y="252" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#555" font-style="italic">Clear questions = great answers!</text>
</svg>`,
          "A child and a robot having a friendly chat with speech bubbles gently bouncing",
        ),
        callout(
          "tip",
          "3 tips for great AI questions:\n1. Be specific — say exactly what you want to know.\n2. Give details — mention your age, subject, or how many answers you want.\n3. Be polite — 'please' and 'thank you' are always nice habits!",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 6 — Staying Safe with AI
    // -------------------------------------------------------------------------
    {
      title: "Staying Safe with AI",
      slug: "ai-junior-safe",
      estMinutes: 8,
      body: body(
        md(`## Keeping yourself safe online and with AI

AI tools can be lots of fun. But just like crossing the road, there are some important rules to keep you safe.

The most important rule is this: **always ask a grown-up first** before using a new AI app or website. Grown-ups can help you choose safe tools and make sure everything is okay.

Here are the key safety rules for using AI:

### 🔒 Keep your secrets secret
Never tell an AI your:
- Full name and surname
- Home address or school name
- Phone number
- Passwords or PINs
- Photos of yourself

AI tools are often connected to the internet, and you never know exactly who might see that information.

### 🤔 Think before you believe
Remember from the last lesson — AI can be wrong! Do not automatically believe everything it says. Check important facts with a grown-up, a book, or a trusted website.

### 💬 Be kind, even to AI
Practice being polite when you chat with AI. The habits you build talking to AI are the same habits you will use talking to people.

### 🆘 Tell someone if something feels wrong
If an AI ever says something that makes you feel scared, upset, or confused, stop and tell a trusted grown-up right away. You will never be in trouble for doing that.`),
        svg(
          `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Safety icons: a padlock, a thinking face, a heart, and a helping hand">
  <rect width="360" height="220" fill="#FFF8F0" rx="16" />

  <!-- Card 1: Lock — keep secrets -->
  <rect x="16" y="24" width="76" height="90" rx="14" fill="#EF9A9A" />
  <text x="54" y="72" text-anchor="middle" font-size="36">🔒</text>
  <text x="54" y="96" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#B71C1C">Keep secrets</text>
  <text x="54" y="108" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#B71C1C">secret</text>

  <!-- Card 2: Think before believe -->
  <rect x="104" y="24" width="76" height="90" rx="14" fill="#FFF176" />
  <text x="142" y="72" text-anchor="middle" font-size="36">🤔</text>
  <text x="142" y="96" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#F57F17">Always</text>
  <text x="142" y="108" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#F57F17">double-check</text>

  <!-- Card 3: Be kind -->
  <rect x="192" y="24" width="76" height="90" rx="14" fill="#A5D6A7" />
  <text x="230" y="72" text-anchor="middle" font-size="36">💬</text>
  <text x="230" y="96" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#1B5E20">Be kind</text>
  <text x="230" y="108" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#1B5E20">and polite</text>

  <!-- Card 4: Tell a grown-up -->
  <rect x="280" y="24" width="64" height="90" rx="14" fill="#B3E5FC" />
  <text x="312" y="72" text-anchor="middle" font-size="36">🆘</text>
  <text x="312" y="96" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#01579B">Tell a</text>
  <text x="312" y="108" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#01579B">grown-up</text>

  <!-- Bottom banner -->
  <rect x="16" y="130" width="328" height="72" rx="12" fill="#FF8A65" />
  <text x="180" y="160" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Always ask a grown-up first!</text>
  <text x="180" y="182" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#FFFFFF">Before using any new AI app or website.</text>
  <text x="180" y="197" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#FFE0B2">They are there to help you stay safe. 💛</text>
</svg>`,
          "Four safety icons: keep secrets, double-check, be kind, tell a grown-up",
        ),
        callout(
          "warning",
          "Safety rules for AI:\n• NEVER share your name, address, school, phone number, or passwords with an AI.\n• ALWAYS ask a grown-up before using a new AI app.\n• If something feels wrong or scary, STOP and tell a trusted adult straight away.\n• Remember — you can never be in trouble for asking for help!",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // Lesson 7 — Fun Things to Try
    // -------------------------------------------------------------------------
    {
      title: "Fun Things to Try",
      slug: "ai-junior-fun",
      estMinutes: 7,
      body: body(
        md(`## Let's explore AI — with a grown-up!

Now that you know what AI is, how it learns, and how to stay safe — it is time for the most exciting part: **trying it yourself!**

Here are some fun ideas you can explore together with a parent, teacher, or another trusted grown-up:

### 🏰 Ask AI for a story
Say something like: *"Please write me a short funny story about a dragon who is afraid of butterflies."*
Watch how the AI creates a whole new story just for you!

### 🤣 Ask for a riddle
Try: *"Give me a riddle that a 9-year-old would enjoy, and then tell me the answer."*
See if you can guess the answer before the AI reveals it!

### 🎨 Draw with AI
Many AI tools can create pictures from words. Ask: *"Draw a cute robot eating an ice cream cone."*
The results can be very creative — and sometimes very funny!

### 🌍 Learn a cool fact
Ask: *"What is the most amazing fact about the ocean that most people do not know?"*
AI knows millions of facts and loves sharing them!

### 🌐 Translate a phrase
Ask: *"How do you say 'Good morning, I love learning!' in French and Zulu?"*
AI can help you say hello in hundreds of languages!

### 💡 Remember the golden rule
Always do these activities **with a grown-up** nearby. It is more fun together, and they can help you if anything is confusing or surprising.`),
        svg(
          `<svg viewBox="0 0 360 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A cheerful child and robot celebrating together with stars and confetti">
  <rect width="360" height="250" fill="#F3E5F5" rx="16" />

  <!-- Confetti pieces -->
  <rect x="30" y="14" width="12" height="8" rx="2" fill="#FF6B9D" transform="rotate(-20,36,18)">
    <animateTransform attributeName="transform" type="rotate" values="-20 36 18;10 36 18;-20 36 18" dur="2s" repeatCount="indefinite" />
  </rect>
  <rect x="80" y="8" width="10" height="7" rx="2" fill="#FFD600" transform="rotate(15,85,11)">
    <animateTransform attributeName="transform" type="rotate" values="15 85 11;-15 85 11;15 85 11" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
  </rect>
  <rect x="260" y="10" width="11" height="7" rx="2" fill="#4F8EF7" transform="rotate(30,266,14)">
    <animateTransform attributeName="transform" type="rotate" values="30 266 14;-10 266 14;30 266 14" dur="2.2s" repeatCount="indefinite" begin="0.6s" />
  </rect>
  <rect x="310" y="18" width="9" height="6" rx="2" fill="#4FE07A" transform="rotate(-10,315,21)">
    <animateTransform attributeName="transform" type="rotate" values="-10 315 21;20 315 21;-10 315 21" dur="1.6s" repeatCount="indefinite" begin="0.2s" />
  </rect>
  <rect x="160" y="6" width="10" height="7" rx="2" fill="#FF9944" transform="rotate(5,165,10)">
    <animateTransform attributeName="transform" type="rotate" values="5 165 10;-25 165 10;5 165 10" dur="2.4s" repeatCount="indefinite" begin="0.9s" />
  </rect>

  <!-- Stars floating -->
  <text x="22" y="56" font-size="20">⭐</text>
  <text x="50" y="36" font-size="14" opacity="0.8">✨</text>
  <text x="294" y="48" font-size="20">⭐</text>
  <text x="316" y="68" font-size="14" opacity="0.8">✨</text>
  <text x="170" y="32" font-size="16" opacity="0.9">🌟</text>

  <!-- Child -->
  <circle cx="108" cy="84" r="28" fill="#FFCC80" />
  <ellipse cx="108" cy="62" rx="24" ry="12" fill="#795548" />
  <circle cx="98" cy="82" r="4" fill="#333" />
  <circle cx="118" cy="82" r="4" fill="#333" />
  <path d="M97 96 Q108 108 119 96" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <rect x="84" y="114" width="48" height="52" rx="10" fill="#CE93D8" />
  <rect x="56" y="120" width="28" height="12" rx="6" fill="#FFCC80" />
  <rect x="136" y="120" width="28" height="12" rx="6" fill="#FFCC80" />
  <rect x="88" y="162" width="16" height="34" rx="8" fill="#7B1FA2" />
  <rect x="112" y="162" width="16" height="34" rx="8" fill="#7B1FA2" />

  <!-- Robot -->
  <rect x="226" y="62" width="76" height="60" rx="14" fill="#4F8EF7" />
  <rect x="234" y="44" width="60" height="22" rx="8" fill="#2C5FBF" />
  <!-- Antenna -->
  <rect x="258" y="30" width="8" height="16" rx="3" fill="#2C5FBF" />
  <circle cx="262" cy="24" r="8" fill="#FFD600">
    <animate attributeName="r" values="8;12;8" dur="1.4s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.6;1" dur="1.4s" repeatCount="indefinite" />
  </circle>
  <!-- Robot eyes -->
  <ellipse cx="252" cy="82" rx="11" ry="11" fill="#FFFFFF" />
  <ellipse cx="278" cy="82" rx="11" ry="11" fill="#FFFFFF" />
  <circle cx="252" cy="82" r="5" fill="#222" />
  <circle cx="278" cy="82" r="5" fill="#222" />
  <!-- Robot smile -->
  <path d="M244 107 Q265 120 286 107" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" />
  <!-- Robot body -->
  <rect x="226" y="124" width="76" height="60" rx="12" fill="#4F8EF7" />
  <rect x="200" y="134" width="28" height="12" rx="6" fill="#2C5FBF" />
  <rect x="302" y="134" width="28" height="12" rx="6" fill="#2C5FBF" />
  <rect x="234" y="178" width="20" height="30" rx="8" fill="#2C5FBF" />
  <rect x="274" y="178" width="20" height="30" rx="8" fill="#2C5FBF" />

  <!-- High-five / hands together in the middle -->
  <text x="170" y="148" text-anchor="middle" font-size="32">🙌</text>

  <text x="180" y="222" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#7B1FA2">You are ready to explore AI!</text>
  <text x="180" y="242" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#555" font-style="italic">Remember — always with a grown-up 💛</text>
</svg>`,
          "A child and a robot celebrating together with stars and confetti flying",
        ),
        callout(
          "tip",
          "Always with a grown-up! AI is a brilliant tool and it can be great fun to explore. But the best adventures are shared ones. Ask a parent, teacher, or older sibling to try these activities with you — they might learn something new too!",
        ),
      ),
    },
  ],
};
