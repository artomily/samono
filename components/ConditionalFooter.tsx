"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  // Landing page (/) renders <Footer /> itself inside its own styled wrapper
  if (pathname === "/" || pathname.startsWith("/concept-")) return null;
  return <Footer />;
}
