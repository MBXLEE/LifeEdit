import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Dumbbell,
  Feather,
  HeartHandshake,
  Home,
  Landmark,
  LineChart,
  Moon,
  NotebookPen,
  PiggyBank,
  Settings,
  Sparkles,
  Sprout,
  Timer,
  UserRound
} from "lucide-react";

export const pillars = [
  { id: "financial", label: "Financial", icon: PiggyBank, score: 76 },
  { id: "physical", label: "Physical", icon: Dumbbell, score: 82 },
  { id: "mental", label: "Mental & Emotional", icon: Brain, score: 71 },
  { id: "social", label: "Social", icon: HeartHandshake, score: 58 },
  { id: "spiritual", label: "Spiritual", icon: Feather, score: 88 },
  { id: "growth", label: "Personal Growth", icon: Sprout, score: 79 }
] as const;

export const themes = [
  { id: "ocean", label: "Ocean", swatch: "bg-[#9ecbe3]" },
  { id: "blush", label: "Blush", swatch: "bg-[#e9b7bd]" },
  { id: "sage", label: "Sage", swatch: "bg-[#aac9aa]" },
  { id: "cream", label: "Cream", swatch: "bg-[#ead9bd]" },
  { id: "midnight", label: "Midnight", swatch: "bg-[#26324a]" }
] as const;

export const navigation = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/life-edit", label: "Life Edit", icon: Sparkles },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/insights", label: "Insights", icon: BarChart3 }
] as const;

export const workspaceNavigation = [
  { href: "/finance", label: "Finance", icon: Landmark },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/fitness", label: "Fitness", icon: Dumbbell },
  { href: "/spiritual", label: "Spiritual", icon: BookOpen },
  { href: "/social", label: "Social", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings }
] as const;

export const habitIdeas = [
  "Hydration",
  "Reading",
  "Prayer",
  "Journaling",
  "Study",
  "Gym"
];

export const quitHabitIdeas = [
  "Smoking",
  "Alcohol",
  "Energy Drinks",
  "Doom Scrolling",
  "Gambling",
  "Overspending"
];

export const dailyTasks = [
  { title: "Review monthly budget", pillar: "Financial", priority: "High", status: "In Progress" },
  { title: "Upper body strength session", pillar: "Physical", priority: "High", status: "Pending" },
  { title: "Call Thando after work", pillar: "Social", priority: "Medium", status: "Pending" },
  { title: "Evening prayer journal", pillar: "Spiritual", priority: "Medium", status: "Pending" }
];

export const focusStats = [
  { label: "Today", value: "2h 15m", icon: Timer },
  { label: "Weekly deep work", value: "11h 40m", icon: LineChart },
  { label: "Best session", value: "90m", icon: Moon }
];
