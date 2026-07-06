import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { HardHat, ShieldCheck, TrendingUp, Boxes } from "lucide-react";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-steel-950 lg:block">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-info/10" />
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
              <HardHat className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold">Construction Industry Solutions</p>
              <p className="text-xs uppercase tracking-widest text-brand-300">
                Cost-controlled builds
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Control sites, materials & contractors with confidence.
            </h1>
            <p className="mt-4 text-steel-300">
              One connected platform — from the first estimate to the final bill.
              Every rupee and every unit of progress, in real time, with zero
              duplicate data entry.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, k: "Live", v: "Cost control" },
                { icon: Boxes, k: "11", v: "Modules" },
                { icon: ShieldCheck, k: "Geo", v: "Attendance" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <s.icon className="h-5 w-5 text-brand-300" />
                  <p className="mt-2 text-lg font-semibold">{s.k}</p>
                  <p className="text-xs text-steel-400">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-steel-500">
            Budget → Commitment → Actual → Variance, on every project, every day.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-bg px-4 lg:w-1/2">
        <LoginForm />
      </div>
    </div>
  );
}
