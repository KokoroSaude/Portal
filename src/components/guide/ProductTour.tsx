import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTour } from "@/contexts/TourContext";
import { logSidebarScroll } from "@/lib/sidebar-scroll-debug";
import { cn } from "@/lib/utils";

const SPOTLIGHT_PAD = 10;
const TOOLTIP_MAX = 420;

function useTargetRect(selector: string | undefined, stepIndex: number) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    let frame = 0;

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const inSidebar = !!el.closest("aside, [data-sidebar-nav]");
      logSidebarScroll("product-tour:scrollIntoView", {
        selector,
        stepIndex,
        inSidebar,
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 80),
      });
      el.scrollIntoView({ block: "nearest", behavior: "smooth", inline: "nearest" });
      setRect(el.getBoundingClientRect());
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    const retry = window.setTimeout(schedule, 400);

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [selector, stepIndex]);

  return rect;
}

export function ProductTour() {
  const { isActive, currentStep, steps, skipTour, nextStep, prevStep } = useTour();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ w: TOOLTIP_MAX, h: 280 });

  const step = steps[currentStep];
  const rect = useTargetRect(step?.target, currentStep);

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    const { width, height } = tooltipRef.current.getBoundingClientRect();
    setTooltipSize({ w: width, h: height });
  }, [currentStep, step]);

  if (!isActive || !step) return null;

  const total = steps.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;

  let tooltipTop = window.innerHeight / 2 - tooltipSize.h / 2;
  let tooltipLeft = window.innerWidth / 2 - tooltipSize.w / 2;

  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    const showBelow = spaceBelow > tooltipSize.h + 48;
    tooltipTop = showBelow ? rect.bottom + 16 : rect.top - tooltipSize.h - 16;
    tooltipLeft = rect.left + rect.width / 2 - tooltipSize.w / 2;
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipSize.w - 16));
    tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipSize.h - 16));
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="pointer-events-none fixed inset-0 z-[199]" aria-hidden />

      {/* Spotlight */}
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-blue-500/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.88)] transition-all duration-300"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-slate-900/88" />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={cn(
          "pointer-events-auto fixed z-[201] w-[min(100vw-2rem,26rem)] rounded-2xl border border-slate-700/80",
          "bg-slate-900/95 p-5 text-slate-100 shadow-2xl backdrop-blur-sm",
        )}
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <p className="mb-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          Passo {currentStep + 1} de {total}
        </p>

        <h2 id="tour-title" className="text-lg font-semibold leading-snug text-white">
          {step.title}
        </h2>
        {step.subtitle && (
          <p className="mt-1 text-sm text-slate-400">{step.subtitle}</p>
        )}

        <div className="my-4 h-px bg-slate-700/80" />

        <p className="text-sm leading-relaxed text-slate-300">{step.description}</p>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={skipTour}
            className="text-sm text-slate-400 transition-colors hover:text-slate-200"
          >
            Pular
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void prevStep()}
              disabled={isFirst}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isFirst
                  ? "cursor-not-allowed text-slate-600"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700",
              )}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => void nextStep()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              {isLast ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
