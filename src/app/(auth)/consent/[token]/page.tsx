import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ShieldCheck, CircleCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

async function grantConsent(formData: FormData) {
  "use server";
  const token = String(formData.get("token"));
  const consent = await prisma.consentRecord.findUnique({ where: { token } });
  if (consent && consent.status !== "granted") {
    await prisma.consentRecord.update({
      where: { token },
      data: { status: "granted", grantedAt: new Date() },
    });
  }
  revalidatePath(`/consent/${token}`);
}

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const consent = await prisma.consentRecord.findUnique({ where: { token }, include: { user: true } });

  if (!consent) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Link not found</h1>
        <p className="mt-2 text-muted-foreground">This consent link is invalid or has expired.</p>
        <Button variant="outline" className="mt-6" asChild><Link href="/">Go home</Link></Button>
      </div>
    );
  }

  if (consent.status === "granted") {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
          <CircleCheck className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold">Consent confirmed</h1>
        <p className="mt-2 text-muted-foreground">Thank you. {consent.user.displayName}&apos;s account can now be approved by an administrator.</p>
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
        <b className="text-foreground">{consent.user.displayName}</b> would like to join RoboCode.Africa, a safe learning
        platform for robotics, coding and AI. As their parent or guardian, please confirm your consent.
      </p>
      <form action={grantConsent} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" variant="gradient" size="lg" className="w-full max-w-xs">I give my consent</Button>
      </form>
    </div>
  );
}
