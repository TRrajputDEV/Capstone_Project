import { 
  Pen, Eraser, Square, Circle, Minus, ArrowRight, Type, 
  ImagePlus, StickyNote, Undo2, Maximize, Download, Trash2, Sun, Moon,
  Sparkles, Loader2
} from "lucide-react";

export default function RoomToolbar({
  activeTool, handleToolSelect, activeShape, showShapeMenu, setShowShapeMenu,
  handleShapeSelect, activeColor, handleColorChange, activeSize, handleSizeChange,
  handleUndo, resetZoom, handleExport, isHost, handleClear, theme, toggleTheme,
  fileInputRef, handleImageUpload, showStickyForm, setShowStickyForm, SHAPES, toolbarRef,
  handleGenerateAI, aiPrompt, setAiPrompt, isAiLoading, showAiModal, setShowAiModal
}) {
  
  const getBtnStyle = (isActive, color = "bg-[#fde047]") => 
    isActive 
      ? `border-2 border-foreground ${color} text-black shadow-[2px_2px_0px_0px_currentColor]` 
      : "border-2 border-transparent hover:border-foreground hover:shadow-[2px_2px_0px_0px_currentColor] bg-background text-foreground";

  const renderShapeIcon = (shapeId) => {
    switch (shapeId) {
      case "circle": return <Circle className="w-5 h-5" strokeWidth={2.5} />;
      case "line": return <Minus className="w-5 h-5" strokeWidth={2.5} />;
      case "arrow": return <ArrowRight className="w-5 h-5" strokeWidth={2.5} />;
      default: return <Square className="w-5 h-5" strokeWidth={2.5} />;
    }
  };

  return (
    <>
      <div
        ref={toolbarRef}
        className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2 p-3 border-2 border-foreground bg-background rounded-2xl shadow-[8px_8px_0px_0px_currentColor] z-40"
      >
        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(activeTool === "draw")}`} onClick={() => handleToolSelect("draw")} title="Draw (D)">
          <Pen className="w-5 h-5" strokeWidth={2.5} />
        </button>
        
        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(activeTool === "erase", "bg-[#93c5fd]")}`} onClick={() => handleToolSelect("erase")} title="Erase (E)">
          <Eraser className="w-5 h-5" strokeWidth={2.5} />
        </button>
        
        <div className="relative">
          <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(activeTool === "shape", "bg-[#fca5a5]")}`} onClick={() => setShowShapeMenu((p) => !p)} title="Shapes (S)">
            {renderShapeIcon(activeShape)}
          </button>
          {showShapeMenu && (
            <div className="absolute left-14 top-0 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_currentColor] p-2 flex flex-col gap-2 rounded-xl z-50">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleShapeSelect(s.id)}
                  className={`w-10 h-10 rounded flex items-center justify-center hover:bg-foreground hover:text-background transition-colors ${activeShape === s.id ? "bg-[#fca5a5] text-black border-2 border-black" : ""}`}
                  title={s.label}
                >
                  {renderShapeIcon(s.id)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(activeTool === "text")}`} onClick={() => handleToolSelect("text")} title="Text tool (T)">
          <Type className="w-5 h-5" strokeWidth={2.5} />
        </button>
        
        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(false)}`} onClick={() => fileInputRef.current?.click()} title="Upload image">
          <ImagePlus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(showStickyForm)}`} onClick={() => setShowStickyForm((p) => !p)} title="Sticky note">
          <StickyNote className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <div className="w-8 border-t-2 border-foreground my-1 mx-auto opacity-30" />

        {isHost && (
          <button 
            className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(showAiModal, "bg-[#c4b5fd]")} group relative overflow-hidden`} 
            onClick={() => setShowAiModal((p) => !p)} 
            title="Generate AI Canvas"
          >
            <Sparkles className="w-5 h-5 group-hover:animate-pulse" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        )}

        <div className="w-8 border-t-2 border-foreground my-1 mx-auto opacity-30" />

        <input type="color" value={activeColor} onChange={(e) => handleColorChange(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-2 border-foreground p-0 shadow-[2px_2px_0px_0px_currentColor] mx-auto overflow-hidden" title="Color" />
        
        <div className="py-2 flex justify-center">
          <input type="range" min="1" max="20" value={activeSize} onChange={(e) => handleSizeChange(Number(e.target.value))} className="w-24 -rotate-90 origin-center translate-y-10 accent-foreground h-1" title="Brush size" />
          <div className="h-20" /> {/* Spacer for rotated slider */}
        </div>

        <div className="w-8 border-t-2 border-foreground my-1 mx-auto opacity-30" />

        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(false)}`} onClick={handleUndo} title="Undo (Ctrl+Z)">
          <Undo2 className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(false)}`} onClick={resetZoom} title="Reset zoom (Ctrl+0)">
          <Maximize className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(false)}`} onClick={handleExport} title="Export PNG">
          <Download className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {isHost && (
          <button className="w-10 h-10 rounded flex items-center justify-center border-2 border-transparent hover:border-black hover:bg-[#fca5a5] hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mt-2" onClick={handleClear} title="Clear board">
            <Trash2 className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}

        <button className={`w-10 h-10 rounded flex items-center justify-center transition-all ${getBtnStyle(false)} mt-2`} onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun className="w-5 h-5" strokeWidth={2.5}/> : <Moon className="w-5 h-5" strokeWidth={2.5}/>}
        </button>
      </div>

      {showAiModal && isHost && (
        <div className="absolute left-24 top-1/2 -translate-y-1/2 bg-background border-2 border-foreground shadow-[12px_12px_0px_0px_currentColor] p-5 w-80 flex flex-col gap-4 z-50 pointer-events-auto rounded-xl">
          <div className="flex justify-between items-center border-b-2 border-foreground pb-2">
            <p className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c4b5fd]" /> AI Generation
            </p>
            <button onClick={() => setShowAiModal(false)} className="hover:text-red-500 font-black">✕</button>
          </div>
          <textarea 
            value={aiPrompt} 
            onChange={(e) => setAiPrompt(e.target.value)} 
            onKeyDown={(e) => { e.stopPropagation(); if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }} 
            placeholder="E.g., Create a 3-column Kanban board for a software project..." 
            className="w-full text-sm font-bold border-2 border-foreground p-3 h-24 resize-none bg-background outline-none focus:border-[#c4b5fd] transition-colors rounded" 
            autoFocus 
          />
          <button 
            onClick={handleGenerateAI} 
            disabled={isAiLoading || !aiPrompt.trim()}
            className="w-full py-3 bg-foreground text-background font-black uppercase tracking-widest border-2 border-transparent hover:border-foreground hover:bg-[#c4b5fd] hover:text-black transition-colors disabled:opacity-50 flex justify-center items-center gap-2 rounded"
          >
            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Canvas"}
          </button>
        </div>
      )}
    </>
  );
}