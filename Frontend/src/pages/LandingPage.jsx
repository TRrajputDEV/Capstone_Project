import { Link } from "react-router-dom";
import { 
  PenTool, MousePointer2, Sparkles, Layers, 
  Moon, Sun, Zap, Users, LayoutTemplate, MessageCircleHeart
} from "lucide-react";
import { useTheme } from "../context/ThemeContext"; 

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-2xl font-black tracking-tight">SyncBoard.</span>
        </div>
        
        <div className="flex items-center gap-8 font-semibold text-sm">
          <button
            onClick={toggleTheme}
            className="hover:opacity-70 transition-opacity"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/login" className="hidden sm:block hover:underline underline-offset-4">
            Log In
          </Link>
          <Link to="/register" className="hover:underline underline-offset-4">
            Open Canvas
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center text-center mt-20 px-6">
        
        {/* Pill Badge */}
        <div className="border border-foreground rounded-full px-5 py-2 flex items-center gap-2 text-sm font-medium mb-10">
          <Sparkles className="w-4 h-4" /> 
          Real-time collaboration, reinvented.
        </div>
        
        {/* Hero Text */}
        <h1 className="text-7xl sm:text-8xl md:text-[9rem] font-black tracking-tighter leading-none mb-8">
          Think Outside
        </h1>
        
        <p className="text-lg sm:text-xl font-medium max-w-2xl mx-auto mb-16">
          Infinite space. Zero latency. Draw, chat, and ideate with your team on a canvas that feels like magic.
        </p>

        <Link to="/register" className="font-bold text-lg mb-20 hover:underline underline-offset-4">
          Start Creating
        </Link>

        {/* Canvas Mockup */}
        <div className="w-full max-w-5xl mx-auto border border-foreground rounded-[2rem] bg-background h-[500px] relative overflow-hidden">
          
          {/* Mockup Top Bar */}
          <div className="absolute top-0 w-full h-12 border-b border-foreground flex items-center px-6 bg-background z-20">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 border border-foreground px-4 py-1 rounded text-[10px] font-mono font-bold tracking-widest uppercase">
              room-id: 8XF9A2
            </div>
          </div>

          {/* Canvas Content */}
          <div className="absolute inset-0 mt-12 z-10 overflow-hidden">
            
            {/* SVG Swooshes matching screenshot */}
            <svg className="absolute w-full h-full left-0 top-0 opacity-40" viewBox="0 0 1000 500">
              <path d="M 200 150 Q 300 350 500 250 T 800 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <path d="M 250 400 Q 450 300 600 350 T 900 300" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>

            {/* Square Sticky Note */}
            <div className="absolute top-20 left-[30%] w-40 h-40 bg-[#fde047] p-4 text-black text-left border border-black/10">
              <span className="font-medium text-sm leading-snug block">
                Don't forget the<br/>new UI updates!
              </span>
            </div>

            {/* Cursors */}
            <div className="absolute top-[40%] left-[45%] flex flex-col items-center">
              <MousePointer2 className="w-6 h-6 text-foreground fill-foreground -rotate-12" />
              <span className="text-foreground text-xs font-bold mt-1">You</span>
            </div>

            <div className="absolute top-[55%] left-[65%] flex flex-col items-center opacity-60">
              <MousePointer2 className="w-6 h-6 text-foreground fill-foreground -rotate-12" />
              <span className="text-foreground text-xs font-bold mt-1">Guest</span>
            </div>
          </div>

          {/* Mock Floating Toolbar */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 border border-foreground bg-background rounded-2xl w-14 py-6 flex flex-col items-center gap-8 z-20">
            <PenTool className="w-5 h-5 text-foreground" />
            <div className="w-6 h-6 border-2 border-dashed border-foreground rounded-sm" />
          </div>
        </div>
      </main>

      {/* Full Width Divider matching screenshot */}
      <div className="w-full border-t border-foreground mt-32 mb-24" />

      {/* Features Grid Section */}
      <section className="container mx-auto px-6 pb-32">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Everything you need to build <br className="hidden md:block"/> the next big thing.
          </h2>
          <p className="font-medium text-lg">
            Powerful tools built seamlessly into a distraction-free interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-foreground rounded-[2rem] p-8 flex flex-col">
            <Zap className="w-6 h-6 mb-12" strokeWidth={1.5} />
            <h3 className="text-lg font-bold mb-3">Zero Latency</h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed">
              WebSocket powered sync ensures every stroke and movement is broadcasted instantly.
            </p>
          </div>

          <div className="border border-foreground rounded-[2rem] p-8 flex flex-col">
            <Users className="w-6 h-6 mb-12" strokeWidth={1.5} />
            <h3 className="text-lg font-bold mb-3">Live Multiplayer</h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed">
              Follow your teammates with live cursors, presence indicators, and role management.
            </p>
          </div>

          <div className="border border-foreground rounded-[2rem] p-8 flex flex-col">
            <LayoutTemplate className="w-6 h-6 mb-12" strokeWidth={1.5} />
            <h3 className="text-lg font-bold mb-3">Rich Tools</h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed">
              Freehand drawing, smart shapes, text blocks, and draggable sticky notes.
            </p>
          </div>

          <div className="border border-foreground rounded-[2rem] p-8 flex flex-col">
            <MessageCircleHeart className="w-6 h-6 mb-12" strokeWidth={1.5} />
            <h3 className="text-lg font-bold mb-3">Integrated Chat</h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed">
              Floating chat, real-time emoji reactions, and typing indicators.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}