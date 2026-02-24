import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoomPage from "./pages/RoomPage";
import LandingPage from "./pages/LandingPage"; // <-- NEW IMPORT

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* NEW: Landing Page Route */}
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" /> : <LandingPage />} 
      />
      
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" /> : <RegisterPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <ProtectedRoute>
            <RoomPage />
          </ProtectedRoute>
        }
      />
      
      {/* Catch-all now redirects to Landing Page instead of Dashboard */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}