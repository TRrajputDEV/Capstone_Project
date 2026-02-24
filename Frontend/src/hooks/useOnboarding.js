import { useState, useEffect } from "react";

const DASHBOARD_KEY = "onboarding_dashboard_done";
const ROOM_KEY = "onboarding_room_done";

export const useDashboardOnboarding = () => {
  const [step, setStep] = useState(null);

  useEffect(() => {
    const done = localStorage.getItem(DASHBOARD_KEY);
    if (!done) {
      // Small delay so page renders first
      setTimeout(() => setStep(1), 800);
    }
  }, []);

  const next = (total) => {
    if (step >= total) {
      localStorage.setItem(DASHBOARD_KEY, "true");
      setStep(null);
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    localStorage.setItem(DASHBOARD_KEY, "true");
    setStep(null);
  };

  return { step, next, skip };
};

export const useRoomOnboarding = () => {
  const [step, setStep] = useState(null);

  useEffect(() => {
    const done = localStorage.getItem(ROOM_KEY);
    if (!done) {
      setTimeout(() => setStep(1), 1200);
    }
  }, []);

  const next = (total) => {
    if (step >= total) {
      localStorage.setItem(ROOM_KEY, "true");
      setStep(null);
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    localStorage.setItem(ROOM_KEY, "true");
    setStep(null);
  };

  return { step, next, skip };
};