import { Room } from "../models/room.model.js";

const SAVE_INTERVAL = 8000;
const saveIntervals = {};

/* =========================
   BATCH SAVE SYSTEM
========================= */

const startBatchSave = (roomId, roomStates) => {
  if (saveIntervals[roomId]) return;

  saveIntervals[roomId] = setInterval(async () => {
    const state = roomStates[roomId];
    if (!state || !state.unsavedChanges) return;

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { strokes: state.strokes, chat: state.chat }
      );

      state.unsavedChanges = false;
      state.lastSavedAt = Date.now();

      console.log(
        `[Batch Save] Room ${roomId} saved. Strokes: ${state.strokes.length}`
      );
    } catch (err) {
      console.error(
        `[Batch Save] Failed for room ${roomId}:`,
        err.message
      );
    }
  }, SAVE_INTERVAL);
};

const stopBatchSave = (roomId) => {
  if (saveIntervals[roomId]) {
    clearInterval(saveIntervals[roomId]);
    delete saveIntervals[roomId];
  }
};

/* =========================
   MAIN SOCKET REGISTRATION
========================= */

export const registerRoomSocket = (io, socket, roomStates) => {
  /* =========================
     JOIN ROOM
  ========================= */

  socket.on("join-room", async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room)
        return socket.emit("error", { message: "Room not found" });

      if (room.isEnded)
        return socket.emit("error", { message: "Room has ended" });

      if (room.isLocked)
        return socket.emit("error", { message: "Room is locked" });

      const isMember = room.participants.find(
        (p) =>
          p.userId.toString() === socket.user._id.toString()
      );

      if (!isMember)
        return socket.emit("error", {
          message: "Not a member of this room",
        });

      if (!roomStates[roomId]) {
        roomStates[roomId] = {
          strokes: room.strokes || [],
          chat: room.chat || [],
          users: [],
          unsavedChanges: false,
          lastSavedAt: Date.now(),
        };
        console.log(
          `[Socket] Room ${roomId} loaded into memory`
        );
      }

      const state = roomStates[roomId];

      const alreadyPresent = state.users.find(
        (u) =>
          u.userId.toString() === socket.user._id.toString()
      );

      if (!alreadyPresent) {
        state.users.push({
          userId: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
          socketId: socket.id,
          role: isMember.role,
        });
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      socket.emit("room-state", {
        strokes: state.strokes,
        chat: state.chat,
      });

      io.to(roomId).emit("presence-update", {
        users: state.users,
      });

      socket.to(roomId).emit("user-joined", {
        username: socket.user.username,
      });

      startBatchSave(roomId, roomStates);
    } catch (err) {
      console.error("join-room error:", err.message);
      socket.emit("error", {
        message: "Failed to join room",
      });
    }
  });

  /* =========================
     DRAW
  ========================= */

  socket.on("draw-stroke", ({ roomId, stroke }) => {
    const state = roomStates[roomId];
    if (!state) return;

    const fullStroke = {
      ...stroke,
      userId: socket.user._id,
      timestamp: Date.now(),
    };

    state.strokes.push(fullStroke);
    state.unsavedChanges = true;

    socket.to(roomId).emit("receive-stroke", {
      stroke: fullStroke,
    });
  });

  /* =========================
     UNDO
  ========================= */

  socket.on("undo", ({ roomId }) => {
    const state = roomStates[roomId];
    if (!state) return;

    for (let i = state.strokes.length - 1; i >= 0; i--) {
      if (
        state.strokes[i].userId?.toString() ===
        socket.user._id.toString()
      ) {
        state.strokes.splice(i, 1);
        break;
      }
    }

    state.unsavedChanges = true;

    io.to(roomId).emit("stroke-undo", {
      strokes: state.strokes,
    });
  });

  /* =========================
     CLEAR BOARD
  ========================= */

  socket.on("clear-board", async ({ roomId }) => {
    const state = roomStates[roomId];
    if (!state) return;

    const room = await Room.findOne({ roomId });
    const participant = room?.participants.find(
      (p) =>
        p.userId.toString() === socket.user._id.toString()
    );

    if (participant?.role !== "host") {
      return socket.emit("error", {
        message: "Only host can clear the board",
      });
    }

    state.strokes = [];
    state.unsavedChanges = true;

    io.to(roomId).emit("board-cleared");
  });

  /* =========================
     CHAT
  ========================= */

  socket.on("send-message", ({ roomId, message }) => {
    const state = roomStates[roomId];
    if (!state || !message?.trim()) return;

    const chatMessage = {
      senderId: socket.user._id,
      senderName: socket.user.username,
      message: message.trim(),
      timestamp: Date.now(),
    };

    state.chat.push(chatMessage);
    state.unsavedChanges = true;

    io.to(roomId).emit("receive-message", {
      message: chatMessage,
    });
  });

  /* =========================
     KICK PARTICIPANT
  ========================= */

  socket.on(
    "kick-participant",
    async ({ roomId, targetUserId }) => {
      const state = roomStates[roomId];
      if (!state) return;

      const room = await Room.findOne({ roomId });

      const requester = room?.participants.find(
        (p) =>
          p.userId.toString() ===
          socket.user._id.toString()
      );

      if (requester?.role !== "host") {
        return socket.emit("error", {
          message:
            "Only host can kick participants",
        });
      }

      const targetUser = state.users.find(
        (u) =>
          u.userId.toString() === targetUserId
      );

      if (!targetUser) return;

      io.to(targetUser.socketId).emit("kicked", {
        message:
          "You have been removed by the host",
      });

      await Room.findOneAndUpdate(
        { roomId },
        {
          $pull: {
            participants: {
              userId: targetUserId,
            },
          },
        }
      );

      state.users = state.users.filter(
        (u) =>
          u.userId.toString() !== targetUserId
      );

      io.to(roomId).emit("presence-update", {
        users: state.users,
      });
    }
  );

  /* =========================
     LOCK / UNLOCK
  ========================= */

  socket.on("toggle-lock", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    const requester = room.participants.find(
      (p) =>
        p.userId.toString() ===
        socket.user._id.toString()
    );

    if (requester?.role !== "host") {
      return socket.emit("error", {
        message:
          "Only host can lock the room",
      });
    }

    room.isLocked = !room.isLocked;
    await room.save();

    io.to(roomId).emit("room-locked", {
      isLocked: room.isLocked,
    });
  });

  /* =========================
     END ROOM
  ========================= */

  socket.on("end-room", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    const requester = room.participants.find(
      (p) =>
        p.userId.toString() ===
        socket.user._id.toString()
    );

    if (requester?.role !== "host") {
      return socket.emit("error", {
        message:
          "Only host can end the room",
      });
    }

    if (roomStates[roomId]) {
      await Room.findOneAndUpdate(
        { roomId },
        {
          strokes:
            roomStates[roomId].strokes,
          chat: roomStates[roomId].chat,
          isEnded: true,
        }
      );
    }

    io.to(roomId).emit("room-ended", {
      message:
        "The host has ended this session",
    });

    stopBatchSave(roomId);
    delete roomStates[roomId];
  });

  /* =========================
     LEAVE / DISCONNECT
  ========================= */

  const handleLeave = async (
    roomId
  ) => {
    const state = roomStates[roomId];
    if (!state) return;

    state.users = state.users.filter(
      (u) => u.socketId !== socket.id
    );

    socket.leave(roomId);

    io.to(roomId).emit("presence-update", {
      users: state.users,
    });

    socket.to(roomId).emit("user-left", {
      username: socket.user.username,
    });

    if (state.users.length === 0) {
      try {
        await Room.findOneAndUpdate(
          { roomId },
          {
            strokes: state.strokes,
            chat: state.chat,
          }
        );
      } catch (err) {
        console.error(
          "Final save failed:",
          err.message
        );
      }

      stopBatchSave(roomId);
      delete roomStates[roomId];
    }
  };

  socket.on("leave-room", ({ roomId }) =>
    handleLeave(roomId)
  );

  socket.on("disconnect", () => {
    if (socket.currentRoom) {
      handleLeave(socket.currentRoom);
    }
  });
};