"use client";

import { useRef, useState, useTransition } from "react";
import { Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PersonCard } from "@/components/social/person-card";
import { searchPeople } from "@/lib/social/actions";
import type { PersonResult } from "@/lib/social/types";

interface PeopleSearchProps {
  currentUserId: string;
}

export function PeopleSearch({ currentUserId }: PeopleSearchProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    const term = value.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const r = await searchPeople(term);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        setResults(r.data.results);
        setSearched(true);
      });
    }, 350);
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search people by name…"
          className="pl-9"
        />
      </div>

      {pending && <p className="text-sm text-muted-foreground">Searching…</p>}

      {!pending && searched && results.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-muted">
            <UsersRound className="size-7 text-muted-foreground" />
          </span>
          <p className="font-medium text-muted-foreground">No people found</p>
          <p className="text-sm text-muted-foreground/70">Try a different name.</p>
        </Card>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <PersonCard key={p.id} person={p} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {!searched && q.trim().length < 2 && (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      )}
    </div>
  );
}
