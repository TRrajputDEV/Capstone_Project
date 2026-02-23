import { Room } from "../models/room.model.js";

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
        { strokes: state.strokes, chat: state.chat }
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
      if (room.isEnded) return socket.emit("error", { message: "This room has ended" });
      if (room.isLocked) {
        const isMember = room.participants.find(
          (p) => p.userId.toString() === socket.user._id.toString()
        );
        if (!isMember) return socket.emit("error", { message: "Room is locked by the host" });
      }

      const isMember = room.participants.find(
        (p) => p.userId.toString() === socket.user._id.toString()
      );
      if (!isMember) return socket.emit("error", { message: "You are not a member of this room. Join from dashboard first." });

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
          raisedHand: false,
        });
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      socket.emit("room-state", {
        strokes: roomStates[roomId].strokes,
        chat: roomStates[roomId].chat,
      });

      io.to(roomId).emit("presence-update", {
        users: roomStates[roomId].users,
      });

      socket.to(roomId).emit("user-joined", {
        username: socket.user.username,
        userId: socket.user._id,
      });

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
    socket.to(roomId).emit("receive-stroke", { stroke: fullStroke });
  });

  // CURSOR MOVE
  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-update", {
      userId: socket.user._id,
      username: socket.user.username,
      x,
      y,
    });
  });

  // UNDO
  socket.on("undo", ({ roomId }) => {
    if (!roomStates[roomId]) return;

    const strokes = roomStates[roomId].strokes;
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId?.toString() === socket.user._id.toString()) {
        strokes.splice(i, 1);
        break;
      }
    }

    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("stroke-undo", { strokes: roomStates[roomId].strokes });
    console.log(`[Socket] Undo by ${socket.user.username} in ${roomId}`);
  });

  // CLEAR BOARD
  socket.on("clear-board", async ({ roomId }) => {
    if (!roomStates[roomId]) return;

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
    console.log(`[Socket] Board cleared in ${roomId}`);
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

  // TYPING INDICATOR
  socket.on("typing-start", ({ roomId }) => {
    socket.to(roomId).emit("user-typing", { username: socket.user.username });
  });

  socket.on("typing-stop", ({ roomId }) => {
    socket.to(roomId).emit("user-stopped-typing", { username: socket.user.username });
  });

  // RAISE HAND
  socket.on("raise-hand", ({ roomId }) => {
    if (!roomStates[roomId]) return;

    const userInRoom = roomStates[roomId].users.find(
      (u) => u.userId.toString() === socket.user._id.toString()
    );

    if (userInRoom) {
      userInRoom.raisedHand = !userInRoom.raisedHand;
      io.to(roomId).emit("hand-raised", {
        userId: socket.user._id,
        username: socket.user.username,
        raisedHand: userInRoom.raisedHand,
      });
      io.to(roomId).emit("presence-update", { users: roomStates[roomId].users });
      console.log(`[Socket] ${socket.user.username} raised hand: ${userInRoom.raisedHand}`);
    }
  });

  // REACTION
  socket.on("send-reaction", ({ roomId, emoji }) => {
    io.to(roomId).emit("receive-reaction", {
      userId: socket.user._id,
      username: socket.user.username,
      emoji,
    });
    console.log(`[Socket] Reaction ${emoji} from ${socket.user.username}`);
  });

  // KICK PARTICIPANT
  socket.on("kick-participant", async ({ roomId, targetUserId }) => {
    const state = roomStates[roomId];
    if (!state) return;

    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );

    if (requester?.role !== "host") {
      return socket.emit("error", { message: "Only host can kick participants" });
    }

    const targetUser = state.users.find(
      (u) => u.userId.toString() === targetUserId
    );

    if (targetUser) {
      io.to(targetUser.socketId).emit("kicked", {
        message: "You have been removed by the host",
      });

      await Room.findOneAndUpdate(
        { roomId },
        { $pull: { participants: { userId: targetUserId } } }
      );

      state.users = state.users.filter(
        (u) => u.userId.toString() !== targetUserId
      );

      io.to(roomId).emit("presence-update", { users: state.users });
      console.log(`[Socket] ${targetUser.username} kicked from ${roomId}`);
    }
  });

  // TOGGLE LOCK
  socket.on("toggle-lock", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );

    if (requester?.role !== "host") {
      return socket.emit("error", { message: "Only host can lock the room" });
    }

    room.isLocked = !room.isLocked;
    await room.save();

    io.to(roomId).emit("room-locked", { isLocked: room.isLocked });
    console.log(`[Socket] Room ${roomId} locked: ${room.isLocked}`);
  });

  // END ROOM
  socket.on("end-room", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );

    if (requester?.role !== "host") {
      return socket.emit("error", { message: "Only host can end the room" });
    }

    if (roomStates[roomId]) {
      await Room.findOneAndUpdate(
        { roomId },
        {
          strokes: roomStates[roomId].strokes,
          chat: roomStates[roomId].chat,
          isEnded: true,
        }
      );
    }

    io.to(roomId).emit("room-ended", {
      message: "The host has ended this session",
    });

    stopBatchSave(roomId);
    delete roomStates[roomId];
    console.log(`[Socket] Room ${roomId} ended`);
  });

  // LEAVE ROOM
  socket.on("leave-room", ({ roomId }) => {
    handleLeave(io, socket, roomId, roomStates);
  });

  socket.on("disconnect", () => {
    if (socket.currentRoom) {
      handleLeave(io, socket, socket.currentRoom, roomStates);
    }
  });
};

const handleLeave = async (io, socket, roomId, roomStates) => {
  if (!roomStates[roomId]) return;

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
      console.error(`[Socket] Final save failed:`, err.message);
    }
    stopBatchSave(roomId);
    delete roomStates[roomId];
  }
};