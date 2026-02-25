import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import useSocket from "../hooks/useSocket";
import useCanvas from "../hooks/useCanvas";
import { useToast } from "@/hooks/use-toast";
import { PanelRightOpen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";

import RoomToolbar from "../components/room/RoomToolbar";
import RoomSidebar from "../components/room/RoomSidebar";
import RoomOverlay from "../components/room/RoomOverlay";
import RoomCanvas from "../components/room/RoomCanvas";
import { generateAiCanvasData } from "../services/api";

const STICKY_COLORS = ["#fef08a", "#86efac", "#f9a8d4", "#93c5fd", "#fdba74", "#c4b5fd"];
const SHAPES = [
  { id: "rect", label: "Square" }, { id: "circle", label: "Circle" },
  { id: "line", label: "Line" }, { id: "arrow", label: "Arrow" },
];

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { socket, isReady } = useSocket();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [activityLog, setActivityLog] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", action: null });
  
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [activeTool, setActiveTool] = useState("draw");
  const [activeShape, setActiveShape] = useState("rect");
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeSize, setActiveSize] = useState(4);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  const [stickyNotes, setStickyNotes] = useState([]);
  const [textNodes, setTextNodes] = useState([]);
  const [imageNodes, setImageNodes] = useState([]);
  const [editingTextId, setEditingTextId] = useState(null); 
  
  const [showStickyForm, setShowStickyForm] = useState(false);
  const [stickyText, setStickyText] = useState("");
  const [stickyColor, setStickyColor] = useState("#fef08a");
  
  const [draggingElement, setDraggingElement] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [cursors, setCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [floatingMessages, setFloatingMessages] = useState([]);

  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const typingTimeoutRef = useRef(null);
  const chatBottomRef = useRef(null);
  const reactionIdRef = useRef(0);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null); 

  const { canvasRef, previewCanvasRef, workspaceRef, gridRef, strokesRef, replayStrokes, drawStroke, setTool, setColor, setSize, setShapeType, resetZoom, scale, offset } = useCanvas(socket, roomId);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setCanvasDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleUndo = useCallback(() => socket?.emit("undo", { roomId }), [socket, roomId]);

  const handleKeyboardShortcuts = useCallback((e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); handleUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "0") { e.preventDefault(); resetZoom(); return; }
    if (e.key === "?" || e.key === "/") { e.preventDefault(); setShowShortcuts((p) => !p); return; }
    if (e.key === "Escape") { messageInputRef.current?.blur(); setShowShapeMenu(false); setShowStickyForm(false); setShowAiModal(false); setConfirmModal({isOpen: false}); setEditingTextId(null); setShowShortcuts(false); return; }
    
    if (e.key === "d" || e.key === "D") { handleToolSelect("draw"); return; }
    if (e.key === "e" || e.key === "E") { handleToolSelect("erase"); return; }
    if (e.key === "s" || e.key === "S") { handleToolSelect("shape"); return; }
    if (e.key === "t" || e.key === "T") { handleToolSelect("text"); return; }
    if (e.key === "c" || e.key === "C") { setChatOpen((p) => !p); return; }
  }, [handleUndo, resetZoom]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  useEffect(() => {
    if (!socket || !roomId || !isReady) return;
    socket.emit("join-room", { roomId });
    
    socket.on("room-state", ({ strokes, chat, stickyNotes, textNodes, imageNodes, activityLog }) => { 
      replayStrokes(strokes); setChat(chat); 
      setStickyNotes(stickyNotes || []); setTextNodes(textNodes || []); setImageNodes(imageNodes || []);
      setActivityLog(activityLog || []); setConnected(true); 
    });
    
    socket.on("receive-stroke", ({ stroke }) => drawStroke(stroke));
    socket.on("stroke-undo", ({ strokes }) => replayStrokes(strokes));
    socket.on("board-cleared", () => {
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      setStickyNotes([]); setTextNodes([]); setImageNodes([]);
    });
    socket.on("presence-update", ({ users }) => { setUsers(users); setIsHost(users.find((u) => u.userId?.toString() === user?._id?.toString())?.role === "host"); });
    socket.on("receive-message", ({ message }) => {
      setChat((prev) => [...prev, message]);
      const id = ++reactionIdRef.current;
      setFloatingMessages((prev) => [...prev, { id, text: message.message, sender: message.senderName, x: 10 }]);
      setTimeout(() => setFloatingMessages((prev) => prev.filter((m) => m.id !== id)), 4000);
    });
    socket.on("cursor-update", ({ userId, username, x, y }) => setCursors((prev) => ({ ...prev, [userId]: { username, x, y } })));
    socket.on("user-typing", ({ username }) => setTypingUsers((prev) => (prev.includes(username) ? prev : [...prev, username])));
    socket.on("user-stopped-typing", ({ username }) => setTypingUsers((prev) => prev.filter((u) => u !== username)));
    
    socket.on("receive-sticky", ({ note }) => setStickyNotes((prev) => [...prev, note]));
    socket.on("sticky-updated", ({ noteId, updates }) => setStickyNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n))));
    socket.on("sticky-deleted", ({ noteId }) => setStickyNotes((prev) => prev.filter((n) => n.id !== noteId)));
    
    socket.on("receive-text-node", ({ node }) => setTextNodes((prev) => [...prev, node]));
    socket.on("text-node-updated", ({ nodeId, updates }) => setTextNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))));
    socket.on("text-node-deleted", ({ nodeId }) => setTextNodes((prev) => prev.filter((n) => n.id !== nodeId)));

    socket.on("receive-image-node", ({ node }) => setImageNodes((prev) => [...prev, node]));
    socket.on("image-node-updated", ({ nodeId, updates }) => setImageNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))));
    socket.on("image-node-deleted", ({ nodeId }) => setImageNodes((prev) => prev.filter((n) => n.id !== nodeId)));

    socket.on("activity-update", ({ entry }) => setActivityLog((prev) => [...prev, entry]));
    socket.on("kicked", ({ message }) => { toast({ title: message, variant: "destructive" }); setTimeout(() => navigate("/dashboard"), 1500); });
    socket.on("room-ended", ({ message }) => { toast({ title: message, variant: "destructive" }); setTimeout(() => navigate("/dashboard"), 1500); });
    socket.on("room-locked", ({ isLocked }) => setIsLocked(isLocked));
    socket.on("error", ({ message }) => { toast({ title: message, variant: "destructive" }); setTimeout(() => navigate("/dashboard"), 1500); });

    return () => {
      socket.emit("leave-room", { roomId });
      ["room-state", "receive-stroke", "stroke-undo", "board-cleared", "presence-update", "receive-message", "cursor-update", "user-typing", "user-stopped-typing", "receive-sticky", "sticky-updated", "sticky-deleted", "receive-text-node", "text-node-updated", "text-node-deleted", "receive-image-node", "image-node-updated", "image-node-deleted", "activity-update", "kicked", "room-ended", "room-locked", "error"].forEach((ev) => socket.off(ev));
    };
  }, [socket, roomId, isReady]);

  const handleToolSelect = (t) => { setActiveTool(t); setTool(t); setShowShapeMenu(false); };
  const handleShapeSelect = (s) => { setActiveShape(s); setShapeType(s); setActiveTool("shape"); setTool("shape"); setShowShapeMenu(false); };
  const handleColorChange = (c) => { setActiveColor(c); setColor(c); };
  const handleSizeChange = (s) => { setActiveSize(s); setSize(s); };
  
  const openConfirm = (title, message, action) => setConfirmModal({ isOpen: true, title, message, action });
  const handleClear = () => { if (isHost) openConfirm("Clear Board", "Are you sure you want to wipe the entire canvas?", () => socket.emit("clear-board", { roomId })); };
  const handleLeave = () => { socket.emit("leave-room", { roomId }); navigate("/dashboard"); };
  const handleKick = (targetUserId, username) => openConfirm("Remove User", `Kick ${username}?`, () => socket.emit("kick-participant", { roomId, targetUserId }));
  const handleToggleLock = () => socket.emit("toggle-lock", { roomId });
  const handleEndRoom = () => openConfirm("End Session", "End this session for everyone?", () => { socket.emit("end-room", { roomId }); navigate("/dashboard"); });
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send-message", { roomId, message });
    socket.emit("typing-stop", { roomId });
    setMessage("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };
  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing-start", { roomId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("typing-stop", { roomId }), 1500);
  };

  const copyRoomId = () => { navigator.clipboard.writeText(roomId); toast({ title: "Room ID copied!" }); };
  const copyInviteLink = () => { navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`); toast({ title: "Invite link copied!" }); };

  const handleExportPNG = async () => {
    if (!workspaceRef.current) return;
    const cursorContainer = document.getElementById("cursor-container");
    if (cursorContainer) cursorContainer.style.display = "none";
    try {
      const canvas = await html2canvas(workspaceRef.current, {
        backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
        useCORS: true,
        scale: 2, 
      });
      const link = document.createElement("a");
      link.download = `penspace-${roomId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Board exported as PNG!" });
    } catch (err) {
      console.error("Export failed:", err);
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      if (cursorContainer) cursorContainer.style.display = "block";
    }
  };

  const handleExportJSON = () => {
    const data = { strokes: strokesRef.current, stickyNotes, textNodes, imageNodes };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `penspace-${roomId}.json`;
    link.click();
    toast({ title: "Board exported as JSON" });
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (isHost) {
          socket.emit("import-board", { roomId, data });
          toast({ title: "Board imported successfully!" });
        } else {
          toast({ title: "Only the host can import boards.", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Invalid file format", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target.result;
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const maxW = 400; const maxH = 400;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        if (h > maxH) { w = (w * maxH) / h; h = maxH; }
        const x = (window.innerWidth / 2 - offset.current.x) / scale.current - w/2;
        const y = (window.innerHeight / 2 - offset.current.y) / scale.current - h/2;
        
        const imageNode = { id: `image_${Date.now()}_${Math.random().toString(36).slice(2)}`, src: imageData, width: w, height: h, x, y };
        setImageNodes(prev => [...prev, imageNode]);
        socket.emit("add-image-node", { roomId, node: imageNode });
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
    e.target.value = ""; 
  };

  const handleAddSticky = () => {
    if (!stickyText.trim()) return;
    const x = (window.innerWidth / 2 - offset.current.x) / scale.current - 100;
    const y = (window.innerHeight / 2 - offset.current.y) / scale.current - 100;
    const note = { id: `sticky_${Date.now()}_${Math.random().toString(36).slice(2)}`, text: stickyText, color: stickyColor, x, y, username: user?.username };
    setStickyNotes(prev => [...prev, note]);
    socket.emit("add-sticky", { roomId, note });
    setStickyText(""); setShowStickyForm(false);
  };
  
  const handleCanvasClick = (e) => {
    if (activeTool !== "text") return;
    const x = (e.clientX - offset.current.x) / scale.current;
    const y = (e.clientY - offset.current.y) / scale.current;
    
    const textNode = { id: `text_${Date.now()}_${Math.random().toString(36).slice(2)}`, text: "", color: activeColor, fontSize: activeSize * 6, x, y };
    setTextNodes(prev => [...prev, textNode]);
    socket.emit("add-text-node", { roomId, node: textNode });
    
    setEditingTextId(textNode.id); 
    handleToolSelect("draw");
  };

  const handleDeleteSticky = (noteId) => { setStickyNotes(prev => prev.filter(n => n.id !== noteId)); socket.emit("delete-sticky", { roomId, noteId }); };
  const handleDeleteText = (nodeId) => { setTextNodes(prev => prev.filter(n => n.id !== nodeId)); socket.emit("delete-text-node", { roomId, nodeId }); };
  const handleDeleteImage = (nodeId) => { setImageNodes(prev => prev.filter(n => n.id !== nodeId)); socket.emit("delete-image-node", { roomId, nodeId }); };

  const handleUpdateText = (nodeId, newText) => {
    setTextNodes(prev => prev.map(n => n.id === nodeId ? { ...n, text: newText } : n));
    socket.emit("update-text-node", { roomId, nodeId, updates: { text: newText } });
  };
  const handleUpdateImageSize = (nodeId, width, height) => {
    setImageNodes(prev => prev.map(n => n.id === nodeId ? { ...n, width, height } : n));
    socket.emit("update-image-node", { roomId, nodeId, updates: { width, height } });
  }

  const handleElementMouseDown = (e, element, type) => { 
    if (type === "text" && editingTextId === element.id) return; 
    e.preventDefault(); 
    e.stopPropagation(); 
    
    setDraggingElement({ id: element.id, type }); 
    dragOffset.current = { 
      x: (e.clientX - offset.current.x) / scale.current - element.x, 
      y: (e.clientY - offset.current.y) / scale.current - element.y 
    }; 
  };
  
  const handleElementMouseMove = useCallback((e) => {
    if (!draggingElement) return;
    const newX = (e.clientX - offset.current.x) / scale.current - dragOffset.current.x;
    const newY = (e.clientY - offset.current.y) / scale.current - dragOffset.current.y;
    
    const updateLocal = (prevArray) => prevArray.map((n) => n.id === draggingElement.id ? { ...n, x: newX, y: newY } : n);
    if (draggingElement.type === "sticky") setStickyNotes(updateLocal);
    if (draggingElement.type === "text") setTextNodes(updateLocal);
    if (draggingElement.type === "image") setImageNodes(updateLocal);
  }, [draggingElement, scale, offset]);

  const handleElementMouseUp = useCallback(() => {
    if (!draggingElement) return;
    let targetElement = null; let eventName = "";
    if (draggingElement.type === "sticky") { targetElement = stickyNotes.find(n => n.id === draggingElement.id); eventName = "update-sticky"; }
    if (draggingElement.type === "text") { targetElement = textNodes.find(n => n.id === draggingElement.id); eventName = "update-text-node"; }
    if (draggingElement.type === "image") { targetElement = imageNodes.find(n => n.id === draggingElement.id); eventName = "update-image-node"; }
    if (targetElement) socket.emit(eventName, { roomId, noteId: draggingElement.id, nodeId: draggingElement.id, updates: { x: targetElement.x, y: targetElement.y } });
    setDraggingElement(null);
  }, [draggingElement, stickyNotes, textNodes, imageNodes, socket, roomId]);

  useEffect(() => {
    if (draggingElement) { window.addEventListener("mousemove", handleElementMouseMove); window.addEventListener("mouseup", handleElementMouseUp); }
    return () => { window.removeEventListener("mousemove", handleElementMouseMove); window.removeEventListener("mouseup", handleElementMouseUp); };
  }, [draggingElement, handleElementMouseMove, handleElementMouseUp]);

  // 🔴 ADDED: AI Generation Handler
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() || !isHost) return;
    setIsAiLoading(true);
    try {
      const aiCanvasData = await generateAiCanvasData(aiPrompt);
      
      // Pass it directly to your existing import logic so it syncs for everyone!
      socket.emit("import-board", { roomId, data: aiCanvasData });
      
      toast({ title: "✨ Canvas generated successfully!" });
      setAiPrompt("");
      setShowAiModal(false);
    } catch (error) {
      console.error(error);
      toast({ title: "AI Generation failed", description: "Try making your prompt more specific.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-background text-foreground overflow-hidden relative select-none font-sans selection:bg-[#fde047] selection:text-black">
      
      <RoomCanvas
        connected={connected} canvasRef={canvasRef} canvasWidth={canvasDimensions.width} canvasHeight={canvasDimensions.height} previewCanvasRef={previewCanvasRef}
        workspaceRef={workspaceRef} gridRef={gridRef} scale={scale} offset={offset}
        stickyNotes={stickyNotes} textNodes={textNodes} imageNodes={imageNodes}
        editingTextId={editingTextId} setEditingTextId={setEditingTextId}
        handleElementMouseDown={handleElementMouseDown}
        handleDeleteSticky={handleDeleteSticky} handleDeleteText={handleDeleteText} handleDeleteImage={handleDeleteImage}
        handleUpdateText={handleUpdateText} handleUpdateImageSize={handleUpdateImageSize}
        showStickyForm={showStickyForm} setShowStickyForm={setShowStickyForm} stickyText={stickyText} setStickyText={setStickyText}
        STICKY_COLORS={STICKY_COLORS} stickyColor={stickyColor} setStickyColor={setStickyColor} handleAddSticky={handleAddSticky}
        activeTool={activeTool} handleCanvasClick={handleCanvasClick}
      />

      <RoomOverlay floatingMessages={floatingMessages} cursors={cursors} />

      <input type="file" ref={importInputRef} accept=".json" style={{ display: "none" }} onChange={handleImportJSON} />

      <RoomToolbar
        activeTool={activeTool} handleToolSelect={handleToolSelect} activeShape={activeShape}
        showShapeMenu={showShapeMenu} setShowShapeMenu={setShowShapeMenu} handleShapeSelect={handleShapeSelect}
        activeColor={activeColor} handleColorChange={handleColorChange} activeSize={activeSize} handleSizeChange={handleSizeChange}
        handleUndo={handleUndo} resetZoom={resetZoom} handleExport={handleExportPNG} isHost={isHost} handleClear={handleClear}
        theme={theme} toggleTheme={toggleTheme} fileInputRef={fileInputRef} handleImageUpload={handleImageUpload}
        showStickyForm={showStickyForm} setShowStickyForm={setShowStickyForm} SHAPES={SHAPES}
        handleGenerateAI={handleGenerateAI} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} 
        isAiLoading={isAiLoading} showAiModal={showAiModal} setShowAiModal={setShowAiModal}
      />

      <RoomSidebar
        chatOpen={chatOpen} setChatOpen={setChatOpen} users={users} isLocked={isLocked} isHost={isHost}
        currentUser={user} handleKick={handleKick} roomId={roomId} copyRoomId={copyRoomId} copyInviteLink={copyInviteLink}
        handleToggleLock={handleToggleLock} handleEndRoom={handleEndRoom} handleLeave={handleLeave} activeTab={activeTab}
        setActiveTab={setActiveTab} chat={chat} typingUsers={typingUsers} chatBottomRef={chatBottomRef} messageInputRef={messageInputRef}
        message={message} handleTyping={handleTyping} handleSendMessage={handleSendMessage} activityLog={activityLog}
        handleExportJSON={handleExportJSON} importInputRef={importInputRef}
      />

      {!chatOpen && (
        <div className="fixed top-6 right-6 flex items-center gap-3 z-40">
          <button onClick={() => setShowShortcuts(true)} className="bg-background border-2 border-foreground rounded-full w-10 h-10 shadow-[4px_4px_0px_0px_currentColor] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_currentColor] transition-all font-black text-lg">?</button>
          <button onClick={() => setChatOpen(true)} className="bg-background border-2 border-foreground rounded-xl p-3 shadow-[4px_4px_0px_0px_currentColor] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_currentColor] transition-all flex items-center justify-center gap-2">
            <PanelRightOpen strokeWidth={2.5} />
            <span className="font-black uppercase tracking-widest text-xs hidden sm:block">Menu</span>
          </button>
        </div>
      )}

      {/* Brutalist Modal Overlays */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm pointer-events-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-background border-2 border-foreground p-6 w-96 max-w-[90vw] shadow-[12px_12px_0px_0px_currentColor] flex flex-col gap-4">
              <h3 className="text-xl font-black uppercase tracking-widest border-b-2 border-foreground pb-2">{confirmModal.title}</h3>
              <p className="font-medium text-sm">{confirmModal.message}</p>
              <div className="flex gap-4 mt-4">
                <button onClick={() => setConfirmModal({isOpen: false})} className="flex-1 py-2 font-black uppercase tracking-widest border-2 border-foreground hover:bg-muted transition-colors">Cancel</button>
                <button onClick={() => { confirmModal.action(); setConfirmModal({isOpen: false}); }} className="flex-1 py-2 font-black uppercase tracking-widest bg-[#fca5a5] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}

        {showShortcuts && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm pointer-events-auto" onClick={() => setShowShortcuts(false)}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-background border-2 border-foreground p-8 w-[400px] max-w-[90vw] shadow-[12px_12px_0px_0px_currentColor] flex flex-col gap-6">
              <div className="flex justify-between items-center border-b-2 border-foreground pb-2">
                <h3 className="text-xl font-black uppercase tracking-widest">Shortcuts</h3>
                <button onClick={() => setShowShortcuts(false)} className="hover:text-red-500 font-black">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                <div className="flex justify-between border-b-2 border-dashed border-foreground/20 pb-1"><span>Draw</span> <kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">D</kbd></div>
                <div className="flex justify-between border-b-2 border-dashed border-foreground/20 pb-1"><span>Erase</span> <kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">E</kbd></div>
                <div className="flex justify-between border-b-2 border-dashed border-foreground/20 pb-1"><span>Shape</span> <kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">S</kbd></div>
                <div className="flex justify-between border-b-2 border-dashed border-foreground/20 pb-1"><span>Text</span> <kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">T</kbd></div>
                <div className="flex justify-between border-b-2 border-dashed border-foreground/20 pb-1"><span>Chat</span> <kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">C</kbd></div>
                <div className="flex justify-between border-b-2 border-dashed border-foreground/20 pb-1"><span>Menu</span> <kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">?</kbd></div>
                <div className="flex justify-between col-span-2 border-b-2 border-dashed border-foreground/20 pb-1"><span>Undo</span> <div className="space-x-1"><kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">Ctrl</kbd><span>+</span><kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">Z</kbd></div></div>
                <div className="flex justify-between col-span-2 border-b-2 border-dashed border-foreground/20 pb-1"><span>Reset Zoom</span> <div className="space-x-1"><kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">Ctrl</kbd><span>+</span><kbd className="bg-muted px-2 py-0.5 border-2 border-foreground rounded font-mono">0</kbd></div></div>
                <div className="flex justify-between col-span-2 pb-1"><span>Pan</span> <span className="opacity-70 text-xs uppercase tracking-widest mt-1">Mid/Right Mouse</span></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}