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

/**
 * Loga a cadeia de elementos do nav até o <aside>, com alturas e overflow
 * computados, para descobrir onde o scroll trava.
 */
export function dumpSidebarChain(
  label: string,
  nav: HTMLElement | null,
  extra: Record<string, unknown> = {},
) {
  if (!nav) return;

  const chain: Array<Record<string, unknown>> = [];
  let el: HTMLElement | null = nav;
  let hops = 0;
  while (el && hops < 8) {
    const style = getComputedStyle(el);
    chain.push({
      tag: el.tagName.toLowerCase(),
      cls: el.className?.toString().slice(0, 80),
      clientH: el.clientHeight,
      scrollH: el.scrollHeight,
      offsetH: el.offsetHeight,
      rectH: Math.round(el.getBoundingClientRect().height),
      cssHeight: style.height,
      minHeight: style.minHeight,
      maxHeight: style.maxHeight,
      flex: style.flex,
      overflowY: style.overflowY,
      display: style.display,
    });
    if (el.tagName.toLowerCase() === "aside") break;
    el = el.parentElement;
    hops += 1;
  }

  logSidebarScroll(`chain:${label}`, {
    ...extra,
    canScroll: nav.scrollHeight > nav.clientHeight + 1,
    navScrollTop: nav.scrollTop,
    navMaxScroll: nav.scrollHeight - nav.clientHeight,
    viewport: { innerHeight: window.innerHeight, innerWidth: window.innerWidth },
    isLg: window.matchMedia("(min-width: 1024px)").matches,
    chain,
  });
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
