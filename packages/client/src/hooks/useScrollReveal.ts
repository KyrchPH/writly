import { useCallback, useEffect, useState } from "react";

type ScrollRevealOptions = {
  selector?: string;
  visibleClass: string;
  threshold?: number;
  rootMargin?: string;
};

export function useScrollReveal<T extends HTMLElement>({
  selector = "[data-reveal]",
  visibleClass,
  threshold = 0.2,
  rootMargin = "0px 0px -10% 0px",
}: ScrollRevealOptions) {
  const [container, setContainer] = useState<T | null>(null);
  const ref = useCallback((node: T | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) return;

    const observedItems = new Set<HTMLElement>();
    let frameId: number | null = null;

    const isItemInView = (item: HTMLElement) => {
      const rect = item.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const revealLine = viewportHeight * (1 - Math.min(threshold, 0.45));

      return rect.top <= revealLine && rect.bottom >= 0;
    };

    const markVisible = (item: HTMLElement) => {
      item.classList.add(visibleClass);
      item.dataset.revealVisible = "true";
    };

    const revealVisibleItems = () => {
      observedItems.forEach((item) => {
        if (item.classList.contains(visibleClass)) return;
        if (isItemInView(item)) {
          markVisible(item);
        }
      });
    };

    const scheduleRevealCheck = () => {
      if (frameId !== null) return;
      const requestFrame =
        window.requestAnimationFrame ??
        ((callback: FrameRequestCallback) => window.setTimeout(callback, 16));

      frameId = requestFrame(() => {
        frameId = null;
        observeItems();
        revealVisibleItems();
      });
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  markVisible(entry.target as HTMLElement);
                }
              });
            },
            { threshold, rootMargin },
          );

    const observeItems = () => {
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(selector),
      );

      items.forEach((item) => {
        if (observedItems.has(item)) return;
        observedItems.add(item);

        if (!observer) {
          if (isItemInView(item)) {
            markVisible(item);
          }
          return;
        }

        observer.observe(item);
        if (isItemInView(item)) {
          markVisible(item);
        }
      });
    };

    observeItems();
    scheduleRevealCheck();

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(observeItems);

    mutationObserver?.observe(container, {
      childList: true,
      subtree: true,
    });
    window.addEventListener("scroll", scheduleRevealCheck, { passive: true });
    window.addEventListener("resize", scheduleRevealCheck);

    return () => {
      if (frameId !== null) {
        const cancelFrame =
          window.cancelAnimationFrame ??
          ((handle: number) => window.clearTimeout(handle));
        cancelFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleRevealCheck);
      window.removeEventListener("resize", scheduleRevealCheck);
      mutationObserver?.disconnect();
      observer?.disconnect();
      observedItems.clear();
    };
  }, [container, selector, visibleClass, threshold, rootMargin]);

  return ref;
}
