import { AnimatePresence, motion } from "framer-motion";

export default function RoomCanvas({
  connected, canvasRef, canvasWidth, canvasHeight, previewCanvasRef,
  stickyNotes, handleStickyMouseDown, handleDeleteSticky, showStickyForm,
  setShowStickyForm, stickyText, setStickyText, STICKY_COLORS, stickyColor,
  setStickyColor, handleAddSticky
}) {
  return (
    <div className="absolute inset-0 z-0 bg-[radial-gradient(#00000033_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:24px_24px]">
      
      {/* Connection State Overlay */}
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-50">
          <p className="text-2xl font-black tracking-widest uppercase animate-pulse border-2 border-foreground px-6 py-3 bg-background shadow-[8px_8px_0px_0px_currentColor]">
            Connecting...
          </p>
        </div>
      )}

      {/* Main drawing surface (Made transparent so dots show through) */}
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="block absolute top-0 left-0 bg-transparent touch-none cursor-crosshair z-10"
      />

      {/* Preview canvas for drawing shapes */}
      <canvas
        ref={previewCanvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="absolute top-0 left-0 bg-transparent pointer-events-none z-10"
      />

      {/* Rendered Sticky Notes */}
      {stickyNotes.map((note) => (
        <div
          key={note.id}
          className="absolute w-56 min-h-32 border-2 border-black p-4 cursor-move z-20 group flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
          style={{ left: note.x, top: note.y, backgroundColor: note.color }}
          onMouseDown={(e) => handleStickyMouseDown(e, note)}
        >
          <p className="text-sm text-black font-bold whitespace-pre-wrap break-words select-none leading-snug">
            {note.text}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-4 border-t border-black/20 pt-1">
            @{note.username}
          </p>
          <button
            onClick={() => handleDeleteSticky(note.id)}
            className="absolute top-2 right-2 w-6 h-6 border-2 border-black bg-white text-black font-black flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="Delete sticky"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add New Sticky Note Modal */}
      <AnimatePresence>
        {showStickyForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border-2 border-foreground shadow-[12px_12px_0px_0px_currentColor] p-5 z-50 w-80 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b-2 border-foreground pb-2">
              <p className="text-sm font-black uppercase tracking-widest">New Note</p>
              <button onClick={() => setShowStickyForm(false)} className="hover:text-red-500 font-black">✕</button>
            </div>
            
            <textarea
              value={stickyText}
              onChange={(e) => setStickyText(e.target.value)}
              placeholder="TYPE YOUR THOUGHTS..."
              className="w-full text-sm font-bold border-2 border-foreground p-3 h-24 resize-none bg-background outline-none focus:border-[#93c5fd] transition-colors"
              autoFocus
            />
            
            <div className="flex gap-2 flex-wrap">
              {STICKY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setStickyColor(c)}
                  className={`w-8 h-8 border-2 transition-transform ${
                    stickyColor === c ? "border-foreground scale-110 shadow-[2px_2px_0px_0px_currentColor]" : "border-foreground/20 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  title="Select color"
                />
              ))}
            </div>
            
            <button 
              onClick={handleAddSticky}
              className="w-full py-3 bg-foreground text-background font-black uppercase tracking-widest border-2 border-transparent hover:border-foreground hover:bg-[#fde047] hover:text-black transition-colors"
            >
              Post Note
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}