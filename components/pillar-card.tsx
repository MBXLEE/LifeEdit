import { pillars } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function PillarCard({ pillar }: { pillar: (typeof pillars)[number] }) {
  const Icon = pillar.icon;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{pillar.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">Monthly alignment</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <span className="text-2xl font-semibold">{pillar.score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <Progress value={pillar.score} className="mt-3" />
      </CardContent>
    </Card>
  );
}
