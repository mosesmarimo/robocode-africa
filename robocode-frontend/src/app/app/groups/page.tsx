import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { UsersRound } from "lucide-react";
import { GroupCard } from "@/components/social/group-card";
import { CreateGroupDialog } from "@/components/social/create-group-dialog";
import type { GroupsList } from "@/lib/social/types";

export const metadata = { title: "Groups" };

export default async function GroupsPage() {
  await getPageUser();
  const { myGroups, discoverable } = await apiGet<GroupsList>("/social/groups");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Groups</h1>
          <p className="mt-1 text-muted-foreground">
            Join communities, share updates, and collaborate with other builders.
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your groups
        </h2>
        {myGroups.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UsersRound className="size-7" />
            </span>
            <p className="font-medium">You haven&apos;t joined any groups yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Discover groups below or create your own to start collaborating.
            </p>
            <CreateGroupDialog />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myGroups.map((g) => (
              <GroupCard key={g.id} group={g} joined />
            ))}
          </div>
        )}
      </section>

      {discoverable.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Discover
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoverable.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
