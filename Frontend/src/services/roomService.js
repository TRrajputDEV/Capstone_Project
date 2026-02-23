import api from "./api.js";

const roomService = {
  createRoom: (data) => api.post("/rooms/create", data),
  joinRoom: (roomId, password = null) =>
    api.post(`/rooms/join/${roomId}`, { password }),
  getMyRooms: () => api.get("/rooms/my-rooms"),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
};

export default roomService;