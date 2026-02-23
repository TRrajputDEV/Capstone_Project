import { Room } from "../models/room.model.js";

// Batched save interval — every 8 seconds
const SAVE_INTERVAL = 8000;
const saveIntervals = {};

const startBatchSave = (io, roomId, roomStates) => {
  if (saveIntervals[roomId]) return;

  saveIntervals[roomId] = setInterval(async () => {
    const state = roomStates[roomId];
    if (!state || !state.unsavedChanges) return;

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { strokes: state.strokes, chat: state.chat },
      );
      state.unsavedChanges = false;
      state.lastSavedAt = Date.now();
      console.log(`[Batch Save] Room ${roomId} saved. Strokes: ${state.strokes.length}`);
    } catch (err) {
      console.error(`[Batch Save] Failed for room ${roomId}:`, err.message);
    }
  }, SAVE_INTERVAL);
};

const stopBatchSave = (roomId) => {
  if (saveIntervals[roomId]) {
    clearInterval(saveIntervals[roomId]);
    delete saveIntervals[roomId];
  }
};

export const registerRoomSocket = (io, socket, roomStates) => {

  // JOIN ROOM
  socket.on("join-room", async ({ roomId }) => {
    try {
      console.log(`[Socket] ${socket.user.username} joining room ${roomId}`);

      const room = await Room.findOne({ roomId });
      if (!room) return socket.emit("error", { message: "Room not found" });

      // Check membership
      const isMember = room.participants.find(
        (p) => p.userId.toString() === socket.user._id.toString()
      );
      if (!isMember) return socket.emit("error", { message: "Not a member of this room" });

      // Init room state in memory if not exists
      if (!roomStates[roomId]) {
        roomStates[roomId] = {
          strokes: room.strokes || [],
          chat: room.chat || [],
          users: [],
          unsavedChanges: false,
          lastSavedAt: Date.now(),
        };
        console.log(`[Socket] Room ${roomId} loaded into memory`);
      }

      // Add user to presence list
      const alreadyPresent = roomStates[roomId].users.find(
        (u) => u.userId.toString() === socket.user._id.toString()
      );
      if (!alreadyPresent) {
        roomStates[roomId].users.push({
          userId: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
          socketId: socket.id,
          role: isMember.role,
        });
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      // Send existing strokes + chat to the joining user
      socket.emit("room-state", {
        strokes: roomStates[roomId].strokes,
        chat: roomStates[roomId].chat,
      });

      // Broadcast updated presence to room
      io.to(roomId).emit("presence-update", {
        users: roomStates[roomId].users,
      });

      // Notify others
      socket.to(roomId).emit("user-joined", {
        username: socket.user.username,
        userId: socket.user._id,
      });

      // Start batch saving
      startBatchSave(io, roomId, roomStates);

      console.log(`[Socket] Room ${roomId} users: ${roomStates[roomId].users.length}`);
    } catch (err) {
      console.error("[Socket] join-room error:", err.message);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // DRAW STROKE
  socket.on("draw-stroke", ({ roomId, stroke }) => {
    if (!roomStates[roomId]) return;

    const fullStroke = {
      ...stroke,
      userId: socket.user._id,
      timestamp: Date.now(),
    };

    roomStates[roomId].strokes.push(fullStroke);
    roomStates[roomId].unsavedChanges = true;

    // Broadcast to everyone else in room
    socket.to(roomId).emit("receive-stroke", { stroke: fullStroke });
  });

  // UNDO
  socket.on("undo", ({ roomId }) => {
    if (!roomStates[roomId]) return;

    const strokes = roomStates[roomId].strokes;

    // Remove last stroke by this user
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId?.toString() === socket.user._id.toString()) {
        strokes.splice(i, 1);
        break;
      }
    }

    roomStates[roomId].unsavedChanges = true;

    // Tell everyone to re-render
    io.to(roomId).emit("stroke-undo", {
      strokes: roomStates[roomId].strokes,
    });

    console.log(`[Socket] Undo by ${socket.user.username} in room ${roomId}`);
  });

  // CLEAR BOARD — host only
  socket.on("clear-board", async ({ roomId }) => {
    if (!roomStates[roomId]) return;

    // Verify host server-side
    const room = await Room.findOne({ roomId });
    const participant = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );

    if (participant?.role !== "host") {
      return socket.emit("error", { message: "Only host can clear the board" });
    }

    roomStates[roomId].strokes = [];
    roomStates[roomId].unsavedChanges = true;

    io.to(roomId).emit("board-cleared");
    console.log(`[Socket] Board cleared by host in room ${roomId}`);
  });

  // SEND MESSAGE
  socket.on("send-message", ({ roomId, message }) => {
    if (!roomStates[roomId] || !message?.trim()) return;

    const chatMessage = {
      senderId: socket.user._id,
      senderName: socket.user.username,
      message: message.trim(),
      timestamp: Date.now(),
    };

    roomStates[roomId].chat.push(chatMessage);
    roomStates[roomId].unsavedChanges = true;

    io.to(roomId).emit("receive-message", { message: chatMessage });
  });

  // LEAVE ROOM
  socket.on("leave-room", ({ roomId }) => {
    handleLeave(io, socket, roomId, roomStates);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (socket.currentRoom) {
      handleLeave(io, socket, socket.currentRoom, roomStates);
    }
  });
};

const handleLeave = async (io, socket, roomId, roomStates) => {
  if (!roomStates[roomId]) return;

  // Remove from presence
  roomStates[roomId].users = roomStates[roomId].users.filter(
    (u) => u.socketId !== socket.id
  );

  socket.leave(roomId);

  io.to(roomId).emit("presence-update", {
    users: roomStates[roomId].users,
  });

  socket.to(roomId).emit("user-left", {
    username: socket.user.username,
  });

  console.log(`[Socket] ${socket.user.username} left room ${roomId}`);

  // If room is empty, save immediately and clean up
  if (roomStates[roomId].users.length === 0) {
    console.log(`[Socket] Room ${roomId} empty. Saving and cleaning up.`);
    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          strokes: roomStates[roomId].strokes,
          chat: roomStates[roomId].chat,
        }
      );
    } catch (err) {
      console.error(`[Socket] Final save failed for room ${roomId}:`, err.message);
    }
    stopBatchSave(roomId);
    delete roomStates[roomId];
  }
};