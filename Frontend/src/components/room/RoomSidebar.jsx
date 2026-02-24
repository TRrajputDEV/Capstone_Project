import { 
  LogOut, MessageSquare, Activity, X, Copy, Link as LinkIcon, 
  Lock, Unlock, ShieldAlert, UserMinus, ArrowRight
} from "lucide-react";

export default function RoomSidebar({
  panelRef, chatOpen, setChatOpen, users = [], isLocked, isHost, currentUser, handleKick, roomId, copyRoomId, copyInviteLink,
  handleToggleLock, handleEndRoom, handleLeave, activeTab, setActiveTab, chat = [], typingUsers = [], chatBottomRef,
  messageInputRef, message, handleTyping, handleSendMessage, activityLog = []
}) {
  return (
    <div
      ref={panelRef}
      className={`absolute right-6 top-24 bottom-6 w-80 bg-background border-2 border-foreground shadow-[8px_8px_0px_0px_currentColor] rounded-xl flex flex-col z-40 transition-transform duration-300 ease-in-out ${
        chatOpen ? "translate-x-0" : "translate-x-[120%]"
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b-2 border-foreground bg-muted/50 rounded-t-xl">
        <span className="font-black uppercase tracking-widest text-sm">Room Control</span>
        <button onClick={() => setChatOpen(false)} className="hover:scale-110 transition-transform">
          <X className="w-5 h-5" strokeWidth={2.5}/>
        </button>
      </div>

      {/* Users Section */}
      <div className="p-4 border-b-2 border-foreground shrink-0 bg-[#93c5fd] text-black">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black tracking-widest uppercase">
            ONLINE — {users?.length || 0}
          </p>
          {isLocked && <span className="text-[10px] bg-[#fca5a5] border-2 border-black px-1.5 py-0.5 font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Lock className="w-3 h-3"/> LCK</span>}
        </div>

        <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
          {users.map((u) => (
            <div key={u.socketId} className="flex items-center gap-2 group">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-black bg-[#27c93f] shrink-0" />
              <span className="text-sm font-bold flex-1 truncate">
                {u.username} {u.raisedHand && "🖐"}
              </span>
              {u.role === "host" && (
                <span className="text-[10px] bg-[#fde047] border-2 border-black px-1.5 py-0.5 font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  host
                </span>
              )}
              {isHost && u.userId?.toString() !== currentUser?._id?.toString() && (
                <button onClick={() => handleKick(u.userId, u.username)} className="text-black hover:text-red-600 transition-colors" title="Remove">
                  <UserMinus className="w-4 h-4" strokeWidth={2.5}/>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <button onClick={copyRoomId} className="w-full text-left text-xs text-background bg-foreground hover:bg-foreground/80 font-mono font-bold px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between transition-all active:translate-y-[2px] active:shadow-none">
            <span>{roomId}</span><Copy className="w-4 h-4"/>
          </button>
          <button onClick={copyInviteLink} className="w-full text-xs font-black uppercase tracking-widest hover:underline text-left flex items-center gap-2 mt-2">
            <LinkIcon className="w-4 h-4"/> Copy Link
          </button>
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="p-4 border-b-2 border-foreground shrink-0 flex flex-col gap-2 bg-background">
          <p className="text-[10px] font-black tracking-widest uppercase mb-1">HOST CONTROLS</p>
          <button className="flex items-center gap-2 w-full justify-start text-xs rounded-none border-2 border-foreground p-2 font-bold uppercase tracking-widest hover:bg-[#fde047] hover:text-black transition-colors" onClick={handleToggleLock}>
            {isLocked ? <Unlock className="w-4 h-4"/> : <Lock className="w-4 h-4"/>} {isLocked ? "Unlock Room" : "Lock Room"}
          </button>
          <button className="flex items-center gap-2 w-full justify-start text-xs rounded-none border-2 border-foreground p-2 font-bold uppercase tracking-widest hover:bg-[#fca5a5] hover:text-black transition-colors" onClick={handleEndRoom}>
            <ShieldAlert className="w-4 h-4"/> End Session
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b-2 border-foreground shrink-0 bg-muted/30">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex justify-center items-center gap-2 text-xs py-3 font-black uppercase tracking-widest transition-colors border-r-2 border-foreground ${
            activeTab === "chat" ? "bg-foreground text-background" : "hover:bg-foreground/10"
          }`}
        >
          <MessageSquare className="w-4 h-4"/> Chat
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 flex justify-center items-center gap-2 text-xs py-3 font-black uppercase tracking-widest transition-colors ${
            activeTab === "activity" ? "bg-foreground text-background" : "hover:bg-foreground/10"
          }`}
        >
          <Activity className="w-4 h-4"/> Log
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 bg-background">
            {chat.length === 0 ? (
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mt-4">No messages yet</p>
            ) : (
              chat.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="font-black uppercase tracking-wider">{msg.senderName}: </span>
                  <span className="font-medium">{msg.message}</span>
                </div>
              ))
            )}
            {typingUsers.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#93c5fd]">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </p>
            )}
            <div ref={chatBottomRef} />
          </div>
          <div className="p-3 border-t-2 border-foreground flex gap-2 shrink-0 bg-background rounded-b-xl">
            <input
              ref={messageInputRef} value={message} onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="MESSAGE... (T)"
              className="flex-1 text-xs font-bold uppercase tracking-wider border-2 border-foreground rounded-none px-3 py-2 bg-background outline-none focus:border-[#93c5fd] shadow-[2px_2px_0px_0px_currentColor] transition-colors"
            />
            <button onClick={handleSendMessage} className="bg-foreground text-background border-2 border-foreground px-3 font-black hover:bg-[#93c5fd] hover:text-black transition-colors shadow-[2px_2px_0px_0px_currentColor] active:translate-y-[2px] active:shadow-none flex items-center justify-center">
              <ArrowRight className="w-4 h-4" strokeWidth={3}/>
            </button>
          </div>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0 bg-background rounded-b-xl">
          {activityLog.length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mt-4">No activity yet</p>
          ) : (
            [...activityLog].reverse().map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-xs border-b border-foreground/10 pb-2">
                <div>
                  <span className="font-black uppercase tracking-wider">{entry.username}</span>
                  <span className="font-medium ml-1 opacity-80">{entry.type}</span>
                  <p className="font-mono text-[10px] opacity-50 mt-1">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Leave Room Button attached to bottom of panel */}
      <button onClick={handleLeave} className="absolute -bottom-14 right-0 flex items-center justify-center gap-2 bg-background border-2 border-foreground px-4 py-2 font-black uppercase tracking-widest text-xs hover:bg-destructive hover:text-white transition-colors shadow-[4px_4px_0px_0px_currentColor]">
        <LogOut className="w-4 h-4"/> Leave Room
      </button>
    </div>
  );
}