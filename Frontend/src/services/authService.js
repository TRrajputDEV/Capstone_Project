import api from "./api.js";

const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),

  loginWithGoogle: () => {
    return new Promise((resolve, reject) => {
      console.log("[Google OAuth] Opening popup...");
      
      const popup = window.open(
        `${import.meta.env.VITE_BACKEND_ORIGIN}/api/auth/google`,
        "googleAuth",
        "width=500,height=600,left=400,top=100"
      );

      if (!popup) {
        reject(new Error("Popup blocked by browser"));
        return;
      }

      const handler = (event) => {
        console.log("[Google OAuth] Message received:", event.origin, event.data);
        if (event.origin !== import.meta.env.VITE_BACKEND_ORIGIN) return;
        if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
          window.removeEventListener("message", handler);
          clearInterval(timer);
          popup.close();
          console.log("[Google OAuth] Success! Token received.");
          resolve(event.data.accessToken);
        }
      };

      window.addEventListener("message", handler);

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener("message", handler);
          console.log("[Google OAuth] Popup closed by user.");
          reject(new Error("Popup closed"));
        }
      }, 500);
    });
  },
};

export default authService;