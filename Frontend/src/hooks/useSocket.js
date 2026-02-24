import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

// Fallback ensures local dev works even if .env is missing
const SOCKET_URL = import.meta.env.VITE_BACKEND_ORIGIN || "http://localhost:8000";

const useSocket = () => {
  const socketRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!socketInstance) {
      console.log(`[Socket] Connecting to: ${SOCKET_URL}`);
      
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true, // CRITICAL: Must match Axios CORS policy
        transports: ["websocket", "polling"], // Polling fallback prevents connection drops on strict networks
      });
    }

    socketRef.current = socketInstance;

    if (socketInstance.connected) {
      setIsReady(true);
    } else {
      socketInstance.on("connect", () => {
        console.log("[Socket] Connected:", socketInstance.id);
        setIsReady(true);
      });
    }

    socketInstance.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    return () => {
      // Don't kill the global instance on unmount, just remove the local listener
      socketInstance?.off("connect");
    };
  }, []);

  return { socket: socketRef.current, isReady };
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("[Socket] Disconnected");
  }
};

export default useSocket;