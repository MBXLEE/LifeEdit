import { BookOpen, Feather, ListChecks } from "lucide-react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export default function SpiritualPage() {
  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Spiritual"
        eyebrow="Bible study and prayer"
        description="Manage Bible study plans, reading plans, prayer lists, prayer journal entries, scripture notes, and study progress."
        icon={BookOpen}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reading Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">John Study Plan</p>
                <Progress value={64} className="mt-2" />
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 text-sm">Today: John 12 · Notes and application</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prayer Journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Prayer, gratitude, and reflection notes." />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Feather className="h-4 w-4" />
              Track answered prayers and ongoing lists.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
