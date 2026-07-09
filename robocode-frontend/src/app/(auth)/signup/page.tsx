import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentSignupForm, SchoolSignupForm } from "@/components/auth/signup-forms";
import { getRefCookie } from "@/lib/referrals/ref-cookie";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  const invited = !!(await getRefCookie());

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Create your account</h1>
      <p className="mt-1 text-muted-foreground">Join the safest place to learn robotics, coding & AI.</p>

      {invited && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Sparkles className="size-4 shrink-0" />
          Invited by a friend — you&apos;ll both earn RoboPoints once your account is approved.
        </div>
      )}

      <Tabs defaultValue="student" className="mt-7">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">I&apos;m a student</TabsTrigger>
          <TabsTrigger value="school">Register a school</TabsTrigger>
        </TabsList>
        <TabsContent value="student" className="mt-6">
          <StudentSignupForm />
        </TabsContent>
        <TabsContent value="school" className="mt-6">
          <SchoolSignupForm />
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
