"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authAPI.register(data);
      setAuth(res.data.user, res.data.access_token);
      toast.success(`Welcome to ContentOS, ${res.data.user.name}!`);
      router.push("/dashboard/upload");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Registration failed";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-warm">ContentOS</span>
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl p-8">
          <h1 className="font-heading font-bold text-2xl text-warm mb-1">
            Create your workspace
          </h1>
          <p className="text-muted text-sm mb-6">
            Free forever. No credit card required.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 uppercase tracking-wider">
                Full name
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Alex Johnson"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-warm placeholder:text-muted/50 outline-none focus:border-primary transition-colors"
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-warm placeholder:text-muted/50 outline-none focus:border-primary transition-colors"
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-10 text-sm text-warm placeholder:text-muted/50 outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-warm"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-heading font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating workspace…
                </>
              ) : (
                "Get started free"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
