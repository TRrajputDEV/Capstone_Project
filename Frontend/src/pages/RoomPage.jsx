import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";
import useCanvas from "../hooks/useCanvas";
import { Button } from "@/components/ui/button";

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [users, setUsers] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);

  const { canvasRef, replayStrokes, drawStroke, setTool, setColor, setSize } = useCanvas(socket, roomId);

  useEffect(() => {
    if (!socket || !roomId) return;

    console.log("[Room] Joining room:", roomId);
    socket.emit("join-room", { roomId });

    socket.on("room-state", ({ strokes, chat }) => {
      console.log("[Room] State received. Strokes:", strokes.length, "Chat:", chat.length);
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
      console.log("[Room] Presence update:", users.map(u => u.username));
      setUsers(users);
      const me = users.find(u => u.userId?.toString() === user?._id?.toString());
      setIsHost(me?.role === "host");
    });

    socket.on("receive-message", ({ message }) => {
      setChat((prev) => [...prev, message]);
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
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("error");
    };
  }, [socket, roomId]);

  const handleUndo = () => socket.emit("undo", { roomId });
  const handleClear = () => {
    if (isHost) socket.emit("clear-board", { roomId });
  };
  const handleSendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send-message", { roomId, message });
    setMessage("");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 p-2 border-r bg-muted w-14 items-center">
        <Button size="icon" variant="outline" onClick={() => setTool("draw")} title="Draw">✏️</Button>
        <Button size="icon" variant="outline" onClick={() => setTool("erase")} title="Erase">🧹</Button>
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
          className="w-10 rotate-90 mt-6"
          title="Size"
        />
        <div className="mt-auto flex flex-col gap-2">
          <Button size="icon" variant="outline" onClick={handleUndo} title="Undo">↩️</Button>
          {isHost && (
            <Button size="icon" variant="destructive" onClick={handleClear} title="Clear">🗑️</Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <p className="text-muted-foreground">Connecting to room...</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={window.innerWidth - 350}
          height={window.innerHeight}
          className="bg-white cursor-crosshair"
        />
      </div>

      {/* Right panel — presence + chat */}
      <div className="w-64 border-l flex flex-col">
        {/* Users */}
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground mb-2">ONLINE — {users.length}</p>
          {users.map((u) => (
            <div key={u.socketId} className="flex items-center gap-2 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">{u.username}</span>
              {u.role === "host" && (
                <span className="text-xs bg-primary text-primary-foreground px-1 rounded">host</span>
              )}
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {chat.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{msg.senderName}: </span>
              <span className="text-muted-foreground">{msg.message}</span>
            </div>
          ))}
        </div>

        {/* Chat input */}
        <div className="p-2 border-t flex gap-1">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Message..."
            className="flex-1 text-sm border rounded px-2 py-1 bg-background"
          />
          <Button size="sm" onClick={handleSendMessage}>→</Button>
        </div>
      </div>
    </div>
  );
}