import { useEffect, useRef } from "react";

export function useAutoScroll(intervalMs = 3000) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let intervalId: ReturnType<typeof setInterval>;
    let isPaused = false;

    // We keep track of the scroll timeout to avoid racing user scrolls
    let resumeTimeout: ReturnType<typeof setTimeout>;

    const startScroll = () => {
      // Clear any existing interval before creating a new one
      clearInterval(intervalId);
      
      intervalId = setInterval(() => {
        if (isPaused || !el) return;
        
        // Only trigger auto-scroll if the element is actually scrollable horizontally
        // On desktop, some of these might wrap instead of scroll.
        if (el.scrollWidth <= el.clientWidth) return;

        const maxScroll = el.scrollWidth - el.clientWidth;
        
        // Mobile cards are typically 85vw. So scroll by 85% of client width roughly maps to 1 card.
        let nextScroll = el.scrollLeft + (el.clientWidth * 0.85); 

        const childCount = el.children.length;
        
        // If we've reached the absolute end (with a tiny buffer)
        if (el.scrollLeft >= maxScroll - 10) {
          if (childCount === 2) {
            clearInterval(intervalId);
            return;
          } else {
            // Roll back to start
            nextScroll = 0;
          }
        }

        el.scrollTo({ left: nextScroll, behavior: "smooth" });
      }, intervalMs);
    };

    // Pause on interaction
    const pause = () => {
      isPaused = true;
      clearTimeout(resumeTimeout);
    };

    // Resume after interaction ends with a small delay
    const resume = () => {
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        isPaused = false;
      }, 1000);
    };

    // Listeners for mobile touch and desktop mouse interaction
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });
    // Also pause if the user is manually scrolling using touch or trackpad
    el.addEventListener("scroll", pause, { passive: true });
    
    // We add a separate listener to resume scrolling after the native scroll finishes
    // Scroll events fire continuously, so we debounce the resume
    let scrollDebounce: ReturnType<typeof setTimeout>;
    const handleScrollEnd = () => {
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(() => {
        resume();
      }, 250);
    };
    el.addEventListener("scroll", handleScrollEnd, { passive: true });

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);

    startScroll();

    return () => {
      clearInterval(intervalId);
      clearTimeout(resumeTimeout);
      clearTimeout(scrollDebounce);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
      el.removeEventListener("scroll", pause);
      el.removeEventListener("scroll", handleScrollEnd);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, [intervalMs]);

  return containerRef;
}
