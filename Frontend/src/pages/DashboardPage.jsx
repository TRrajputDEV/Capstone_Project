import { useState, useEffect } from "react";
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
  const [joinId, setJoinId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [createName, setCreateName] = useState("");
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
      const res = await roomService.createRoom({ name: createName });
      const newRoom = res.data.data;
      console.log("[Dashboard] Room created:", newRoom.roomId);
      setDialogOpen(false);
      setCreateName("");
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
      await roomService.joinRoom(joinId.trim().toUpperCase());
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col p-4 shrink-0">
        {/* Logo */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">⬜ Whiteboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time collaboration</p>
        </div>

        <Separator className="mb-4" />

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          <Button variant="secondary" className="justify-start gap-2">
            🏠 Dashboard
          </Button>
        </nav>

        <Separator className="my-4" />

        {/* User profile */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>
              {user?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
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
            <h2 className="text-2xl font-bold">Welcome back, {user?.username} 👋</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Create a new board or jump back into an existing one.
            </p>
          </div>

          {/* Create Room Button */}
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
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <Input
              placeholder="Enter board ID e.g. A3F9B2C1"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              className="max-w-xs uppercase"
            />
            <Button type="submit" variant="outline" disabled={joinLoading}>
              {joinLoading ? "Joining..." : "Join"}
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
                <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-xl">
              <p className="text-4xl mb-3">⬜</p>
              <p className="font-medium">No boards yet</p>
              <p className="text-sm mt-1">Create your first board to get started</p>
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
  const isHost = room.participants?.some(
    (p) => p.userId === currentUserId && p.role === "host"
  ) || room.createdBy?._id === currentUserId;

  return (
    <button
      onClick={onClick}
      className="text-left border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all bg-background group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">⬜</div>
        {isHost && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Host
          </span>
        )}
      </div>
      <p className="font-semibold truncate group-hover:text-primary transition-colors">
        {room.name}
      </p>
      <p className="text-xs text-muted-foreground mt-1 font-mono">{room.roomId}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">
          {room.participants?.length} member{room.participants?.length !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(room.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          })}
        </span>
      </div>
    </button>
  );
}