import type { BrandTokens } from "@/lib/tenant";

/** Injects per-tenant brand colours as CSS variables (white-label theming). */
export function BrandStyle({ brand }: { brand: BrandTokens }) {
  const css = `:root{--brand-primary:${brand.primary};--brand-secondary:${brand.secondary};--brand-accent:${brand.accent};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
