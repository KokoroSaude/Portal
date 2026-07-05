import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { isStandalone } from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  showInstallButton: boolean;
  hasNativePrompt: boolean;
  instructionsOpen: boolean;
  setInstructionsOpen: (open: boolean) => void;
  promptInstall: () => Promise<void>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    const media = window.matchMedia("(display-mode: standalone)");

    const onDisplayModeChange = () => {
      setInstalled(isStandalone());
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (installed) return;

    if (!deferredPrompt) {
      setInstructionsOpen(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        toast.success("Kokoro instalado com sucesso!");
        setInstalled(true);
        setDeferredPrompt(null);
        return;
      }

      setInstructionsOpen(true);
    } catch {
      setInstructionsOpen(true);
    }
  }, [deferredPrompt, installed]);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      showInstallButton: !installed,
      hasNativePrompt: deferredPrompt !== null,
      instructionsOpen,
      setInstructionsOpen,
      promptInstall,
    }),
    [deferredPrompt, installed, instructionsOpen, promptInstall],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return context;
}
