"use client";

import { useEffect } from "react";
import { FOOTWEAR_SECTION_ID } from "@/lib/discountShortLinkDestination";

/**
 * Short links land on `/#footwear`. Next soft navigations (and late layout)
 * can miss the native hash scroll — re-scroll once the footwear anchor exists.
 */
export default function ScrollToFootwearHash() {
  useEffect(() => {
    const hash = `#${FOOTWEAR_SECTION_ID}`;

    const run = () => {
      if (window.location.hash !== hash) return;
      const el = document.getElementById(FOOTWEAR_SECTION_ID);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    run();
    const t1 = window.setTimeout(run, 50);
    const t2 = window.setTimeout(run, 350);
    window.addEventListener("hashchange", run);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("hashchange", run);
    };
  }, []);

  return null;
}
