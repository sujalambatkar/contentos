import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("contentos_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("contentos_token");
      localStorage.removeItem("contentos_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// ── Content ───────────────────────────────────────────────────────────────

export const contentAPI = {
  process: (data: {
    input_text: string;
    input_type: string;
    platforms: string[];
  }) => api.post("/content/process", data),

  status: (jobId: string) => api.get(`/content/status/${jobId}`),

  history: (limit = 20) =>
    api.get<{ history: HistoryItem[] }>(`/content/history?limit=${limit}`),

  historyItem: (jobId: string) => api.get(`/content/history/${jobId}`),

  deleteHistory: (jobId: string) => api.delete(`/content/history/${jobId}`),
};

// ── Tone ──────────────────────────────────────────────────────────────────

export const toneAPI = {
  upload: (text: string) => api.post("/tone/upload", { text }),
};

export const SSE_URL = (jobId: string) =>
  `${API_URL}/content/stream/${jobId}`;

// ── Types ─────────────────────────────────────────────────────────────────

export interface HistoryItem {
  job_id: string;
  input_type: string;
  platforms: string[];
  completed_platforms: string[];
  topics: string[];
  status: string;
  created_at: string;
  preview: string;
}
