import { AnimatePresence, motion } from "framer-motion";

export default function RoomOverlay({ floatingMessages, cursors }) {
  return (
    <>
      {/* ── Floating Chat Messages ─────────────────────────
          Moved to bottom-right so they don't overlap toolbar
          or canvas reaction bar
      ─────────────────────────────────────────────────── */}
      <div
        className="fixed pointer-events-none z-30 flex flex-col-reverse gap-2"
        style={{
          bottom: "32px",
          right: "360px", // sits just left of the sidebar
          width: "300px",
          maxHeight: "280px",
          overflow: "hidden",
        }}
      >
        <AnimatePresence initial={false}>
          {floatingMessages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_currentColor] text-foreground text-sm px-4 py-2 inline-block max-w-[280px] font-medium">
                <span className="font-black uppercase tracking-wider block text-[10px] mb-0.5 text-[#93c5fd]">
                  {m.sender}
                </span>
                <span className="break-words text-xs">{m.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Live Cursors ──────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-20">
        {Object.entries(cursors).map(([userId, cursor], index) => {
          const colors = ["bg-[#93c5fd]", "bg-[#fca5a5]", "bg-[#86efac]", "bg-[#fde047]", "bg-[#c4b5fd]"];
          const badgeColor = colors[index % colors.length];
          return (
            <div
              key={userId}
              className="absolute transition-[left,top] duration-75 ease-linear"
              style={{ left: cursor.x, top: cursor.y }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                className="drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]"
              >
                <path
                  d="M0 0L0 11.5L3.5 8.5L6 14L8 13L5.5 7.5L10 7.5L0 0Z"
                  fill="var(--foreground)"
                />
              </svg>
              <span
                className={`absolute left-4 top-3 text-[9px] font-black uppercase tracking-widest border-2 border-black text-black px-1.5 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${badgeColor} whitespace-nowrap`}
              >
                {cursor.username}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}