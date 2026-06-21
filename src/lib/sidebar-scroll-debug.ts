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
    return (
      import.meta.env.DEV || localStorage.getItem("kokoro:debug-sidebar") === "1"
    );
  } catch {
    return import.meta.env.DEV;
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
