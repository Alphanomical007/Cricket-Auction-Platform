<div align="center">

# 🏏 Cricket Auction Platform

**An open-source, IPL-style player auction system with real-time bidding**

Experience the thrill of live player auctions — perfect for office cricket leagues, fantasy sports, or any team-building event!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

<img src="readme_asset/landing-page.png" alt="Landing Page" width="800"/>

</div>

---

## Features

- **Real-time Bidding** — WebSocket-powered live auctions with instant updates
- **Multi-Role System** — Admin, Organizer, Auctioneer, Captain, Player, Spectator
- **Smart Timer** — Auto-resets on bids, configurable duration
- **Live Dashboard** — Track budgets, rosters, and bid history in real-time
- **Spectator Mode** — Projector-ready full-screen view for audiences
- **Email Invitations** — Automated invites via AWS SES (or configure your own SMTP)
- **Player Profiles** — Photo uploads with skill ratings
- **Secure Auth** — JWT-based authentication with magic link support
- **Mobile Controllable** — Access natively from your phone without docker
- **Scalable** — Redis-based coordination supports multiple workers/pods

---

## Screenshots

<details>
<summary><b>Click to view screenshots</b></summary>

### Event Dashboard
<img src="readme_asset/event-section.png" alt="Event Dashboard" width="700"/>

### Multi-Role Selection
<img src="readme_asset/multi-role.png" alt="Multi-Role" width="500"/>

### Login
<img src="readme_asset/login_form.png" alt="Login" width="500"/>

### Auction Completed Summary
<img src="readme_asset/event_completed_view.png" alt="Completed View" width="700"/>

</details>

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy (async), PostgreSQL, Redis, ARQ |
| **Frontend** | Next.js 14 (App Router), TailwindCSS, Zustand |
| **Storage** | AWS S3 (or local uploads) |
| **Email** | AWS SES (configurable) |

---

## Quick Start

### Option 1: Native Setup (Recommended)

This requires you to have PostgreSQL and Redis installed strictly on your host machine.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/cricket-auction.git
cd cricket-auction

# 2. Copy environment file
cp backend/.env.example backend/.env

# 3. Set up and start individual services (Refer to Local Development instructions)
```

### Option 2: Use an External Database

If you have an existing cloud PostgreSQL database:

```bash
# 1. Edit .env with your database connection
DATABASE_URL=postgresql+asyncpg://user:password@your-db-host:5432/auction_db

# 2. Start services locally natively
```

### Option 3: Local Development (Native without Docker)

Since Docker has been removed to allow native control:

```bash
# 1. Start the Database and Redis (Required)
# Ensure you have PostgreSQL installed natively on port 5432 
# Ensure you have Redis installed natively on port 6379 
# (On Windows, you can install Redis via Windows Subsystem for Linux (WSL) or Memurai)

# 2. Start the Backend API (FastAPI)
# The `--host 0.0.0.0` flag binds the server to your local IP so you can access it via phone
cd backend
python -m venv venv
venv\Scripts\activate  # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3. Start the Background Worker (Arq)
# In a new terminal window
cd backend
venv\Scripts\activate  # Mac/Linux: source venv/bin/activate
arq app.worker.WorkerSettings

# 4. Start the Frontend (Next.js)
# In a new terminal window
cd frontend
npm install
# The `npm run dev` script has been updated to use `-H 0.0.0.0` to allow mobile access
npm run dev
```

> **Note:** To connect from your mobile phone, connect to the exact same Wi-Fi network as the server, find your computer's local IP address (e.g., `192.168.0.114`), and navigate to `http://192.168.0.114:3000` in your mobile web browser.

---

## Configuration

### Environment Variables

Create a `.env` file in the backend directory. Example:

```bash
# ── App ──────────────────────────────────────────────────────────────────────
SECRET_KEY=your-super-secret-key-change-this
GODMODE_SECRET=testing-secret-for-dev-only

# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/auction

# ── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Frontend URLs ────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://192.168.0.114:8000/api
NEXT_PUBLIC_WS_URL=ws://192.168.0.114:8000/api/auction/ws

# ── AWS SES (Email) - Optional ───────────────────────────────────────────────
# Leave empty to disable email features
AWS_MAIL_ACCESS_KEY_ID=
AWS_MAIL_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
EMAIL_FROM=auction@yourdomain.com

# ── AWS S3 (Profile Photos) - Optional ───────────────────────────────────────
# Leave empty to use local file storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
```

### Database Migrations

After starting the databases locally, run migrations:

```bash
cd backend && alembic upgrade head
```

### Seed Test Data (Optional)

```bash
cd backend && python seed_players.py
```

---

## Production Deployment

Since Docker has been stripped, deploy the FastAPI backend, the Worker, and Next.js frontend traditionally onto VPS (like AWS EC2, DigitalOcean, or Render) alongside managed PostgreSQL and Redis services. Configure your `.env` properly and use `gunicorn` instead of standalone `uvicorn` and traditional process managers like `pm2` / `systemd`.

---

## User Roles

| Role | Capabilities |
|------|--------------|
| **Admin** | Create events, assign organizers/auctioneers, manage allowed email domains |
| **Organizer** | Configure event settings, add players, create teams, assign captains |
| **Auctioneer** | Start/pause auction, pick players, hammer sales, finish event |
| **Captain** | Place bids, view budget & roster, bookmark players |
| **Player** | Complete profile (photo, ratings), view personal dashboard |
| **Spectator** | Watch live auction, view standings and history |

---

## Auction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ADMIN creates event → assigns ORGANIZER                     │
├─────────────────────────────────────────────────────────────────┤
│  2. ORGANIZER sets up event:                                    │
│     • Configure budget, max players per team                    │
│     • Add players (by email domain)                             │
│     • Create teams, assign CAPTAINS                             │
│     • Mark event as "Ready"                                     │
├─────────────────────────────────────────────────────────────────┤
│  3. System sends email invitations to all participants          │
├─────────────────────────────────────────────────────────────────┤
│  4. AUCTIONEER starts auction:                                  │
│     • Pick player (random or manual)                            │
│     • Timer starts (180 seconds default)                        │
├─────────────────────────────────────────────────────────────────┤
│  5. CAPTAINS bid in real-time:                                  │
│     • Timer resets on each bid                                  │
│     • Max bid increment: min(50% of current, 5% of budget)      │
├─────────────────────────────────────────────────────────────────┤
│  6. Timer expires → Player SOLD or UNSOLD                       │
│     • Unsold players can be re-auctioned                        │
├─────────────────────────────────────────────────────────────────┤
│  7. AUCTIONEER finishes auction → Summary displayed             │
└─────────────────────────────────────────────────────────────────┘
```

---

## WebSocket Events

Connect to: `ws://your-domain/api/auction/ws/{eventId}?token=<jwt>`

| Event | Description |
|-------|-------------|
| `auction_state` | Full state snapshot on connect |
| `player_up` | New player put up for auction |
| `new_bid` | A captain placed a bid |
| `timer_tick` | Timer countdown (every second) |
| `player_sold` | Player sold to a captain |
| `player_unsold` | Player went unsold |
| `auction_paused` | Auctioneer paused the auction |
| `auction_resumed` | Auctioneer resumed the auction |
| `auction_completed` | Auction finished |

---

## Testing & Development

### God Mode (Dev Only)

Instantly log in as any user without password:

```
http://localhost/auth/login?godmode=YOUR_GODMODE_SECRET&email=user@example.com
```

### API Documentation

- Swagger UI: `http://localhost/api/docs`
- ReDoc: `http://localhost/api/redoc`

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Inspired by IPL player auctions
- Built with ❤️ for cricket lovers

---

## Contact & Support

<div align="center">

**A project by [Techiebutler](https://techiebutler.com)**

Have questions? Need help?

**Email:** [support@techiebutler.com](mailto:support@techiebutler.com)

[![Instagram](https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white)](https://www.instagram.com/techie_butler/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/techiebutler/)

---

**⭐ Star this repo if you find it useful!**

[Report Bug](https://github.com/AuctionApp/cricket-auction/issues) · [Request Feature](https://github.com/AuctionApp/cricket-auction/issues)

</div>
