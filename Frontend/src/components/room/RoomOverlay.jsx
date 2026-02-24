import { AnimatePresence, motion } from "framer-motion";

export default function RoomOverlay({
  floatingMessages, cursors
}) {
  return (
    <>
      {/* ── Floating Chat Messages ─────────────────────────── */}
      <div className="absolute pointer-events-none z-30 overflow-hidden" style={{ bottom: "40px", left: "120px", width: "300px" }}>
        <AnimatePresence>
          {floatingMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-3"
            >
              <div className="bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_currentColor] text-foreground text-sm px-4 py-2 inline-block max-w-xs font-medium">
                <span className="font-black uppercase tracking-wider block text-xs mb-0.5 text-[#93c5fd] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] dark:drop-shadow-none">
                  {m.sender}
                </span>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Live Cursors ──────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {Object.entries(cursors).map(([userId, cursor], index) => {
          const isAlternate = index % 2 === 0;
          const badgeColor = isAlternate ? "bg-[#93c5fd]" : "bg-[#fca5a5]";
          
          return (
            <div key={userId} className="absolute transition-all duration-75" style={{ left: cursor.x, top: cursor.y }}>
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" className="drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <path d="M0 0L0 11.5L3.5 8.5L6 14L8 13L5.5 7.5L10 7.5L0 0Z" fill="var(--foreground)" />
              </svg>
              <span className={`absolute left-4 top-4 text-[10px] font-black uppercase tracking-widest border-2 border-black text-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${badgeColor} whitespace-nowrap`}>
                {cursor.username}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}