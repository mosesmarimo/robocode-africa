"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Certificate print/export control. `print:hidden` (Tailwind's built-in
 * `@media print` variant) removes it from the printed/saved-as-PDF output so
 * only the certificate itself shows.
 */
export function PrintButton() {
  return (
    <Button
      variant="gradient"
      size="lg"
      className="print:hidden gap-2"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Print / Save as PDF
    </Button>
  );
}
