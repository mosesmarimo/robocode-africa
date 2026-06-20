"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BrandLogo } from "@/components/brand-logo";
import { NavLinks } from "@/components/app/nav-links";
import type { NavSection } from "@/lib/nav";

export function MobileNav({ sections, brandName }: { sections: NavSection[]; brandName: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="grid size-10 place-items-center rounded-lg hover:bg-muted lg:hidden">
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 h-full max-w-[18rem] translate-x-0 translate-y-0 rounded-none rounded-r-2xl data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <div className="mb-4">
          <BrandLogo name={brandName} />
        </div>
        <NavLinks sections={sections} onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
