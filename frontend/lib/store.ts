import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
}

interface PlatformOutput {
  platform: string;
  content: Record<string, unknown>;
  schedule?: Record<string, unknown>;
  status: string;
}

interface ContentJob {
  jobId: string;
  status: "pending" | "processing" | "complete" | "error";
  outputs: PlatformOutput[];
  topics: string[];
  hooks: string[];
  toneProfile: Record<string, unknown>;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

interface ContentStore {
  currentJob: ContentJob | null;
  setJob: (job: ContentJob) => void;
  addOutput: (output: PlatformOutput) => void;
  updateJobStatus: (status: ContentJob["status"]) => void;
  clearJob: () => void;

  // Calendar drag state
  calendarSlots: Record<string, PlatformOutput[]>;
  addToCalendar: (slot: string, output: PlatformOutput) => void;
  removeFromCalendar: (slot: string, platform: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        if (typeof window !== "undefined") {
          localStorage.setItem("contentos_token", token);
          localStorage.setItem("contentos_user", JSON.stringify(user));
        }
      },
      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== "undefined") {
          localStorage.removeItem("contentos_token");
          localStorage.removeItem("contentos_user");
        }
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "contentos-auth",
    }
  )
);

export const useContentStore = create<ContentStore>((set, get) => ({
  currentJob: null,

  setJob: (job) => set({ currentJob: job }),

  addOutput: (output) =>
    set((state) => {
      if (!state.currentJob) return state;
      const existing = state.currentJob.outputs.findIndex(
        (o) => o.platform === output.platform
      );
      const outputs =
        existing >= 0
          ? state.currentJob.outputs.map((o, i) =>
              i === existing ? output : o
            )
          : [...state.currentJob.outputs, output];
      return { currentJob: { ...state.currentJob, outputs } };
    }),

  updateJobStatus: (status) =>
    set((state) => {
      if (!state.currentJob) return state;
      return { currentJob: { ...state.currentJob, status } };
    }),

  clearJob: () => set({ currentJob: null }),

  calendarSlots: {},

  addToCalendar: (slot, output) =>
    set((state) => ({
      calendarSlots: {
        ...state.calendarSlots,
        [slot]: [...(state.calendarSlots[slot] || []), output],
      },
    })),

  removeFromCalendar: (slot, platform) =>
    set((state) => ({
      calendarSlots: {
        ...state.calendarSlots,
        [slot]: (state.calendarSlots[slot] || []).filter(
          (o) => o.platform !== platform
        ),
      },
    })),
}));
