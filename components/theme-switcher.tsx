"use client";

import { themes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-5" : "grid-cols-1 sm:grid-cols-5")}>
      {themes.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setTheme(item.id)}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition hover:bg-muted",
            theme === item.id && "ring-2 ring-ring"
          )}
          aria-label={`Use ${item.label} theme`}
        >
          <span className={cn("h-5 w-5 rounded-full border border-border", item.swatch)} />
          {!compact && <span>{item.label}</span>}
        </button>
      ))}
    </div>
  );
}
