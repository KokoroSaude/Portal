import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  filterTourSteps,
  getTourForAudience,
  TENANT_TOUR_OPTIONAL,
  tourStorageKey,
  type TourStep,
} from "@/lib/tours";

type TourContextValue = {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (options?: { force?: boolean }) => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  isCompleted: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

type TourProviderProps = {
  children: ReactNode;
  onOpenMobileNav?: () => void;
};

export function TourProvider({ children, onOpenMobileNav }: TourProviderProps) {
  const { isPlatform, hasFeature, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const audience = isPlatform ? "platform" : "tenant";

  const baseSteps = useMemo(() => {
    const tour = getTourForAudience(isPlatform);
    const core = filterTourSteps(tour, hasFeature);
    if (!isPlatform) {
      const optional = TENANT_TOUR_OPTIONAL.filter(
        (s) => !s.feature || hasFeature(s.feature),
      );
      // Insere opcionais antes do passo "guide" (último)
      const guide = core.at(-1);
      const head = core.slice(0, -1);
      return guide ? [...head, ...optional, guide] : [...head, ...optional];
    }
    return core;
  }, [isPlatform, hasFeature]);

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>(baseSteps);
  const [completed, setCompleted] = useState(
    () => localStorage.getItem(tourStorageKey(audience)) === "done",
  );

  useEffect(() => {
    setSteps(baseSteps);
  }, [baseSteps]);

  const storageKey = tourStorageKey(audience);

  const markCompleted = useCallback(() => {
    localStorage.setItem(storageKey, "done");
    setCompleted(true);
    setIsActive(false);
    setCurrentStep(0);
  }, [storageKey]);

  const prepareStep = useCallback(
    async (step: TourStep) => {
      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
        await new Promise((r) => setTimeout(r, 350));
      }
      if (step.openMobileNav && window.matchMedia("(max-width: 1023px)").matches) {
        onOpenMobileNav?.();
        await new Promise((r) => setTimeout(r, 300));
      }
    },
    [location.pathname, navigate, onOpenMobileNav],
  );

  const startTour = useCallback(
    async (options?: { force?: boolean }) => {
      if (!options?.force && localStorage.getItem(storageKey) === "done") return;
      setSteps(baseSteps);
      setCurrentStep(0);
      setIsActive(true);
      if (baseSteps[0]) await prepareStep(baseSteps[0]);
    },
    [baseSteps, prepareStep, storageKey],
  );

  const skipTour = useCallback(() => {
    markCompleted();
  }, [markCompleted]);

  const nextStep = useCallback(async () => {
    const next = currentStep + 1;
    if (next >= steps.length) {
      markCompleted();
      return;
    }
    setCurrentStep(next);
    await prepareStep(steps[next]!);
  }, [currentStep, markCompleted, prepareStep, steps]);

  const prevStep = useCallback(async () => {
    const prev = Math.max(0, currentStep - 1);
    setCurrentStep(prev);
    await prepareStep(steps[prev]!);
  }, [currentStep, prepareStep, steps]);

  // Auto-inicia na home na primeira visita
  useEffect(() => {
    if (!isAuthenticated || isActive) return;
    if (location.pathname !== "/") return;
    if (localStorage.getItem(storageKey) === "done") return;

    const timer = window.setTimeout(() => {
      void startTour();
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, isActive, location.pathname, startTour, storageKey]);

  const value = useMemo(
    () => ({
      isActive,
      currentStep,
      steps,
      startTour,
      skipTour,
      nextStep,
      prevStep,
      isCompleted: completed,
    }),
    [completed, currentStep, isActive, nextStep, prevStep, skipTour, startTour, steps],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
