import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import roomService from "../services/roomService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [joinId, setJoinId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await roomService.getMyRooms();
      setRooms(res.data.data);
      console.log("[Dashboard] Rooms fetched:", res.data.data.length);
    } catch (err) {
      console.error("[Dashboard] Failed to fetch rooms:", err.message);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await roomService.createRoom({
        name: createName,
        password: createPassword || null,
      });
      const newRoom = res.data.data;
      console.log("[Dashboard] Room created:", newRoom.roomId);
      setDialogOpen(false);
      setCreateName("");
      setCreatePassword("");
      navigate(`/room/${newRoom.roomId}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      await roomService.joinRoom(
        joinId.trim().toUpperCase(),
        joinPassword || null,
      );
      console.log("[Dashboard] Joined room:", joinId);
      navigate(`/room/${joinId.trim().toUpperCase()}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || "Room not found");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col p-4 shrink-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">⬜ Whiteboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time collaboration
          </p>
        </div>

        <Separator className="mb-4" />

        <nav className="flex flex-col gap-1 flex-1">
          <Button variant="secondary" className="justify-start gap-2">
            🏠 Dashboard
          </Button>
        </nav>

        <Separator className="my-4" />

        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>
              {user?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 mb-2"
          onClick={toggleTheme}
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          🚪 Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, {user?.username} 👋
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Create a new board or jump back into an existing one.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">+ New Board</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a new board</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="roomName">Board name</Label>
                  <Input
                    id="roomName"
                    placeholder="e.g. Sprint Planning, Design Review"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="roomPassword">
                    Password{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="roomPassword"
                    type="password"
                    placeholder="Leave empty for open room"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                  />
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create Board"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Join by ID */}
        <div className="bg-muted/50 rounded-xl p-5 mb-8 border">
          <h3 className="font-semibold mb-1">Join a board</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Enter a board ID shared by someone else.
          </p>
          <form
            onSubmit={handleJoinRoom}
            className="flex flex-col gap-2 max-w-sm"
          >
            <Input
              placeholder="Board ID e.g. A3F9B2C1"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            />
            <Input
              type="password"
              placeholder="Password (if required)"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={joinLoading}
              className="self-start"
            >
              {joinLoading ? "Joining..." : "Join Board"}
            </Button>
          </form>
          {joinError && (
            <p className="text-sm text-destructive mt-2">{joinError}</p>
          )}
        </div>

        {/* My Rooms */}
        <div>
          <h3 className="font-semibold mb-4">My Boards</h3>

          {loadingRooms ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-xl">
              <p className="text-4xl mb-3">⬜</p>
              <p className="font-medium">No boards yet</p>
              <p className="text-sm mt-1">
                Create your first board to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  currentUserId={user?._id}
                  onClick={() => navigate(`/room/${room.roomId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RoomCard({ room, currentUserId, onClick }) {
  const isHost =
    room.createdBy?._id === currentUserId ||
    room.participants?.some((p) => p.userId === currentUserId && p.role === "host");

  return (
    <button
      onClick={onClick}
      className="text-left border rounded-xl overflow-hidden hover:border-primary hover:shadow-md transition-all bg-background group w-full"
    >
      {/* Thumbnail */}
      <div className="w-full h-32 bg-muted flex items-center justify-center overflow-hidden border-b">
        {room.thumbnail ? (
          <img
            src={room.thumbnail}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-4xl opacity-30">⬜</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="font-semibold truncate group-hover:text-primary transition-colors flex-1">
            {room.name}
          </p>
          <div className="flex gap-1 ml-2 shrink-0">
            {isHost && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Host
              </span>
            )}
            {room.isLocked && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                🔒
              </span>
            )}
            {room.hasPassword && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                🔑
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">{room.roomId}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {room.participants?.length} member{room.participants?.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(room.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
    </button>
  );
}
