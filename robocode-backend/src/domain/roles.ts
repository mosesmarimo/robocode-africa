export const ROLES = [
  "super_admin",
  "moderator",
  "school_admin",
  "teacher",
  "student",
  "parent",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Platform Admin",
  moderator: "Moderator",
  school_admin: "School Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent / Guardian",
};

// Higher number = more authority (for UI hints only; real checks are capability-based).
export const ROLE_RANK: Record<Role, number> = {
  super_admin: 100,
  moderator: 80,
  school_admin: 60,
  teacher: 40,
  student: 20,
  parent: 10,
};

export type Capability =
  | "platform.manage"
  | "platform.approve_direct"
  | "moderation.manage"
  | "tenant.manage"
  | "tenant.approve_students"
  | "tenant.branding"
  | "class.manage"
  | "assignment.grade"
  | "studio.use"
  | "project.create"
  | "team.create"
  | "competition.create"
  | "competition.manage"
  | "content.author"
  | "reports.view";

const STUDENT_CAPS: Capability[] = ["studio.use", "project.create", "team.create"];
const TEACHER_CAPS: Capability[] = [
  ...STUDENT_CAPS,
  "class.manage",
  "assignment.grade",
  "competition.create",
  "content.author",
  "reports.view",
];
const SCHOOL_ADMIN_CAPS: Capability[] = [
  ...TEACHER_CAPS,
  "tenant.manage",
  "tenant.approve_students",
  "tenant.branding",
  "competition.manage",
];
const MODERATOR_CAPS: Capability[] = ["moderation.manage", "reports.view"];
const SUPER_ADMIN_CAPS: Capability[] = [
  ...SCHOOL_ADMIN_CAPS,
  ...MODERATOR_CAPS,
  "platform.manage",
  "platform.approve_direct",
];

export const ROLE_CAPS: Record<Role, Capability[]> = {
  super_admin: SUPER_ADMIN_CAPS,
  moderator: MODERATOR_CAPS,
  school_admin: SCHOOL_ADMIN_CAPS,
  teacher: TEACHER_CAPS,
  student: STUDENT_CAPS,
  parent: [],
};

export function can(role: string | undefined | null, cap: Capability): boolean {
  if (!role) return false;
  const caps = ROLE_CAPS[role as Role];
  return !!caps && caps.includes(cap);
}

export function isStaff(role?: string | null): boolean {
  return ["super_admin", "moderator", "school_admin", "teacher"].includes(role ?? "");
}
