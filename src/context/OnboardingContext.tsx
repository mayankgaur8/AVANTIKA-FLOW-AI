import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingData {
  userType: string | null;
  useCases: string[];
  team: string;
  email: string;
  sourcePage: string;
  ctaClicked: string;
  campaignSource: string;
}

interface OpenOnboardingOptions {
  sourcePage?: string;
  ctaClicked?: string;
  campaignSource?: string;
}

interface OnboardingContextType {
  isOpen: boolean;
  step: number;
  totalSteps: number;
  data: OnboardingData;
  openOnboarding: (options?: OpenOnboardingOptions) => void;
  closeOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (n: number) => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  resetFlow: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_DATA: OnboardingData = {
  userType: null,
  useCases: [],
  team: '',
  email: '',
  sourcePage: '/',
  ctaClicked: 'unknown',
  campaignSource: '',
};

const STORAGE_KEY = 'avantika_onboarding_v1';
const STEP_KEY = 'avantika_onboarding_step';

function loadSaved(): OnboardingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

function loadSavedStep(): number {
  try {
    const raw = localStorage.getItem(STEP_KEY);
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n >= 1 && n <= 4 ? n : 1;
  } catch {
    return 1;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setDataState] = useState<OnboardingData>(loadSaved);

  // Persist data + step to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (isOpen) localStorage.setItem(STEP_KEY, String(step));
  }, [step, isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const openOnboarding = useCallback((options?: OpenOnboardingOptions) => {
    // Resume from where they left off
    const search = new URLSearchParams(location.search);
    const derivedCampaign = options?.campaignSource || search.get('utm_source') || search.get('source') || '';

    setDataState((prev) => ({
      ...prev,
      sourcePage: options?.sourcePage || location.pathname,
      ctaClicked: options?.ctaClicked || prev.ctaClicked || 'unknown',
      campaignSource: derivedCampaign || prev.campaignSource,
    }));
    setStep(loadSavedStep());
    setIsOpen(true);
  }, [location.pathname, location.search]);

  const closeOnboarding = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((n: number) => {
    setStep(Math.max(1, Math.min(4, n)));
  }, []);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setDataState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFlow = useCallback(() => {
    setDataState(DEFAULT_DATA);
    setStep(1);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_KEY);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{ isOpen, step, totalSteps: 4, data, openOnboarding, closeOnboarding, nextStep, prevStep, goToStep, updateData, resetFlow }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useOnboarding = (): OnboardingContextType => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within <OnboardingProvider>');
  return ctx;
};
