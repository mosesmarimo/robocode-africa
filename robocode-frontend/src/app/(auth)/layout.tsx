import Link from "next/link";
import { ShieldCheck, Sparkles, Cpu, Trophy } from "lucide-react";
import { getBranding } from "@/lib/tenant";
import { BrandStyle } from "@/components/brand-style";
import { BrandLogo } from "@/components/brand-logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { brand, tenant } = await getBranding();
  const name = tenant?.name ?? "RoboCode.Africa";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandStyle brand={brand} />
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -left-16 top-1/3 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-10 size-72 rounded-full bg-black/10 blur-3xl" />
        <BrandLogo name={name} logoUrl={brand.logoUrl} href="/" className="relative z-10 text-white [&_span]:text-white" />
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">{brand.tagline ?? "Learn Robotics, Coding & AI"}</h2>
          <p className="mt-3 text-white/85">A safe, gamified studio where students build real circuits, write code, and watch it come alive.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Cpu, t: "Interactive 3D electronics simulator" },
              { icon: Sparkles, t: "Guided courses for every level" },
              { icon: Trophy, t: "Teams, competitions & leaderboards" },
              { icon: ShieldCheck, t: "Approved, moderated & child-safe" },
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-white/15"><f.icon className="size-4.5" /></span>
                {f.t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/70">© {new Date().getFullYear()} RoboCode.Africa · Safe learning for every student</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo name={name} logoUrl={brand.logoUrl} href="/" />
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
            <Link href="/safety" className="underline hover:text-foreground">Safety Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
