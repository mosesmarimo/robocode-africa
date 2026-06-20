import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, CircleCheck } from "lucide-react";
import { apiPublic, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface ConsentResult {
  ok: boolean;
  status: string;
  studentName: string;
}

async function grantConsent(formData: FormData) {
  "use server";
  const token = String(formData.get("token"));
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const tenant = h.get("x-tenant") ?? undefined;
  let result: ConsentResult;
  try {
    result = await apiPublic<ConsentResult>(`/consent/${token}`, {}, host, tenant);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) redirect(`/consent/${token}?state=invalid`);
    throw e;
  }
  redirect(`/consent/${token}?state=granted&name=${encodeURIComponent(result.studentName)}`);
}

export default async function ConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ state?: string; name?: string }>;
}) {
  const { token } = await params;
  const { state, name } = await searchParams;

  if (state === "invalid") {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Link not found</h1>
        <p className="mt-2 text-muted-foreground">This consent link is invalid or has expired.</p>
        <Button variant="outline" className="mt-6" asChild><Link href="/">Go home</Link></Button>
      </div>
    );
  }

  if (state === "granted") {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
          <CircleCheck className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold">Consent confirmed</h1>
        <p className="mt-2 text-muted-foreground">Thank you. {name}&apos;s account can now be approved by an administrator.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary/15 text-secondary">
        <ShieldCheck className="size-8" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold">Parental consent</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
        Your child would like to join RoboCode.Africa, a safe learning
        platform for robotics, coding and AI. As their parent or guardian, please confirm your consent.
      </p>
      <form action={grantConsent} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" variant="gradient" size="lg" className="w-full max-w-xs">I give my consent</Button>
      </form>
    </div>
  );
}
