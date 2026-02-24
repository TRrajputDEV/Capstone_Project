import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Network, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast({ title: "✅ Account created!" });
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: err.response?.data?.message || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast({ title: "✅ Logged in with Google!" });
      navigate("/dashboard");
    } catch (err) {
      if (err.message !== "Popup closed") {
        toast({ title: "Google login failed", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans selection:bg-[#fde047] selection:text-black">
      
      {/* Left Side: Interactive Illustration Panel */}
      <div className="hidden lg:flex flex-col relative w-1/2 border-r-2 border-foreground bg-foreground/5 overflow-hidden justify-center items-center">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 hover:opacity-70 transition-opacity z-20 font-bold uppercase tracking-widest text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Abstract Wireframe Art - "Connecting Nodes" Theme */}
        <div className="relative w-[400px] h-[400px]">
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100">
            {/* Grid */}
            <path d="M 0 25 L 100 25 M 0 50 L 100 50 M 0 75 L 100 75" fill="none" stroke="currentColor" strokeWidth="0.2" />
            <path d="M 25 0 L 25 100 M 50 0 L 50 100 M 75 0 L 75 100" fill="none" stroke="currentColor" strokeWidth="0.2" />
            
            {/* Connecting lines */}
            <path d="M 25 25 L 75 50 L 50 75 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>

          {/* Animated Nodes (Colored) */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute top-[21%] left-[21%] w-10 h-10 border-2 border-black bg-[#93c5fd] rounded-full flex items-center justify-center z-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Network className="w-5 h-5" />
          </motion.div>

          <div className="absolute top-[46%] right-[21%] w-8 h-8 border-2 border-black bg-[#fca5a5] rounded-full z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
          <div className="absolute bottom-[21%] left-[46%] w-8 h-8 border-4 border-foreground rounded-full bg-background z-10" />

          {/* Floating Sticky (Yellow) */}
          <motion.div 
            animate={{ y: [10, -10, 10], rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 bg-[#fde047] text-black border-2 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20"
          >
            <span className="font-bold text-sm block leading-tight">Join the room.</span>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <Layers className="w-8 h-8" strokeWidth={2.5} />
            <span className="text-2xl font-black tracking-tighter uppercase">PENSPACE.</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase">Join <br/> Penspace.</h1>
            <p className="font-medium opacity-70">Create an account to start building.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-bold uppercase tracking-widest text-xs">Username</Label>
              <Input
                id="username" name="username"
                placeholder="yourname"
                value={form.username} onChange={handleChange} required
                className="rounded-none border-2 border-foreground focus-visible:ring-0 focus-visible:border-[#fde047] h-12 shadow-[4px_4px_0px_0px_currentColor] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold uppercase tracking-widest text-xs">Email</Label>
              <Input
                id="email" name="email" type="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
                className="rounded-none border-2 border-foreground focus-visible:ring-0 focus-visible:border-[#fde047] h-12 shadow-[4px_4px_0px_0px_currentColor] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold uppercase tracking-widest text-xs">Password</Label>
              <Input
                id="password" name="password" type="password"
                placeholder="••••••••"
                value={form.password} onChange={handleChange} required
                className="rounded-none border-2 border-foreground focus-visible:ring-0 focus-visible:border-[#fde047] h-12 shadow-[4px_4px_0px_0px_currentColor] transition-colors"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-none border-2 border-transparent bg-foreground text-background text-md font-bold uppercase tracking-widest hover:translate-y-[2px] hover:translate-x-[2px] transition-transform shadow-[4px_4px_0px_0px_currentColor] hover:shadow-[2px_2px_0px_0px_currentColor] mt-4" 
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
              <span className="bg-background px-4 text-foreground/50">Or sign up with</span>
            </div>
          </div>

          <Button
            type="button" variant="outline"
            className="w-full h-14 rounded-none border-2 border-foreground font-bold hover:bg-[#fde047] hover:text-black transition-colors shadow-[4px_4px_0px_0px_currentColor] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_currentColor]" 
            onClick={handleGoogleLogin}
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>

          <p className="text-center text-sm font-medium mt-8">
            Already have an account?{" "}
            <Link to="/login" className="font-bold uppercase tracking-wide hover:underline underline-offset-4 text-[#93c5fd] dark:text-[#93c5fd] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}