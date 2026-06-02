# ContentOS — AI-Powered Content Repurposing Platform

ContentOS transforms any video transcript, blog post, or raw notes into platform-ready content for Twitter/X, LinkedIn, Instagram, YouTube, and newsletters — all streamed back in real time via a multi-agent LangGraph pipeline.

![Architecture](docs/architecture.png)

---

## Features

- 🎙️ **Multi-format input** — paste transcripts, blog posts, or bullet-point notes; drag-drop `.txt`, `.md`, or `.pdf` files
- ⚡ **Parallel AI agents** — five platform-specific agents run concurrently via LangGraph, each optimised for its format and audience
- 📡 **Real-time streaming** — outputs stream back one card at a time via SSE as each agent completes
- 🎨 **Voice calibration** — learns your writing style from past uploads using ChromaDB embeddings
- 📅 **Editorial calendar** — drag generated content onto a weekly schedule with confidence-rated posting-time suggestions
- 🔐 **Auth** — JWT-based authentication, 7-day tokens, bcrypt password hashing
- 📜 **History** — view, re-load, and delete past generations

---

## Tech Stack

| Layer       | Technology                                              |
|-------------|---------------------------------------------------------|
| LLM         | Groq API — `llama-3.3-70b-versatile` (free tier)       |
| Embeddings  | HuggingFace Inference API — `all-MiniLM-L6-v2`         |
| Agent graph | LangGraph + LangChain                                   |
| Backend     | FastAPI 0.111, Python 3.11, Motor (async MongoDB)       |
| Vector DB   | ChromaDB (persistent, per-user tone collections)        |
| Database    | MongoDB Atlas free cluster                              |
| Cache       | Upstash Redis (session-ready)                           |
| Frontend    | Next.js 15 (App Router), TypeScript, Tailwind CSS      |
| Animation   | Framer Motion                                           |
| State       | Zustand                                                 |
| Deployment  | Render (backend) + Vercel (frontend)                   |

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas free cluster (or local `mongod`)
- Groq API key — [console.groq.com](https://console.groq.com)
- HuggingFace API key — [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### 1. Clone

```bash
git clone https://github.com/your-username/contentos.git
cd contentos
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your keys (see table below)

mkdir -p data/chroma uploads
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
# .env.local already contains NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

App: http://localhost:3000

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                   | Description                                      | Required |
|----------------------------|--------------------------------------------------|----------|
| `GROQ_API_KEY`             | Groq API key for LLM calls                       | ✅        |
| `HF_API_KEY`               | HuggingFace Inference API key for embeddings     | ✅        |
| `MONGODB_URI`              | MongoDB Atlas connection string                  | ✅        |
| `SECRET_KEY`               | JWT signing secret (min 32 chars)                | ✅        |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST URL                           | optional |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token                         | optional |
| `CHROMA_PATH`              | ChromaDB storage path (default: `./data/chroma`) | optional |
| `UPLOAD_DIR`               | File upload directory (default: `./uploads`)     | optional |
| `ALLOWED_ORIGINS`          | CORS origins JSON array                          | optional |
| `DEBUG`                    | Enable debug logging (default: `false`)          | optional |

### Frontend (`frontend/.env.local`)

| Variable               | Description                          |
|------------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend base URL                     |

---

## API Reference

### Auth

| Method | Endpoint           | Body / Response                        |
|--------|--------------------|----------------------------------------|
| POST   | `/auth/register`   | `{name, email, password}` → JWT + user |
| POST   | `/auth/login`      | `{email, password}` → JWT + user       |
| GET    | `/auth/me`         | Current user (requires Bearer token)   |

### Content

| Method | Endpoint                       | Description                                        |
|--------|--------------------------------|----------------------------------------------------|
| POST   | `/content/process`             | Start pipeline → `{job_id}`                        |
| GET    | `/content/stream/{job_id}`     | SSE stream — pass `?token=<jwt>` (no header support) |
| GET    | `/content/status/{job_id}`     | Poll job status                                    |
| GET    | `/content/history`             | List past jobs (Bearer auth)                       |
| GET    | `/content/history/{job_id}`    | Full job detail                                    |
| DELETE | `/content/history/{job_id}`    | Delete job                                         |

### Tone

| Method | Endpoint        | Description                                |
|--------|-----------------|--------------------------------------------|
| POST   | `/tone/upload`  | Upload past content `{text}` to build voice profile |

### SSE Event Format

```
data: {"platform": "twitter", "content": {...}, "schedule": {...}, "status": "complete"}\n\n
data: {"type": "meta", "topics": [...], "hooks": [...], "tone_profile": {...}}\n\n
data: [DONE]\n\n
```

---

## Agent Pipeline

```
Input text
    │
    ▼
[parse_transcript]  ── extract topics (5-7) + hooks (3)
    │
    ▼
[load_tone_profile] ── query ChromaDB embeddings → voice traits
    │
    ▼
[generate_platforms] ── parallel fan-out:
    ├── generate_twitter    → 7-tweet thread
    ├── generate_linkedin   → 600-800 word article
    ├── generate_instagram  → 3 caption sizes + 15 hashtags
    ├── generate_newsletter → subject lines + 300-word section
    └── generate_youtube    → title + description + timestamps + tags
    │
    ▼
[suggest_schedule]  ── best posting times per platform
    │
    ▼
SSE stream → frontend
```

---

## Deployment

### Backend on Render

1. Push `backend/` to a GitHub repo
2. Create a new **Web Service** on Render — select **Docker** runtime
3. Point to `backend/Dockerfile`
4. Add all environment variables from the table above
5. Add a **Disk** (`/data`, 1 GB) for ChromaDB persistence
6. Deploy — health check at `/health`

### Frontend on Vercel

```bash
cd frontend
vercel deploy
```

Set `NEXT_PUBLIC_API_URL` to your Render service URL in the Vercel dashboard.

---

## Screenshots

> Coming soon — add screenshots to `docs/screenshots/`

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with a clear message
4. Open a PR — describe what changed and why

---

## License

MIT © 2025
