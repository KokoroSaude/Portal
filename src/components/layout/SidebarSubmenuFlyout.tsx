import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { isNavToActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export type SidebarSubmenuFlyoutItem = {
  to: string;
  label: string;
};

type SidebarSubmenuFlyoutProps = {
  label: string;
  items: SidebarSubmenuFlyoutItem[];
  onNavigate?: () => void;
  trigger: React.ReactNode;
};

export function SidebarSubmenuFlyout({
  label,
  items,
  onNavigate,
  trigger,
}: SidebarSubmenuFlyoutProps) {
  const { pathname, search } = useLocation();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  }, []);

  const show = () => {
    updatePosition();
    setVisible(true);
  };

  const hide = () => setVisible(false);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [visible, updatePosition]);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {trigger}
      </div>
      {visible &&
        createPortal(
          <div
            className="fixed z-[200]"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={show}
            onMouseLeave={hide}
            role="menu"
            aria-label={label}
          >
            <div className="-translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="relative min-w-[11rem] rounded-xl border border-border/70 bg-card py-1.5 text-left shadow-soft-lg">
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-1/2 size-2.5 -translate-y-1/2 rotate-45 border-b border-l border-border/70 bg-card"
                />
                <p className="px-3.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    onClick={onNavigate}
                    className={() =>
                      cn(
                        "block px-3.5 py-2 text-sm transition-colors",
                        isNavToActive(item.to, pathname, search)
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-foreground hover:bg-muted",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
