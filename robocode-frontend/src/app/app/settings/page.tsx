import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { SettingsForm } from "@/components/account/settings-form";

export const metadata = { title: "Settings" };

interface SettingsData {
  user: {
    displayName: string;
    locale: string;
    avatarSeed: string;
    email: string;
    role: string;
  };
  schoolName: string | null;
}

export default async function SettingsPage() {
  await getPageUser();

  const { user, schoolName } = await apiGet<SettingsData>("/account/settings");

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
