import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Check } from "lucide-react";

export default function OnboardingTooltip({
  step,
  total,
  title,
  description,
  position = "bottom",
  targetRef,
  onNext,
  onSkip,
}) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    const updatePosition = () => {
      if (!targetRef?.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      const newStyle = {};
      const GAP = 20;

      // Position logic
      if (position === "bottom") {
        newStyle.top = rect.bottom + GAP;
        newStyle.left = rect.left;
      } else if (position === "top") {
        newStyle.bottom = window.innerHeight - rect.top + GAP;
        newStyle.left = rect.left;
      } else if (position === "left") {
        newStyle.top = rect.top;
        newStyle.right = window.innerWidth - rect.left + GAP;
      } else if (position === "right") {
        newStyle.top = rect.top;
        newStyle.left = rect.right + GAP;
      }

      // Edge detection (keep it on screen)
      if (newStyle.left !== undefined) {
        newStyle.left = Math.max(20, Math.min(newStyle.left, window.innerWidth - 340));
      }

      setStyle(newStyle);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [targetRef, position, step]);

  const isLast = step === total;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed z-[60] w-80 bg-background border-2 border-foreground shadow-[8px_8px_0px_0px_currentColor] text-foreground flex flex-col pointer-events-auto"
        style={style}
      >
        {/* Header Area */}
        <div className="flex justify-between items-center p-4 border-b-2 border-foreground bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="bg-[#93c5fd] text-black border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Tip {step}/{total}
            </span>
          </div>
          <button 
            onClick={onSkip} 
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Skip tutorial"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col gap-2 bg-background">
          <h3 className="font-black text-lg uppercase tracking-tight leading-none">{title}</h3>
          <p className="text-sm font-medium opacity-80 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Footer Area */}
        <div className="p-4 border-t-2 border-foreground bg-background flex justify-between items-center">
          <div className="flex gap-1">
            {/* Progress dots */}
            {Array.from({ length: total }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 border-2 border-foreground ${i + 1 === step ? "bg-[#fde047]" : "bg-transparent"}`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            className={`flex items-center justify-center gap-2 border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              isLast ? "bg-[#86efac] text-black" : "bg-[#fca5a5] text-black"
            }`}
          >
            {isLast ? (
              <>Got it <Check className="w-4 h-4" strokeWidth={3} /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" strokeWidth={3} /></>
            )}
          </button>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}