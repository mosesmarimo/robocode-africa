import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { SettingsForm } from "@/components/account/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = (await getPageUser());

  const schoolName = user.tenant?.isPlatform ? null : (user.tenant?.name ?? null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Account settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile, language, and accessibility preferences.</p>
      </div>

      <div className="max-w-2xl">
        <SettingsForm
          displayName={user.displayName}
          locale={user.locale}
          avatarSeed={user.avatarSeed}
          email={user.email}
          role={user.role}
          schoolName={schoolName}
        />
      </div>
    </div>
  );
}
