export const meta = {
  name: 'robocode-polish',
  description: 'Parallel polish: block-based coding mode, i18n + language switcher, and learn→Studio handoff',
  phases: [{ title: 'Polish', detail: 'three disjoint enhancement agents' }],
}

const CONTEXT = [
  'You are enhancing RoboCode.Africa, an existing, fully-working Next.js 16 (App Router, React 19, RSC) + TypeScript + Tailwind v4 platform for kids to learn robotics/coding/AI. It COMPILES today; keep it compiling. Match the existing style.',
  '',
  'NEXT 16 RULES: route params & searchParams are Promises (await them). /app/** pages already have an auth shell (active user guaranteed). Server actions in "use server" files or inline async fns; call revalidatePath after mutations. Never import server-only into client components. Import icons directly from "lucide-react".',
  '',
  'HELPERS: import { prisma } from "@/lib/prisma"; import { getCurrentUser, requireActiveUser } from "@/lib/auth/current-user"; import { cn } from "@/lib/utils".',
  'UI KIT (only these exist): "@/components/ui/{button,card,badge,input,textarea,label,tabs,dialog,select,avatar,progress,switch,separator,scroll-area}"; toast from "sonner". Button variants: default|gradient|secondary|accent|outline|ghost|destructive|link; sizes default|sm|lg|icon|icon-sm; supports asChild.',
  'DESIGN: headings "font-display font-bold"; brand utils bg-brand-gradient, text-gradient, glass; tokens bg-card, text-muted-foreground, border-border, text-primary, bg-primary/12. Vibrant, kid-friendly, accessible (aria-labels on icon buttons).',
  '',
  'STUDIO STATE (Zustand): import { useStudio } from "@/lib/studio/store". Relevant fields/actions: code (string), setCode(code), language, board, parts, addPart(typeId), title. The code editor lives in src/components/studio/code-editor.tsx (CodeEditor). The studio right panel is assembled in src/components/studio/studio-app.tsx.',
  'BOARDS/DOMAIN: import { getBoard, BOARDS, BOARD_LIST } from "@/lib/domain/boards"; import { emptyDiagram, type Diagram } from "@/lib/domain/diagram"; component catalogue ids in "@/lib/domain/components" (COMPONENTS, COMPONENT_BY_ID).',
].join('\n')

const MODULES = [
  {
    key: 'open-in-studio',
    label: 'Learn → Studio handoff',
    files: [
      'src/app/studio/[projectId]/page.tsx',
      'src/app/app/challenges/[slug]/page.tsx',
    ],
    spec:
      'Make "Open in Studio" from a challenge preload that task\'s starter circuit + starter code so students build & run it directly. '
      + 'EDIT src/app/studio/[projectId]/page.tsx: it currently handles projectId==="new" with a blank diagram. Add support for a searchParams `?task=<slug>`: the page signature must accept `searchParams: Promise<{ task?: string }>` and await it. When projectId==="new" AND a task slug is present, load that Task (prisma.task.findUnique by slug); use task.starterDiagram (cast as Diagram) if present else emptyDiagram(task.boardType), task.starterCode (else the board.starterCode), board=task.boardType, and title=`Challenge: ${task.title}`. Keep all existing behaviour for normal project ids and plain new projects. Read the existing file first and preserve its structure/imports. '
      + 'EDIT src/app/app/challenges/[slug]/page.tsx: change the "Open in Studio" button/link href from /studio/new to `/studio/new?task=${task.slug}` (keep target/_blank if present). Read the file first; make a minimal, surgical change only.',
  },
  {
    key: 'i18n',
    label: 'Internationalisation + language switcher',
    files: [
      'src/lib/i18n/dictionaries.ts',
      'src/lib/i18n/index.ts',
      'src/components/i18n/language-switcher.tsx',
      'src/components/marketing/site-footer.tsx',
    ],
    spec:
      'Add a lightweight i18n foundation (no external deps). Locales: en (English), sn (Shona), nd (Ndebele), sw (Swahili), zu (Zulu), fr (French), pt (Portuguese), ar (Arabic). '
      + 'dictionaries.ts: export LOCALES (array of {code,label,flag?}) and a DICT: Record<localeCode, Record<string,string>> with a useful set of common UI keys (e.g. nav.signin, nav.signup, nav.features, nav.pricing, cta.getStarted, cta.openStudio, hero.tagline, footer.safety, common.dashboard, common.learn, common.teams, common.leaderboard). Provide full English values; provide real translations for at least sn, sw, zu, fr, pt for the handful of keys (use accurate translations; for ar mark dir rtl). Other missing keys fall back to English. '
      + 'index.ts: export type Locale, DEFAULT_LOCALE="en", function t(key, locale?) (falls back to en then to the key), getLocale() (server: read cookie "rc_locale" via next/headers cookies(), default en) marked appropriately, and a small client hook is fine too. Also export isRtl(locale). Keep server/client usage clean (this file may be imported by both; if you use next/headers, put that in a server-only helper or guard — simplest: put getLocale in this file WITHOUT "use client" and only call it from server components). '
      + 'language-switcher.tsx ("use client"): a Select (or dropdown) listing LOCALES; on change set document.cookie "rc_locale=<code>;path=/;max-age=31536000" and location.reload(). Compact, with a Globe icon. '
      + 'site-footer.tsx: REPLACE the existing marketing footer with an improved version that ALSO renders the <LanguageSwitcher/> (keep it cohesive with the existing footer — read the current file first to preserve its links/branding, then add the switcher in a tasteful spot). Keep it a server component that renders the client switcher.',
  },
  {
    key: 'blocks',
    label: 'Block-based coding mode',
    files: [
      'src/lib/studio/blocks.ts',
      'src/components/studio/block-editor.tsx',
      'src/components/studio/studio-app.tsx',
    ],
    spec:
      'Add a beginner-friendly BLOCK-BASED coding mode that generates Arduino code, for the youngest students. Self-contained, no external libraries (no Blockly). '
      + 'blocks.ts: define a Block model (discriminated union) for a small useful set: PIN_MODE(pin,mode), DIGITAL_WRITE(pin, on:boolean), WAIT(ms), REPEAT(times, children:Block[]), FOREVER(children) [maps to loop], IF_PRESSED(pin, children), SERIAL_PRINT(text), TONE(pin, freq), NO_TONE(pin), SERVO_WRITE(pin, angle). Provide a default starter program (blink). Export a function generateCode(blocks): string that emits a valid Arduino sketch (collect PIN_MODE + setup-ish statements into setup(); FOREVER children + loose statements into loop(); REPEAT→for loop; IF_PRESSED→if(digitalRead(pin)==LOW){}; etc.). The generated code MUST parse with the existing interpreter (standard Arduino C++). Keep generation correct and indented. '
      + 'block-editor.tsx ("use client"): a visual editor — a palette of block types (click to append to the current program), a vertical list of the program blocks with inline editable params (number inputs / on-off toggles / text inputs / a board-pin <Select>), reorder (move up/down) + delete per block, and a live "Generated code" preview. A prominent "Use this code" button calls useStudio.getState().setCode(generateCode(blocks)). Colourful, chunky, kid-friendly blocks (rounded, colored by category). Manage block state with useState seeded from the default starter. '
      + 'studio-app.tsx: READ THE EXISTING FILE FIRST and preserve everything. Add a small segmented toggle (Blocks | Code) at the top of the right-hand panel; default "Code". When "Blocks" is selected, render <BlockEditor/> instead of <CodeEditor/> (keep <SerialMonitor/> below in both modes, and keep the "sketch.ino" header — maybe relabel to reflect mode). Do not remove or break the existing Toolbar/Palette/Canvas/Inspector wiring or the useSimulation hookup. Keep it a clean minimal diff layered on top of the current layout.',
  },
]

function prompt(mod) {
  return [
    CONTEXT,
    '',
    '======= YOUR TASK: ' + mod.label + ' =======',
    'Create/edit EXACTLY these files (read existing ones before editing; make surgical changes that keep the app compiling):',
    mod.files.map((f) => '  - ' + f).join('\n'),
    '',
    'DETAILS:\n' + mod.spec,
    '',
    'Before finishing: ensure every import exists, params/searchParams are awaited, "use client" only where needed, no server-only-in-client, and the generated TypeScript type-checks. Then return the structured result.',
  ].join('\n')
}

const OUT = {
  type: 'object', additionalProperties: false,
  required: ['module', 'filesWritten', 'status'],
  properties: {
    module: { type: 'string' },
    filesWritten: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
    status: { type: 'string' },
  },
}

phase('Polish')
const results = await parallel(
  MODULES.map((m) => () =>
    agent(prompt(m), { label: 'polish:' + m.key, phase: 'Polish', schema: OUT, agentType: 'general-purpose', model: 'sonnet', effort: 'high' }),
  ),
)
return { built: results.filter(Boolean) }
