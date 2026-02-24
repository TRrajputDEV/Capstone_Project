import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import useSocket from "../hooks/useSocket";
import useCanvas from "../hooks/useCanvas";
import { useToast } from "@/hooks/use-toast";
import { PanelRightOpen } from "lucide-react";

import RoomToolbar from "../components/room/RoomToolbar";
import RoomSidebar from "../components/room/RoomSidebar";
import RoomOverlay from "../components/room/RoomOverlay";
import RoomCanvas from "../components/room/RoomCanvas";

const STICKY_COLORS = ["#fef08a", "#86efac", "#f9a8d4", "#93c5fd", "#fdba74", "#c4b5fd"];
const SHAPES = [
  { id: "rect", label: "Square" },
  { id: "circle", label: "Circle" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
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

  const [activeTool, setActiveTool] = useState("draw");
  const [activeShape, setActiveShape] = useState("rect");
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeSize, setActiveSize] = useState(4);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  const [stickyNotes, setStickyNotes] = useState([]);
  const [showStickyForm, setShowStickyForm] = useState(false);
  const [stickyText, setStickyText] = useState("");
  const [stickyColor, setStickyColor] = useState("#fef08a");
  const [draggingNote, setDraggingNote] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [cursors, setCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [floatingMessages, setFloatingMessages] = useState([]);

  const typingTimeoutRef = useRef(null);
  const chatBottomRef = useRef(null);
  const reactionIdRef = useRef(0);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { canvasRef, previewCanvasRef, replayStrokes, drawStroke, setTool, setColor, setSize, setShapeType, resetZoom } = useCanvas(socket, roomId);

  // Force canvas to always be the exact size of the window
  const [canvasDimensions, setCanvasDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setCanvasDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleUndo = useCallback(() => {
    socket?.emit("undo", { roomId });
  }, [socket, roomId]);

  // Removed all the single-letter shortcuts (T, C, S, D, E) to fix the typing irritation!
  const handleKeyboardShortcuts = useCallback((e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); handleUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "0") { e.preventDefault(); resetZoom(); return; }
    if (e.key === "Escape") { messageInputRef.current?.blur(); setShowShapeMenu(false); setShowStickyForm(false); return; }
  }, [handleUndo, resetZoom]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  useEffect(() => {
    if (!socket || !roomId || !isReady) return;
    socket.emit("join-room", { roomId });
    socket.on("room-state", ({ strokes, chat, stickyNotes, activityLog }) => {
      replayStrokes(strokes); setChat(chat); setStickyNotes(stickyNotes || []); setActivityLog(activityLog || []); setConnected(true);
    });
    socket.on("receive-stroke", ({ stroke }) => drawStroke(stroke));
    socket.on("stroke-undo", ({ strokes }) => replayStrokes(strokes));
    socket.on("board-cleared", () => {
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      setStickyNotes([]);
    });
    socket.on("presence-update", ({ users }) => {
      setUsers(users);
      const me = users.find((u) => u.userId?.toString() === user?._id?.toString());
      setIsHost(me?.role === "host");
    });
    socket.on("receive-message", ({ message }) => {
      setChat((prev) => [...prev, message]);
      const id = ++reactionIdRef.current;
      const x = 10 + Math.random() * 60;
      setFloatingMessages((prev) => [...prev, { id, text: message.message, sender: message.senderName, x }]);
      setTimeout(() => setFloatingMessages((prev) => prev.filter((m) => m.id !== id)), 4000);
    });
    socket.on("cursor-update", ({ userId, username, x, y }) => setCursors((prev) => ({ ...prev, [userId]: { username, x, y } })));
    socket.on("user-typing", ({ username }) => setTypingUsers((prev) => (prev.includes(username) ? prev : [...prev, username])));
    socket.on("user-stopped-typing", ({ username }) => setTypingUsers((prev) => prev.filter((u) => u !== username)));
    socket.on("receive-sticky", ({ note }) => setStickyNotes((prev) => [...prev, note]));
    socket.on("sticky-updated", ({ noteId, updates }) => setStickyNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n))));
    socket.on("sticky-deleted", ({ noteId }) => setStickyNotes((prev) => prev.filter((n) => n.id !== noteId)));
    socket.on("activity-update", ({ entry }) => setActivityLog((prev) => [...prev, entry]));
    socket.on("user-left", ({ username }) => { setCursors((prev) => { const c = { ...prev }; delete c[username]; return c; }); });
    socket.on("kicked", ({ message }) => { toast({ title: message, variant: "destructive" }); setTimeout(() => navigate("/dashboard"), 1500); });
    socket.on("room-ended", ({ message }) => { toast({ title: message, variant: "destructive" }); setTimeout(() => navigate("/dashboard"), 1500); });
    socket.on("room-locked", ({ isLocked }) => setIsLocked(isLocked));
    socket.on("error", ({ message }) => { toast({ title: message, variant: "destructive" }); setTimeout(() => navigate("/dashboard"), 1500); });

    return () => {
      socket.emit("leave-room", { roomId });
      ["room-state", "receive-stroke", "stroke-undo", "board-cleared", "presence-update", "receive-message", "cursor-update", "user-typing", "user-stopped-typing", "receive-sticky", "sticky-updated", "sticky-deleted", "activity-update", "user-joined", "user-left", "kicked", "room-ended", "room-locked", "error"].forEach((ev) => socket.off(ev));
    };
  }, [socket, roomId, isReady]);

  const handleToolSelect = (t) => { setActiveTool(t); setTool(t); setShowShapeMenu(false); };
  const handleShapeSelect = (s) => { setActiveShape(s); setShapeType(s); setActiveTool("shape"); setTool("shape"); setShowShapeMenu(false); };
  const handleColorChange = (c) => { setActiveColor(c); setColor(c); };
  const handleSizeChange = (s) => { setActiveSize(s); setSize(s); };
  const handleClear = () => { if (isHost && window.confirm("Clear the board for everyone?")) socket.emit("clear-board", { roomId }); };
  const handleLeave = () => { socket.emit("leave-room", { roomId }); navigate("/dashboard"); };
  const handleKick = (targetUserId, username) => { if (window.confirm(`Remove ${username} from the room?`)) socket.emit("kick-participant", { roomId, targetUserId }); };
  const handleToggleLock = () => socket.emit("toggle-lock", { roomId });
  const handleEndRoom = () => { if (window.confirm("End this session for everyone?")) { socket.emit("end-room", { roomId }); navigate("/dashboard"); } };
  
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxW = canvas.width * 0.5; const maxH = canvas.height * 0.5;
        let w = img.width, h = img.height;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        if (h > maxH) { w = (w * maxH) / h; h = maxH; }
        const imgX = (canvas.width - w) / 2; const imgY = (canvas.height - h) / 2;
        canvas.getContext("2d").drawImage(img, imgX, imgY, w, h);
        socket.emit("draw-stroke", { roomId, stroke: { type: "image", imageData, imgX, imgY, imgWidth: w, imgHeight: h } });
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddSticky = () => {
    if (!stickyText.trim()) return;
    const note = { id: `sticky_${Date.now()}_${Math.random().toString(36).slice(2)}`, text: stickyText, color: stickyColor, x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100, username: user?.username };
    socket.emit("add-sticky", { roomId, note });
    setStickyText(""); setShowStickyForm(false);
  };
  const handleDeleteSticky = (noteId) => socket.emit("delete-sticky", { roomId, noteId });

  const handleStickyMouseDown = (e, note) => { e.preventDefault(); setDraggingNote(note.id); dragOffset.current = { x: e.clientX - note.x, y: e.clientY - note.y }; };
  const handleStickyMouseMove = useCallback((e) => {
    if (!draggingNote) return;
    setStickyNotes((prev) => prev.map((n) => n.id === draggingNote ? { ...n, x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y } : n));
  }, [draggingNote]);
  const handleStickyMouseUp = useCallback(() => {
    if (!draggingNote) return;
    const note = stickyNotes.find((n) => n.id === draggingNote);
    if (note) socket.emit("update-sticky", { roomId, noteId: draggingNote, updates: { x: note.x, y: note.y } });
    setDraggingNote(null);
  }, [draggingNote, stickyNotes, socket, roomId]);

  useEffect(() => {
    if (draggingNote) { window.addEventListener("mousemove", handleStickyMouseMove); window.addEventListener("mouseup", handleStickyMouseUp); }
    return () => { window.removeEventListener("mousemove", handleStickyMouseMove); window.removeEventListener("mouseup", handleStickyMouseUp); };
  }, [draggingNote, handleStickyMouseMove, handleStickyMouseUp]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a"); link.download = `penspace-${roomId}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  };

  return (
    <div className="w-screen h-screen bg-background text-foreground overflow-hidden relative select-none font-sans selection:bg-[#fde047] selection:text-black">
      
      <RoomCanvas
        connected={connected} canvasRef={canvasRef} canvasWidth={canvasDimensions.width} canvasHeight={canvasDimensions.height} previewCanvasRef={previewCanvasRef}
        stickyNotes={stickyNotes} handleStickyMouseDown={handleStickyMouseDown} handleDeleteSticky={handleDeleteSticky}
        showStickyForm={showStickyForm} setShowStickyForm={setShowStickyForm} stickyText={stickyText} setStickyText={setStickyText}
        STICKY_COLORS={STICKY_COLORS} stickyColor={stickyColor} setStickyColor={setStickyColor} handleAddSticky={handleAddSticky}
      />

      <RoomOverlay
        floatingMessages={floatingMessages} cursors={cursors} roomId={roomId}
      />

      <RoomToolbar
        activeTool={activeTool} handleToolSelect={handleToolSelect} activeShape={activeShape}
        showShapeMenu={showShapeMenu} setShowShapeMenu={setShowShapeMenu} handleShapeSelect={handleShapeSelect}
        activeColor={activeColor} handleColorChange={handleColorChange} activeSize={activeSize} handleSizeChange={handleSizeChange}
        handleUndo={handleUndo} resetZoom={resetZoom} handleExport={handleExport} isHost={isHost} handleClear={handleClear}
        theme={theme} toggleTheme={toggleTheme} fileInputRef={fileInputRef} handleImageUpload={handleImageUpload}
        showStickyForm={showStickyForm} setShowStickyForm={setShowStickyForm} SHAPES={SHAPES}
      />

      <RoomSidebar
        chatOpen={chatOpen} setChatOpen={setChatOpen} users={users} isLocked={isLocked} isHost={isHost}
        currentUser={user} handleKick={handleKick} roomId={roomId} copyRoomId={copyRoomId} copyInviteLink={copyInviteLink}
        handleToggleLock={handleToggleLock} handleEndRoom={handleEndRoom} handleLeave={handleLeave} activeTab={activeTab}
        setActiveTab={setActiveTab} chat={chat} typingUsers={typingUsers} chatBottomRef={chatBottomRef} messageInputRef={messageInputRef}
        message={message} handleTyping={handleTyping} handleSendMessage={handleSendMessage} activityLog={activityLog}
      />

      {/* Floating Panel Toggle - Moved to top right to stop overlaps */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed top-6 right-6 bg-background border-2 border-foreground rounded-xl p-3 shadow-[4px_4px_0px_0px_currentColor] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_currentColor] transition-all z-40 text-foreground flex items-center justify-center gap-2"
          title="Open Sidebar"
        >
          <PanelRightOpen strokeWidth={2.5} />
          <span className="font-black uppercase tracking-widest text-xs hidden sm:block">Menu</span>
        </button>
      )}
    </div>
  );
}