import { useLayoutEffect, useState, type RefObject } from "react";

type SidebarNavHeightRefs = {
  shell: RefObject<HTMLElement | null>;
  header: RefObject<HTMLElement | null>;
  footer: RefObject<HTMLElement | null>;
};

export function useSidebarNavHeight(
  refs: SidebarNavHeightRefs,
  collapsed: boolean,
) {
  const [navMaxHeight, setNavMaxHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const shell = refs.shell.current;
    const header = refs.header.current;
    const footer = refs.footer.current;
    if (!shell || !header || !footer) return;

    const measure = () => {
      const available = shell.clientHeight - header.offsetHeight - footer.offsetHeight;
      setNavMaxHeight(Math.max(available, 0));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    observer.observe(header);
    observer.observe(footer);

    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [collapsed]);

  return navMaxHeight;
}
