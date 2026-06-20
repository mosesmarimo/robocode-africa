import type { Role } from "@/lib/domain/roles";

export type NavItem = { label: string; href: string; icon: string };
export type NavSection = { title?: string; items: NavItem[] };

const STUDENT: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/app", icon: "layout-dashboard" },
      { label: "RoboCode Studio", href: "/app/projects", icon: "cpu" },
      { label: "Learn", href: "/app/learn", icon: "graduation-cap" },
      { label: "Challenges", href: "/app/challenges", icon: "target" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Teams", href: "/app/teams", icon: "users" },
      { label: "Competitions", href: "/app/competitions", icon: "trophy" },
      { label: "Leaderboard", href: "/app/leaderboard", icon: "bar-chart-3" },
      { label: "Badges", href: "/app/badges", icon: "award" },
    ],
  },
];

const TEACHER: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/app", icon: "layout-dashboard" },
      { label: "RoboCode Studio", href: "/app/projects", icon: "cpu" },
      { label: "Classes", href: "/app/teacher/classes", icon: "school" },
      { label: "Assignments", href: "/app/teacher/assignments", icon: "clipboard-list" },
      { label: "Grading", href: "/app/teacher/grading", icon: "check-check" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Teams", href: "/app/teams", icon: "users" },
      { label: "Competitions", href: "/app/competitions", icon: "trophy" },
      { label: "Leaderboard", href: "/app/leaderboard", icon: "bar-chart-3" },
      { label: "Content Library", href: "/app/learn", icon: "graduation-cap" },
    ],
  },
];

const SCHOOL_ADMIN: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/app", icon: "layout-dashboard" },
      { label: "Approvals", href: "/app/school/approvals", icon: "user-check" },
      { label: "Members", href: "/app/school/members", icon: "users" },
      { label: "Classes", href: "/app/teacher/classes", icon: "school" },
    ],
  },
  {
    title: "School",
    items: [
      { label: "Branding", href: "/app/school/branding", icon: "palette" },
      { label: "Domain", href: "/app/school/domain", icon: "globe" },
      { label: "Competitions", href: "/app/competitions", icon: "trophy" },
      { label: "Reports", href: "/app/school/reports", icon: "bar-chart-3" },
    ],
  },
];

const SUPER_ADMIN: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/app", icon: "layout-dashboard" },
      { label: "Approvals", href: "/app/admin/approvals", icon: "user-check" },
      { label: "Schools", href: "/app/admin/tenants", icon: "building-2" },
      { label: "Moderation", href: "/app/admin/moderation", icon: "shield" },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Content", href: "/app/admin/content", icon: "library" },
      { label: "Competitions", href: "/app/competitions", icon: "trophy" },
      { label: "Users", href: "/app/admin/users", icon: "users" },
      { label: "System", href: "/app/admin/system", icon: "activity" },
    ],
  },
];

const MODERATOR: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/app", icon: "layout-dashboard" },
      { label: "Approvals", href: "/app/admin/approvals", icon: "user-check" },
      { label: "Moderation", href: "/app/admin/moderation", icon: "shield" },
    ],
  },
];

export function navForRole(role: string): NavSection[] {
  switch (role as Role) {
    case "super_admin":
      return SUPER_ADMIN;
    case "moderator":
      return MODERATOR;
    case "school_admin":
      return SCHOOL_ADMIN;
    case "teacher":
      return TEACHER;
    default:
      return STUDENT;
  }
}
