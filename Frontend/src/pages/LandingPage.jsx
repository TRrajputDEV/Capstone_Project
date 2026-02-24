import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  PenTool, MousePointer2, Sparkles, Layers, 
  Moon, Sun, LayoutTemplate, ArrowRight, Link as LinkIcon,
  Zap, Globe2, ShieldCheck, MonitorSmartphone, GripHorizontal
} from "lucide-react";
import { useTheme } from "../context/ThemeContext"; 

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRef(null);
  const canvasRef = useRef(null); 
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const parallaxFast = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);
  const parallaxSlow = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-[#fde047] selection:text-black relative">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b-2 border-foreground">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer">
            <Layers className="w-8 h-8" strokeWidth={2.5} />
            <span className="text-2xl font-black tracking-tighter uppercase mt-1">Penspace.</span>
          </div>
          
          <div className="flex items-center gap-6 font-semibold text-sm">
            <button
              onClick={toggleTheme}
              className="hover:scale-110 transition-transform p-2 border-2 border-foreground rounded-full shadow-[2px_2px_0px_0px_currentColor] bg-background"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" strokeWidth={2.5}/> : <Moon className="w-5 h-5" strokeWidth={2.5}/>}
            </button>
            <Link to="/login" className="hidden sm:block hover:underline underline-offset-4 uppercase tracking-wider text-xs font-black">
              Log In
            </Link>
            <Link to="/register" className="bg-[#fde047] text-black border-2 border-black px-6 py-2.5 uppercase tracking-widest text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              Open Canvas
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main ref={heroRef} className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center border-b-2 border-foreground overflow-hidden bg-[radial-gradient(#00000033_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:24px_24px]">
        
        {/* Abstract Floating Elements */}
        <motion.div style={{ y: parallaxFast }} className="absolute top-32 left-[5%] hidden lg:block pointer-events-none">
          <div className="w-32 h-32 border-4 border-foreground border-dashed rounded-full animate-[spin_20s_linear_infinite] opacity-30" />
        </motion.div>
        
        <motion.div style={{ y: parallaxSlow }} className="absolute bottom-20 left-[12%] hidden md:flex flex-col items-center pointer-events-none z-20">
          <MousePointer2 className="w-12 h-12 text-foreground fill-background -rotate-12 drop-shadow-[4px_4px_0px_currentColor]" strokeWidth={1.5} />
          <span className="bg-[#93c5fd] text-black border-2 border-black text-[10px] uppercase tracking-widest font-black px-3 py-1 mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Alex_Dev</span>
        </motion.div>

        <motion.div style={{ y: parallaxFast }} className="absolute top-40 right-[12%] hidden md:block pointer-events-none z-20">
          <div className="w-48 h-48 bg-[#fde047] border-2 border-black p-4 text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-6 font-bold text-left leading-snug flex flex-col justify-between">
            <span>"We need to wire the sockets before launch."</span>
            <span className="text-[10px] font-black uppercase opacity-60">Sticky Note</span>
          </div>
        </motion.div>

        <motion.div style={{ y: parallaxSlow }} className="absolute bottom-32 right-[8%] hidden lg:block pointer-events-none">
          <div className="w-24 h-24 bg-[#fca5a5] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-12" />
        </motion.div>

        {/* Core Hero Content */}
        <motion.div style={{ y: yBg, opacity: opacityFade }} className="max-w-5xl mx-auto flex flex-col items-center relative z-10 bg-background/80 backdrop-blur-md p-8 sm:p-16 border-2 border-foreground shadow-[12px_12px_0px_0px_currentColor] rounded-3xl mt-12">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="border-2 border-foreground bg-[#93c5fd] text-black px-5 py-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Sparkles className="w-4 h-4" /> Version 2.0 is Live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[4rem] sm:text-[6rem] md:text-[8rem] font-black tracking-tighter leading-[0.85] mb-8 text-foreground drop-shadow-[4px_4px_0px_currentColor] dark:drop-shadow-none"
          >
            THINK <br /> OUTSIDE.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
            className="text-lg sm:text-xl font-bold max-w-2xl mx-auto mb-12 opacity-80"
          >
            Stop losing ideas in chat threads. Draw, chat, and map out your architecture on an infinite collaborative canvas with zero latency.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
            <Link to="/register" className="group flex items-center gap-4 bg-foreground text-background border-2 border-foreground px-8 py-4 text-xl sm:text-2xl font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_currentColor] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_currentColor] hover:bg-[#fde047] hover:text-black transition-all">
              Start Creating <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Spinning Brutalist Badge */}
        <div className="absolute bottom-10 right-10 hidden xl:flex items-center justify-center animate-[spin_10s_linear_infinite] pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-32 h-32 fill-[#86efac] stroke-black stroke-2 overflow-visible drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <path d="M50 0 L55 45 L100 50 L55 55 L50 100 L45 55 L0 50 L45 45 Z" />
          </svg>
          <span className="absolute font-black text-black text-xs uppercase tracking-widest rotate-45">Free</span>
        </div>
      </main>

      {/* Brutalist Marquee Banner */}
      <div className="w-full bg-[#fca5a5] border-y-2 border-black py-4 overflow-hidden flex whitespace-nowrap -rotate-2 scale-105 shadow-[0px_8px_0px_0px_rgba(0,0,0,1)] relative z-20">
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 20, repeat: Infinity }} className="flex gap-12 text-2xl font-black uppercase tracking-widest text-black">
          <span>Real-Time Sync</span> • <span>Live Cursors</span> • <span>Infinite Canvas</span> • <span>Twitch-Style Chat</span> • <span>Smart Shapes</span> • 
          <span>Real-Time Sync</span> • <span>Live Cursors</span> • <span>Infinite Canvas</span> • <span>Twitch-Style Chat</span> • <span>Smart Shapes</span> • 
        </motion.div>
      </div>

      {/* 01. The Workspace (Interactive Mockup) */}
      <section className="py-32 px-6 overflow-hidden border-b-2 border-foreground bg-muted/30">
        <div className="container mx-auto mb-12 flex flex-col sm:flex-row justify-between items-end gap-6">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter border-b-4 border-foreground inline-block pb-2">01. The Workspace</h2>
          <div className="bg-[#fde047] text-black border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">
            Try Dragging Elements! ↓
          </div>
        </div>
        
        <motion.div 
          ref={canvasRef}
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
          className="w-full max-w-6xl mx-auto border-2 border-foreground rounded-3xl bg-background h-[450px] md:h-[650px] relative shadow-[16px_16px_0px_0px_currentColor] overflow-hidden"
        >
          {/* Mockup Top Bar */}
          <div className="absolute top-0 w-full h-14 border-b-2 border-foreground flex items-center px-6 bg-muted/50 z-20">
            <div className="flex gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-foreground bg-[#fca5a5]" />
              <div className="w-4 h-4 rounded-full border-2 border-foreground bg-[#fde047]" />
              <div className="w-4 h-4 rounded-full border-2 border-foreground bg-[#93c5fd]" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 border-2 border-foreground px-4 py-1 rounded bg-background font-mono font-bold tracking-widest uppercase text-xs shadow-[2px_2px_0px_0px_currentColor]">
              room: PEN-8XF
            </div>
          </div>

          <div className="absolute inset-0 mt-14 bg-[radial-gradient(#00000033_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:24px_24px]">
            {/* Draggable Sticky */}
            <motion.div 
              drag dragConstraints={canvasRef} dragElastic={0.1} whileDrag={{ scale: 1.05, rotate: 0 }}
              initial={{ rotate: -5 }} animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-32 left-[20%] w-56 h-56 bg-[#fde047] p-5 text-black border-2 border-black flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-grab active:cursor-grabbing z-10"
            >
              <span className="font-black text-xl leading-snug block">Connect the frontend UI to the socket logic here.</span>
              <span className="text-[10px] uppercase font-black opacity-60">@developer</span>
            </motion.div>

            {/* Draggable Cursors */}
            <motion.div drag dragConstraints={canvasRef} initial={{ x: 300, y: 100 }} className="absolute flex flex-col items-center z-20 cursor-grab active:cursor-grabbing">
              <MousePointer2 className="w-10 h-10 text-foreground fill-background -rotate-12 drop-shadow-[2px_2px_0px_currentColor]" strokeWidth={1.5} />
              <span className="bg-[#93c5fd] text-black border-2 border-black text-[10px] uppercase tracking-widest font-black px-3 py-1 mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none">You</span>
            </motion.div>

            <motion.div drag dragConstraints={canvasRef} initial={{ x: 700, y: 300 }} animate={{ x: [700, 650, 750, 700], y: [300, 350, 280, 300] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute flex flex-col items-center z-20 cursor-grab active:cursor-grabbing">
              <MousePointer2 className="w-10 h-10 text-foreground fill-background -rotate-12 drop-shadow-[2px_2px_0px_currentColor]" strokeWidth={1.5} />
              <span className="bg-[#fca5a5] text-black border-2 border-black text-[10px] uppercase tracking-widest font-black px-3 py-1 mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none">Guest</span>
            </motion.div>
          </div>

          {/* Wireframe Floating Toolbar */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 border-2 border-foreground bg-background rounded-2xl p-3 flex flex-col items-center gap-4 z-20 shadow-[6px_6px_0px_0px_currentColor]">
            <div className="w-10 h-10 border-2 border-black bg-[#fde047] rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><PenTool className="w-5 h-5 text-black" strokeWidth={2.5}/></div>
            <div className="w-10 h-10 hover:bg-muted rounded flex items-center justify-center cursor-pointer"><LayoutTemplate className="w-5 h-5 text-foreground" strokeWidth={2.5}/></div>
            <div className="w-8 border-t-2 border-foreground opacity-30" />
            <div className="w-6 h-6 border-2 border-foreground rounded-full bg-foreground" />
            <div className="w-6 h-6 border-2 border-foreground rounded-full bg-[#fca5a5]" />
            <div className="w-6 h-6 border-2 border-foreground rounded-full bg-[#93c5fd]" />
          </div>
        </motion.div>
      </section>

      {/* 02. The Flow (SUPERCHARGED) */}
      <section className="py-32 px-6 border-b-2 border-foreground bg-background relative overflow-hidden">
        {/* Animated Background Line connecting the flow */}
        <div className="absolute top-1/2 left-0 w-full h-2 border-t-4 border-dashed border-foreground/20 -translate-y-1/2 hidden md:block" />
        
        <div className="container mx-auto relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter border-b-4 border-foreground inline-block pb-2 mb-20 bg-background pr-4">02. The Flow</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex flex-col gap-6 relative group">
              <div className="w-full aspect-square border-2 border-foreground rounded-3xl flex items-center justify-center bg-background relative overflow-hidden shadow-[8px_8px_0px_0px_currentColor] group-hover:-translate-y-4 group-hover:shadow-[16px_16px_0px_0px_currentColor] transition-all duration-300 z-10 cursor-default">
                {/* Watermark Number */}
                <span className="absolute -bottom-10 -right-4 text-[12rem] font-black text-foreground/5 leading-none pointer-events-none transition-transform group-hover:scale-110 group-hover:-rotate-6">1</span>
                <div className="w-32 h-20 border-2 border-black bg-[#fde047] text-black flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-10">
                  + NEW
                </div>
              </div>
              <div className="bg-background relative z-10">
                <h3 className="text-3xl font-black uppercase tracking-tight mb-2">Insta-Boot</h3>
                <p className="font-bold opacity-70">Click one button to instantly generate a secure, fresh whiteboard room. No setup, no friction.</p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }} className="flex flex-col gap-6 relative group">
              <div className="w-full aspect-square border-2 border-foreground rounded-3xl flex items-center justify-center bg-background relative overflow-hidden shadow-[8px_8px_0px_0px_currentColor] group-hover:-translate-y-4 group-hover:shadow-[16px_16px_0px_0px_currentColor] transition-all duration-300 z-10 cursor-default">
                <span className="absolute -bottom-10 -right-4 text-[12rem] font-black text-foreground/5 leading-none pointer-events-none transition-transform group-hover:scale-110 group-hover:-rotate-6">2</span>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute z-0">
                  <Globe2 className="w-32 h-32 opacity-10" />
                </motion.div>
                <div className="border-2 border-black bg-[#93c5fd] text-black px-6 py-3 font-mono text-sm tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform font-black z-10">
                  penspace.io/room/123
                </div>
              </div>
              <div className="bg-background relative z-10">
                <h3 className="text-3xl font-black uppercase tracking-tight mb-2">Drop The Link</h3>
                <p className="font-bold opacity-70">Send the generated Room ID to your team. They jump in from any browser globally. Zero installs.</p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.4 }} className="flex flex-col gap-6 relative group">
              <div className="w-full aspect-square border-2 border-foreground rounded-3xl flex items-center justify-center bg-background relative overflow-hidden shadow-[8px_8px_0px_0px_currentColor] group-hover:-translate-y-4 group-hover:shadow-[16px_16px_0px_0px_currentColor] transition-all duration-300 z-10 cursor-default">
                <span className="absolute -bottom-10 -right-4 text-[12rem] font-black text-foreground/5 leading-none pointer-events-none transition-transform group-hover:scale-110 group-hover:-rotate-6">3</span>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="w-32 h-32 border-4 border-dashed border-foreground rounded-full relative z-10">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#fca5a5] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                  <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[#86efac] border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                </motion.div>
              </div>
              <div className="bg-background relative z-10">
                <h3 className="text-3xl font-black uppercase tracking-tight mb-2">Sync Minds</h3>
                <p className="font-bold opacity-70">Watch cursors fly. Everything you draw, type, or move syncs in real-time across the globe.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 03. The Toolkit (BRAND NEW BENTO GRID) */}
      <section className="py-32 px-6 border-b-2 border-foreground bg-muted/20">
        <div className="container mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter border-b-4 border-foreground inline-block pb-2 mb-12">03. The Toolkit</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[250px]">
            
            {/* Bento 1: Zero Latency */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="md:col-span-2 border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_currentColor] rounded-3xl flex flex-col justify-between group hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_currentColor] transition-all overflow-hidden relative">
              <Zap className="w-12 h-12 text-[#fde047] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:drop-shadow-none mb-4" strokeWidth={2.5}/>
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-widest mb-1">Zero Latency</h3>
                <p className="font-bold opacity-70">WebSockets engineered for instant cursor and stroke syncing.</p>
              </div>
              {/* Abstract decorative graphic */}
              <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="200" height="200" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="10 10" className="animate-[spin_10s_linear_infinite]" /></svg>
              </div>
            </motion.div>

            {/* Bento 2: Infinite Canvas */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.1 }} className="md:col-span-2 border-2 border-foreground bg-[#93c5fd] text-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl flex flex-col justify-between group hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000000_2px,transparent_2px)] [background-size:16px_16px] group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 flex justify-end">
                 <div className="w-12 h-12 border-2 border-black bg-white rounded flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <GripHorizontal className="w-6 h-6" strokeWidth={3} />
                 </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-widest mb-1">Infinite Space</h3>
                <p className="font-bold opacity-90">Pan and zoom without boundaries. The board grows with your ideas.</p>
              </div>
            </motion.div>

            {/* Bento 3: Full Control */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }} className="md:col-span-3 border-2 border-foreground bg-[#fca5a5] text-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl flex items-center justify-between group hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-widest mb-2">Host Controls</h3>
                <p className="font-bold text-lg opacity-90 max-w-md">Lock rooms, manage participants, and control the environment. You own your canvas.</p>
              </div>
              <ShieldCheck className="w-24 h-24 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] hidden sm:block group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            </motion.div>

            {/* Bento 4: Any Device */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.3 }} className="md:col-span-1 border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_currentColor] rounded-3xl flex flex-col justify-center items-center text-center group hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_currentColor] transition-all">
              <MonitorSmartphone className="w-16 h-16 mb-4 group-hover:-rotate-12 transition-transform" strokeWidth={2} />
              <h3 className="text-xl font-black uppercase tracking-widest">Cross Platform</h3>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Massive CTA Footer */}
      <section className="border-t-2 border-foreground py-32 px-6 overflow-hidden relative bg-foreground text-background">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="container mx-auto flex flex-col items-center text-center relative z-10"
        >
          <h2 className="text-[12vw] font-black uppercase tracking-tighter leading-[0.8] mb-12 text-[#fde047] drop-shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            CLEAR THE <br/> BOARD.
          </h2>
          <Link to="/register" className="bg-background text-foreground border-4 border-background px-12 py-6 text-2xl font-black uppercase tracking-widest hover:bg-[#93c5fd] hover:text-black hover:border-black transition-all hover:-translate-y-2 shadow-[8px_8px_0px_0px_rgba(253,224,71,1)]">
            Create Free Room
          </Link>
        </motion.div>
        
        {/* Background abstract typography pattern */}
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none flex items-center justify-center overflow-hidden mix-blend-overlay">
          <span className="text-[50vw] font-black leading-none whitespace-nowrap text-background">PEN</span>
        </div>
      </section>

    </div>
  );
}