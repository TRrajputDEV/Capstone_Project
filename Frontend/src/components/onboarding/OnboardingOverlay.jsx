import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function OnboardingOverlay({ targetRef }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const updateRect = () => {
      if (targetRef?.current) {
        setRect(targetRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [targetRef]);

  if (!rect) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* This uses a standard CSS trick to draw a dark overlay over the whole screen,
        except for the transparent 'hole' punched out where our target element is. 
      */}
      <svg className="w-full h-full">
        <defs>
          <mask id="hole">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              animate={{
                x: rect.left - 8,
                y: rect.top - 8,
                width: rect.width + 16,
                height: rect.height + 16,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#hole)"
        />
        
        {/* Adds a stark border around the spotlight hole for extra brutalist flair */}
        <motion.rect
          animate={{
            x: rect.left - 8,
            y: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          rx="12"
          fill="none"
          stroke="#fde047" // Brutalist Yellow
          strokeWidth="4"
          strokeDasharray="8 8"
          className="animate-[dash_2s_linear_infinite]"
        />
      </svg>
    </div>
  );
}