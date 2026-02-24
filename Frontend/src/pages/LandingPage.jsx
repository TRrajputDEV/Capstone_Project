import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  PenTool, MousePointer2, Sparkles, Layers, 
  Moon, Sun, Zap, Users, LayoutTemplate, MessageCircleHeart, 
  ArrowRight, Link as LinkIcon, CheckCircle2, Code2, Paintbrush
} from "lucide-react";
import { useTheme } from "../context/ThemeContext"; 

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-foreground selection:text-background">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/90 backdrop-blur-md z-50 border-b border-foreground/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 hover:opacity-70 transition-opacity cursor-pointer">
            <Layers className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-xl font-black tracking-tighter uppercase">PENSPACE.</span>
          </div>
          
          <div className="flex items-center gap-6 font-semibold text-sm">
            <button
              onClick={toggleTheme}
              className="hover:opacity-70 transition-opacity p-2 border border-foreground rounded-full"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login" className="hidden sm:block hover:underline underline-offset-4 uppercase tracking-wider text-xs font-bold">
              Log In
            </Link>
            <Link to="/register" className="bg-foreground text-background px-6 py-2.5 rounded-full hover:bg-foreground/80 transition-colors uppercase tracking-widest text-xs font-bold shadow-[4px_4px_0px_0px_currentColor] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_currentColor]">
              Open Canvas
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main ref={heroRef} className="relative pt-48 pb-32 px-6 flex flex-col items-center text-center border-b border-foreground">
        <motion.div style={{ y: yBg, opacity: opacityFade }} className="max-w-5xl mx-auto flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="border-2 border-foreground bg-[#93c5fd] text-black rounded-full px-5 py-2 flex items-center gap-2 text-xs sm:text-sm font-mono uppercase tracking-widest font-bold mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            <Sparkles className="w-4 h-4" /> 
            The Digital Whiteboard
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[5rem] sm:text-[8rem] md:text-[11rem] font-black tracking-tighter leading-[0.85] mb-8"
          >
            THINK <br /> OUTSIDE.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg sm:text-2xl font-medium max-w-2xl mx-auto mb-16 opacity-80"
          >
            Stop losing ideas in chat threads. Draw, chat, and map out your thoughts on an infinite canvas with zero latency.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/register" className="group flex items-center gap-4 text-2xl sm:text-3xl font-black uppercase tracking-tight hover:opacity-60 transition-opacity">
              Start Creating <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform text-[#fca5a5]" />
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Infinite Scrolling Marquee Banner */}
      <div className="w-full border-b border-foreground bg-foreground text-background py-5 overflow-hidden flex whitespace-nowrap">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
          className="flex gap-16 text-xl font-black uppercase tracking-widest"
        >
          <span>Real-Time Sync</span> • <span className="text-[#fde047]">Live Cursors</span> • <span>Infinite Canvas</span> • <span className="text-[#93c5fd]">Twitch-Style Chat</span> • <span>Smart Shapes</span> • 
          <span>Real-Time Sync</span> • <span className="text-[#fde047]">Live Cursors</span> • <span>Infinite Canvas</span> • <span className="text-[#93c5fd]">Twitch-Style Chat</span> • <span>Smart Shapes</span> • 
        </motion.div>
      </div>

      {/* The Big Interactive Canvas Illustration */}
      <section className="py-32 px-6 overflow-hidden border-b border-foreground bg-foreground/5">
        <div className="container mx-auto mb-16">
          <h2 className="text-3xl font-black uppercase tracking-tight border-b-2 border-foreground inline-block pb-2">01. The Workspace</h2>
        </div>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
          className="w-full max-w-6xl mx-auto border-2 border-foreground rounded-[2rem] bg-background h-[400px] md:h-[600px] relative shadow-[12px_12px_0px_0px_currentColor]"
        >
          {/* Mockup Top Bar with Brutalist Colors */}
          <div className="absolute top-0 w-full h-14 border-b-2 border-foreground flex items-center px-6 bg-background z-20">
            <div className="flex gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-foreground bg-[#fca5a5]" />
              <div className="w-4 h-4 rounded-full border-2 border-foreground bg-[#fde047]" />
              <div className="w-4 h-4 rounded-full border-2 border-foreground bg-[#93c5fd]" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 border-2 border-foreground px-4 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-foreground text-background">
              room-id: PEN-8XF
            </div>
          </div>

          <div className="absolute inset-0 mt-14 overflow-hidden">
            {/* Interactive Sticky Note (Yellow) */}
            <motion.div 
              initial={{ rotate: -5 }}
              whileInView={{ rotate: 3, y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-32 left-[20%] w-48 h-48 bg-[#fde047] p-5 text-black border-2 border-black flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="font-bold text-lg leading-tight block">
                Connect the frontend UI to the socket logic here.
              </span>
              <span className="text-xs font-mono opacity-80 font-bold">@developer</span>
            </motion.div>

            {/* Animated Cursors */}
            <motion.div 
              animate={{ x: [0, 200, 80, 0], y: [0, -100, 50, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute top-[40%] left-[45%] flex flex-col items-center z-10"
            >
              <MousePointer2 className="w-8 h-8 text-foreground fill-background -rotate-12" strokeWidth={1.5} />
              <span className="bg-[#93c5fd] text-black border-2 border-black text-[10px] uppercase tracking-widest font-black px-3 py-1 mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">You</span>
            </motion.div>

            <motion.div 
              animate={{ x: [0, -150, -50, 0], y: [0, 120, -30, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute top-[60%] left-[70%] flex flex-col items-center z-10"
            >
              <MousePointer2 className="w-8 h-8 text-foreground fill-background -rotate-12" strokeWidth={1.5} />
              <span className="bg-[#fca5a5] text-black border-2 border-black text-[10px] uppercase tracking-widest font-black px-3 py-1 mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Guest</span>
            </motion.div>
          </div>

          {/* Wireframe Floating Toolbar */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 border-2 border-foreground bg-background rounded-full w-14 md:w-16 py-8 flex flex-col items-center gap-8 z-20 shadow-[6px_6px_0px_0px_currentColor]">
            <PenTool className="w-6 h-6 text-foreground" />
            <LayoutTemplate className="w-6 h-6 text-foreground" />
            <div className="w-6 h-6 border-2 border-foreground rounded-sm" />
          </div>
        </motion.div>
      </section>

      {/* How it Works (Step-by-step illustrations) */}
      <section className="py-32 px-6 border-b border-foreground">
        <div className="container mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tight border-b-2 border-foreground inline-block pb-2 mb-16">02. The Flow</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex flex-col gap-6">
              <div className="w-full aspect-square border-2 border-foreground rounded-2xl flex items-center justify-center bg-background relative overflow-hidden group shadow-[6px_6px_0px_0px_currentColor]">
                <div className="w-24 h-16 border-2 border-foreground bg-[#fde047] text-black rounded-lg flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  + NEW
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">1. Spin it up</h3>
                <p className="font-medium opacity-80">Click one button to instantly generate a secure, fresh whiteboard room. No setup required.</p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
              <div className="w-full aspect-square border-2 border-foreground rounded-2xl flex items-center justify-center bg-background relative overflow-hidden group shadow-[6px_6px_0px_0px_currentColor]">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute">
                  <LinkIcon className="w-16 h-16 opacity-20" />
                </motion.div>
                <div className="border-2 border-foreground bg-[#93c5fd] text-black px-4 py-2 font-mono text-sm tracking-widest rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 group-hover:-translate-x-1 transition-transform font-bold">
                  penspace.io/room/123
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">2. Drop the link</h3>
                <p className="font-medium opacity-80">Send the room ID to your team. They can join instantly from any browser, anywhere.</p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.4 }} className="flex flex-col gap-6">
              <div className="w-full aspect-square border-2 border-foreground rounded-2xl flex items-center justify-center bg-background relative overflow-hidden group shadow-[6px_6px_0px_0px_currentColor]">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="w-24 h-24 border-4 border-dashed border-foreground rounded-full relative">
                  <div className="absolute -top-4 -left-4 w-6 h-6 bg-[#fca5a5] border-2 border-foreground rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                  <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-[#fde047] border-2 border-foreground rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                </motion.div>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">3. Sync Minds</h3>
                <p className="font-medium opacity-80">Watch cursors fly. Everything you draw, type, or move syncs in real-time across the globe.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Massive CTA Footer */}
      <section className="border-t border-foreground py-32 px-6 overflow-hidden relative bg-foreground text-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto flex flex-col items-center text-center relative z-10"
        >
          <h2 className="text-[12vw] font-black uppercase tracking-tighter leading-none mb-10 text-[#fde047]">
            CLEAR THE <br/> BOARD.
          </h2>
          <Link to="/register" className="border-4 border-background bg-background text-foreground rounded-full px-12 py-6 text-xl sm:text-2xl font-black uppercase tracking-widest hover:bg-[#93c5fd] transition-all hover:scale-105 shadow-[8px_8px_0px_0px_rgba(253,224,71,1)]">
            Create Free Room
          </Link>
        </motion.div>
        
        {/* Background abstract typography pattern */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex items-center justify-center overflow-hidden">
          <span className="text-[40vw] font-black leading-none whitespace-nowrap">PEN</span>
        </div>
      </section>

    </div>
  );
}