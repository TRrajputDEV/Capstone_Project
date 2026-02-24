import { 
  LogOut, MessageSquare, Activity, X, Copy, Link as LinkIcon, 
  Lock, Unlock, ShieldAlert, UserMinus, ArrowRight, Users
} from "lucide-react";

export default function RoomSidebar({
  panelRef, chatOpen, setChatOpen, users = [], isLocked, isHost, currentUser, handleKick, roomId, copyRoomId, copyInviteLink,
  handleToggleLock, handleEndRoom, handleLeave, activeTab, setActiveTab, chat = [], typingUsers = [], chatBottomRef,
  messageInputRef, message, handleTyping, handleSendMessage, activityLog = []
}) {
  if (!chatOpen) return null;

  return (
    <div ref={panelRef} className="fixed right-6 top-24 bottom-6 w-80 sm:w-96 bg-background border-2 border-foreground shadow-[8px_8px_0px_0px_currentColor] rounded-xl flex flex-col z-50 overflow-hidden">
      
      {/* Header & Tabs */}
      <div className="flex flex-col border-b-2 border-foreground bg-muted/30">
        <div className="flex justify-between items-center p-3 border-b-2 border-foreground bg-background">
          <span className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#fde047] border-2 border-black inline-block" /> Control Hub
          </span>
          <button onClick={() => setChatOpen(false)} className="hover:bg-destructive hover:text-white border-2 border-transparent hover:border-foreground p-1 rounded transition-colors">
            <X className="w-5 h-5" strokeWidth={2.5}/>
          </button>
        </div>
        <div className="flex">
          <button onClick={() => setActiveTab("chat")} className={`flex-1 flex justify-center items-center gap-2 text-[10px] py-3 font-black uppercase tracking-widest transition-colors border-r-2 border-foreground ${activeTab === "chat" ? "bg-foreground text-background" : "hover:bg-foreground/10"}`}><MessageSquare className="w-4 h-4"/> Chat</button>
          <button onClick={() => setActiveTab("users")} className={`flex-1 flex justify-center items-center gap-2 text-[10px] py-3 font-black uppercase tracking-widest transition-colors border-r-2 border-foreground ${activeTab === "users" ? "bg-foreground text-background" : "hover:bg-foreground/10"}`}><Users className="w-4 h-4"/> Users</button>
          <button onClick={() => setActiveTab("activity")} className={`flex-1 flex justify-center items-center gap-2 text-[10px] py-3 font-black uppercase tracking-widest transition-colors ${activeTab === "activity" ? "bg-foreground text-background" : "hover:bg-foreground/10"}`}><Activity className="w-4 h-4"/> Log</button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-background flex flex-col">
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3">
              {chat.length === 0 ? <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mt-auto mb-auto opacity-50">Say something...</p> : chat.map((msg, i) => (
                <div key={i} className="text-sm bg-muted/20 p-2 border-2 border-transparent hover:border-foreground/20 rounded">
                  <span className="font-black uppercase tracking-wider text-[#93c5fd] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] dark:drop-shadow-none">{msg.senderName}: </span>
                  <span className="font-medium">{msg.message}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <div className="pt-3 border-t-2 border-foreground/10 flex gap-2 shrink-0">
              <input ref={messageInputRef} value={message} onChange={handleTyping} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} placeholder="MESSAGE..." className="flex-1 text-xs font-bold uppercase tracking-wider border-2 border-foreground rounded-none px-3 py-2 bg-background outline-none focus:border-[#93c5fd] shadow-[2px_2px_0px_0px_currentColor] transition-colors" />
              <button onClick={handleSendMessage} className="bg-foreground text-background border-2 border-foreground px-3 font-black hover:bg-[#93c5fd] hover:text-black transition-colors shadow-[2px_2px_0px_0px_currentColor] active:translate-y-[2px] active:shadow-none flex items-center justify-center"><ArrowRight className="w-4 h-4" strokeWidth={3}/></button>
            </div>
          </div>
        )}
        {activeTab === "users" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between mb-4 border-b-2 border-foreground pb-2">
                <p className="text-xs font-black tracking-widest uppercase">Online ({users?.length || 0})</p>
                {isLocked && <span className="text-[10px] bg-[#fca5a5] border-2 border-black px-1.5 py-0.5 font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"><Lock className="w-3 h-3"/> LCK</span>}
              </div>
              {users.map((u) => (
                <div key={u.socketId} className="flex items-center gap-3 group">
                  <div className="w-3 h-3 rounded-full border-2 border-black bg-[#27c93f] shrink-0" />
                  <span className="text-sm font-bold flex-1 truncate">{u.username} {u.raisedHand && "🖐"}</span>
                  {u.role === "host" && <span className="text-[10px] bg-[#fde047] border-2 border-black px-1.5 py-0.5 font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">host</span>}
                  {isHost && u.userId?.toString() !== currentUser?._id?.toString() && (
                    <button onClick={() => handleKick(u.userId, u.username)} className="text-black hover:text-red-600 transition-colors" title="Remove"><UserMinus className="w-4 h-4" strokeWidth={2.5}/></button>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t-2 border-foreground bg-muted/30 flex flex-col gap-2">
              <button onClick={copyRoomId} className="w-full text-left text-xs text-background bg-foreground hover:bg-foreground/80 font-mono font-bold px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between transition-all active:translate-y-[2px] active:shadow-none"><span>{roomId}</span><Copy className="w-4 h-4"/></button>
              <button onClick={copyInviteLink} className="w-full text-xs font-black uppercase tracking-widest hover:underline text-left flex items-center gap-2 justify-center py-2"><LinkIcon className="w-4 h-4"/> Copy Link</button>
            </div>
          </div>
        )}
        {activeTab === "activity" && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {activityLog.length === 0 ? <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mt-auto mb-auto">No activity yet</p> : [...activityLog].reverse().map((entry, i) => (
              <div key={i} className="flex flex-col text-xs border-l-2 border-foreground pl-3 py-1">
                <span className="font-black uppercase tracking-wider">{entry.username}</span>
                <span className="font-medium opacity-80">{entry.type}</span>
                <span className="font-mono text-[10px] opacity-40 mt-1">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔴 FIXED: Persistent Host Controls and Leave Room button pinned to the absolute bottom! 🔴 */}
      <div className="border-t-2 border-foreground bg-background p-3 shrink-0 flex flex-col gap-2">
        {isHost && (
          <div className="flex gap-2">
            <button className="flex-1 flex justify-center items-center gap-1 text-[10px] border-2 border-foreground py-2 font-bold uppercase tracking-widest hover:bg-[#fde047] hover:text-black transition-colors shadow-[2px_2px_0px_0px_currentColor]" onClick={handleToggleLock}>
              {isLocked ? <Unlock className="w-3 h-3"/> : <Lock className="w-3 h-3"/>} {isLocked ? "Unlock" : "Lock"}
            </button>
            <button className="flex-1 flex justify-center items-center gap-1 text-[10px] border-2 border-foreground py-2 font-bold uppercase tracking-widest hover:bg-[#fca5a5] hover:text-black transition-colors shadow-[2px_2px_0px_0px_currentColor]" onClick={handleEndRoom}>
              <ShieldAlert className="w-3 h-3"/> End
            </button>
          </div>
        )}
        <button onClick={handleLeave} className="w-full flex items-center justify-center gap-2 bg-background border-2 border-foreground py-2 font-black uppercase tracking-widest text-xs hover:bg-destructive hover:text-white transition-colors shadow-[2px_2px_0px_0px_currentColor]">
          <LogOut className="w-4 h-4"/> Leave Room
        </button>
      </div>

    </div>
  );
}