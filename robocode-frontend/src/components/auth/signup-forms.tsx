"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/auth/field";
import { studentSignup, schoolSignup, type ActionState } from "@/lib/auth/actions";

export function StudentSignupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(studentSignup, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Full name" name="displayName" placeholder="Tariro Moyo" error={state.fieldErrors?.displayName} required />
      <Field label="Email" name="email" type="email" placeholder="you@example.com" error={state.fieldErrors?.email} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" name="password" type="password" placeholder="••••••••" error={state.fieldErrors?.password} required />
        <Field label="Birth year" name="birthYear" type="number" placeholder="2013" error={state.fieldErrors?.birthYear} required />
      </div>
      <Field
        label="Parent / guardian email"
        name="guardianEmail"
        type="email"
        placeholder="guardian@example.com"
        hint="Required for under-13s — they'll confirm your account."
        error={state.fieldErrors?.guardianEmail}
      />
      <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={pending}>
        {pending ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : "Create student account"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">All student accounts are reviewed before activation to keep RoboCode safe.</p>
    </form>
  );
}

export function SchoolSignupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(schoolSignup, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label="School name" name="schoolName" placeholder="Springfield STEM Academy" error={state.fieldErrors?.schoolName} required />
      <Field label="Preferred subdomain" name="slug" placeholder="springfield" hint="Students will visit yourname.robocode.africa" error={state.fieldErrors?.slug} required />
      <Field label="Your name" name="adminName" placeholder="Grace Banda" error={state.fieldErrors?.adminName} required />
      <Field label="Work email" name="email" type="email" placeholder="admin@school.edu" error={state.fieldErrors?.email} required />
      <Field label="Password" name="password" type="password" placeholder="••••••••" error={state.fieldErrors?.password} required />
      <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={pending}>
        {pending ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : "Register school"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">School registrations are reviewed by the RoboCode.Africa team.</p>
    </form>
  );
}
