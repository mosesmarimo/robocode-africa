export const meta = {
  name: 'robocode-features',
  description: 'Build the remaining RoboCode.Africa feature modules (learn, teams, competitions, leaderboard, badges, notifications, profile/settings, admin, school, teacher, marketing) in parallel',
  phases: [
    { title: 'Build modules', detail: 'one agent per feature module, disjoint files' },
  ],
}

const CONTEXT = [
  'You are a senior Next.js engineer building part of RoboCode.Africa — a safe, vibrant platform where primary/high-school students learn robotics, coding & AI. The foundation already exists and COMPILES; you are adding one feature module. Match the existing style exactly and produce TypeScript that type-checks.',
  '',
  'STACK: Next.js 16 (App Router, React 19, RSC), TypeScript, Tailwind CSS v4, Prisma (SQLite). Server Components fetch data directly; mutations are Server Actions ("use server"). Client interactivity uses small "use client" components.',
  '',
  'CRITICAL NEXT 16 RULES:',
  '- Dynamic route params and searchParams are PROMISES: `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; }`. Same for searchParams.',
  '- All /app/** pages are already wrapped by an authenticated shell layout (sidebar+topbar) and guaranteed an ACTIVE logged-in user. Do NOT add another shell; just render page content inside the provided <main> (return a div with space-y-6).',
  '- Server Actions live in their own file starting with "use server", OR inline in a Server Component as `async function act(fd: FormData){ "use server"; ... }`. After mutations call revalidatePath(...).',
  '- Never import a "use server"/server-only module into a "use client" component. Client components may import and call server actions (they are async functions).',
  '- For icons, import directly from "lucide-react" (e.g. `import { Users, Trophy } from "lucide-react"`). Do not modify the shared icon registry.',
  '',
  'AUTH & TENANCY HELPERS:',
  '- import { getCurrentUser, requireActiveUser, requireCapability } from "@/lib/auth/current-user";  (getCurrentUser() returns the user incl .tenant; in /app pages it is non-null and active — use `(await getCurrentUser())!`).',
  '- import { can, isStaff, ROLE_LABELS, type Role } from "@/lib/domain/roles"; capabilities: "platform.manage","platform.approve_direct","moderation.manage","tenant.manage","tenant.approve_students","tenant.branding","class.manage","assignment.grade","competition.create","competition.manage","content.author","reports.view".',
  '- For role-restricted pages, guard at top: `const user=(await getCurrentUser())!; if(!can(user.role, CAP)) notFound();` (import notFound from "next/navigation").',
  '- TENANT SCOPING: platform staff (super_admin/moderator) see all; everyone else is scoped to user.tenantId. Filter prisma queries by tenantId accordingly.',
  '- import { prisma } from "@/lib/prisma";',
  '- Points/notify: import { awardPoints, awardBadge } from "@/lib/points"; import { notify } from "@/lib/notify". awardPoints({userId, delta, reason, refType?, refId?, idemKey?, teamId?}).',
  '',
  'UI KIT (import from these exact paths; these are ALL that exist — compose tables/lists with plain divs):',
  '- "@/components/ui/button" → Button (variants: default|gradient|secondary|accent|outline|ghost|destructive|link; sizes: default|sm|lg|icon|icon-sm; supports asChild for wrapping <Link>).',
  '- "@/components/ui/card" → Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.',
  '- "@/components/ui/badge" → Badge (variants: default|secondary|accent|success|warning|destructive|outline|muted).',
  '- "@/components/ui/input" Input; "@/components/ui/textarea" Textarea; "@/components/ui/label" Label.',
  '- "@/components/ui/tabs" → Tabs, TabsList, TabsTrigger, TabsContent.',
  '- "@/components/ui/dialog" → Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose.',
  '- "@/components/ui/select" → Select, SelectTrigger, SelectValue, SelectContent, SelectItem.',
  '- "@/components/ui/avatar" → Avatar, AvatarFallback; "@/components/ui/progress" Progress; "@/components/ui/switch" Switch; "@/components/ui/separator" Separator; "@/components/ui/scroll-area" ScrollArea.',
  '- "@/components/app/stat-card" → StatCard({label,value,icon,hint?,tone?}) where icon is a kebab lucide name and tone is primary|secondary|accent|success.',
  '- toast: import { toast } from "sonner" (client only).',
  '- helpers: import { cn, initials, formatRelative, slugify } from "@/lib/utils".',
  '- constants: import { TRACK_LABELS, LEVEL_LABELS, levelProgress, POINTS } from "@/lib/domain/constants"; import { getBoard } from "@/lib/domain/boards".',
  '',
  'DESIGN LANGUAGE (match the existing dashboard for a beautiful, vibrant, professional, kid-friendly feel):',
  '- Headings use class "font-display font-bold". Page root: <div className="space-y-6"> with an h1 (text-2xl/3xl) + muted subtitle.',
  '- Cards: rounded-xl, generous padding (p-5/p-6), hover lift (hover:-translate-y-0.5 hover:shadow-lg) for clickable cards.',
  '- Use brand utilities: "bg-brand-gradient" (gradient), "text-gradient", "glass". Primary actions use Button variant="gradient".',
  '- Tokens: bg-background, bg-card, text-foreground, text-muted-foreground, border-border, text-primary, bg-primary/12, bg-muted, text-success, etc. Avatars: <Avatar><AvatarFallback>{initials(name)}</AvatarFallback></Avatar>.',
  '- Empty states: centered Card with an icon chip, message, and a primary CTA. Always handle empty data gracefully.',
  '- Accessibility: real buttons/links, aria-labels on icon-only controls, sufficient contrast.',
].join('\n')

const SCHEMA = [
  'PRISMA MODELS (fields you will use; all ids are string cuid; enum-like fields are strings):',
  'Tenant{ id, slug, name, isPlatform, status, branding(Json: {primary,secondary,accent,logoUrl?,tagline?}), policies(Json), createdAt }',
  'User{ id, tenantId, email, displayName, role(super_admin|moderator|school_admin|teacher|student|parent), status(pending|active|suspended|rejected), isMinor, birthYear?, guardianEmail?, avatarSeed, locale, roboPoints, level, lastLoginAt, createdAt }',
  'ApprovalRequest{ id, userId, tenantId, type(student_direct|student_school|teacher), status(pending|approved|rejected), decidedById?, decidedAt?, reason?, createdAt }  (relation: user)',
  'ConsentRecord{ id, userId(unique), guardianEmail, status(pending|granted|denied), token, grantedAt? }',
  'Project{ id, ownerId, tenantId, teamId?, title, description?, boardType, diagram(Json), visibility(private|tenant|public), isTemplate, createdAt, updatedAt }',
  'Course{ id, tenantId?, title, slug(unique), track(robotics|coding|ai), level(primary|high), description?, coverImage?, published, order }  (relations: lessons, tasks, enrollments)',
  'Lesson{ id, courseId, title, slug, order, contentType, body(Json: {blocks:[{type:"markdown",text}]}), estMinutes }',
  'Task{ id, courseId?, title, slug(unique), description, track, difficulty(beginner|intermediate|advanced), points, boardType, starterCode?, starterDiagram(Json?), checks(Json) }  (relations: submissions)',
  'Enrollment{ id, userId, courseId, progress(Json:{percent}), completedAt? }  unique(userId,courseId)',
  'LessonProgress{ id, userId, lessonId, status(in_progress|completed), completedAt? }  unique(userId,lessonId)',
  'Submission{ id, taskId, userId, teamId?, code?, status(submitted|passed|failed|graded), score?, autoResult(Json), feedback?, createdAt }',
  'Class{ id, tenantId, teacherId, name, joinCode(unique), createdAt }  (relations: members(ClassMember), assignments)',
  'ClassMember{ id, classId, userId, role }  unique(classId,userId)  (relation: user)',
  'Assignment{ id, classId, taskId?, courseId?, title, instructions?, dueAt?, createdAt }',
  'Team{ id, tenantId, name, kind(intra_school|school_rep), description?, avatarSeed, captainId, roboPoints, createdAt }  (relations: members(TeamMember), captain(User), chatMessages)',
  'TeamMember{ id, teamId, userId, role(captain|member), status(invited|active) }  unique(teamId,userId)  (relation: user)',
  'Competition{ id, tenantId?, title, slug(unique), type(coding|robotics|ai), scope(intra_school|inter_school|global), status(upcoming|live|judging|closed), description?, startsAt?, endsAt?, rules(Json) }  (relations: rounds, entries, scores)',
  'Round{ id, competitionId, name, order, taskId?, startsAt?, endsAt? }',
  'CompetitionEntry{ id, competitionId, teamId?, userId?, status, totalScore }  (relation: team)',
  'Score{ id, competitionId?, roundId?, entryId, points, breakdown(Json?) }',
  'RoboPointLedger{ id, userId, teamId?, delta, reason, refType?, refId?, idemKey?(unique), createdAt }',
  'Badge{ id, code(unique), name, description, icon, criteria(Json?) }  UserBadge{ id, userId, badgeId, awardedAt }  unique(userId,badgeId) (relation: badge)',
  'Notification{ id, userId, type, title, body?, data(Json?), readAt?, createdAt }',
  'Announcement{ id, tenantId?, authorId, title, body, audience, createdAt }',
  'ChatMessage{ id, teamId, userId, body, status(pending|approved|blocked), createdAt }  (relation: user)',
  'ModerationCase{ id, tenantId?, reporterId?, targetType, targetId, reason, status(open|reviewing|resolved|dismissed), notes?, resolvedById?, createdAt }',
  'AuditLog{ id, tenantId?, actorId?, action, targetType?, targetId?, meta(Json?), createdAt }',
  'Plan{ id, name(unique), seats, priceCents, features(Json) }  Subscription{ id, tenantId(unique), planId, status, seatsUsed, renewsAt? }',
  'Domain{ id, tenantId, hostname(unique), type(subdomain|custom), verified, txtToken?, sslStatus }',
].join('\n')

const MODULES = [
  {
    key: 'learn',
    label: 'Learning (courses/lessons)',
    files: [
      'src/app/app/learn/page.tsx',
      'src/app/app/learn/[slug]/page.tsx',
      'src/app/app/learn/[slug]/[lessonSlug]/page.tsx',
      'src/components/learn/lesson-actions.tsx',
    ],
    spec:
      'Course catalogue + course detail + lesson viewer. Server actions ALREADY EXIST — import { enroll, completeLesson } from "@/lib/learn/actions" (do not recreate). '
      + 'learn/page.tsx: fetch published courses (global tenantId null OR user.tenantId) ordered by order; group by track (robotics/coding/ai) with TRACK_LABELS; each course card shows level badge, title, description, lesson count, and the user\'s enrollment percent (query Enrollment for this user) as a Progress bar; link to /app/learn/[slug]. Hero header. '
      + 'learn/[slug]/page.tsx: course detail; list lessons in order with completed checkmarks (query LessonProgress for user), estMinutes, links to /app/learn/[slug]/[lessonSlug]; also list the course Tasks (challenges) linking to /app/challenges/[slug]; show overall progress; an Enroll button (client, calls enroll) if not enrolled. '
      + 'learn/[slug]/[lessonSlug]/page.tsx: render lesson body blocks (body.blocks where type markdown → render text as paragraphs/headers; do a tiny markdown-ish render: lines starting with # → heading, blank → spacing, else paragraph). Prev/next lesson nav. A "Mark complete & continue" button (client component lesson-actions.tsx) calling completeLesson(lessonId, courseId) then navigating to next lesson or back to course; show toast. '
      + 'lesson-actions.tsx ("use client"): exports a CompleteLessonButton({lessonId, courseId, nextHref}) using the completeLesson action + sonner toast + router.push.',
  },
  {
    key: 'challenges',
    label: 'Challenges (tasks + grading)',
    files: [
      'src/app/app/challenges/page.tsx',
      'src/app/app/challenges/[slug]/page.tsx',
      'src/components/learn/challenge-submit.tsx',
    ],
    spec:
      'Coding challenges backed by Task + the auto-grader. The grading server action ALREADY EXISTS — import { submitSolution } from "@/lib/learn/actions" (signature: (taskId, code) => Promise<{passed,score,results:{description,ok}[],serial:string[],error?}>). '
      + 'challenges/page.tsx: list all Tasks; show difficulty badge (beginner/intermediate/advanced), points (with a zap icon), track, and the user\'s best Submission status (query Submission for user+task: passed=green check). Allow filtering by track via Tabs (All/Robotics/Coding/AI). Cards link to /app/challenges/[slug]. '
      + 'challenges/[slug]/page.tsx: task detail by slug; show description, points, difficulty, board; a "Open in Studio" Button linking to /studio/new; and the ChallengeSubmit client panel preloaded with task.starterCode. '
      + 'challenge-submit.tsx ("use client"): a Textarea (font-mono) preloaded with starterCode, a "Run checks & submit" Button that calls submitSolution(taskId, code), shows a loading state, then renders each result row ([x]/[ ] description), the pass/fail banner (score%), serial output lines, and a success toast + confetti-ish celebration text when passed. Keep it self-contained.',
  },
  {
    key: 'teams',
    label: 'Teams + moderated chat',
    files: [
      'src/app/app/teams/page.tsx',
      'src/app/app/teams/[id]/page.tsx',
      'src/lib/teams/actions.ts',
      'src/components/teams/team-actions.tsx',
      'src/components/teams/team-chat.tsx',
    ],
    spec:
      'teams/actions.ts ("use server"): createTeam({name, description}) — creates Team in user.tenantId with captainId=user.id + a TeamMember(captain,active), awardBadge(user,"team-player"); joinTeam(teamId) — adds TeamMember(member,active) if not full/member, awardBadge "team-player"; leaveTeam(teamId); postMessage(teamId, body) — SAFETY: run a basic profanity/PII filter (a small banned-words array + a simple email/phone regex); if it matches set status="blocked" and create a ModerationCase(targetType:"chat", reason); else status="approved"; only team members may post. All revalidatePath. '
      + 'teams/page.tsx: "Your teams" (where user is a TeamMember) + "Browse teams" (other teams in tenant) with member counts + roboPoints; a Create Team dialog (client team-actions.tsx) and Join buttons. '
      + 'teams/[id]/page.tsx: team detail — header with team avatar (initials), roboPoints, member list (with captain crown), shared team Projects, and a moderated chat (team-chat.tsx). Guard: only members (or staff same tenant) can view chat; show "blocked message pending review" placeholder for blocked messages to non-staff. '
      + 'team-actions.tsx ("use client"): CreateTeamDialog + JoinButton using the actions + toast. team-chat.tsx ("use client"): message list (approved only, plus own pending/blocked) + an input that calls postMessage; optimistic-ish; note "Messages are moderated to keep everyone safe.".',
  },
  {
    key: 'competitions',
    label: 'Competitions',
    files: [
      'src/app/app/competitions/page.tsx',
      'src/app/app/competitions/[slug]/page.tsx',
      'src/lib/competitions/actions.ts',
      'src/components/competitions/enter-button.tsx',
    ],
    spec:
      'competitions/actions.ts ("use server"): enterCompetition(competitionId, teamId?) — creates a CompetitionEntry for the user (or their team) if none exists, awardBadge(user,"competitor"), awardPoints(75, "Joined a competition", idemKey per comp+user); revalidatePath. '
      + 'competitions/page.tsx: list competitions visible to the user (global tenantId null OR user.tenantId) grouped/sorted by status (live first, then upcoming, then closed) with type badge, scope, date range (use formatRelative or toLocaleDateString), and entry count; cards link to /app/competitions/[slug]. Vibrant status badges (live=success pulse, upcoming=accent, closed=muted). '
      + 'competitions/[slug]/page.tsx: detail — description, rounds list, a standings table (entries ordered by totalScore desc, showing rank, team/user name, score), and an Enter button (enter-button.tsx client) if the competition is live/upcoming and the user has not entered. '
      + 'enter-button.tsx ("use client"): calls enterCompetition + toast.',
  },
  {
    key: 'leaderboard',
    label: 'Leaderboard',
    files: ['src/app/app/leaderboard/page.tsx'],
    spec:
      'A single page with Tabs: Students | Teams | Schools. Students: top users by roboPoints within user.tenantId (platform staff: across platform) — rank, avatar(initials), name, level, points; highlight the current user\'s row. Teams: top Teams by roboPoints in tenant. Schools: top Tenants by aggregate student roboPoints (group users by tenantId, sum roboPoints) — only meaningful for platform staff but show for everyone (their school highlighted). Medal styling for top 3 (gold/silver/bronze accents). Use server component with prisma aggregation. Make it celebratory and clean.',
  },
  {
    key: 'badges',
    label: 'Badges',
    files: ['src/app/app/badges/page.tsx'],
    spec:
      'Grid of ALL Badge records; mark which the current user has earned (query UserBadge with badge relation). Earned badges are full-color with the awarded date; locked badges are greyed with a lock overlay and the description as a hint of how to earn. Show an earned/total counter header. Use the badge.icon kebab name via the Icon component (import { Icon } from "@/components/icon") OR a fallback award icon. Make earned badges feel rewarding (bg-brand-gradient chip, subtle glow).',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    files: ['src/app/app/notifications/page.tsx', 'src/lib/notifications/actions.ts', 'src/components/notifications/notif-actions.tsx'],
    spec:
      'notifications/actions.ts ("use server"): markAllRead() (set readAt=now for user\'s unread), markRead(id); revalidatePath("/app/notifications"). '
      + 'notifications/page.tsx: list current user\'s Notifications newest first; unread have a bg-primary/5 highlight + dot; show type icon (approval/badge/level_up/info via lucide), title, body, formatRelative(createdAt); a "Mark all read" button (notif-actions.tsx client). Empty state. '
      + 'notif-actions.tsx ("use client"): MarkAllReadButton calling markAllRead + toast.',
  },
  {
    key: 'account',
    label: 'Profile + Settings',
    files: ['src/app/app/profile/page.tsx', 'src/app/app/settings/page.tsx', 'src/lib/account/actions.ts', 'src/components/account/settings-form.tsx'],
    spec:
      'account/actions.ts ("use server"): updateProfile({displayName, locale, avatarSeed}) for the current user (validate non-empty displayName); revalidatePath. '
      + 'profile/page.tsx: the current user\'s public profile — big avatar(initials), name, role label, school name, level + roboPoints + level progress (levelProgress), earned badges row (UserBadge), recent projects, and basic stats (projects count, submissions passed, badges). '
      + 'settings/page.tsx: account settings using settings-form.tsx (client) — edit display name, language (Select: en, sn (Shona), nd (Ndebele), sw (Swahili), zu (Zulu), fr, pt), and a few placeholder accessibility toggles (Switch: reduce motion, dyslexia-friendly font, high contrast) that persist visually (no backend needed beyond profile fields). Save calls updateProfile + toast. Also show read-only account info (email, role, school) and a "Sign out" note.',
  },
  {
    key: 'admin',
    label: 'Platform admin suite',
    role: 'super_admin',
    files: [
      'src/app/app/admin/approvals/page.tsx',
      'src/app/app/admin/tenants/page.tsx',
      'src/app/app/admin/users/page.tsx',
      'src/app/app/admin/moderation/page.tsx',
      'src/app/app/admin/content/page.tsx',
      'src/app/app/admin/system/page.tsx',
      'src/lib/admin/actions.ts',
      'src/components/admin/admin-buttons.tsx',
    ],
    spec:
      'Platform-level admin (super_admin + moderator). Guard each page: const user=(await getCurrentUser())!; if(!(can(user.role,"platform.manage")||can(user.role,"moderation.manage"))) notFound(); (approvals/moderation allow moderator; tenants/users/content/system require platform.manage). '
      + 'admin/actions.ts ("use server"): approveUser(userId) — set user.status="active", set their ApprovalRequest.status="approved"+decidedBy+decidedAt, notify the user, awardBadge maybe none; rejectUser(userId, reason?) — status="rejected", ApprovalRequest rejected, notify; approveTenant(tenantId) — tenant.status="active" + activate its pending school_admin user(s) + their approval requests, notify; suspendUser(userId)/reinstateUser(userId); resolveModeration(caseId, action) set status; All check the actor has platform.manage/moderation.manage; AuditLog each action; revalidatePath. '
      + 'approvals/page.tsx: pending ApprovalRequests across the platform (include user+tenant) with Approve/Reject buttons (admin-buttons.tsx); separate sections for pending Schools (Tenant status="pending") with Approve. '
      + 'tenants/page.tsx: all Tenants (schools) with status, member counts, plan; suspend/reinstate + approve actions. users/page.tsx: searchable list of all users with role+status+school, suspend/reinstate. moderation/page.tsx: ModerationCase queue (open) with resolve/dismiss + show the offending content. content/page.tsx: overview of Courses + Tasks (counts, list). system/page.tsx: platform KPIs dashboard (total schools, students, projects, simulations(SimulationRun count), competitions, pending approvals) using StatCard + simple lists. '
      + 'admin-buttons.tsx ("use client"): Approve/Reject/Suspend/Resolve buttons calling the actions + toast + (reject reason via prompt or small dialog).',
  },
  {
    key: 'school',
    label: 'School admin suite',
    role: 'school_admin',
    files: [
      'src/app/app/school/approvals/page.tsx',
      'src/app/app/school/members/page.tsx',
      'src/app/app/school/branding/page.tsx',
      'src/app/app/school/domain/page.tsx',
      'src/app/app/school/reports/page.tsx',
      'src/lib/school/actions.ts',
      'src/components/school/school-buttons.tsx',
      'src/components/school/branding-form.tsx',
    ],
    spec:
      'School-admin tools, scoped to user.tenantId. Guard: if(!can(user.role,"tenant.manage")) notFound(). '
      + 'school/actions.ts ("use server"): approveStudent(userId)/rejectStudent(userId) — verify the target user.tenantId === actor.tenantId, set status + ApprovalRequest + notify; suspendStudent/reinstateStudent; updateBranding({primary,secondary,accent,tagline,logoUrl?}) — merge into tenant.branding Json (verify tenant.manage + branding cap); setPolicies({autoApprove}); All revalidatePath + AuditLog. '
      + 'approvals/page.tsx: pending students in this school with Approve/Reject (school-buttons.tsx). members/page.tsx: teachers + students of the school with status, points, suspend/reinstate; a count summary. '
      + 'branding/page.tsx: branding-form.tsx (client) — colour pickers (use <input type="color">) for primary/secondary/accent, a tagline input, optional logo URL; LIVE preview card using the chosen colours (a mock header with bg using inline style gradient); Save calls updateBranding + toast; explain white-label. '
      + 'domain/page.tsx: show the school subdomain (slug.robocode.africa) and a custom-domain connection guide — show the Domain records, DNS CNAME/TXT instructions (static informative UI), verification status badges. reports/page.tsx: school analytics — active students, projects created, lessons completed, challenge pass rate, top students, with StatCards + simple bar lists. '
      + 'school-buttons.tsx + branding-form.tsx ("use client").',
  },
  {
    key: 'teacher',
    label: 'Teacher suite',
    role: 'teacher',
    files: [
      'src/app/app/teacher/classes/page.tsx',
      'src/app/app/teacher/classes/[id]/page.tsx',
      'src/app/app/teacher/assignments/page.tsx',
      'src/app/app/teacher/grading/page.tsx',
      'src/lib/teacher/actions.ts',
      'src/components/teacher/teacher-buttons.tsx',
    ],
    spec:
      'Teacher tools scoped to user.tenantId. Guard: if(!can(user.role,"class.manage")) notFound(). '
      + 'teacher/actions.ts ("use server"): createClass({name}) — Team? no: create Class with teacherId=user.id, tenantId, a random joinCode (use a 6-char code from crypto-free random via Math? prefer nanoid: import { nanoid } from "nanoid"); addStudentByEmail(classId, email) — find active student in same tenant, create ClassMember; createAssignment({classId, title, taskId?, instructions?, dueAt?}); gradeSubmission(submissionId, score, feedback) — set Submission.status="graded", score, feedback, awardPoints to the student; revalidatePath. '
      + 'classes/page.tsx: teacher\'s classes with member counts + joinCode + a Create Class dialog (teacher-buttons.tsx). classes/[id]/page.tsx: class roster (ClassMember + user), add-student form, the class assignments. '
      + 'assignments/page.tsx: list assignments across the teacher\'s classes + a create form (choose class + optional task). grading/page.tsx: recent Submissions from students in the teacher\'s tenant (join via task) needing review (status submitted/passed) with a grade action (score + feedback). '
      + 'teacher-buttons.tsx ("use client"): dialogs/forms for create class, add student, create assignment, grade.',
  },
  {
    key: 'marketing',
    label: 'Marketing site',
    files: [
      'src/app/page.tsx',
      'src/app/(marketing)/layout.tsx',
      'src/app/(marketing)/features/page.tsx',
      'src/app/(marketing)/for-schools/page.tsx',
      'src/app/(marketing)/pricing/page.tsx',
      'src/app/(marketing)/safety/page.tsx',
      'src/app/(marketing)/about/page.tsx',
      'src/components/marketing/site-header.tsx',
      'src/components/marketing/site-footer.tsx',
    ],
    spec:
      'A stunning, vibrant public marketing site (NOT under /app, so it has NO auth shell). REPLACE src/app/page.tsx with a rich landing page. Create a (marketing) route group with a shared layout that renders site-header.tsx (sticky, glassy nav: logo via "@/components/brand-logo" BrandLogo, links to Features, For Schools, Pricing, Safety, About, and Sign in / Get started buttons linking to /login and /signup) and site-footer.tsx. '
      + 'NOTE: the landing page src/app/page.tsx is OUTSIDE the (marketing) group so import and use SiteHeader/SiteFooter directly there too (wrap content). '
      + 'Landing (src/app/page.tsx): hero with bold headline + gradient, subcopy, primary CTAs (Get started → /signup, Open Studio → /studio/new), a hero visual (a styled mock of the Studio using divs — a fake board + wires + code lines, OR a bg-grid panel), trust strip ("Approved & moderated · Works on low-end devices · COPPA/GDPR-aligned"), feature highlights grid (Interactive simulator, Guided courses, Teams & competitions, Safe & moderated, White-label for schools, Works offline-friendly) each with a lucide icon + colored chip, a "3 boards" section (Arduino UNO, ESP32, Raspberry Pi Pico), a how-it-works 3-step, a testimonials/stats band, and a final CTA. '
      + 'features/page.tsx: deeper feature sections (Studio, Simulation incl. Arduino UNO/ESP32/Raspberry Pi Pico via rp2040js + custom boards via wokwi-boards, Learning, Gamification, Safety). for-schools/page.tsx: white-label, custom domain, admin controls, approvals, seats, a CTA "Register your school" → /signup. pricing/page.tsx: 3 plan cards (Free, School, District) with feature lists + CTAs. safety/page.tsx: child-safety commitments (mandatory approvals, parental consent, moderated communication, data minimisation, COPPA/GDPR-K/POPIA/Zim DPA). about/page.tsx: mission for African STEM education. '
      + 'Use Button (gradient/outline), Card, Badge, lucide icons, bg-brand-gradient, text-gradient, bg-grid, glass. Make it genuinely beautiful and cohesive. Every page wrapped by SiteHeader/SiteFooter (via the group layout; landing imports them directly).',
  },
]

function agentPrompt(mod) {
  return [
    CONTEXT,
    '',
    SCHEMA,
    '',
    '================ YOUR MODULE: ' + mod.label + ' ================',
    mod.role ? `(Role-restricted: ${mod.role}-level pages — add the capability guard described.)` : '',
    '',
    'Create EXACTLY these files (and only these), each complete and self-consistent:',
    mod.files.map((f) => '  - ' + f).join('\n'),
    '',
    'REQUIREMENTS:',
    mod.spec,
    '',
    'FINAL CHECKS before finishing: every import path is valid and exists per the UI KIT / helpers listed; params/searchParams are awaited Promises; "use client" only where hooks/events/browser APIs are used; no server-only imports in client files; all prisma field names match the SCHEMA; handle empty/missing data; the code reads like the existing dashboard. Write the files with the Write tool. Then return the structured result.',
  ].join('\n')
}

const SCHEMA_OUT = {
  type: 'object',
  additionalProperties: false,
  required: ['module', 'filesWritten', 'status'],
  properties: {
    module: { type: 'string' },
    filesWritten: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
    status: { type: 'string' },
  },
}

phase('Build modules')
const results = await parallel(
  MODULES.map((mod) => () =>
    agent(agentPrompt(mod), {
      label: 'feat:' + mod.key,
      phase: 'Build modules',
      schema: SCHEMA_OUT,
      agentType: 'general-purpose',
      model: 'sonnet',
      effort: 'high',
    }),
  ),
)

return {
  built: results.filter(Boolean),
  totalFiles: results.filter(Boolean).reduce((a, r) => a + (r.filesWritten?.length || 0), 0),
}
