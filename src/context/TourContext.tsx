import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'center';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: 'tour-hero',
    title: 'Welcome to Avantika Flow AI',
    description: "Turn any workflow into a scalable, documented system — powered by AI. Let's take a quick tour of what you can do.",
    placement: 'bottom',
  },
  {
    id: 'capture',
    targetId: 'tour-capture',
    title: 'Capture Workflows Instantly',
    description: 'Record any process as you do it. Our AI auto-generates polished documentation, SOPs, and step-by-step guides — no manual writing required.',
    placement: 'bottom',
  },
  {
    id: 'optimize',
    targetId: 'tour-optimize',
    title: 'Optimize with Workflow Intelligence',
    description: 'Real-time analytics surface bottlenecks and optimization opportunities across every process your team runs.',
    placement: 'bottom',
  },
  {
    id: 'integrations',
    targetId: 'tour-integrations',
    title: '200+ Integrations',
    description: 'Connect Avantika Flow AI to your existing stack — Notion, Confluence, Slack, Salesforce, and hundreds more. No context switching.',
    placement: 'bottom',
  },
  {
    id: 'workflow-ai',
    targetId: 'tour-workflow-ai',
    title: 'Workflow AI Automation',
    description: 'Let AI agents automatically discover, optimize, and execute your workflows — so your team focuses on high-value work instead of repetitive tasks.',
    placement: 'bottom',
  },
  {
    id: 'cta',
    targetId: 'tour-cta',
    title: 'Ready to Transform Your Team?',
    description: "You've seen what Avantika Flow AI can do. Start your free trial or request a personalized demo — your team will be live in minutes.",
    placement: 'top',
  },
];

const STORAGE_KEY = 'avantika_tour_completed';

interface TourContextValue {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: TourStep;
  hasCompleted: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev >= TOUR_STEPS.length - 1) {
        setIsActive(false);
        setHasCompleted(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    setCurrentStepIndex(0);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        totalSteps: TOUR_STEPS.length,
        currentStep: TOUR_STEPS[currentStepIndex],
        hasCompleted,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
