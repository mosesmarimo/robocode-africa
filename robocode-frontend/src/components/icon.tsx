import {
  LayoutDashboard, Cpu, GraduationCap, Target, Users, Trophy, BarChart3, Award, School,
  ClipboardList, CheckCheck, UserCheck, Palette, Globe, Building2, Shield, Library, Activity,
  Bell, Settings, LogOut, Plus, Search, Sparkles, Lightbulb, Radar, Crown, Brain, Flame, Zap,
  Play, Square, RotateCcw, Save, Share2, Folder, BookOpen, ChevronDown, Menu, X, Check, Trash2,
  Cable, MousePointer2, ZoomIn, ZoomOut, Hand, Wifi, Bluetooth, HelpCircle, type LucideProps,
} from "lucide-react";

const REGISTRY: Record<string, React.ComponentType<LucideProps>> = {
  "layout-dashboard": LayoutDashboard, cpu: Cpu, "graduation-cap": GraduationCap, target: Target,
  users: Users, trophy: Trophy, "bar-chart-3": BarChart3, award: Award, school: School,
  "clipboard-list": ClipboardList, "check-check": CheckCheck, "user-check": UserCheck, palette: Palette,
  globe: Globe, "building-2": Building2, shield: Shield, library: Library, activity: Activity,
  bell: Bell, settings: Settings, "log-out": LogOut, plus: Plus, search: Search, sparkles: Sparkles,
  lightbulb: Lightbulb, radar: Radar, crown: Crown, brain: Brain, flame: Flame, zap: Zap, play: Play,
  square: Square, "rotate-ccw": RotateCcw, save: Save, "share-2": Share2, folder: Folder,
  "book-open": BookOpen, "chevron-down": ChevronDown, menu: Menu, x: X, check: Check, "trash-2": Trash2,
  cable: Cable, "mouse-pointer-2": MousePointer2, "zoom-in": ZoomIn, "zoom-out": ZoomOut, hand: Hand,
  wifi: Wifi, bluetooth: Bluetooth,
};

export function Icon({ name, className, ...props }: { name: string; className?: string } & LucideProps) {
  const Cmp = REGISTRY[name] ?? HelpCircle;
  return <Cmp className={className} {...props} />;
}
