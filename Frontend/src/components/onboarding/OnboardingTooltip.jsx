import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function OnboardingTooltip({
  step,
  total,
  title,
  description,
  position = "bottom",
  onNext,
  onSkip,
  targetRef,
}) {
  const getPositionStyles = () => {
    if (!targetRef?.current) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const rect = targetRef.current.getBoundingClientRect();
    const offset = 12;

    if (position === "bottom") return { top: rect.bottom + offset, left: rect.left + rect.width / 2, transform: "translateX(-50%)" };
    if (position === "top") return { top: rect.top - offset, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" };
    if (position === "right") return { top: rect.top + rect.height / 2, left: rect.right + offset, transform: "translateY(-50%)" };
    if (position === "left") return { top: rect.top + rect.height / 2, left: rect.left - offset, transform: "translate(-100%, -50%)" };
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  };

  const arrowClass = {
    bottom: "absolute -top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-background",
    top: "absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-background",
    right: "absolute -left-2 top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-background",
    left: "absolute -right-2 top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-background",
  };

  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[100] w-72 bg-background border rounded-xl shadow-2xl p-4"
        style={getPositionStyles()}
      >
        {/* Arrow */}
        <div className={arrowClass[position]} />

        {/* Step counter */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            Step {step} of {total}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i + 1 === step ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <Button size="sm" onClick={onNext}>
            {step === total ? "Got it! 🎉" : "Next →"}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}