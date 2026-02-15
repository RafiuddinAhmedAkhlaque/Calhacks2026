# ScrollStop

A Chrome extension that interrupts your doomscrolling with quiz questions generated from study materials you and your friends upload. Join a shared room, compete on a leaderboard, and hold each other accountable with a built-in "shame factor."

## How It Works

1. Create or join a room with friends using an invite code
2. Upload study documents (PDF, MD accepted)
4. Let AI generate study questions based on those documents
4. Set tracked domains (Reddit, Twitter, TikTok, YouTube, etc.) and a time session limit
5. When you exceed the time session limit on that website, a full-page quiz blocks the page
6. Answer 5 questions correctly in a row to unlock
7. Track your progress on a real-time leaderboard and compare with your friends. Try not to be last and have fun

## Setup

### Prerequisites

- Node.js 20+
- npm
- A Groq API key (free -- for AI quiz generation)

### 1. Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```

Get a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys).

Then start the server:

```bash
npm run dev
```

The server runs on `http://localhost:3001`.

### 2. Extension

```bash
cd extension
npm install
npm run build
```

### 3. Load in Chrome

1. Open `chrome://extensions/`
2. Enable Developer mode (toggle in top-right)
3. Click Load unpacked
4. Select the `extension/dist` folder

### 4. Use It

1. Click the ScrollStop extension icon in Chrome
2. Pick a username and log in
3. Create a room (or join one with an invite code)
4. Upload study documents
5. Quiz questions are generated automatically
6. Click "Set Active" on your room
7. Go to Settings and configure your tracked domains and time limit
8. Browse a tracked site and wait for the quiz to interrupt you

## Tech Stack

- Extension: React 19, TypeScript, Tailwind CSS v4, Vite 6
- Backend: Express 5, Socket.io, Drizzle ORM, SQLite (better-sqlite3)
- AI: Groq (Llama 3.3 70B) for quiz question generation from uploaded documents
- Realtime: Socket.io for live leaderboard updates across room members

## Features

- Room system: create/join rooms with invite codes, compete with friends
- Document upload: PDF and text file parsing with AI-powered quiz generation
- Domain tracking:  configurable list of sites to monitor (Reddit, Twitter, TikTok, YouTube, etc.)
- Adjustable time limit: 1 to 60 minutes before the quiz interrupt fires
- Quiz overlay: full-page blocker requiring 5 consecutive correct answers to dismiss
- Live leaderboard: real-time score updates via Socket.io with rank, streak, and quiz count
- Shame factor: see exactly where you rank among your friends
