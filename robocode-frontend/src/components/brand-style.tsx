import { DEFAULT_BRAND, safeColor, type BrandTokens } from "@/lib/tenant";

/** Injects per-tenant brand colours as CSS variables (white-label theming). */
export function BrandStyle({ brand }: { brand: BrandTokens }) {
  // Defence in depth: re-validate every colour here too, so even if an
  // unsanitised brand object reaches this component nothing can break out of
  // the <style> element.
  const primary = safeColor(brand.primary, DEFAULT_BRAND.primary);
  const secondary = safeColor(brand.secondary, DEFAULT_BRAND.secondary);
  const accent = safeColor(brand.accent, DEFAULT_BRAND.accent);
  const css = `:root{--brand-primary:${primary};--brand-secondary:${secondary};--brand-accent:${accent};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
