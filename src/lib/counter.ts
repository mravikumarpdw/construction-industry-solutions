import { db } from "./db";

// Gap-free, concurrency-safe document number series per tenant/scope (V-10).
// Scope examples: "PO:2026-27", "GRN:2026-27", "WO:2026-27", "RA:WO123".
export async function nextSeq(tenantId: string, scope: string): Promise<number> {
  const counter = await db.counter.upsert({
    where: { tenantId_scope: { tenantId, scope } },
    create: { tenantId, scope, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

// Formatted document number, e.g. PO/2026-27/00042
export async function nextDocNo(
  tenantId: string,
  prefix: string,
  fy = "2026-27"
): Promise<string> {
  const n = await nextSeq(tenantId, `${prefix}:${fy}`);
  return `${prefix}/${fy}/${String(n).padStart(5, "0")}`;
}
