# 🎮 Trivia Battle Royale

A multiplayer real-time trivia quiz game built with NestJS, Next.js, Prisma, and WebSockets.

## Project Structure

```
├── server/          # NestJS backend (REST + WebSocket)
│   ├── src/
│   │   ├── auth/        # JWT authentication
│   │   ├── game/        # WebSocket gateway + game logic
│   │   ├── rooms/       # Room management
│   │   ├── questions/   # Question bank
│   │   ├── leaderboard/ # Global ranking
│   │   └── prisma/      # Database service
│   └── prisma/
│       └── schema.prisma
├── client/          # Next.js 14 frontend (App Router + Tailwind)
│   └── src/
│       ├── app/         # Pages
│       ├── context/     # Auth context
│       └── lib/         # API client + socket
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or Docker)

### 1. Database Setup

```bash
# Start PostgreSQL (Docker example)
docker run --name trivia-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=trivia -p 5432:5432 -d postgres:16

# Apply migrations
cd server
npx prisma migrate dev --name init

# Seed questions
curl -X POST http://localhost:3001/api/questions/seed
```

### 2. Backend

```bash
cd server
npm install
cp .env .env  # Edit DATABASE_URL + JWT_SECRET
npm run start:dev
```

Server runs on `http://localhost:3001`

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs on `http://localhost:3000`

## Features

### MVP ✅
- [x] Create/join rooms with a code
- [x] Real-time synchronized quiz (10 questions, 10s per question)
- [x] Live scoreboard + final results

### V2
- [x] JWT Authentication (register/login)
- [x] Global leaderboard
- [ ] Paid private rooms via Stripe

### V3
- [ ] Premium subscription (exclusive themes)
- [ ] Spectator mode
- [ ] In-game chat via WebSocket

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | NestJS + WebSocket Gateway |
| Database | PostgreSQL + Prisma |
| Auth | JWT + Passport |
| Payments | Stripe Checkout (planned) |
| Deploy | Vercel (front) + Railway (back) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get current user |
| POST | /api/rooms | Create room |
| POST | /api/rooms/:code/join | Join room |
| GET | /api/rooms/:code | Get room details |
| GET | /api/leaderboard | Global ranking |
| GET | /api/questions/categories | List categories |
| POST | /api/questions/seed | Seed sample questions |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| joinRoom | Client → Server | Join a room |
| startGame | Client → Server | Host starts game |
| submitAnswer | Client → Server | Submit answer |
| roomState | Server → Client | Room info |
| playerJoined | Server → Client | New player |
| gameStarted | Server → Client | Game begins |
| newQuestion | Server → Client | Next question |
| answerResult | Server → Client | Answer feedback |
| liveScores | Server → Client | Current scores |
| gameFinished | Server → Client | Final results |
