<div align="center">

<h1>penspace</h1>

<p><strong>Real-time collaborative whiteboard with AI-powered ideation</strong></p>

<img width="1393" height="782" alt="Screenshot From 2026-02-25 12-55-20" src="https://github.com/user-attachments/assets/9fc338c5-807a-4304-b15f-c959c68a3403" />

</div>

---


##  About

**penspace** is a full-stack, real-time collaborative whiteboard built for teams who think visually. Multiple users can join a shared canvas, draw simultaneously, drop sticky notes, place images, and write text — all synced live across every connected device.

It ships with Google OAuth, room-based sessions with host controls, a persistent canvas that survives page reloads, AI-powered ideation via Google Gemini, live cursors, a floating Twitch-style chat, emoji reactions, and a mobile-responsive layout — all wrapped in a brutalist design system.

---

## ✨ Features

### 🎨 Canvas & Drawing
- Freehand drawing with configurable brush size and color
- Eraser tool
- Shape tools — Rectangle, Circle, Line, Arrow
- Draggable text nodes (click to place, double-click to edit)
- Draggable image upload nodes with delete support
- Draggable sticky notes with 6 color options
- Undo last stroke (per user)
- Export canvas as PNG
- Zoom in/out via Ctrl+Scroll or pinch gesture
- Pan via middle mouse button drag
<img width="1393" height="782" alt="Screenshot From 2026-02-25 12-56-12" src="https://github.com/user-attachments/assets/4f5a2d7e-8671-49fb-af55-350914e35928" />

### 👥 Collaboration
- Real-time stroke sync via WebSockets
- Live cursor tracking with username labels
- Presence list showing all online users
- Floating Twitch-style chat messages overlaid on canvas
- Emoji reactions that float across the canvas
- Raise hand feature with animated indicator
- Typing indicators in chat

### 🏠 Room System
- Create rooms with a name and optional password
- Join rooms by ID or invite link
- Room thumbnails auto-generated from canvas drawings
- Host controls: lock/unlock room, kick participants, end session
- Activity log (join, leave, kick, lock, clear events)
- Persistent canvas — reload the page and everything is still there
<img width="1393" height="725" alt="Screenshot From 2026-02-25 12-55-47" src="https://github.com/user-attachments/assets/30f444bd-445d-4488-89da-f9ba05a38485" />

### 🔐 Authentication
- Email + password registration and login
- Google OAuth 2.0 (popup flow, no full-page redirect)
- JWT-based session management

### 🤖 AI Integration
- Google Gemini AI assistant embedded in the workflow
- Generate ideas, summarize content, or ask questions from within your board

### 📱 Other
- Dark / light mode
- Mobile responsive layout with bottom toolbar
- Keyboard shortcuts for power users
- First-time onboarding tour (dashboard + room)
- Toast notifications replacing all browser alerts

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Animation | Framer Motion |
| Real-time | Socket.io |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT, Passport.js, Google OAuth 2.0 |
| AI | Google Gemini API (`@google/genai`) |
| Deployment | Render (backend + frontend), MongoDB Atlas |

---

## 📁 Project Structure

```
penspace/
├── backend/
│   └── src/
│       ├── app.js                  # Express app setup, CORS, middleware
│       ├── index.js                # Server entry point
│       ├── config/
│       │   └── passport.js         # Google OAuth strategy
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   └── room.controller.js
│       ├── db/
│       │   └── index.js            # MongoDB connection
│       ├── middlewares/
│       │   └── auth.middleware.js  # JWT verification
│       ├── models/
│       │   ├── user.model.js
│       │   └── room.model.js       # Strokes, stickyNotes, textNodes, imageNodes
│       ├── routes/
│       │   ├── auth.routes.js
│       │   └── room.routes.js
│       ├── sockets/
│       │   ├── index.js            # Socket.io server init
│       │   └── roomSockets.js      # All real-time event handlers
│       └── utils/
│           ├── ApiError.js
│           ├── ApiResponse.js
│           └── asyncHandler.js
│
└── Frontend/
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── auth/
        │   │   └── ProtectedRoute.jsx
        │   ├── onboarding/
        │   │   ├── OnboardingTooltip.jsx
        │   │   └── OnboardingOverlay.jsx
        │   ├── room/
        │   │   ├── RoomCanvas.jsx   # Canvas + floating nodes layer
        │   │   ├── RoomToolbar.jsx  # Left tool panel
        │   │   ├── RoomSidebar.jsx  # Right chat/users/activity panel
        │   │   └── RoomOverlay.jsx  # Live cursors + floating messages
        │   └── ui/                  # shadcn/ui components
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        ├── hooks/
        │   ├── useCanvas.js         # Drawing engine, zoom/pan, thumbnail
        │   ├── useSocket.js         # Socket connection with JWT
        │   └── useOnboarding.js
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   └── RoomPage.jsx
        └── services/
            ├── api.js
            ├── authService.js
            └── roomService.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB URI (local or [MongoDB Atlas](https://cloud.mongodb.com))
- Google Cloud project with OAuth 2.0 credentials
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/penspace.git
cd penspace
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 3. Configure environment variables

Create `.env` files in both `backend/` and `Frontend/` — see [Environment Variables](#-environment-variables) below.

### 4. Run in development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd Frontend
npm run dev
```

Frontend runs on `http://localhost:5173`  
Backend runs on `http://localhost:8000`

---

## 🔑 Environment Variables

### `backend/.env`

```env
PORT=8000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net
DB_NAME=penspace

# Auth
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### `Frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api
VITE_BACKEND_ORIGIN=http://localhost:8000
```

---

## 📜 Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start for production |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## 📡 API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register with email + password |
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/logout` | Logout, clear session |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `GET` | `/api/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |

### Rooms

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/rooms/create` | Create a new room | ✅ |
| `POST` | `/api/rooms/join/:roomId` | Join a room by ID | ✅ |
| `GET` | `/api/rooms/my-rooms` | Get all rooms for current user | ✅ |
| `GET` | `/api/rooms/:roomId` | Get single room details | ✅ |
| `DELETE` | `/api/rooms/:roomId` | Delete a room (host only) | ✅ |

---

## 🔌 Socket Events

### Client → Server

```
join-room           { roomId }
leave-room          { roomId }
draw-stroke         { roomId, stroke }
cursor-move         { roomId, x, y }
undo                { roomId }
clear-board         { roomId }
send-message        { roomId, message }
typing-start        { roomId }
typing-stop         { roomId }
raise-hand          { roomId }
send-reaction       { roomId, emoji }
add-sticky          { roomId, note }
update-sticky       { roomId, noteId, updates }
delete-sticky       { roomId, noteId }
add-text-node       { roomId, node }
update-text-node    { roomId, nodeId, updates }
delete-text-node    { roomId, nodeId }
add-image-node      { roomId, node }
update-image-node   { roomId, nodeId, updates }
delete-image-node   { roomId, nodeId }
kick-participant    { roomId, targetUserId }
toggle-lock         { roomId }
end-room            { roomId }
save-thumbnail      { roomId, thumbnail }
```

### Server → Client

```
room-state          { strokes, chat, stickyNotes, textNodes, imageNodes, activityLog }
receive-stroke      { stroke }
stroke-undo         { strokes }
board-cleared
cursor-update       { userId, username, x, y }
presence-update     { users }
receive-message     { message }
user-typing         { username }
user-stopped-typing { username }
hand-raised         { userId, username, raisedHand }
receive-reaction    { userId, username, emoji }
receive-sticky      { note }
sticky-updated      { noteId, updates }
sticky-deleted      { noteId }
receive-text-node   { node }
text-node-updated   { nodeId, updates }
text-node-deleted   { nodeId }
receive-image-node  { node }
image-node-updated  { nodeId, updates }
image-node-deleted  { nodeId }
activity-update     { entry }
user-joined         { username }
user-left           { username }
kicked              { message }
room-ended          { message }
room-locked         { isLocked }
error               { message }
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `D` | Draw tool |
| `E` | Eraser tool |
| `S` | Shape tool |
| `T` | Text tool |
| `C` | Toggle sidebar panel |
| `Ctrl + Z` | Undo last stroke |
| `Ctrl + 0` | Reset zoom to 100% |
| `Ctrl + Scroll` | Zoom in / out |
| `Middle Mouse` | Pan canvas |
| `Escape` | Close menus / deselect |

---

## ☁️ Deployment

penspace is deployed on **Render** (both frontend and backend) with **MongoDB Atlas**.

### Step-by-step

**1. MongoDB Atlas**
- Allow all IPs: `0.0.0.0/0` under Network Access
- Copy your connection string

**2. Backend on Render (Web Service)**
```
Root Directory:   backend
Build Command:    npm install
Start Command:    node src/index.js
```

Set these environment variables in Render:
```
PORT                 = 10000
NODE_ENV             = production
MONGODB_URI          = <your atlas uri>
JWT_SECRET           = <min 32 chars>
CORS_ORIGIN          = https://your-frontend.onrender.com
GOOGLE_CLIENT_ID     = <from google console>
GOOGLE_CLIENT_SECRET = <from google console>
GOOGLE_CALLBACK_URL  = https://your-backend.onrender.com/api/auth/google/callback
GEMINI_API_KEY       = <your gemini key>
```

**3. Frontend on Render (Static Site)**
```
Root Directory:    Frontend
Build Command:     npm install && npm run build
Publish Directory: dist
```

Set these environment variables:
```
VITE_API_URL        = https://your-backend.onrender.com/api
VITE_BACKEND_ORIGIN = https://your-backend.onrender.com
```

**4. Add `Frontend/public/_redirects`**
```
/*    /index.html   200
```

**5. Google Cloud Console**

Add to Authorized JavaScript origins:
```
https://your-frontend.onrender.com
```

Add to Authorized redirect URIs:
```
https://your-backend.onrender.com/api/auth/google/callback
```

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake. This is expected behavior on the free plan.

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow conventional commits and keep PRs focused on a single change.

---

## 🐛 Known Issues

- Canvas thumbnail only captures vector strokes — sticky notes, text nodes, and image nodes are DOM elements and don't appear in the exported PNG or thumbnail
- Free tier Render backend has cold start delay (~30s) after inactivity
- Image nodes store full base64 in MongoDB — very large images may approach document size limits; consider adding Cloudinary upload in a future version

---

## 🗺️ Roadmap

- [ ] Cloudinary image storage (replace base64)
- [ ] AI Gemini sidebar panel with canvas context awareness
- [ ] Voice/video call integration
- [ ] Board templates (mind map, kanban, retrospective)
- [ ] Guest mode (no login required for read-only view)
- [ ] Board sharing with public link (no room password needed)
- [ ] Mobile drawing with pressure sensitivity

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

⭐ Star this repo if you find it useful!

</div>
