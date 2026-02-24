import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import useSocket from "../hooks/useSocket";
import useCanvas from "../hooks/useCanvas";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import OnboardingTooltip from "../components/onboarding/OnboardingTooltip";
import { useRoomOnboarding } from "../hooks/useOnboarding";

const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "😮"];
const STICKY_COLORS = [
  "#fef08a",
  "#86efac",
  "#f9a8d4",
  "#93c5fd",
  "#fdba74",
  "#c4b5fd",
];
const SHAPES = [
  { id: "rect", label: "⬜" },
  { id: "circle", label: "⭕" },
  { id: "line", label: "╱" },
  { id: "arrow", label: "→" },
];

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { socket, isReady } = useSocket();
  const { toast } = useToast();

  // Room state
  const [users, setUsers] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [activityLog, setActivityLog] = useState([]);

  // Tool states
  const [activeTool, setActiveTool] = useState("draw");
  const [activeShape, setActiveShape] = useState("rect");
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeSize, setActiveSize] = useState(4);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  // Sticky notes
  const [stickyNotes, setStickyNotes] = useState([]);
  const [showStickyForm, setShowStickyForm] = useState(false);
  const [stickyText, setStickyText] = useState("");
  const [stickyColor, setStickyColor] = useState("#fef08a");
  const [draggingNote, setDraggingNote] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Fun features
  const [cursors, setCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [floatingMessages, setFloatingMessages] = useState([]);

  const typingTimeoutRef = useRef(null);
  const chatBottomRef = useRef(null);
  const reactionIdRef = useRef(0);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    canvasRef,
    previewCanvasRef,
    replayStrokes,
    drawStroke,
    setTool,
    setColor,
    setSize,
    setShapeType,
    resetZoom,
  } = useCanvas(socket, roomId);

  const canvasWidth =
    typeof window !== "undefined"
      ? window.innerWidth - (chatOpen ? 350 : 86)
      : 800;
  const canvasHeight = typeof window !== "undefined" ? window.innerHeight : 600;

  const {
    step: onboardStep,
    next: onboardNext,
    skip: onboardSkip,
  } = useRoomOnboarding();

  // Onboarding refs
  const toolbarOnboardRef = useRef(null);
  const panelOnboardRef = useRef(null);
  const reactionOnboardRef = useRef(null);

  const ROOM_STEPS = [
    {
      title: "Your drawing toolbar 🎨",
      description:
        "Draw, erase, add shapes, text, images and sticky notes. Use D/E/S as keyboard shortcuts.",
      ref: toolbarOnboardRef,
      position: "right",
    },
    {
      title: "Chat & controls panel 💬",
      description:
        "See who's online, chat with the team, view activity, and access host controls. Press C to toggle.",
      ref: panelOnboardRef,
      position: "left",
    },
    {
      title: "Reactions & raise hand 🎉",
      description:
        "Send live reactions that float across the canvas. Raise your hand to get the host's attention!",
      ref: reactionOnboardRef,
      position: "top",
    },
  ];
  const ROOM_TOTAL = 3;

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ── Keyboard Shortcuts ──────────────────────────────────
  const handleKeyboardShortcuts = useCallback(
    (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        socket?.emit("undo", { roomId });
        toast({ title: "↩ Undone" });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        resetZoom();
        toast({ title: "🔍 Zoom reset" });
        return;
      }
      if (e.key === "d" || e.key === "D") {
        handleToolSelect("draw");
        return;
      }
      if (e.key === "e" || e.key === "E") {
        handleToolSelect("erase");
        return;
      }
      if (e.key === "s" || e.key === "S") {
        handleToolSelect("shape");
        return;
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        messageInputRef.current?.focus();
        return;
      }
      if (e.key === "c" || e.key === "C") {
        setChatOpen((p) => !p);
        return;
      }
      if (e.key === "Escape") {
        messageInputRef.current?.blur();
        setShowShapeMenu(false);
        setShowStickyForm(false);
        return;
      }
    },
    [socket, roomId, resetZoom],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // ── Socket Events ───────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId || !isReady) return;

    console.log("[Room] Socket ready, joining:", roomId);
    socket.emit("join-room", { roomId });

    socket.on("room-state", ({ strokes, chat, stickyNotes, activityLog }) => {
      console.log("[Room] State received. Strokes:", strokes.length);
      replayStrokes(strokes);
      setChat(chat);
      setStickyNotes(stickyNotes || []);
      setActivityLog(activityLog || []);
      setConnected(true);
      toast({ title: "✅ Connected to room" });
    });

    socket.on("receive-stroke", ({ stroke }) => drawStroke(stroke));

    socket.on("stroke-undo", ({ strokes }) => replayStrokes(strokes));

    socket.on("board-cleared", () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }
      setStickyNotes([]);
      toast({ title: "🗑️ Board cleared" });
    });

    socket.on("presence-update", ({ users }) => {
      setUsers(users);
      const me = users.find(
        (u) => u.userId?.toString() === user?._id?.toString(),
      );
      setIsHost(me?.role === "host");
    });

    socket.on("receive-message", ({ message }) => {
      setChat((prev) => [...prev, message]);
      const id = ++reactionIdRef.current;
      const x = 10 + Math.random() * 60;
      setFloatingMessages((prev) => [
        ...prev,
        { id, text: message.message, sender: message.senderName, x },
      ]);
      setTimeout(
        () => setFloatingMessages((prev) => prev.filter((m) => m.id !== id)),
        4000,
      );
    });

    socket.on("cursor-update", ({ userId, username, x, y }) => {
      setCursors((prev) => ({ ...prev, [userId]: { username, x, y } }));
    });

    socket.on("user-typing", ({ username }) => {
      setTypingUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username],
      );
    });

    socket.on("user-stopped-typing", ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    socket.on("hand-raised", ({ username, raisedHand }) => {
      if (raisedHand) {
        toast({ title: `🖐 ${username} raised their hand` });
        const id = ++reactionIdRef.current;
        setFloatingReactions((prev) => [
          ...prev,
          { id, emoji: "🖐", label: `${username} raised hand`, x: 50 },
        ]);
        setTimeout(
          () => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)),
          3000,
        );
      }
    });

    socket.on("receive-reaction", ({ username, emoji }) => {
      const id = ++reactionIdRef.current;
      const x = 5 + Math.random() * 85;
      setFloatingReactions((prev) => [
        ...prev,
        { id, emoji, label: username, x },
      ]);
      setTimeout(
        () => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)),
        3000,
      );
    });

    // Sticky notes
    socket.on("receive-sticky", ({ note }) => {
      setStickyNotes((prev) => [...prev, note]);
    });

    socket.on("sticky-updated", ({ noteId, updates }) => {
      setStickyNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
      );
    });

    socket.on("sticky-deleted", ({ noteId }) => {
      setStickyNotes((prev) => prev.filter((n) => n.id !== noteId));
    });

    // Activity log
    socket.on("activity-update", ({ entry }) => {
      setActivityLog((prev) => [...prev, entry]);
    });

    socket.on("user-joined", ({ username }) => {
      console.log("[Room] Joined:", username);
      toast({ title: `👋 ${username} joined` });
    });

    socket.on("user-left", ({ username }) => {
      console.log("[Room] Left:", username);
      toast({ title: `👋 ${username} left` });
      setCursors((prev) => {
        const c = { ...prev };
        delete c[username];
        return c;
      });
    });

    socket.on("kicked", ({ message }) => {
      toast({ title: message, variant: "destructive" });
      setTimeout(() => navigate("/dashboard"), 1500);
    });

    socket.on("room-ended", ({ message }) => {
      toast({ title: message, variant: "destructive" });
      setTimeout(() => navigate("/dashboard"), 1500);
    });

    socket.on("room-locked", ({ isLocked }) => {
      setIsLocked(isLocked);
      toast({ title: isLocked ? "🔒 Room locked" : "🔓 Room unlocked" });
    });

    socket.on("error", ({ message }) => {
      console.error("[Room] Error:", message);
      toast({ title: message, variant: "destructive" });
      setTimeout(() => navigate("/dashboard"), 1500);
    });

    return () => {
      socket.emit("leave-room", { roomId });
      [
        "room-state",
        "receive-stroke",
        "stroke-undo",
        "board-cleared",
        "presence-update",
        "receive-message",
        "cursor-update",
        "user-typing",
        "user-stopped-typing",
        "hand-raised",
        "receive-reaction",
        "receive-sticky",
        "sticky-updated",
        "sticky-deleted",
        "activity-update",
        "user-joined",
        "user-left",
        "kicked",
        "room-ended",
        "room-locked",
        "error",
      ].forEach((ev) => socket.off(ev));
    };
  }, [socket, roomId, isReady]);

  // ── Handlers ────────────────────────────────────────────
  const handleToolSelect = (t) => {
    setActiveTool(t);
    setTool(t);
    setShowShapeMenu(false);
    toast({ title: `Tool: ${t}` });
  };

  const handleShapeSelect = (s) => {
    setActiveShape(s);
    setShapeType(s);
    setActiveTool("shape");
    setTool("shape");
    setShowShapeMenu(false);
  };

  const handleColorChange = (c) => {
    setActiveColor(c);
    setColor(c);
  };

  const handleSizeChange = (s) => {
    setActiveSize(s);
    setSize(s);
  };

  const handleUndo = () => {
    socket?.emit("undo", { roomId });
    toast({ title: "↩ Undone" });
  };

  const handleClear = () => {
    if (!isHost) return;
    if (window.confirm("Clear the board for everyone?")) {
      socket.emit("clear-board", { roomId });
    }
  };

  const handleLeave = () => {
    socket.emit("leave-room", { roomId });
    navigate("/dashboard");
  };

  const handleKick = (targetUserId, username) => {
    if (window.confirm(`Remove ${username} from the room?`)) {
      socket.emit("kick-participant", { roomId, targetUserId });
    }
  };

  const handleToggleLock = () => socket.emit("toggle-lock", { roomId });

  const handleEndRoom = () => {
    if (window.confirm("End this session for everyone?")) {
      socket.emit("end-room", { roomId });
      navigate("/dashboard");
    }
  };

  const handleRaiseHand = () => socket.emit("raise-hand", { roomId });

  const handleReaction = (emoji) =>
    socket.emit("send-reaction", { roomId, emoji });

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
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", { roomId });
    }, 1500);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({ title: "📋 Room ID copied!" });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    toast({ title: "🔗 Invite link copied!" });
  };

  // ── Image upload ────────────────────────────────────────
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
        const maxW = canvas.width * 0.5;
        const maxH = canvas.height * 0.5;
        let w = img.width,
          h = img.height;
        if (w > maxW) {
          h = (h * maxW) / w;
          w = maxW;
        }
        if (h > maxH) {
          w = (w * maxH) / h;
          h = maxH;
        }
        const imgX = (canvas.width - w) / 2;
        const imgY = (canvas.height - h) / 2;
        canvas.getContext("2d").drawImage(img, imgX, imgY, w, h);
        socket.emit("draw-stroke", {
          roomId,
          stroke: {
            type: "image",
            imageData,
            imgX,
            imgY,
            imgWidth: w,
            imgHeight: h,
          },
        });
        toast({ title: "🖼️ Image added" });
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Sticky notes ────────────────────────────────────────
  const handleAddSticky = () => {
    if (!stickyText.trim()) return;
    const note = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text: stickyText,
      color: stickyColor,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    };
    socket.emit("add-sticky", { roomId, note });
    setStickyText("");
    setShowStickyForm(false);
    toast({ title: "📝 Sticky note added" });
  };

  const handleDeleteSticky = (noteId) => {
    socket.emit("delete-sticky", { roomId, noteId });
  };

  const handleStickyMouseDown = (e, note) => {
    e.preventDefault();
    setDraggingNote(note.id);
    dragOffset.current = { x: e.clientX - note.x, y: e.clientY - note.y };
  };

  const handleStickyMouseMove = useCallback(
    (e) => {
      if (!draggingNote) return;
      setStickyNotes((prev) =>
        prev.map((n) =>
          n.id === draggingNote
            ? {
                ...n,
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y,
              }
            : n,
        ),
      );
    },
    [draggingNote],
  );

  const handleStickyMouseUp = useCallback(() => {
    if (!draggingNote) return;
    const note = stickyNotes.find((n) => n.id === draggingNote);
    if (note) {
      socket.emit("update-sticky", {
        roomId,
        noteId: draggingNote,
        updates: { x: note.x, y: note.y },
      });
    }
    setDraggingNote(null);
  }, [draggingNote, stickyNotes, socket, roomId]);

  useEffect(() => {
    if (draggingNote) {
      window.addEventListener("mousemove", handleStickyMouseMove);
      window.addEventListener("mouseup", handleStickyMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleStickyMouseMove);
      window.removeEventListener("mouseup", handleStickyMouseUp);
    };
  }, [draggingNote, handleStickyMouseMove, handleStickyMouseUp]);

  // Export canvas
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "📥 Exported as PNG" });
  };

  const myHandRaised = users.find(
    (u) => u.userId?.toString() === user?._id?.toString(),
  )?.raisedHand;

  const getActivityIcon = (type) => {
    const icons = {
      joined: "👋",
      left: "🚪",
      kicked: "⛔",
      locked: "🔒",
      unlocked: "🔓",
      cleared: "🗑️",
    };
    return icons[type] || "•";
  };

  const getActivityText = (type) => {
    const texts = {
      joined: "joined the room",
      left: "left the room",
      kicked: "was removed",
      locked: "locked the room",
      unlocked: "unlocked the room",
      cleared: "cleared the board",
    };
    return texts[type] || type;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative select-none">
      {/* ── Floating Reactions ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: "90vh", scale: 0.5 }}
              animate={{ opacity: 0, y: "10vh", scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute flex flex-col items-center gap-1"
              style={{ left: `${r.x}%` }}
            >
              <span className="text-3xl">{r.emoji}</span>
              <span className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full">
                {r.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Floating Chat Messages ─────────────────────────── */}
      <div
        className="absolute pointer-events-none z-20 overflow-hidden"
        style={{ bottom: "80px", left: "70px", width: "280px" }}
      >
        <AnimatePresence>
          {floatingMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              <div className="bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-2xl inline-block max-w-xs">
                <span className="font-semibold text-primary">{m.sender}: </span>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Live Cursors ──────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {Object.entries(cursors).map(([userId, cursor]) => (
          <div
            key={userId}
            className="absolute transition-all duration-75"
            style={{ left: cursor.x + 56, top: cursor.y }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M0 0L0 11.5L3.5 8.5L6 14L8 13L5.5 7.5L10 7.5L0 0Z"
                fill="#7c3aed"
              />
            </svg>
            <span className="text-xs bg-violet-600 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap -ml-1 mt-1 block">
              {cursor.username}
            </span>
          </div>
        ))}
      </div>

      {/* ── Desktop Toolbar ───────────────────────────────── */}
      <div
        ref={toolbarOnboardRef}
        className="hidden md:flex flex-col gap-1.5 p-2 border-r bg-muted w-14 items-center py-4 z-10 shrink-0 overflow-y-auto"
      >
        {/* Draw */}
        <Button
          size="icon"
          variant={activeTool === "draw" ? "default" : "outline"}
          onClick={() => handleToolSelect("draw")}
          title="Draw (D)"
        >
          ✏️
        </Button>

        {/* Erase */}
        <Button
          size="icon"
          variant={activeTool === "erase" ? "default" : "outline"}
          onClick={() => handleToolSelect("erase")}
          title="Erase (E)"
        >
          🧹
        </Button>

        {/* Shapes */}
        <div className="relative">
          <Button
            size="icon"
            variant={activeTool === "shape" ? "default" : "outline"}
            onClick={() => setShowShapeMenu((p) => !p)}
            title="Shapes (S)"
          >
            {SHAPES.find((s) => s.id === activeShape)?.label || "⬜"}
          </Button>
          {showShapeMenu && (
            <div className="absolute left-12 top-0 bg-background border rounded-lg shadow-lg p-1 flex flex-col gap-1 z-50">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleShapeSelect(s.id)}
                  className={`w-8 h-8 rounded text-base hover:bg-muted flex items-center justify-center ${
                    activeShape === s.id ? "bg-primary/20" : ""
                  }`}
                  title={s.id}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text */}
        <Button
          size="icon"
          variant={activeTool === "text" ? "default" : "outline"}
          onClick={() => handleToolSelect("text")}
          title="Text tool"
        >
          T
        </Button>

        {/* Image upload */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          🖼️
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Sticky note */}
        <Button
          size="icon"
          variant={showStickyForm ? "default" : "outline"}
          onClick={() => setShowStickyForm((p) => !p)}
          title="Sticky note"
        >
          📝
        </Button>

        <div className="w-full h-px bg-border my-1" />

        {/* Color */}
        <input
          type="color"
          value={activeColor}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-2 border-muted-foreground"
          title="Color"
        />

        {/* Size */}
        <input
          type="range"
          min="1"
          max="20"
          value={activeSize}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="w-10 rotate-90 my-5"
          title="Brush size"
        />

        <div className="w-full h-px bg-border my-1" />

        {/* Undo */}
        <Button
          size="icon"
          variant="outline"
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
        >
          ↩️
        </Button>

        {/* Reset zoom */}
        <Button
          size="icon"
          variant="outline"
          onClick={resetZoom}
          title="Reset zoom (Ctrl+0)"
        >
          🔍
        </Button>

        {/* Export */}
        <Button
          size="icon"
          variant="outline"
          onClick={handleExport}
          title="Export PNG"
        >
          📥
        </Button>

        {/* Clear — host only */}
        {isHost && (
          <Button
            size="icon"
            variant="destructive"
            onClick={handleClear}
            title="Clear board"
          >
            🗑️
          </Button>
        )}

        {/* Theme */}
        <Button
          size="icon"
          variant="outline"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </Button>
      </div>

      {/* ── Canvas Area ───────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <p className="text-muted-foreground animate-pulse">
              Connecting to room...
            </p>
          </div>
        )}

        {/* Main canvas */}
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="bg-white cursor-crosshair block absolute top-0 left-0"
        />

        {/* Preview canvas */}
        <canvas
          ref={previewCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute top-0 left-0 pointer-events-none"
        />

        {/* Sticky Notes */}
        {stickyNotes.map((note) => (
          <div
            key={note.id}
            className="absolute w-48 min-h-24 rounded-lg shadow-lg p-3 cursor-move z-20 group"
            style={{ left: note.x, top: note.y, backgroundColor: note.color }}
            onMouseDown={(e) => handleStickyMouseDown(e, note)}
          >
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words select-none">
              {note.text}
            </p>
            <p className="text-xs text-gray-500 mt-2">{note.username}</p>
            <button
              onClick={() => handleDeleteSticky(note.id)}
              className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Sticky note form */}
        <AnimatePresence>
          {showStickyForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-background border rounded-xl shadow-xl p-4 z-30 w-72"
            >
              <p className="text-sm font-semibold mb-2">Add sticky note</p>
              <textarea
                value={stickyText}
                onChange={(e) => setStickyText(e.target.value)}
                placeholder="Type your note..."
                className="w-full text-sm border rounded p-2 h-20 resize-none bg-background outline-none focus:ring-1 ring-primary"
                autoFocus
              />
              <div className="flex gap-1 my-2 flex-wrap">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStickyColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      stickyColor === c
                        ? "border-gray-800 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStickyForm(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSticky}>
                  Add
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction bar */}
        <div
          ref={reactionOnboardRef}
          className="absolute bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-background/90 backdrop-blur border rounded-full px-3 py-1.5 shadow-lg z-10"
        >
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
          <div className="w-px bg-border mx-1" />
          <button
            onClick={handleRaiseHand}
            className={`text-xl hover:scale-125 transition-transform ${
              myHandRaised ? "animate-bounce" : ""
            }`}
            title="Raise hand"
          >
            🖐
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="hidden md:block absolute top-3 left-3 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded-lg border">
          D=Draw · E=Erase · S=Shape · T=Chat · C=Panel · Ctrl+Z=Undo ·
          Ctrl+Scroll=Zoom
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────────────── */}
      <div
        ref={panelOnboardRef}
        className={`border-l flex flex-col transition-all duration-300 shrink-0 fixed md:relative right-0 top-0 h-full bg-background z-30 ${
          chatOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        {/* Users */}
        <div className="p-3 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">
              ONLINE — {users.length}
            </p>
            {isLocked && (
              <span className="text-xs text-yellow-600 font-medium">🔒</span>
            )}
          </div>

          {users.map((u) => (
            <div
              key={u.socketId}
              className="flex items-center gap-2 py-1 group"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-sm flex-1 truncate">
                {u.username}
                {u.raisedHand && " 🖐"}
              </span>
              {u.role === "host" && (
                <span className="text-xs bg-primary text-primary-foreground px-1 rounded">
                  host
                </span>
              )}
              {isHost && u.userId?.toString() !== user?._id?.toString() && (
                <button
                  onClick={() => handleKick(u.userId, u.username)}
                  className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div className="mt-3 space-y-1">
            <button
              onClick={copyRoomId}
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground font-mono bg-muted px-2 py-1 rounded flex items-center justify-between"
            >
              <span>{roomId}</span>
              <span>📋</span>
            </button>
            <button
              onClick={copyInviteLink}
              className="w-full text-xs text-primary hover:underline text-left"
            >
              🔗 Copy invite link
            </button>
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="p-3 border-b shrink-0 flex flex-col gap-1">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              HOST CONTROLS
            </p>
            <Button
              size="sm"
              variant="outline"
              className="justify-start text-xs"
              onClick={handleToggleLock}
            >
              {isLocked ? "🔓 Unlock Room" : "🔒 Lock Room"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="justify-start text-xs"
              onClick={handleEndRoom}
            >
              ⏹ End Session
            </Button>
          </div>
        )}

        {/* Leave */}
        <div className="p-3 border-b shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs text-destructive border-destructive hover:bg-destructive hover:text-white"
            onClick={handleLeave}
          >
            🚪 Leave Room
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 text-xs py-2 font-medium transition-colors ${
              activeTab === "chat"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 text-xs py-2 font-medium transition-colors ${
              activeTab === "activity"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📋 Activity
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
              {chat.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  No messages yet
                </p>
              ) : (
                chat.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-primary">
                      {msg.senderName}:{" "}
                    </span>
                    <span className="text-foreground">{msg.message}</span>
                  </div>
                ))
              )}
              {typingUsers.length > 0 && (
                <p className="text-xs text-muted-foreground italic">
                  {typingUsers.join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing...
                </p>
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="p-2 border-t flex gap-1 shrink-0">
              <input
                ref={messageInputRef}
                value={message}
                onChange={handleTyping}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Message... (T)"
                className="flex-1 text-sm border rounded px-2 py-1 bg-background outline-none focus:ring-1 ring-primary"
              />
              <Button size="sm" onClick={handleSendMessage}>
                →
              </Button>
            </div>
          </>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
            {activityLog.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-4">
                No activity yet
              </p>
            ) : (
              [...activityLog].reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 mt-0.5">
                    {getActivityIcon(entry.type)}
                  </span>
                  <div>
                    <span className="font-medium">{entry.username}</span>
                    <span className="text-muted-foreground ml-1">
                      {getActivityText(entry.type)}
                    </span>
                    <p className="text-muted-foreground/60 mt-0.5">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Toggle panel button */}
      <button
        onClick={() => setChatOpen((p) => !p)}
        className="hidden md:block absolute top-1/2 -translate-y-1/2 bg-muted border rounded-l-lg px-1 py-3 text-xs hover:bg-accent transition-colors z-20"
        style={{ right: chatOpen ? "256px" : "0px" }}
      >
        {chatOpen ? "›" : "‹"}
      </button>

      {/* ── Mobile Toolbar ────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-background border-t px-2 py-2 z-40">
        <button
          onClick={() => handleToolSelect("draw")}
          className={`text-xl p-2 rounded-lg ${
            activeTool === "draw" ? "bg-primary/20" : ""
          }`}
        >
          ✏️
        </button>
        <button
          onClick={() => handleToolSelect("erase")}
          className={`text-xl p-2 rounded-lg ${
            activeTool === "erase" ? "bg-primary/20" : ""
          }`}
        >
          🧹
        </button>
        <button
          onClick={() => handleToolSelect("shape")}
          className={`text-xl p-2 rounded-lg ${
            activeTool === "shape" ? "bg-primary/20" : ""
          }`}
        >
          ⬜
        </button>
        <input
          type="color"
          value={activeColor}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <button onClick={handleUndo} className="text-xl p-2 rounded-lg">
          ↩️
        </button>
        <button
          onClick={() => setChatOpen((p) => !p)}
          className="text-xl p-2 rounded-lg"
        >
          💬
        </button>
        <button onClick={handleLeave} className="text-xl p-2 rounded-lg">
          🚪
        </button>
      </div>
      {/* Room Onboarding */}
      {onboardStep && connected && (
        <OnboardingTooltip
          step={onboardStep}
          total={ROOM_TOTAL}
          title={ROOM_STEPS[onboardStep - 1].title}
          description={ROOM_STEPS[onboardStep - 1].description}
          position={ROOM_STEPS[onboardStep - 1].position}
          targetRef={ROOM_STEPS[onboardStep - 1].ref}
          onNext={() => onboardNext(ROOM_TOTAL)}
          onSkip={onboardSkip}
        />
      )}
    </div>
  );
}
