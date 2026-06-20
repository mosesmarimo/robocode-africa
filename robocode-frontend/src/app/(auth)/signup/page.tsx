import type { Metadata } from "next";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentSignupForm, SchoolSignupForm } from "@/components/auth/signup-forms";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Create your account</h1>
      <p className="mt-1 text-muted-foreground">Join the safest place to learn robotics, coding & AI.</p>

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
