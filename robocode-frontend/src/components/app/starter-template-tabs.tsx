"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type StarterTemplate = {
  id: string;
  title: string;
  description: string | null;
  boardType: string;
};

// One tab per dev board, in the order boards appear in the Studio's picker.
const BOARD_TABS = [
  { id: "arduino-uno", label: "Arduino Uno R3" },
  { id: "esp32", label: "ESP32" },
  { id: "raspberry-pi-pico", label: "Raspberry Pi Pico" },
];

export function StarterTemplateTabs({ templates }: { templates: StarterTemplate[] }) {
  const groups = BOARD_TABS.map((b) => ({
    ...b,
    items: templates.filter((t) => t.boardType === b.id),
  })).filter((g) => g.items.length > 0);

  // A template for a board outside the known three still gets a tab rather
  // than silently disappearing from the page.
  const other = templates.filter((t) => !BOARD_TABS.some((b) => b.id === t.boardType));
  if (other.length) groups.push({ id: "other", label: "Other boards", items: other });
  if (!groups.length) return null;

  return (
    <Tabs defaultValue={groups[0].id}>
      <TabsList className="mb-4 h-auto flex-wrap">
        {groups.map((g) => (
          <TabsTrigger key={g.id} value={g.id} className="gap-1.5">
            {g.label}
            <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
              {g.items.length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((g) => (
        <TabsContent key={g.id} value={g.id}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((t) => (
              <Link key={t.id} href={`/studio/${t.id}`}>
                <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                  <Badge variant="secondary">{g.id === "other" ? t.boardType : g.label}</Badge>
                  <p className="mt-3 font-semibold group-hover:text-primary">{t.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
