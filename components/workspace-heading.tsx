"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const titles: Record<string, string> = {
  "/planner": "Planner", "/focus": "Focus", "/journal": "Journal",
  "/life-edit": "Life Edit", "/insights": "Insights", "/finance": "Finance", "/budget": "Budget",
  "/fitness": "Gym Planner", "/social": "Relationships", "/habits": "My Habits",
  "/quit-habits": "Breaking Free", "/settings": "Theme Studio", "/spiritual": "Spiritual",
};

export function WorkspaceHeading({ section, title, children }: { section: string; title: string; children?: ReactNode }) {
  const path = usePathname();
  const mobileTitle = titles[path];
  const greeting = path === "/dashboard" && title.includes(", ") ? title.split(", ") : null;
  return <div className="le-heading"><div><p className="le-eyebrow">{section}</p><h1>{mobileTitle ? <><span className="le-desktop-title">{title}</span><span className="le-mobile-title">{mobileTitle}</span></> : greeting ? <>{greeting[0]}, <span className="le-greeting-name">{greeting.slice(1).join(", ").replace(/\.$/, "")} <span aria-hidden="true">{"\u2726"}</span></span></> : title}</h1></div>{children}</div>;
}
