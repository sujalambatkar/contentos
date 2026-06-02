# ContentOS — System Architecture

## Overview

ContentOS is split into two independently deployed services: a Python backend and a Next.js frontend. The backend runs the LangGraph agent pipeline as a FastAPI background task, persisting incremental results to MongoDB. The frontend connects via Server-Sent Events (SSE) and renders each platform card as its agent completes.

---

## Request Lifecycle

```
Browser
  |
  | 1. POST /content/process  {input_text, input_type, platforms}
  |    Authorization: Bearer <jwt>
  v
FastAPI
  |
  | 2. Create content_jobs document in MongoDB  {status: "pending"}
  | 3. Return {job_id}  (HTTP 202)
  | 4. Dispatch background task  run_pipeline(job_id, ...)
  |
  | 5. Browser opens EventSource
  |    GET /content/stream/{job_id}?token=<jwt>
  |    (EventSource cannot set headers, token in query param)
  |
  v
SSE loop (polls MongoDB every 1 second)
  |
  | 6. As each platform agent finishes and writes to MongoDB,
  |    the SSE loop detects the new completed_platform entry
  |    and emits an event frame:
  |
  |    data: {"platform": "twitter", "content": {...}, "status": "complete"}
  |
  | 7. After all platforms complete, emits meta frame + [DONE]
  v
Browser
  useSSE hook parses each frame → Zustand store → React re-render
  Each platform card fades in as its data arrives
```

---

## Backend Layer Diagram

```
backend/
|
+-- app/main.py
|     FastAPI app
|     CORS middleware (allowed origins from config)
|     GZip middleware
|     Lifespan: creates /data/chroma and /uploads on startup
|
+-- app/config.py
|     pydantic-settings reads from .env
|     All external credentials and path config
|
+-- app/auth/
|     router.py     POST /auth/register, /auth/login, /auth/me
|     utils.py      bcrypt hash/verify (direct bcrypt, not passlib)
|                   JWT encode/decode via python-jose
|                   get_current_user dependency (reads Bearer token)
|
+-- app/api/
|     content_router.py
|       POST /content/process
|         - validates request with ProcessRequest schema
|         - inserts job into MongoDB
|         - dispatches run_pipeline as FastAPI BackgroundTask
|         - returns job_id immediately (non-blocking)
|
|       GET /content/stream/{job_id}
|         - resolves user from ?token= query param
|         - async generator polls MongoDB every 1s
|         - yields SSE data frames for each new completed platform
|         - yields [DONE] when job.status == "complete"
|         - hard timeout at 120 polls (2 minutes)
|
|       GET /content/status/{job_id}
|         - returns current status, completed_platforms, errors
|
|     history_router.py
|       GET  /content/history        - list past jobs (Motor cursor)
|       GET  /content/history/{id}   - full job with all outputs
|       DELETE /content/history/{id} - hard delete from MongoDB
|       POST /tone/upload            - store writing sample in ChromaDB
|
+-- app/agents/
|     orchestrator.py
|       LangGraph StateGraph with four nodes:
|         parse_transcript -> load_tone_profile -> generate_platforms -> suggest_schedule
|       run_pipeline():
|         - builds initial AgentState dict (all JSON-serializable)
|         - invokes compiled graph with ainvoke()
|         - writes final state to MongoDB on completion or error
|
|     transcript_parser.py   (Node 1)
|       chunk_text():         splits input into 1500-word overlapping chunks
|       extract_topics_and_hooks():
|         - sends first 4000 chars to Groq
|         - returns 5-7 topics and 3 hooks as JSON
|
|     tone_calibrator.py     (Node 2)
|       query_tone_samples(): fetches user's past content from ChromaDB
|       analyze_tone():       Groq call to derive voice traits from samples
|       Falls back to default profile if no past content exists
|
|     platform_adapter.py    (Nodes 3a-3e, run in parallel)
|       Five async functions, each:
|         1. Builds a platform-specific system + human prompt
|         2. Calls ChatGroq.ainvoke()
|         3. Parses JSON from response (robust parser handles fences + truncation)
|         4. Appends result to state["platform_outputs"]
|       All wrapped with @retry(stop=3, wait=exponential(2-10s))
|
|     scheduler_agent.py     (Node 4)
|       Returns evidence-based posting times per platform
|       Confidence score included per suggestion
|
+-- app/db/
      mongo.py
        Motor AsyncIOMotorClient (connection pooled, lazy init)
        Collections: users, content_jobs
        _serialize(): converts ObjectId to string "id" field
        update_content_job(): used by agents to write partial results
                              during pipeline execution (not just at end)

      chroma.py
        PersistentClient at CHROMA_PATH (default /data/chroma)
        One collection per user_id for tone profiles
        embed_texts(): calls HuggingFace Inference API
          POST https://api-inference.huggingface.co/pipeline/feature-extraction/
               sentence-transformers/all-MiniLM-L6-v2
          (Never imports sentence_transformers locally — RAM constraint)
```

---

## Frontend Layer Diagram

```
frontend/
|
+-- app/layout.tsx
|     Syne (headings) + DM Sans (body) from Google Fonts
|     suppressHydrationWarning on body (prevents Zustand persist mismatch)
|     ToasterProvider in a "use client" boundary
|
+-- app/page.tsx
|     Checks auth state after mount (mounted guard prevents SSR mismatch)
|     Authenticated  -> redirect to /dashboard/upload
|     Unauthenticated -> renders full landing page
|
+-- app/(auth)/
|     login/page.tsx    React Hook Form + Zod validation
|     register/page.tsx POST /auth/register -> setAuth -> redirect
|
+-- app/dashboard/layout.tsx
|     mounted guard: renders empty shell on first paint
|     After mount: checks isAuthenticated(), redirects to /login if false
|     Renders Navbar + children
|
+-- app/dashboard/upload/page.tsx
|     Input type selector (transcript / blog / notes)
|     UploadZone (drag-drop or paste)
|     Platform selector (checkboxes with brand colors)
|     Disclaimer (Groq free tier timing notice)
|     Generate button -> POST /content/process -> sets jobId
|     StreamingOutput receives jobId, opens SSE, renders cards
|     ToneProfile renders once meta event arrives
|
+-- app/dashboard/page.tsx
|     ContentCalendar (weekly grid, drag items between slots)
|     Reads calendarSlots from Zustand
|
+-- app/dashboard/history/page.tsx
|     Fetches GET /content/history on mount
|     View action: loads full job into Zustand -> navigates to upload page
|     Regenerate: navigates to upload with prefill query param
|     Delete: DELETE /content/history/{id} -> remove from local state
|
+-- lib/api.ts
|     Axios instance with baseURL from NEXT_PUBLIC_API_URL
|     Request interceptor: attaches localStorage token as Bearer header
|     Response interceptor: on 401, clears auth and redirects to /login
|
+-- lib/store.ts
|     useAuthStore (persisted to localStorage via zustand/middleware)
|       user, token, setAuth(), logout(), isAuthenticated()
|     useContentStore (in-memory, cleared on page refresh)
|       currentJob: { jobId, status, outputs[], topics[], toneProfile }
|       calendarSlots: Record<string, PlatformOutput[]>
|
+-- lib/sse.ts
|     useSSE(jobId, callbacks)
|       Opens EventSource to /content/stream/{jobId}?token=<jwt>
|       (token from localStorage, EventSource cannot set headers)
|       Parses each data frame:
|         platform event  -> onPlatformOutput()
|         meta event      -> onMeta()
|         [DONE]          -> onDone() + close()
|         error field     -> onError() + close()
```

---

## Data Models

### MongoDB: `content_jobs`

```
{
  job_id:              string (UUID)
  user_id:             string (MongoDB ObjectId ref)
  input_text:          string (truncated to 10,000 chars)
  input_type:          "transcript" | "blog" | "notes"
  platforms:           string[]
  status:              "pending" | "processing" | "complete" | "error"
  completed_platforms: string[]
  platform_outputs: {
    twitter:    { tweets: string[], thread_count: number }
    linkedin:   { title: string, article: string, word_count: number }
    instagram:  { captions: {short, medium, long}, hashtags: string[] }
    newsletter: { subject_lines: string[], preview_text: string, body: string }
    youtube:    { title: string, description: string, timestamps: [...], tags: string[] }
  }
  topics:       string[]
  hooks:        string[]
  tone_profile: { traits, vocabulary_level, avg_sentence_length, tone_descriptors, common_phrases }
  schedule: {
    [platform]: { times: string[], confidence: number, reasoning: string }
  }
  errors:       Record<string, string>
  created_at:   datetime
  updated_at:   datetime
}
```

### ChromaDB: `tone_{user_id}`

One collection per user. Each document is a past writing sample submitted via `POST /tone/upload`. Queried at generation time to extract voice traits via cosine similarity search.

---

## LangGraph State

The pipeline state is a plain dict (all values JSON-serializable) threaded through each node:

```
AgentState {
  raw_input            string
  input_type           string
  chunks               string[]
  topics               string[]
  hooks                string[]
  tone_profile         dict
  platform_outputs     dict
  completed_platforms  string[]
  schedule             dict
  job_id               string
  user_id              string
  platforms            string[]
  status               string
  error                string | None
}
```

Each node receives the full state and returns a new merged state. Nodes 3a-3e run in parallel using `asyncio.gather` inside a single LangGraph node (`generate_platforms`), with a 2-second stagger between each call and a 90-second hard timeout per platform.

---

## Key Design Decisions

**Why SSE instead of WebSockets**
SSE is unidirectional (server to client), which matches the use case exactly — the client only needs to receive streaming updates. SSE works over standard HTTP, is automatically reconnected by the browser, and is simpler to implement behind a proxy or CDN.

**Why the token is in the query param for SSE**
The browser's `EventSource` API does not support setting custom request headers. Passing the JWT as `?token=` is the standard workaround. The backend resolves and validates this token identically to the Bearer header flow.

**Why agents write to MongoDB incrementally**
Rather than holding the full pipeline state in memory and writing only at the end, each platform agent writes its result to MongoDB the moment it completes. This means the SSE poller can forward partial results to the browser in real time — the user sees Twitter output while LinkedIn is still generating.

**Why no local embedding models**
The backend is deployed on Render's free tier with a 512 MB RAM limit. Loading `sentence-transformers` locally would exceed this. All embedding calls go to the HuggingFace Inference API over HTTP instead.

**Why pdfjs-dist runs client-side**
PDF text extraction happens in the browser using `pdfjs-dist` before the content is sent to the backend. This avoids multipart file upload complexity, works without any backend changes, and keeps the binary off the server entirely.
