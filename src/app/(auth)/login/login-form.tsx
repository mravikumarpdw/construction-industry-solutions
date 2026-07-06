"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

const DEMO_ACCOUNTS = [
  { label: "Managing Director", email: "md@apexinfra.in" },
  { label: "Project Manager", email: "pm@apexinfra.in" },
  { label: "Site Engineer", email: "site@apexinfra.in" },
  { label: "Storekeeper", email: "store@apexinfra.in" },
  { label: "Billing / QS", email: "billing@apexinfra.in" },
  { label: "Accounts", email: "accounts@apexinfra.in" },
];
const DEMO_PASSWORD = "password123";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("md@apexinfra.in");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Login failed");
      toast.success(`Welcome, ${json.data.name}`);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-fg">
          Sign in
        </h2>
        <p className="mt-1 text-sm text-muted">
          Welcome back. Enter your credentials to continue.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.in"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign in
            </>
          )}
        </Button>
      </form>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-widest text-muted">
            Demo accounts
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
              }}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-brand-300 hover:bg-surface-2"
            >
              <span className="block font-medium text-fg">{a.label}</span>
              <span className="block text-muted truncate">{a.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          All demo accounts use password{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-fg-soft">
            {DEMO_PASSWORD}
          </code>
        </p>
      </div>
    </motion.div>
  );
}
