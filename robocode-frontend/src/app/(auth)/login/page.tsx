import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="mt-1 text-muted-foreground">Sign in to continue building.</p>
      <div className="mt-8">
        <LoginForm />
      </div>

      <details className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground">Demo accounts (password: password123)</summary>
        <ul className="mt-3 space-y-1 text-muted-foreground">
          <li><b className="text-foreground">Student:</b> tariro@springfield.robocode.africa</li>
          <li><b className="text-foreground">Teacher:</b> curie@springfield.robocode.africa</li>
          <li><b className="text-foreground">School admin:</b> admin@springfield.robocode.africa</li>
          <li><b className="text-foreground">Platform admin:</b> super@robocode.africa</li>
        </ul>
      </details>
    </div>
  );
}
