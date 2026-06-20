import Link from "next/link";
import { Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PendingPage({ searchParams }: { searchParams: Promise<{ school?: string }> }) {
  const { school } = await searchParams;
  const isSchool = school === "1";
  return (
    <div className="text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/18 text-accent-foreground">
        <Clock className="size-8" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold">You&apos;re almost in!</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
        {isSchool
          ? "Thanks for registering your school. The RoboCode.Africa team will review your request and email you once it's approved."
          : "Your account has been created and is awaiting approval from an administrator. We keep RoboCode safe by reviewing every signup."}
      </p>
      <div className="mx-auto mt-6 flex max-w-xs items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-left text-sm text-muted-foreground">
        <ShieldCheck className="size-5 shrink-0 text-secondary" />
        You&apos;ll receive a notification by email the moment your account is activated.
      </div>
      <Button variant="outline" className="mt-8" asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
