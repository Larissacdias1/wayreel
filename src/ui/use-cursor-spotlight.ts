// src/ui/use-cursor-spotlight.ts
// Shared cursor-tracking spotlight logic — sets --cursor-x/--cursor-y (as
// percentages of the container's own box) on every mousemove, consumed by
// a radial-gradient background (Home.css's .home-spotlight, Chat.css's
// .chat-spotlight). One hook, two call sites, per user decision — not
// duplicated per screen.
//
// No-op on coarse/touch pointers: effects.css's .cursor-spotlight already
// hides the layer there via a media query, so skipping the listener here
// just avoids pointless work, it isn't what makes the layer disappear.

import { useEffect, useRef, type RefObject } from "react";

export function useCursorSpotlight<
  T extends HTMLElement,
>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    function handleMouseMove(event: MouseEvent) {
      const rect = element!.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      element!.style.setProperty("--cursor-x", `${x}%`);
      element!.style.setProperty("--cursor-y", `${y}%`);
    }

    element.addEventListener("mousemove", handleMouseMove);
    return () => element.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return ref;
}
