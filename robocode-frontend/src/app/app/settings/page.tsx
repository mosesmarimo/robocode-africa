import { getPageUser } from "@/lib/auth/current-user";
import { apiGet, apiGetOrNull } from "@/lib/api/client";
import { SettingsForm } from "@/components/account/settings-form";
import { AiModelForm, type AiConfigData } from "@/components/account/ai-model-form";

export const metadata = { title: "Settings" };

interface SettingsData {
  user: {
    displayName: string;
    locale: string;
    avatarSeed: string;
    email: string;
    role: string;
    tagline?: string | null;
    bio?: string | null;
  };
  schoolName: string | null;
}

export default async function SettingsPage() {
  await getPageUser();

  // These two endpoints are independent — fetch them concurrently to avoid a
  // request waterfall (both are no-store live fetches).
  const [{ user, schoolName }, aiConfig] = await Promise.all([
    apiGet<SettingsData>("/account/settings"),
    apiGetOrNull<AiConfigData>("/ai/config"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Account settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile, language, and accessibility preferences.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <SettingsForm
          displayName={user.displayName}
          locale={user.locale}
          avatarSeed={user.avatarSeed}
          email={user.email}
          role={user.role}
          schoolName={schoolName}
          tagline={user.tagline ?? ""}
          bio={user.bio ?? ""}
        />
        {aiConfig && <AiModelForm data={aiConfig} />}
      </div>
    </div>
  );
}
