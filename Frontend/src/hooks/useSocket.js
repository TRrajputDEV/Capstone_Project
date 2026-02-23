import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

const useSocket = () => {
  const socketRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!socketInstance) {
      console.log("[Socket] Initializing...");
      socketInstance = io(import.meta.env.VITE_BACKEND_ORIGIN, {
        auth: { token },
        transports: ["websocket"],
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