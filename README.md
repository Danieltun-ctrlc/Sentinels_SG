# Sentinel SG — Digital Shield

**"TRAIN THE REFLEX. PROTECT THE COMMUNITY."**

A three-pillar cyber-resilience web platform for young Singaporeans, built for CODE_EXP 2026.

## Pillars

| Pillar | Description |
|--------|-------------|
| 🎮 The Threat Arena | Turn-based creature battler teaching cyber-defence reflexes |
| 📰 Trending Threats Board | Intelligence feed from SPF, ScamShield, and CSA advisories |
| 🤖 AI Fact-Checker | Multi-modal upload with dual-agent AI analysis |

## Tech Stack

- **Frontend**: React 18 (CRA) + plain CSS + react-router-dom v6
- **Backend**: Express.js 4 + MySQL2 + JWT auth
- **Database**: MySQL 8.0

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- MySQL 8.0+ running locally
- npm

### Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd sentinel-sg
   ```

2. **Set up the database**
   ```bash
   mysql -u root -p < server/db/schema.sql
   ```

3. **Configure environment variables**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Edit `server/.env` with your MySQL credentials and a JWT secret.

4. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

5. **Start the backend** (port 5000)
   ```bash
   cd server && npm run dev
   ```

6. **Start the frontend** (port 3000)
   ```bash
   cd client && npm start
   ```

7. **Verify**: Visit `http://localhost:3000` and check `http://localhost:5000/api/health`.

## Project Structure

```
sentinel-sg/
├── client/          # React frontend (Create React App)
├── server/          # Express.js backend
│   ├── src/         # Application source
│   │   ├── config/      # DB pool, env validation
│   │   ├── routes/      # Route definitions
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Database queries
│   │   ├── middleware/  # Auth, error handling, uploads
│   │   ├── services/    # Business logic
│   │   └── utils/       # Helpers (JWT, hashing, formatters)
│   ├── db/          # SQL schema and seeds
│   └── uploads/     # Temp folder for fact-check files
└── README.md
```

## Hackathon

- **Event**: CODE_EXP 2026 · Singapore · Online Harms
- **Deadline**: 11 June 2026
