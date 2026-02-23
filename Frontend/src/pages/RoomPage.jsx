import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";
import useCanvas from "../hooks/useCanvas";
import { Button } from "@/components/ui/button";

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

  const { canvasRef, replayStrokes, drawStroke, setTool, setColor, setSize } =
    useCanvas(socket, roomId);

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

    socket.on("receive-stroke", ({ stroke }) => {
      drawStroke(stroke);
    });

    socket.on("stroke-undo", ({ strokes }) => {
      replayStrokes(strokes);
    });

    socket.on("board-cleared", () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    socket.on("presence-update", ({ users }) => {
      console.log("[Room] Presence:", users.map((u) => u.username));
      setUsers(users);
      const me = users.find(
        (u) => u.userId?.toString() === user?._id?.toString()
      );
      setIsHost(me?.role === "host");
    });

    socket.on("receive-message", ({ message }) => {
      setChat((prev) => [...prev, message]);
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
      console.log("[Room] Lock status:", isLocked);
    });

    socket.on("user-joined", ({ username }) => {
      console.log("[Room] User joined:", username);
    });

    socket.on("user-left", ({ username }) => {
      console.log("[Room] User left:", username);
    });

    socket.on("error", ({ message }) => {
      console.error("[Room] Socket error:", message);
      alert(message);
    });

    return () => {
      socket.emit("leave-room", { roomId });
      socket.off("room-state");
      socket.off("receive-stroke");
      socket.off("stroke-undo");
      socket.off("board-cleared");
      socket.off("presence-update");
      socket.off("receive-message");
      socket.off("kicked");
      socket.off("room-ended");
      socket.off("room-locked");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("error");
    };
  }, [socket, roomId, isReady]);

  const handleUndo = () => socket.emit("undo", { roomId });

  const handleClear = () => {
    if (isHost) socket.emit("clear-board", { roomId });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send-message", { roomId, message });
    setMessage("");
  };

  const handleLeave = () => {
    socket.emit("leave-room", { roomId });
    navigate("/dashboard");
  };

  const handleKick = (targetUserId) => {
    if (confirm("Remove this participant?")) {
      socket.emit("kick-participant", { roomId, targetUserId });
    }
  };

  const handleToggleLock = () => {
    socket.emit("toggle-lock", { roomId });
  };

  const handleEndRoom = () => {
    if (confirm("End this session for everyone?")) {
      socket.emit("end-room", { roomId });
      navigate("/dashboard");
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID copied!");
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    alert("Invite link copied!");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-col gap-2 p-2 border-r bg-muted w-14 items-center py-4">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setTool("draw")}
          title="Draw"
        >
          ✏️
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setTool("erase")}
          title="Erase"
        >
          🧹
        </Button>
        <input
          type="color"
          defaultValue="#000000"
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border"
          title="Color"
        />
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
          className="bg-white cursor-crosshair"
        />
      </div>

      {/* Right Panel */}
      <div
        className={`border-l flex flex-col transition-all duration-300 ${
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
              <span className="text-sm flex-1 truncate">{u.username}</span>
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
                    title="Remove participant"
                  >
                    ✕
                  </button>
                )}
            </div>
          ))}

          {/* Room ID + Invite */}
          <div className="mt-3 space-y-1">
            <button
              onClick={copyRoomId}
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors font-mono bg-muted px-2 py-1 rounded flex items-center justify-between"
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

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {chat.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-4">
              No messages yet
            </p>
          ) : (
            chat.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{msg.senderName}: </span>
                <span className="text-muted-foreground">{msg.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Chat input */}
        <div className="p-2 border-t flex gap-1 shrink-0">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Message..."
            className="flex-1 text-sm border rounded px-2 py-1 bg-background outline-none focus:ring-1 ring-primary"
          />
          <Button size="sm" onClick={handleSendMessage}>
            →
          </Button>
        </div>
      </div>

      {/* Toggle chat button — always visible */}
      <button
        onClick={() => setChatOpen((prev) => !prev)}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-muted border border-r-0 rounded-l-lg px-1 py-3 text-xs hover:bg-accent transition-colors z-20"
        style={{ right: chatOpen ? "256px" : "0px" }}
      >
        {chatOpen ? "›" : "‹"}
      </button>
    </div>
  );
}