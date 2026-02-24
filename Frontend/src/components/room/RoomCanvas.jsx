import { AnimatePresence, motion } from "framer-motion";
import { GripHorizontal } from "lucide-react";

export default function RoomCanvas({
  connected, canvasRef, canvasWidth, canvasHeight, previewCanvasRef, scale, offset, workspaceRef, gridRef,
  stickyNotes, textNodes, imageNodes, handleElementMouseDown,
  handleDeleteSticky, handleDeleteText, handleDeleteImage, handleUpdateText, handleUpdateImageSize,
  showStickyForm, setShowStickyForm, stickyText, setStickyText, STICKY_COLORS, stickyColor, setStickyColor, handleAddSticky,
  editingTextId, setEditingTextId, handleCanvasClick
}) {
  
  return (
    <div 
      ref={gridRef}
      className="absolute inset-0 z-0 bg-[radial-gradient(#00000033_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] overflow-hidden transition-none"
      onClick={(e) => { if (e.target === e.currentTarget) handleCanvasClick(e); }}
    >
      
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-50">
          <p className="text-2xl font-black tracking-widest uppercase animate-pulse border-2 border-foreground px-6 py-3 bg-background shadow-[8px_8px_0px_0px_currentColor]">
            Connecting...
          </p>
        </div>
      )}

      {/* 🔴 THE UNIFIED WORKSPACE WRAPPER 🔴 
          Everything inside this div moves and zooms together perfectly. 
      */}
      <div ref={workspaceRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 will-change-transform">
        
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} onClick={handleCanvasClick} className="block absolute top-0 left-0 bg-transparent touch-none cursor-crosshair pointer-events-auto" />
        <canvas ref={previewCanvasRef} width={canvasWidth} height={canvasHeight} className="absolute top-0 left-0 bg-transparent pointer-events-none" />

        {stickyNotes.map((note) => (
          <div key={note.id} className="absolute w-56 min-h-32 border-2 border-black p-4 cursor-move group flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow pointer-events-auto" style={{ left: note.x, top: note.y, backgroundColor: note.color }} onMouseDown={(e) => handleElementMouseDown(e, note, "sticky")}>
            <p className="text-sm text-black font-bold whitespace-pre-wrap break-words select-none leading-snug">{note.text}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-4 border-t border-black/20 pt-1">@{note.username}</p>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteSticky(note.id); }} className="absolute top-2 right-2 w-6 h-6 border-2 border-black bg-white text-black font-black flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-50 cursor-pointer">✕</button>
          </div>
        ))}

        {textNodes.map((node) => (
          <div key={node.id} className="absolute group pointer-events-auto flex items-center gap-2 border-2 border-transparent hover:border-foreground/20 hover:bg-foreground/5 p-1 transition-colors" style={{ left: node.x, top: node.y }} onDoubleClick={() => setEditingTextId(node.id)}>
            <div className="cursor-move opacity-0 group-hover:opacity-100 p-1" onMouseDown={(e) => handleElementMouseDown(e, node, "text")}>
              <GripHorizontal className="w-5 h-5 text-foreground/50 hover:text-foreground transition-colors" />
            </div>

            {editingTextId === node.id ? (
              <input
                autoFocus type="text" value={node.text} onChange={(e) => handleUpdateText(node.id, e.target.value)} placeholder="Type here..."
                className="bg-transparent outline-none font-sans font-black tracking-wide border-b-2 border-dashed border-foreground/50"
                style={{ color: node.color, fontSize: `${node.fontSize}px`, minWidth: "100px" }}
                onMouseDown={(e) => e.stopPropagation()} 
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") { setEditingTextId(null); if (!node.text.trim()) handleDeleteText(node.id); } }}
                onBlur={() => { setEditingTextId(null); if (!node.text.trim()) handleDeleteText(node.id); }}
              />
            ) : (
              <span className="font-sans font-black tracking-wide cursor-text whitespace-nowrap" style={{ color: node.color, fontSize: `${node.fontSize}px` }}>
                {node.text || "Double click to edit"}
              </span>
            )}
            
            <button onClick={(e) => { e.stopPropagation(); handleDeleteText(node.id); }} className="absolute -top-3 -right-3 w-5 h-5 border-2 border-black bg-white text-black text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-50 cursor-pointer">✕</button>
          </div>
        ))}

        {imageNodes.map((node) => (
          <div key={node.id} className="absolute group pointer-events-auto border-2 border-transparent hover:border-foreground shadow-none hover:shadow-[8px_8px_0px_0px_currentColor] bg-background/10 transition-all" style={{ left: node.x, top: node.y, width: node.width, height: node.height }}>
            <div className="w-full h-full cursor-move" onMouseDown={(e) => handleElementMouseDown(e, node, "image")}>
              <img src={node.src} className="w-full h-full object-contain pointer-events-none" alt="canvas element" />
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(node.id); }} className="absolute -top-3 -right-3 w-6 h-6 border-2 border-black bg-white text-black font-black flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-50 cursor-pointer">✕</button>
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 bg-foreground" style={{ resize: 'both', overflow: 'hidden', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} onMouseUp={(e) => { handleUpdateImageSize(node.id, e.target.offsetWidth, e.target.offsetHeight); }} />
          </div>
        ))}

      </div>

      <AnimatePresence>
        {showStickyForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border-2 border-foreground shadow-[12px_12px_0px_0px_currentColor] p-5 z-50 w-80 flex flex-col gap-4 pointer-events-auto">
            <div className="flex justify-between items-center border-b-2 border-foreground pb-2">
              <p className="text-sm font-black uppercase tracking-widest">New Note</p>
              <button onClick={() => setShowStickyForm(false)} className="hover:text-red-500 font-black">✕</button>
            </div>
            <textarea value={stickyText} onChange={(e) => setStickyText(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="TYPE YOUR THOUGHTS..." className="w-full text-sm font-bold border-2 border-foreground p-3 h-24 resize-none bg-background outline-none focus:border-[#93c5fd] transition-colors" autoFocus />
            <div className="flex gap-2 flex-wrap">
              {STICKY_COLORS.map((c) => (
                <button key={c} onClick={() => setStickyColor(c)} className={`w-8 h-8 border-2 transition-transform ${stickyColor === c ? "border-foreground scale-110 shadow-[2px_2px_0px_0px_currentColor]" : "border-foreground/20 hover:scale-105"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <button onClick={handleAddSticky} className="w-full py-3 bg-foreground text-background font-black uppercase tracking-widest border-2 border-transparent hover:border-foreground hover:bg-[#fde047] hover:text-black transition-colors">Post Note</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}