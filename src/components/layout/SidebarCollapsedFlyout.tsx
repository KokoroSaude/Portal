import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type SidebarCollapsedFlyoutProps = {
  collapsed?: boolean;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Show tooltip even when the sidebar is expanded (e.g. footer icon row). */
  forceTooltip?: boolean;
  placement?: "right" | "top";
};

export function SidebarCollapsedFlyout({
  collapsed,
  label,
  description,
  children,
  className,
  forceTooltip = false,
  placement = "right",
}: SidebarCollapsedFlyoutProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (placement === "top") {
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
      return;
    }
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  }, [placement]);

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

  if (!collapsed && !forceTooltip) {
    return <>{children}</>;
  }

  const tooltipPositionClass =
    placement === "top" ? "-translate-x-1/2 -translate-y-full" : "-translate-y-1/2";

  const arrowClass =
    placement === "top"
      ? "absolute -bottom-[5px] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r border-b border-border/70 bg-card"
      : "absolute -left-[5px] top-1/2 size-2.5 -translate-y-1/2 rotate-45 border-b border-l border-border/70 bg-card";

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("relative", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[200]"
            style={{ top: position.top, left: position.left }}
            role="tooltip"
          >
            <div className={cn("animate-in fade-in-0 zoom-in-95 duration-150", tooltipPositionClass)}>
              <div className="relative flex min-w-[10rem] max-w-[14rem] flex-col gap-0.5 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-left shadow-soft-lg">
                <span aria-hidden className={arrowClass} />
                <span className="text-sm font-semibold leading-tight text-foreground">{label}</span>
                {description && (
                  <span className="text-xs leading-snug text-muted-foreground">{description}</span>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
