import { db } from "./db";
import { money } from "./money";

type LedgerType = "Budget" | "Committed" | "Actual";
type Db = typeof db | Parameters<Parameters<typeof db.$transaction>[0]>[0];

// Post an entry into the single project cost ledger (SRS §7.7). Immutable once
// posted — reversals are done by posting a negative contra entry, never edits.
export async function postToLedger(
  client: Db,
  input: {
    tenantId: string;
    projectId: string;
    boqItemId?: string | null;
    costHeadId?: string | null;
    type: LedgerType;
    amount: number;
    sourceType: string; // PO | WO | GRN | Issue | WageSheet | RABill | Expense | EquipmentLog | Budget
    sourceId?: string | null;
    description?: string | null;
  }
) {
  return client.costLedgerEntry.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId,
      boqItemId: input.boqItemId ?? null,
      costHeadId: input.costHeadId ?? null,
      type: input.type,
      amount: money(input.amount),
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      description: input.description ?? null,
    },
  });
}

export interface CostSummary {
  budget: number;
  committed: number;
  actual: number;
  variance: number; // budget - (committed + actual)
  utilisationPct: number; // (committed + actual) / budget
}

// Budget-vs-Committed-vs-Actual for a single project (ERP-004/007).
export async function projectCostSummary(projectId: string): Promise<CostSummary> {
  const [budgetAgg, ledgerAgg] = await Promise.all([
    db.budgetLine.aggregate({
      where: { projectId, approved: true },
      _sum: { amount: true },
    }),
    db.costLedgerEntry.groupBy({
      by: ["type"],
      where: { projectId },
      _sum: { amount: true },
    }),
  ]);

  const budget = money(budgetAgg._sum.amount ?? 0);
  const committed = money(
    ledgerAgg.find((g) => g.type === "Committed")?._sum.amount ?? 0
  );
  const actual = money(
    ledgerAgg.find((g) => g.type === "Actual")?._sum.amount ?? 0
  );
  return {
    budget,
    committed,
    actual,
    variance: money(budget - (committed + actual)),
    utilisationPct: budget > 0 ? money(((committed + actual) / budget) * 100) : 0,
  };
}

// Portfolio roll-up across many projects (MD dashboard). BudgetLine has no
// tenantId column, so scope is always expressed via the project id list.
export async function portfolioSummary(
  _tenantId: string,
  projectIds: string[]
): Promise<CostSummary> {
  const [budgetAgg, ledgerAgg] = await Promise.all([
    db.budgetLine.aggregate({
      where: { projectId: { in: projectIds }, approved: true },
      _sum: { amount: true },
    }),
    db.costLedgerEntry.groupBy({
      by: ["type"],
      where: { projectId: { in: projectIds } },
      _sum: { amount: true },
    }),
  ]);
  const budget = money(budgetAgg._sum.amount ?? 0);
  const committed = money(
    ledgerAgg.find((g) => g.type === "Committed")?._sum.amount ?? 0
  );
  const actual = money(
    ledgerAgg.find((g) => g.type === "Actual")?._sum.amount ?? 0
  );
  return {
    budget,
    committed,
    actual,
    variance: money(budget - (committed + actual)),
    utilisationPct: budget > 0 ? money(((committed + actual) / budget) * 100) : 0,
  };
}

// Per-cost-head breakdown for a project (dashboard chart).
export async function costByHead(projectId: string) {
  const heads = await db.costHead.findMany({
    where: { boqItems: { some: { projectId } } },
    orderBy: { sort: "asc" },
  });
  const [budgets, ledger] = await Promise.all([
    db.budgetLine.groupBy({
      by: ["costHeadId"],
      where: { projectId, approved: true },
      _sum: { amount: true },
    }),
    db.costLedgerEntry.groupBy({
      by: ["costHeadId", "type"],
      where: { projectId },
      _sum: { amount: true },
    }),
  ]);

  return heads.map((h) => {
    const budget = money(
      budgets.find((b) => b.costHeadId === h.id)?._sum.amount ?? 0
    );
    const committed = money(
      ledger.find((l) => l.costHeadId === h.id && l.type === "Committed")?._sum
        .amount ?? 0
    );
    const actual = money(
      ledger.find((l) => l.costHeadId === h.id && l.type === "Actual")?._sum
        .amount ?? 0
    );
    return {
      code: h.code,
      name: h.name,
      budget,
      committed,
      actual,
      variance: money(budget - (committed + actual)),
    };
  });
}

// Budget guardrail check for indents/POs/WOs (ERP-005, V-02).
export async function budgetCheck(
  projectId: string,
  boqItemId: string | null,
  additionalCommit: number
): Promise<{ budget: number; used: number; remaining: number; exceeds: boolean }> {
  const budgetWhere = boqItemId
    ? { projectId, boqItemId, approved: true }
    : { projectId, approved: true };
  const ledgerWhere = boqItemId ? { projectId, boqItemId } : { projectId };

  const [budgetAgg, ledgerAgg] = await Promise.all([
    db.budgetLine.aggregate({ where: budgetWhere, _sum: { amount: true } }),
    db.costLedgerEntry.aggregate({
      where: { ...ledgerWhere, type: { in: ["Committed", "Actual"] } },
      _sum: { amount: true },
    }),
  ]);

  const budget = money(budgetAgg._sum.amount ?? 0);
  const used = money(ledgerAgg._sum.amount ?? 0);
  const remaining = money(budget - used);
  return {
    budget,
    used,
    remaining,
    exceeds: additionalCommit > remaining,
  };
}
