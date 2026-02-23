import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketInstance) {
      const token = localStorage.getItem("accessToken");
      console.log("[Socket] Initializing connection...");

      socketInstance = io(import.meta.env.VITE_BACKEND_ORIGIN, {
        auth: { token },
        transports: ["websocket"],
      });

      socketInstance.on("connect", () => {
        console.log("[Socket] Connected:", socketInstance.id);
      });

      socketInstance.on("connect_error", (err) => {
        console.error("[Socket] Connection error:", err.message);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
        socketInstance = null;
      });
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on component unmount — only on logout
    };
  }, []);

  return socketRef.current;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("[Socket] Manually disconnected");
  }
};

export default useSocket;