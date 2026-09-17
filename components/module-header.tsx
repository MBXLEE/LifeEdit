import { type LucideIcon } from "lucide-react";

export function ModuleHeader({
  title,
  eyebrow,
  description,
  icon: Icon
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
