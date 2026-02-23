import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";
import useCanvas from "../hooks/useCanvas";
import { Button } from "@/components/ui/button";

const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "😮"];
const REACTION_COLORS = {
  "👍": "#3b82f6", "❤️": "#ef4444", "😂": "#f59e0b",
  "🔥": "#f97316", "👏": "#8b5cf6", "😮": "#06b6d4",
};

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, isReady } = useSocket();

  const [users, setUsers] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  // Chunk C states
  const [cursors, setCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [floatingMessages, setFloatingMessages] = useState([]);
  const [activeTool, setActiveTool] = useState("draw");
  const [activeColor, setActiveColor] = useState("#000000");

  const typingTimeoutRef = useRef(null);
  const chatBottomRef = useRef(null);
  const reactionIdRef = useRef(0);

  const { canvasRef, replayStrokes, drawStroke, setTool, setColor, setSize } =
    useCanvas(socket, roomId);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!socket || !roomId || !isReady) return;

    console.log("[Room] Socket ready, joining room:", roomId);
    socket.emit("join-room", { roomId });

    socket.on("room-state", ({ strokes, chat }) => {
      console.log("[Room] State received. Strokes:", strokes.length);
      replayStrokes(strokes);
      setChat(chat);
      setConnected(true);
    });

    socket.on("receive-stroke", ({ stroke }) => drawStroke(stroke));

    socket.on("stroke-undo", ({ strokes }) => replayStrokes(strokes));

    socket.on("board-cleared", () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    socket.on("presence-update", ({ users }) => {
      setUsers(users);
      const me = users.find(
        (u) => u.userId?.toString() === user?._id?.toString()
      );
      setIsHost(me?.role === "host");
    });

    socket.on("receive-message", ({ message }) => {
      setChat((prev) => [...prev, message]);

      // Floating message bubble
      const id = ++reactionIdRef.current;
      const x = 10 + Math.random() * 60;
      setFloatingMessages((prev) => [...prev, { id, text: message.message, sender: message.senderName, x }]);
      setTimeout(() => {
        setFloatingMessages((prev) => prev.filter((m) => m.id !== id));
      }, 4000);
    });

    // Live cursors
    socket.on("cursor-update", ({ userId, username, x, y }) => {
      setCursors((prev) => ({ ...prev, [userId]: { username, x, y } }));
    });

    // Typing
    socket.on("user-typing", ({ username }) => {
      setTypingUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username]
      );
    });

    socket.on("user-stopped-typing", ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    // Raise hand
    socket.on("hand-raised", ({ username, raisedHand }) => {
      if (raisedHand) {
        const id = ++reactionIdRef.current;
        setFloatingReactions((prev) => [
          ...prev,
          { id, emoji: "🖐", label: `${username} raised hand`, x: 50 },
        ]);
        setTimeout(() => {
          setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
        }, 3000);
      }
    });

    // Reactions
    socket.on("receive-reaction", ({ username, emoji }) => {
      const id = ++reactionIdRef.current;
      const x = 5 + Math.random() * 85;
      setFloatingReactions((prev) => [...prev, { id, emoji, label: username, x }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    socket.on("kicked", ({ message }) => {
      alert(message);
      navigate("/dashboard");
    });

    socket.on("room-ended", ({ message }) => {
      alert(message);
      navigate("/dashboard");
    });

    socket.on("room-locked", ({ isLocked }) => {
      setIsLocked(isLocked);
    });

    socket.on("user-joined", ({ username }) => {
      console.log("[Room] Joined:", username);
    });

    socket.on("user-left", ({ username }) => {
      console.log("[Room] Left:", username);
      // Clean up cursor
      setCursors((prev) => {
        const copy = { ...prev };
        delete copy[username];
        return copy;
      });
    });

    socket.on("error", ({ message }) => {
      console.error("[Room] Error:", message);
      alert(message);
      navigate("/dashboard");
    });

    return () => {
      socket.emit("leave-room", { roomId });
      [
        "room-state", "receive-stroke", "stroke-undo", "board-cleared",
        "presence-update", "receive-message", "cursor-update",
        "user-typing", "user-stopped-typing", "hand-raised",
        "receive-reaction", "kicked", "room-ended", "room-locked",
        "user-joined", "user-left", "error",
      ].forEach((event) => socket.off(event));
    };
  }, [socket, roomId, isReady]);

  // Handlers
  const handleUndo = () => socket.emit("undo", { roomId });
  const handleClear = () => isHost && socket.emit("clear-board", { roomId });
  const handleLeave = () => {
    socket.emit("leave-room", { roomId });
    navigate("/dashboard");
  };
  const handleKick = (targetUserId) => {
    if (confirm("Remove this participant?")) {
      socket.emit("kick-participant", { roomId, targetUserId });
    }
  };
  const handleToggleLock = () => socket.emit("toggle-lock", { roomId });
  const handleEndRoom = () => {
    if (confirm("End this session for everyone?")) {
      socket.emit("end-room", { roomId });
      navigate("/dashboard");
    }
  };
  const handleRaiseHand = () => socket.emit("raise-hand", { roomId });
  const handleReaction = (emoji) => socket.emit("send-reaction", { roomId, emoji });

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
    alert("Room ID copied!");
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    alert("Invite link copied!");
  };

  const handleToolSelect = (t) => {
    setActiveTool(t);
    setTool(t);
  };

  const handleColorChange = (c) => {
    setActiveColor(c);
    setColor(c);
  };

  const myHandRaised = users.find(
    (u) => u.userId?.toString() === user?._id?.toString()
  )?.raisedHand;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">

      {/* Floating Reactions */}
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

      {/* Floating Chat Messages */}
      <div
        className="absolute pointer-events-none z-20 overflow-hidden"
        style={{
          bottom: "80px",
          left: chatOpen ? "56px" : "56px",
          width: "280px",
        }}
      >
        <AnimatePresence>
          {floatingMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, x: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="mb-2 max-w-xs"
            >
              <div className="bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-2xl rounded-bl-sm inline-block">
                <span className="font-semibold text-primary">
                  {m.sender}:{" "}
                </span>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Live Cursors */}
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

      {/* Toolbar */}
      <div className="flex flex-col gap-2 p-2 border-r bg-muted w-14 items-center py-4 z-10 shrink-0">
        <Button
          size="icon"
          variant={activeTool === "draw" ? "default" : "outline"}
          onClick={() => handleToolSelect("draw")}
          title="Draw"
        >
          ✏️
        </Button>
        <Button
          size="icon"
          variant={activeTool === "erase" ? "default" : "outline"}
          onClick={() => handleToolSelect("erase")}
          title="Erase"
        >
          🧹
        </Button>
        <div className="relative">
          <input
            type="color"
            value={activeColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-2 border-muted-foreground"
            title="Color"
          />
        </div>
        <input
          type="range"
          min="1"
          max="20"
          defaultValue="4"
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-10 rotate-90 mt-6 mb-6"
          title="Brush size"
        />
        <div className="mt-auto flex flex-col gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={handleUndo}
            title="Undo"
          >
            ↩️
          </Button>
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
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <p className="text-muted-foreground animate-pulse">
              Connecting to room...
            </p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={window.innerWidth - (chatOpen ? 350 : 86)}
          height={window.innerHeight}
          className="bg-white cursor-crosshair block"
        />

        {/* Reaction bar — bottom of canvas */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-background/90 backdrop-blur border rounded-full px-3 py-1.5 shadow-lg">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform active:scale-95"
              title={emoji}
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
      </div>

      {/* Right Panel */}
      <div
        className={`border-l flex flex-col transition-all duration-300 shrink-0 ${
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
              <span className="text-xs text-yellow-600 font-medium">
                🔒 Locked
              </span>
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
              {isHost &&
                u.userId?.toString() !== user?._id?.toString() && (
                  <button
                    onClick={() => handleKick(u.userId)}
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

        {/* Chat */}
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

        {/* Chat Input */}
        <div className="p-2 border-t flex gap-1 shrink-0">
          <input
            value={message}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Message..."
            className="flex-1 text-sm border rounded px-2 py-1 bg-background outline-none focus:ring-1 ring-primary"
          />
          <Button size="sm" onClick={handleSendMessage}>
            →
          </Button>
        </div>
      </div>

      {/* Toggle chat panel button */}
      <button
        onClick={() => setChatOpen((prev) => !prev)}
        className="absolute top-1/2 -translate-y-1/2 bg-muted border rounded-l-lg px-1 py-3 text-xs hover:bg-accent transition-colors z-20"
        style={{ right: chatOpen ? "256px" : "0px" }}
      >
        {chatOpen ? "›" : "‹"}
      </button>
    </div>
  );
}