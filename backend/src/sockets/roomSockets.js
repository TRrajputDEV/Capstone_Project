import { Room } from "../models/room.model.js";

const SAVE_INTERVAL = 8000;
const saveIntervals = {};

const stopBatchSave = (roomId) => {
  if (saveIntervals[roomId]) {
    clearInterval(saveIntervals[roomId]);
    delete saveIntervals[roomId];
  }
};

const logActivity = (roomStates, roomId, type, username) => {
  if (!roomStates[roomId]) return;
  roomStates[roomId].activityLog = roomStates[roomId].activityLog || [];
  const entry = { type, username, timestamp: Date.now() };
  roomStates[roomId].activityLog.push(entry);
  roomStates[roomId].unsavedChanges = true;
  return entry;
};

const startBatchSave = (io, roomId, roomStates) => {
  if (saveIntervals[roomId]) return;

  saveIntervals[roomId] = setInterval(async () => {
    const state = roomStates[roomId];
    if (!state || !state.unsavedChanges) return;

    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          strokes: state.strokes,
          chat: state.chat,
          stickyNotes: state.stickyNotes || [],
          activityLog: state.activityLog || [],
          thumbnail: state.thumbnail || null,
        }
      );
      state.unsavedChanges = false;
      state.lastSavedAt = Date.now();
      console.log(`[Batch Save] Room ${roomId} saved.`);
    } catch (err) {
      console.error(`[Batch Save] Failed:`, err.message);
    }
  }, SAVE_INTERVAL);
};

export const registerRoomSocket = (io, socket, roomStates) => {

  // JOIN ROOM
  socket.on("join-room", async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return socket.emit("error", { message: "Room not found" });
      if (room.isEnded) return socket.emit("error", { message: "This room has ended" });
      if (room.isLocked) {
        const isMember = room.participants.find(
          (p) => p.userId.toString() === socket.user._id.toString()
        );
        if (!isMember) return socket.emit("error", { message: "Room is locked" });
      }

      const isMember = room.participants.find(
        (p) => p.userId.toString() === socket.user._id.toString()
      );
      if (!isMember) return socket.emit("error", { message: "Not a member of this room" });

      if (!roomStates[roomId]) {
        roomStates[roomId] = {
          strokes: room.strokes || [],
          chat: room.chat || [],
          stickyNotes: room.stickyNotes || [],
          activityLog: room.activityLog || [],
          users: [],
          unsavedChanges: false,
          lastSavedAt: Date.now(),
          thumbnail: room.thumbnail || null,
        };
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
        stickyNotes: roomStates[roomId].stickyNotes || [],
        activityLog: roomStates[roomId].activityLog || [],
      });

      // Log + broadcast activity
      const entry = logActivity(roomStates, roomId, "joined", socket.user.username);
      io.to(roomId).emit("activity-update", { entry });
      io.to(roomId).emit("presence-update", { users: roomStates[roomId].users });
      socket.to(roomId).emit("user-joined", { username: socket.user.username });

      startBatchSave(io, roomId, roomStates);
      console.log(`[Socket] ${socket.user.username} joined ${roomId}`);
    } catch (err) {
      console.error("[Socket] join-room error:", err.message);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // DRAW STROKE
  socket.on("draw-stroke", ({ roomId, stroke }) => {
    if (!roomStates[roomId]) return;
    const fullStroke = { ...stroke, userId: socket.user._id, timestamp: Date.now() };
    roomStates[roomId].strokes.push(fullStroke);
    roomStates[roomId].unsavedChanges = true;
    socket.to(roomId).emit("receive-stroke", { stroke: fullStroke });
  });

  // SAVE THUMBNAIL — called from frontend after drawing
  socket.on("save-thumbnail", ({ roomId, thumbnail }) => {
    if (!roomStates[roomId]) return;
    roomStates[roomId].thumbnail = thumbnail;
    roomStates[roomId].unsavedChanges = true;
    console.log(`[Socket] Thumbnail saved for ${roomId}`);
  });

  // CURSOR MOVE
  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-update", {
      userId: socket.user._id,
      username: socket.user.username,
      x, y,
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
    roomStates[roomId].stickyNotes = [];
    roomStates[roomId].thumbnail = null;
    roomStates[roomId].unsavedChanges = true;

    const entry = logActivity(roomStates, roomId, "cleared", socket.user.username);
    io.to(roomId).emit("board-cleared");
    io.to(roomId).emit("activity-update", { entry });
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

  // TYPING
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
    }
  });

  // REACTION
  socket.on("send-reaction", ({ roomId, emoji }) => {
    io.to(roomId).emit("receive-reaction", {
      userId: socket.user._id,
      username: socket.user.username,
      emoji,
    });
  });

  // STICKY NOTES
  socket.on("add-sticky", ({ roomId, note }) => {
    if (!roomStates[roomId]) return;
    const fullNote = { ...note, userId: socket.user._id, username: socket.user.username };
    roomStates[roomId].stickyNotes = roomStates[roomId].stickyNotes || [];
    roomStates[roomId].stickyNotes.push(fullNote);
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("receive-sticky", { note: fullNote });
  });

  socket.on("update-sticky", ({ roomId, noteId, updates }) => {
    if (!roomStates[roomId]) return;
    const idx = roomStates[roomId].stickyNotes?.findIndex((n) => n.id === noteId);
    if (idx !== -1) {
      roomStates[roomId].stickyNotes[idx] = {
        ...roomStates[roomId].stickyNotes[idx],
        ...updates,
      };
      roomStates[roomId].unsavedChanges = true;
      socket.to(roomId).emit("sticky-updated", { noteId, updates });
    }
  });

  socket.on("delete-sticky", ({ roomId, noteId }) => {
    if (!roomStates[roomId]) return;
    roomStates[roomId].stickyNotes = roomStates[roomId].stickyNotes?.filter(
      (n) => n.id !== noteId
    );
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("sticky-deleted", { noteId });
  });

  // KICK
  socket.on("kick-participant", async ({ roomId, targetUserId }) => {
    const state = roomStates[roomId];
    if (!state) return;
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );
    if (requester?.role !== "host") {
      return socket.emit("error", { message: "Only host can kick" });
    }
    const targetUser = state.users.find(
      (u) => u.userId.toString() === targetUserId
    );
    if (targetUser) {
      io.to(targetUser.socketId).emit("kicked", { message: "Removed by host" });
      await Room.findOneAndUpdate(
        { roomId },
        { $pull: { participants: { userId: targetUserId } } }
      );
      state.users = state.users.filter((u) => u.userId.toString() !== targetUserId);
      const entry = logActivity(roomStates, roomId, "kicked", targetUser.username);
      io.to(roomId).emit("presence-update", { users: state.users });
      io.to(roomId).emit("activity-update", { entry });
    }
  });

  // TOGGLE LOCK
  socket.on("toggle-lock", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );
    if (requester?.role !== "host") {
      return socket.emit("error", { message: "Only host can lock" });
    }
    room.isLocked = !room.isLocked;
    await room.save();
    const type = room.isLocked ? "locked" : "unlocked";
    const entry = logActivity(roomStates, roomId, type, socket.user.username);
    io.to(roomId).emit("room-locked", { isLocked: room.isLocked });
    io.to(roomId).emit("activity-update", { entry });
  });

  // END ROOM
  socket.on("end-room", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );
    if (requester?.role !== "host") {
      return socket.emit("error", { message: "Only host can end" });
    }
    if (roomStates[roomId]) {
      await Room.findOneAndUpdate(
        { roomId },
        {
          strokes: roomStates[roomId].strokes,
          chat: roomStates[roomId].chat,
          stickyNotes: roomStates[roomId].stickyNotes || [],
          activityLog: roomStates[roomId].activityLog || [],
          thumbnail: roomStates[roomId].thumbnail || null,
          isEnded: true,
        }
      );
    }
    io.to(roomId).emit("room-ended", { message: "Host ended the session" });
    stopBatchSave(roomId);
    delete roomStates[roomId];
  });

  // LEAVE
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

  const entry = logActivity(roomStates, roomId, "left", socket.user.username);
  io.to(roomId).emit("presence-update", { users: roomStates[roomId].users });
  io.to(roomId).emit("activity-update", { entry });
  socket.to(roomId).emit("user-left", { username: socket.user.username });

  if (roomStates[roomId].users.length === 0) {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          strokes: roomStates[roomId].strokes,
          chat: roomStates[roomId].chat,
          stickyNotes: roomStates[roomId].stickyNotes || [],
          activityLog: roomStates[roomId].activityLog || [],
          thumbnail: roomStates[roomId].thumbnail || null,
        }
      );
    } catch (err) {
      console.error(`[Socket] Final save failed:`, err.message);
    }
    stopBatchSave(roomId);
    delete roomStates[roomId];
  }
};