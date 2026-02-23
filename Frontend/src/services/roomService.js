import api from "./api.js";

const roomService = {
  createRoom: (data) => api.post("/rooms/create", data),
  joinRoom: (roomId) => api.post(`/rooms/join/${roomId}`),
  getMyRooms: () => api.get("/rooms/my-rooms"),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
};

export default roomService;