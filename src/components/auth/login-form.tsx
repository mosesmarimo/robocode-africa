"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/auth/field";
import { login, type ActionState } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Email" name="email" type="email" placeholder="you@school.edu" autoComplete="email" error={state.fieldErrors?.email} required />
      <Field label="Password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" error={state.fieldErrors?.password} required />
      <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={pending}>
        {pending ? <><Loader2 className="size-4 animate-spin" /> Signing in…</> : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </form>
  );
}
