type Box = {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
  offsetHeight: number;
  overflowY: string;
};

function measure(el: Element | null | undefined): Box | null {
  if (!el || !(el instanceof HTMLElement)) return null;
  const style = getComputedStyle(el);
  return {
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    scrollTop: el.scrollTop,
    offsetHeight: el.offsetHeight,
    overflowY: style.overflowY,
  };
}

export function isSidebarScrollDebugEnabled() {
  try {
    if (import.meta.env.DEV) return true;
    if (localStorage.getItem("kokoro:debug-sidebar") === "1") return true;
    return new URLSearchParams(window.location.search).get("debug-sidebar") === "1";
  } catch {
    return import.meta.env.DEV;
  }
}

export function warnIfSidebarScrollBroken(
  nav: HTMLElement | null,
  extra: Record<string, unknown> = {},
) {
  if (!nav) return;

  const navBox = measure(nav);
  if (!navBox) return;

  const canScroll = navBox.scrollHeight > navBox.clientHeight + 1;
  const lastLink = nav.querySelector<HTMLElement>("a:last-of-type, button:last-of-type");
  const lastLinkBelowViewport =
    lastLink != null && lastLink.getBoundingClientRect().bottom > nav.getBoundingClientRect().bottom + 1;

  if (navBox.clientHeight < 48 && navBox.scrollHeight > navBox.clientHeight) {
    console.warn("[kokoro-sidebar] scroll area broken (zero height)", { ...extra, nav: navBox });
    return;
  }

  if (lastLinkBelowViewport && !canScroll) {
    console.warn("[kokoro-sidebar] scroll area broken (items clipped)", {
      ...extra,
      canScroll,
      nav: navBox,
      lastLink: lastLink.textContent?.trim(),
    });
  }
}

export function logSidebarScroll(
  event: string,
  payload: Record<string, unknown>,
) {
  if (!isSidebarScrollDebugEnabled()) return;
  console.info(`[kokoro-sidebar] ${event}`, payload);
}

export function snapshotSidebarLayout(
  label: string,
  refs: {
    root?: HTMLElement | null;
    grid?: HTMLElement | null;
    header?: HTMLElement | null;
    nav?: HTMLElement | null;
    footer?: HTMLElement | null;
    activeLink?: HTMLElement | null;
  },
  extra: Record<string, unknown> = {},
) {
  if (!isSidebarScrollDebugEnabled()) return;

  const nav = refs.nav;
  const navBox = measure(nav);
  const canScroll = navBox ? navBox.scrollHeight > navBox.clientHeight + 1 : false;
  const maxScrollTop = navBox ? navBox.scrollHeight - navBox.clientHeight : 0;

  logSidebarScroll(`layout:${label}`, {
    ...extra,
    canScroll,
    maxScrollTop,
    root: measure(refs.root),
    grid: measure(refs.grid),
    header: measure(refs.header),
    nav: navBox,
    footer: measure(refs.footer),
    activeLink: refs.activeLink
      ? {
          text: refs.activeLink.textContent?.trim(),
          rect: refs.activeLink.getBoundingClientRect(),
        }
      : null,
    viewport: { innerHeight: window.innerHeight, innerWidth: window.innerWidth },
  });
}
