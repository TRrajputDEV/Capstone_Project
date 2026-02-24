import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import roomService from "../services/roomService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "../context/ThemeContext";
import OnboardingTooltip from "../components/onboarding/OnboardingTooltip";
import OnboardingOverlay from "../components/onboarding/OnboardingOverlay";
import { useDashboardOnboarding } from "../hooks/useOnboarding";
import { motion } from "framer-motion";
import { 
  Layers, LogOut, Sun, Moon, Plus, LogIn, 
  LayoutTemplate, MousePointer2, Network, GitMerge, User
} from "lucide-react";

const TOTAL_STEPS = 4;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { step, next, skip } = useDashboardOnboarding();

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [joinId, setJoinId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Onboarding refs
  const welcomeRef = useRef(null);
  const createRef = useRef(null);
  const joinRef = useRef(null);
  const roomsRef = useRef(null);

  const stepRefs = [null, welcomeRef, createRef, joinRef, roomsRef];
  const stepPositions = ["bottom", "bottom", "bottom", "top", "top"];

  const STEPS = [
    {
      title: "Welcome to Penspace! 👋",
      description: "This is your dashboard — your home base for all collaborative boards. Let's take a quick tour.",
    },
    {
      title: "Create a new board",
      description: "Click here to spin up a fresh whiteboard session. You can set a name and optional password.",
    },
    {
      title: "Join a board",
      description: "If someone shares a board ID with you, paste it here to jump straight into their session.",
    },
    {
      title: "Your boards",
      description: "All your active workspaces live here. Thumbnails auto-generate from your drawings!",
    },
  ];

  // Template Data
  const TEMPLATES = [
    { title: "System Architecture", defaultName: "Pixels Architecture", color: "bg-[#93c5fd]", icon: Network },
    { title: "UI Wireframe", defaultName: "Pariksha Interface", color: "bg-[#fde047]", icon: LayoutTemplate },
    { title: "Algorithm Flowchart", defaultName: "LeetCode Logic Flow", color: "bg-[#fca5a5]", icon: GitMerge }
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await roomService.getMyRooms();
      setRooms(res.data.data);
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
      await roomService.joinRoom(joinId.trim().toUpperCase(), joinPassword || null);
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

  const openTemplate = (templateName) => {
    setCreateName(templateName);
    setDialogOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col h-screen bg-foreground/5 text-foreground font-sans overflow-hidden">

      {/* Onboarding */}
      {step && (
        <>
          <OnboardingOverlay targetRef={stepRefs[step]} />
          <OnboardingTooltip
            step={step}
            total={TOTAL_STEPS}
            title={STEPS[step - 1].title}
            description={STEPS[step - 1].description}
            position={stepPositions[step]}
            targetRef={stepRefs[step]}
            onNext={() => next(TOTAL_STEPS)}
            onSkip={skip}
          />
        </>
      )}

      {/* Top Navigation - Replaces Sidebar */}
      <nav className="h-20 border-b-2 border-foreground bg-background px-6 lg:px-12 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8" strokeWidth={2.5} />
          <span className="text-2xl font-black tracking-tighter uppercase mt-1">Penspace.</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <Button
            variant="outline"
            size="icon"
            className="border-2 border-foreground rounded-none h-10 w-10 hover:bg-foreground hover:text-background transition-colors"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <div className="hidden sm:flex items-center gap-3 border-2 border-foreground px-4 py-2 bg-[#fde047] text-black">
            <User className="w-4 h-4" />
            <span className="font-black uppercase tracking-widest text-xs truncate max-w-[150px]">
              {user?.username}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="border-2 border-foreground rounded-none h-10 w-10 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <motion.div 
          className="p-6 md:p-12 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Header & Stats */}
          <motion.div variants={itemVariants} className="mb-12" ref={welcomeRef}>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-6">
              Welcome <br/> Back.
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="border-2 border-foreground bg-foreground text-background px-4 py-2 text-sm font-bold uppercase tracking-widest">
                {rooms.length} Active Boards
              </div>
              <div className="border-2 border-foreground bg-background px-4 py-2 text-sm font-bold uppercase tracking-widest hidden sm:block">
                Workspace: {user?.email}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions & Templates Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
            
            {/* Action: Create Board */}
            <div ref={createRef} className="lg:col-span-4 group border-2 border-foreground bg-background p-6 rounded-xl hover:shadow-[8px_8px_0px_0px_currentColor] transition-all flex flex-col justify-between h-[280px]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">New Board</h3>
                  <p className="text-sm font-medium opacity-70 mt-1">Spin up a fresh canvas.</p>
                </div>
                <div className="w-14 h-14 border-2 border-foreground bg-background flex items-center justify-center rounded-lg group-hover:rotate-6 transition-transform">
                  <LayoutTemplate className="w-7 h-7" strokeWidth={1.5} />
                </div>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-14 rounded-none text-md font-bold uppercase tracking-widest border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-all flex gap-2">
                    <Plus className="w-5 h-5" /> Blank Canvas
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-2 border-foreground rounded-none shadow-[8px_8px_0px_0px_currentColor]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">New Canvas</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateRoom} className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomName" className="font-bold uppercase tracking-widest text-xs">Board name</Label>
                      <Input
                        id="roomName"
                        placeholder="e.g. Architecture Draft"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        className="rounded-none border-foreground h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomPassword" className="font-bold uppercase tracking-widest text-xs">
                        Password <span className="opacity-50">(optional)</span>
                      </Label>
                      <Input
                        id="roomPassword"
                        type="password"
                        placeholder="Leave empty for public"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="rounded-none border-foreground h-12"
                      />
                    </div>
                    {createError && <p className="text-sm text-destructive font-bold">{createError}</p>}
                    <div className="flex gap-4 pt-2">
                      <Button type="submit" disabled={createLoading} className="flex-1 rounded-none h-12 font-bold uppercase tracking-widest bg-foreground text-background">
                        {createLoading ? "Creating..." : "Launch"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Action: Join Board */}
            <div ref={joinRef} className="lg:col-span-4 group border-2 border-foreground bg-background p-6 rounded-xl hover:shadow-[8px_8px_0px_0px_currentColor] transition-all flex flex-col justify-between h-[280px]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Join Board</h3>
                  <p className="text-sm font-medium opacity-70 mt-1">Enter a shared ID.</p>
                </div>
                <div className="w-14 h-14 border-2 border-foreground bg-background flex items-center justify-center rounded-lg group-hover:-rotate-6 transition-transform">
                  <LogIn className="w-7 h-7" strokeWidth={1.5} />
                </div>
              </div>

              <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="ID: 8XF9A2"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                    className="rounded-none border-foreground h-12 font-mono uppercase"
                  />
                  <Input
                    type="password"
                    placeholder="Pass"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="rounded-none border-foreground h-12 w-1/3"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={joinLoading} className="w-full h-12 rounded-none border-2 border-foreground hover:bg-foreground hover:text-background transition-colors font-bold uppercase tracking-widest">
                  {joinLoading ? "Connecting..." : "Connect"}
                </Button>
                {joinError && <p className="text-sm text-destructive font-bold mt-1">{joinError}</p>}
              </form>
            </div>

            {/* Quick Templates List */}
            <div className="lg:col-span-4 border-2 border-foreground bg-background rounded-xl p-6 flex flex-col h-[280px]">
              <h3 className="text-lg font-black uppercase tracking-tight mb-4">Quick Templates</h3>
              <div className="flex flex-col gap-3 flex-1 justify-center">
                {TEMPLATES.map((tmpl, i) => (
                  <button 
                    key={i}
                    onClick={() => openTemplate(tmpl.defaultName)}
                    className="flex items-center gap-4 w-full p-2 hover:bg-foreground/5 transition-colors text-left group"
                  >
                    <div className={`w-10 h-10 border-2 border-foreground ${tmpl.color} flex items-center justify-center rounded shrink-0 group-hover:scale-110 transition-transform`}>
                      <tmpl.icon className="w-5 h-5 text-black" strokeWidth={2} />
                    </div>
                    <span className="font-bold uppercase tracking-wide text-sm">{tmpl.title}</span>
                  </button>
                ))}
              </div>
            </div>

          </motion.div>

          {/* Rooms Grid Section */}
          <motion.div variants={itemVariants} ref={roomsRef}>
            <div className="flex items-center justify-between mb-8 border-b-2 border-foreground pb-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter">My Workspaces</h3>
            </div>

            {loadingRooms ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[240px] border-2 border-foreground/20 bg-muted/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="w-full border-2 border-dashed border-foreground rounded-2xl p-16 flex flex-col items-center text-center bg-background">
                <MousePointer2 className="w-16 h-16 opacity-20 mb-6" strokeWidth={1} />
                <p className="text-3xl font-black uppercase tracking-tight mb-2">Blank Slate</p>
                <p className="font-medium opacity-70">You don't have any active boards yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          </motion.div>

        </motion.div>
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
      className="group flex flex-col text-left border-2 border-foreground bg-background rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_currentColor] transition-all w-full h-[260px]"
    >
      <div className="w-full flex-1 bg-foreground/5 relative overflow-hidden border-b-2 border-foreground flex items-center justify-center">
        {room.thumbnail ? (
          <img
            src={room.thumbnail}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
          />
        ) : (
          <LayoutTemplate className="w-12 h-12 opacity-10" />
        )}
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isHost && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#fde047] text-black border border-black px-2 py-1 shadow-sm">
              Host
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          {room.isLocked && (
            <span className="text-[10px] font-black uppercase bg-[#fca5a5] text-black border border-black px-2 py-1 shadow-sm" title="Locked">
              LCK
            </span>
          )}
          {room.hasPassword && (
            <span className="text-[10px] font-black uppercase bg-[#93c5fd] text-black border border-black px-2 py-1 shadow-sm" title="Password Protected">
              PWD
            </span>
          )}
        </div>
      </div>

      <div className="p-5 w-full bg-background shrink-0">
        <p className="font-black text-lg truncate mb-1 uppercase tracking-tight group-hover:underline underline-offset-4">
          {room.name}
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs font-mono font-bold bg-foreground/10 px-2 py-1 rounded">
            {room.roomId}
          </p>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              {room.participants?.length} User{room.participants?.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              {new Date(room.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}