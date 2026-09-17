import { Cake, HeartHandshake, Phone } from "lucide-react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SocialPage() {
  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Social"
        eyebrow="Relationships with intention"
        description="Track important relationships, birthdays, notes, connection goals, and follow-up reminders."
        icon={HeartHandshake}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Call Parents", "Sunday 18:00", Phone],
          ["Check in on friends", "2 reminders this week", HeartHandshake],
          ["Anele birthday", "September 28", Cake]
        ].map(([title, detail, Icon]) => (
          <Card key={title as string}>
            <CardContent className="p-5">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 font-medium">{title as string}</p>
              <p className="mt-1 text-sm text-muted-foreground">{detail as string}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Relationship Notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {["Mom", "Thando", "Study group", "Mentor"].map((person) => (
            <div key={person} className="rounded-lg border border-border p-3 text-sm">
              <span className="font-medium">{person}</span>
              <span className="ml-2 text-muted-foreground">Recent conversation, next follow-up, and connection goal</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
