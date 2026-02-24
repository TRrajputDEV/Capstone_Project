import { motion } from "framer-motion";

export default function OnboardingOverlay({ targetRef }) {
  if (!targetRef?.current) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 z-[99]"
      />
    );
  }

  const rect = targetRef.current.getBoundingClientRect();
  const padding = 6;

  return (
    <>
      {/* Dark overlay with spotlight cutout using box-shadow trick */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[99] pointer-events-none"
        style={{
          background: "transparent",
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.55)`,
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: "8px",
        }}
      />
    </>
  );
}