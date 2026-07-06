"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  MapPin,
  UserCheck,
  TrendingUp,
  ClipboardList,
  Loader2,
  Wifi,
  BatteryFull,
  Signal,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";
import { timeAgo } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  code: string;
  location: string | null;
}

const ACTIONS = [
  { kind: "checkin", label: "Mark Attendance", icon: UserCheck, hint: "Geo + selfie check-in", color: "from-emerald-400 to-emerald-600" },
  { kind: "progress", label: "Update Progress", icon: TrendingUp, hint: "Daily progress + photo", color: "from-brand-400 to-brand-600" },
  { kind: "indent", label: "Raise Indent", icon: ClipboardList, hint: "Request material", color: "from-sky-400 to-sky-600" },
] as const;

export function MobileSimulator({
  projects,
  totalMobileEvents,
  actorName,
}: {
  projects: Project[];
  totalMobileEvents: number;
  actorName: string;
}) {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const project = projects.find((p) => p.id === projectId);

  const feed = useQuery({
    queryKey: ["mobile-feed"],
    queryFn: async (): Promise<ActivityItem[]> => {
      const res = await fetch("/api/mobile/feed");
      const json = await res.json();
      return (json.data ?? []).map((e: any) => ({ ...e, createdAt: new Date(e.createdAt) }));
    },
    refetchInterval: 4000,
  });

  const action = useMutation({
    mutationFn: async (kind: string) => {
      const res = await fetch("/api/mobile/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, projectId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Action failed");
      return json.data;
    },
    onSuccess: (data, kind) => {
      const label =
        kind === "checkin"
          ? `${data.worker} checked in`
          : kind === "progress"
            ? `Progress: ${data.task}`
            : `Indent ${data.indent} raised`;
      toast.success(`📲 ${label} — synced to office`);
      qc.invalidateQueries({ queryKey: ["mobile-feed"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Phone — the site app */}
      <div className="flex flex-col items-center">
        <p className="mb-3 text-sm font-medium text-muted">📱 Site App (Android)</p>
        <div className="relative w-[320px] rounded-[2.5rem] border-[10px] border-steel-900 bg-steel-950 p-3 shadow-card-lg">
          {/* notch */}
          <div className="absolute left-1/2 top-2 h-5 w-28 -translate-x-1/2 rounded-full bg-steel-900" />
          {/* status bar */}
          <div className="mb-2 flex items-center justify-between px-3 pt-4 text-[10px] text-steel-400">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="h-3 w-3" /> <Wifi className="h-3 w-3" /> <BatteryFull className="h-3 w-3" />
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-b from-steel-900 to-steel-950 p-4">
            <div className="mb-4">
              <p className="text-xs text-brand-300">Construction · Site App</p>
              <p className="text-sm font-semibold text-white">Hi, {actorName.split(" ")[0]}</p>
            </div>

            {/* project selector */}
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-steel-500">
              Active site
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mb-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="text-black">
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            {project?.location && (
              <p className="mb-4 flex items-center gap-1 text-[10px] text-steel-400">
                <MapPin className="h-3 w-3" /> {project.location} · geofence active
              </p>
            )}

            {/* action buttons */}
            <div className="space-y-2.5">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                const busy = action.isPending && action.variables === a.kind;
                return (
                  <button
                    key={a.kind}
                    disabled={action.isPending || !projectId}
                    onClick={() => action.mutate(a.kind)}
                    className={`flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br ${a.color} px-4 py-3 text-left text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{a.label}</span>
                      <span className="block text-[11px] text-white/80">{a.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-center text-[10px] text-steel-500">
              Works offline · queued sync · GPS + selfie verified
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-[320px] text-center text-xs text-muted">
          Tap an action — it posts to the shared API and streams into the office
          web app on the right. {totalMobileEvents}+ mobile events tracked so far.
        </p>
      </div>

      {/* Office — the web feed */}
      <div>
        <p className="mb-3 text-sm font-medium text-muted">🖥️ Office Web — Live Feed</p>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              Mobile activity — live
            </CardTitle>
            <span className="text-xs text-muted">
              {feed.isFetching ? "syncing…" : `updated ${timeAgo(new Date())}`}
            </span>
          </CardHeader>
          <CardBody>
            {feed.isLoading ? (
              <p className="py-8 text-center text-sm text-muted">Loading feed…</p>
            ) : (
              <div className="max-h-[560px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  <motion.div layout>
                    <ActivityFeed items={feed.data ?? []} showProject />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
