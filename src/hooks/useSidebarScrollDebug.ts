import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import {
  isSidebarScrollDebugEnabled,
  logSidebarScroll,
  snapshotSidebarLayout,
} from "@/lib/sidebar-scroll-debug";

type SidebarScrollDebugRefs = {
  root: RefObject<HTMLElement | null>;
  grid: RefObject<HTMLElement | null>;
  header: RefObject<HTMLElement | null>;
  nav: RefObject<HTMLElement | null>;
  footer: RefObject<HTMLElement | null>;
};

function resolveRefs(refs: SidebarScrollDebugRefs) {
  return {
    root: refs.root.current,
    grid: refs.grid.current,
    header: refs.header.current,
    nav: refs.nav.current,
    footer: refs.footer.current,
    activeLink: refs.nav.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? null,
  };
}

export function useSidebarScrollDebug(
  refs: SidebarScrollDebugRefs,
  collapsed: boolean,
) {
  const { pathname } = useLocation();
  const lastScrollTop = useRef(0);
  const lastWheelAt = useRef(0);

  useEffect(() => {
    if (!isSidebarScrollDebugEnabled()) return;

    logSidebarScroll("debug-enabled", {
      hint: 'Set localStorage.removeItem("kokoro:debug-sidebar") to disable in production.',
    });
  }, []);

  useEffect(() => {
    if (!isSidebarScrollDebugEnabled()) return;

    const nav = refs.nav.current;
    if (!nav) return;

    snapshotSidebarLayout("mount-or-deps", resolveRefs(refs), { collapsed, pathname });

    const logScroll = (source: string) => {
      const scrollTop = nav.scrollTop;
      const delta = scrollTop - lastScrollTop.current;
      logSidebarScroll(`scroll:${source}`, {
        scrollTop,
        delta,
        maxScrollTop: nav.scrollHeight - nav.clientHeight,
        canScroll: nav.scrollHeight > nav.clientHeight + 1,
      });
      if (Math.abs(delta) > 0.5) {
        lastScrollTop.current = scrollTop;
      }
    };

    const onScroll = () => logScroll("nav");
    const onWheel = (event: WheelEvent) => {
      lastWheelAt.current = Date.now();
      const before = nav.scrollTop;
      requestAnimationFrame(() => {
        const after = nav.scrollTop;
        logSidebarScroll("wheel", {
          deltaY: event.deltaY,
          deltaMode: event.deltaMode,
          defaultPrevented: event.defaultPrevented,
          targetTag: (event.target as Element | null)?.tagName ?? null,
          scrollTopBefore: before,
          scrollTopAfter: after,
          appliedToNav: after !== before,
          canScroll: nav.scrollHeight > nav.clientHeight + 1,
        });
      });
    };

    const observer = new MutationObserver(() => {
      snapshotSidebarLayout("dom-mutation", resolveRefs(refs), { collapsed, pathname });
    });

    observer.observe(nav, { childList: true, subtree: true, attributes: true });

    nav.addEventListener("scroll", onScroll, { passive: true });
    nav.addEventListener("wheel", onWheel, { passive: true });

    const resetProbe = window.setInterval(() => {
      const scrollTop = nav.scrollTop;
      if (scrollTop === lastScrollTop.current) return;
      const msSinceWheel = Date.now() - lastWheelAt.current;
      logSidebarScroll("scroll-jump-without-wheel", {
        from: lastScrollTop.current,
        to: scrollTop,
        msSinceWheel,
        pathname,
      });
      lastScrollTop.current = scrollTop;
    }, 500);

    return () => {
      observer.disconnect();
      nav.removeEventListener("scroll", onScroll);
      nav.removeEventListener("wheel", onWheel);
      window.clearInterval(resetProbe);
    };
  }, [collapsed, pathname]);

  useEffect(() => {
    if (!isSidebarScrollDebugEnabled()) return;

    const onResize = () =>
      snapshotSidebarLayout("window-resize", resolveRefs(refs), { collapsed, pathname });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [collapsed, pathname]);
}
