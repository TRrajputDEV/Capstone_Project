import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Welcome, {user?.username} 👋</h1>
      <p className="text-muted-foreground">Dashboard coming in Phase 4</p>
      <Button variant="outline" onClick={logout}>Logout</Button>
    </div>
  );
}